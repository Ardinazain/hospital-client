<?php
// Izinkan CORS dengan benar untuk Preflight / fetch requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, x-api-key, api_key, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
include __DIR__ . "/database.php";

// Dapatkan Header API Key secara kebal-case (case-insensitive)
$api_key = '';
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $key => $value) {
        if (strtolower($key) === 'x-api-key') {
            $api_key = $value;
            break;
        }
    }
}
if (!$api_key) {
    $api_key = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
}

if (!$api_key) {
    http_response_code(401);
    echo json_encode(["message"=>"API KEY diperlukan"]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE api_key=?");
$stmt->execute([$api_key]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(403);
    echo json_encode(["message"=>"API KEY tidak valid"]);
    exit;
}