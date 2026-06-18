<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$apiKey = $input['api_key'] ?? '';

if (empty($apiKey)) {
    echo json_encode([
        'success' => false,
        'message' => 'API Key tidak boleh kosong'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username, fullname, email, phone, gender, role, is_active, created_at FROM users WHERE api_key = ?");
    $stmt->execute([$apiKey]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && $user['is_active'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => 'API Key valid',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'fullname' => $user['fullname'],
                'email' => $user['email'],
                'phone' => $user['phone'] ?? '-',
                'gender' => $user['gender'] ?? '-',
                'role' => $user['role'],
                'is_active' => $user['is_active'],
                'registered_at' => $user['created_at']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'API Key tidak valid atau akun tidak aktif'
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
    ]);
}
?>