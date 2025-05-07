<?php
// 載入 Composer 自動加載機制（會載入 vendor/autoload.php）
require __DIR__ . '/vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

class Chat implements MessageComponentInterface {
    // 儲存所有連線的客戶端
    protected $clients;
    // 儲存列表使用者名稱
    protected $names;
    // PDO 資料庫連線
    protected $db;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->names   = [];
        $this->db = new PDO(
            'mysql:host=127.0.0.1;dbname=chatdb;charset=utf8mb4',
            'chatuser',
            'andrea',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }

    // 新連線時觸發：附加客戶端並發送歷史訊息
    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        $stmt = $this->db->query(
            "SELECT username, message, created_at
             FROM chat_messages
             ORDER BY id DESC LIMIT 50"
        );
        $history = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
        $conn->send(json_encode([
            'type'     => 'history',
            'messages' => $history
        ]));
    }

    // 接收訊息時觸發
    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        $type = $data['type'] ?? 'message';

        // 處理 join：記錄名稱、回傳完整在線列表、並廣播給他人
        if ($type === 'join') {
            $this->names[spl_object_id($from)] = $data['username'];

            // 廣播最新在線名單給所有人
            $userListMsg = json_encode([
                'type'  => 'user_list',
                'users' => array_values($this->names),
            ]);
            foreach ($this->clients as $client) {
                $client->send($userListMsg);
            }

            // 再廣播系統訊息 join（可選）
            $join = json_encode([
                'type'       => 'join',
                'username'   => $data['username'],
                'created_at' => date('Y-m-d H:i:s'),
            ]);
            foreach ($this->clients as $client) {
                if ($client !== $from) {
                    $client->send($join);
                }
            }
            return;
        }


        // 處理一般訊息：存 DB、廣播
        $username = $this->names[spl_object_id($from)] ?? '訪客';
        $message  = $data['message'] ?? '';
        $stmt = $this->db->prepare(
            "INSERT INTO chat_messages (username, message) VALUES (?, ?)"
        );
        $stmt->execute([$username, $message]);
        $payload = json_encode([
            'type'       => 'message',
            'username'   => $username,
            'message'    => $message,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        foreach ($this->clients as $client) {
            $client->send($payload);
        }
    }

    // 客戶端斷線時觸發：廣播 leave、移除記錄
    public function onClose(ConnectionInterface $conn) {
        $id       = spl_object_id($conn);
        $username = $this->names[$id] ?? '訪客';
        unset($this->names[$id]);
    
        // 廣播最新在線名單給所有人
        $userListMsg = json_encode([
            'type'  => 'user_list',
            'users' => array_values($this->names),
        ]);
        foreach ($this->clients as $client) {
            $client->send($userListMsg);
        }
    
        // 廣播系統訊息 leave（可選）
        $leave = json_encode([
            'type'       => 'leave',
            'username'   => $username,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        foreach ($this->clients as $client) {
            $client->send($leave);
        }
    
        $this->clients->detach($conn);
    }
    
    // 錯誤時觸發：記錄並關閉連線
    public function onError(ConnectionInterface $conn, \Exception $e) {
        error_log($e->getMessage());
        $conn->close();
    }
}

// 啟動 WebSocket 伺服器於 8081
$server = IoServer::factory(
    new HttpServer(new WsServer(new Chat())),
    8081
);
echo "WebSocket server running on :8081\n";
$server->run();
