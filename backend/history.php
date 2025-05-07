<?php
require __DIR__ . '/vendor/autoload.php';

$db = new PDO(
    'mysql:host=127.0.0.1;dbname=chatdb;charset=utf8mb4',
    'chatuser',
    'andrea',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// 先選出最新 50 筆（DESC），再在外層把它們按 created_at ASC 排序
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
$history = $stmt->fetchAll(PDO::FETCH_ASSOC);

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// 回傳最舊→最新的 50 筆
echo json_encode($history);
