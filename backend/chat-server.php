<?php
// 載入 Composer 自動加載機制（會載入 vendor/autoload.php）
require __DIR__ . '/vendor/autoload.php';

// 使用 Ratchet WebSocket 核心介面
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

// 定義 Chat 類別，實作 MessageComponentInterface 以處理 WebSocket 事件
class Chat implements MessageComponentInterface {
    // 用於儲存所有連線的客戶端物件
    protected $clients;
    // PDO 物件，用於連接並操作資料庫
    protected $db;
    // 儲存每個連線對應的使用者名稱，key 為連線的物件 ID
    protected $names;

    public function __construct() {
        // 初始化 SplObjectStorage，作為客戶端集合
        $this->clients = new \SplObjectStorage;
        // 初始化使用者名稱對照表
        $this->names   = [];

        // 建立 PDO 資料庫連線，使用 UTF-8 編碼與例外錯誤模式
        $this->db = new PDO(
            'mysql:host=127.0.0.1;dbname=chatdb;charset=utf8mb4',
            'chatuser',      // 資料庫使用者名稱
            'andrea',        // 資料庫密碼
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }

    // 當有新客戶端連線時呼叫
    public function onOpen(ConnectionInterface $conn) {
        // 將新連線加到 clients 集合中
        $this->clients->attach($conn);

        // 讀取最近 50 筆歷史訊息（由最新到最舊），再反轉順序送給前端
        $stmt = $this->db->query(
            "SELECT username, message, created_at
             FROM chat_messages
             ORDER BY id DESC LIMIT 50"
        );
        $history = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));

        // 將歷史訊息包成 JSON 格式，並送到剛連線的客戶端
        $conn->send(json_encode([
            'type'     => 'history',
            'messages' => $history
        ]));
    }

    // 當收到 client 發送訊息時呼叫
    public function onMessage(ConnectionInterface $from, $msg) {
        // 將收到的 JSON 字串解析成陣列
        $data = json_decode($msg, true);
        // 取得 message 類型，預設為 'message'
        $type = $data['type'] ?? 'message';

        // 處理用戶加入聊天室的訊息
        if ($type === 'join') {
            // 記錄此連線的使用者名稱
            $this->names[spl_object_id($from)] = $data['username'];
            // 準備廣播給所有客戶端的 join 事件
            $join = json_encode([
                'type'       => 'join',
                'username'   => $data['username'],
                'created_at' => date('Y-m-d H:i:s')
            ]);
            // 廣播給所有目前連線的客戶端
            foreach ($this->clients as $c) {
                $c->send($join);
            }
            return;
        }

        // 處理一般訊息
        // 取得使用者名稱，若未 join 過，則視為 訪客
        $username = $this->names[spl_object_id($from)] ?? '訪客';
        $message  = $data['message'] ?? '';

        // 將訊息存進資料庫 chat_messages 表格
        $stmt = $this->db->prepare(
            "INSERT INTO chat_messages (username, message) VALUES (?, ?)"
        );
        $stmt->execute([$username, $message]);

        // 準備要廣播的訊息資料
        $payload = json_encode([
            'type'       => 'message',
            'username'   => $username,
            'message'    => $message,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        // 廣播給所有客戶端
        foreach ($this->clients as $c) {
            $c->send($payload);
        }
    }

    // 當客戶端連線關閉時呼叫
    public function onClose(ConnectionInterface $conn) {
        // 取得此連線對應的使用者名稱
        $id       = spl_object_id($conn);
        $username = $this->names[$id] ?? '訪客';

        // 準備廣播給所有客戶端的 leave 事件
        $leave = json_encode([
            'type'       => 'leave',
            'username'   => $username,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        foreach ($this->clients as $c) {
            $c->send($leave);
        }

        // 從客戶端集合中移除
        $this->clients->detach($conn);
        // 移除使用者名稱對應，釋放記憶體
        unset($this->names[$id]);
    }

    // 發生錯誤時呼叫
    public function onError(ConnectionInterface $conn, \Exception $e) {
        // 將錯誤訊息寫入伺服器錯誤日誌
        error_log($e->getMessage());
        // 關閉此連線
        $conn->close();
    }
}

// 啟動 WebSocket 伺服器，監聽本機 8081 埠
$server = IoServer::factory(
    new HttpServer(new WsServer(new Chat())),
    8081
);

echo "WebSocket server running on :8081\n";
// 開始事件迴圈，永遠運行伺服器
$server->run();
