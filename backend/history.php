<?php
// history.php
require __DIR__ . '/vendor/autoload.php';

$db = new PDO(
    'mysql:host=127.0.0.1;dbname=chatdb;charset=utf8mb4',
    'chatuser',
    'andrea',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// 識別私聊模式
$user = $_GET['user'] ?? '';
$peer = $_GET['peer'] ?? '';

if ($user !== '' && $peer !== '') {
    // 私聊歷史：from/to 任一方向，最新 50 筆，再按時間正序回
    $sql = "
      SELECT from_user AS username, message, created_at
      FROM (
        SELECT from_user, to_user, message, created_at
        FROM private_messages
        WHERE (from_user = :u AND to_user = :p)
           OR (from_user = :p AND to_user = :u)
        ORDER BY id DESC
        LIMIT 50
      ) AS sub
      ORDER BY created_at ASC
    ";
    $stmt = $db->prepare($sql);
    $stmt->execute(['u' => $user, 'p' => $peer]);
} else {
    // 公聊歷史
    $sql = "
      SELECT username, message, created_at
      FROM (
        SELECT username, message, created_at
        FROM chat_messages
        ORDER BY id DESC
        LIMIT 50
      ) AS sub
      ORDER BY created_at ASC
    ";
    $stmt = $db->query($sql);
}

$history = $stmt->fetchAll(PDO::FETCH_ASSOC);

// CORS 標頭
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// 回傳 JSON
echo json_encode($history);
