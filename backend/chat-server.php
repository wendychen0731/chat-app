<?php
// chat_server.php
// -----------------------------------------------------------------------------
// 載入 Composer 自動加載機制（會載入 vendor/autoload.php）
require __DIR__ . '/vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

class Chat implements MessageComponentInterface
{
    /** @var \SplObjectStorage|ConnectionInterface[] */
    protected $clients;          // 所有連線
    /** @var array<int,string>   spl_object_id(conn)  => username */
    protected $names;            // 連線 id 對應名稱
    /** @var array<string,ConnectionInterface> username => conn */
    protected $userConns;        // 使用者名稱對應連線（方便私聊推送）
    /** @var PDO */
    protected $db;               // PDO 連線

    public function __construct()
    {
        $this->clients   = new \SplObjectStorage;
        $this->names     = [];
        $this->userConns = [];

        $this->db = new PDO(
            'mysql:host=127.0.0.1;dbname=chatdb;charset=utf8mb4',
            'chatuser',
            'andrea',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }

    // ────────────────────── 連線建立 ──────────────────────
    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);

        // 傳最近 50 筆「公用聊天室」歷史
        $stmt = $this->db->query(
            'SELECT username, message, created_at
             FROM chat_messages
             ORDER BY id DESC LIMIT 50'
        );
        $history = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
        $conn->send(json_encode([
            'type'     => 'history',
            'messages' => $history,
        ]));
    }

    // ────────────────────── 收到訊息 ──────────────────────
    public function onMessage(ConnectionInterface $from, $msg)
    {
        error_log('◆ 收到封包: ' . $msg);
        $data = json_decode($msg, true);
        $type = $data['type'] ?? 'message';

        // ---------- 1. 使用者加入 ----------
        if ($type === 'join') {
            $username = $data['username'] ?? '訪客';
            $cid      = spl_object_id($from);
            $this->names[$cid]     = $username;
            $this->userConns[$username] = $from;

            // 廣播線上名單
            $this->broadcast([
                'type'  => 'user_list',
                'users' => array_values($this->names),
            ]);

            // 通知其他人有人加入
            $this->broadcast([
                'type'       => 'join',
                'username'   => $username,
                'created_at' => date('Y-m-d H:i:s'),
            ], $exclude = [$from]);

            return;
        }

        // ---------- 2. 私聊訊息 ----------
        if ($type === 'private') {
            $fromUser = $this->names[spl_object_id($from)] ?? '訪客';
            $toUser   = $data['to'] ?? '';
            $message  = trim($data['message'] ?? '');

            if ($toUser === '' || $message === '') {
                return; // 格式不對直接丟棄
            }

            // 寫 DB
            $stmt = $this->db->prepare(
                'INSERT INTO private_messages (from_user, to_user, message)
                 VALUES (?,?,?)'
            );
            $stmt->execute([$fromUser, $toUser, $message]);

            // 回傳給收 / 發雙方
            $payload = [
                'type'       => 'private',
                'from'       => $fromUser,
                'to'         => $toUser,
                'message'    => $message,
                'created_at' => date('Y-m-d H:i:s'),
            ];
            // 發送給自己
            $from->send(json_encode($payload));
            // 線上才發給對方
            if (isset($this->userConns[$toUser])) {
                $this->userConns[$toUser]->send(json_encode($payload));
            }

            return;
        }

        // ---------- 3. 公用訊息 ----------
        if ($type === 'message') {
            $username = $this->names[spl_object_id($from)] ?? '訪客';
            $message  = trim($data['message'] ?? '');
            if ($message === '') {
                return;
            }

            // 寫 DB
            $stmt = $this->db->prepare(
                'INSERT INTO chat_messages (username, message) VALUES (?,?)'
            );
            $stmt->execute([$username, $message]);

            // 廣播
            $this->broadcast([
                'type'       => 'message',
                'username'   => $username,
                'message'    => $message,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }
    }

    // ────────────────────── 連線關閉 ──────────────────────
    public function onClose(ConnectionInterface $conn)
    {
        $cid      = spl_object_id($conn);
        $username = $this->names[$cid] ?? '訪客';

        unset($this->names[$cid]);
        unset($this->userConns[$username]);
        $this->clients->detach($conn);

        // 更新線上名單
        $this->broadcast([
            'type'  => 'user_list',
            'users' => array_values($this->names),
        ]);

        // 系統離線訊息
        $this->broadcast([
            'type'       => 'leave',
            'username'   => $username,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    // ────────────────────── 錯誤 ──────────────────────
    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        error_log($e->getMessage());
        $conn->close();
    }

    // ────────────────────── 工具：廣播 ──────────────────────
    /**
     * @param array $payload  要送出的資料（會自動 json_encode）
     * @param ConnectionInterface[] $exclude 要排除的連線
     */
    protected function broadcast(array $payload, array $exclude = [])
    {
        $json = json_encode($payload);
        foreach ($this->clients as $client) {
            if (!in_array($client, $exclude, true)) {
                $client->send($json);
            }
        }
    }
}

// -----------------------------------------------------------------------------
// 啟動 WebSocket 伺服器於 8081
$server = IoServer::factory(
    new HttpServer(new WsServer(new Chat())),
    8081
);
echo "WebSocket server running on :8081\n";
$server->run();
