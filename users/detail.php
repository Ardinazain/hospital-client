<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, x-api-key, api_key, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

// Validasi API Key (semua user bisa akses)
$provided_key = '';
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $key => $value) {
        if (strtolower($key) === 'x-api-key') {
            $provided_key = $value;
            break;
        }
    }
}
if (!$provided_key) {
    $provided_key = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
}

if (!$provided_key) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Akses ditolak! API Key diperlukan.']);
    exit();
}

$stmt = $pdo->prepare("SELECT id, role, username FROM users WHERE api_key = ? AND is_active = 1");
$stmt->execute([$provided_key]);
$currentUser = $stmt->fetch();
if (!$currentUser) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'API Key tidak valid atau tidak aktif!']);
    exit();
}

// ✅ SEMUA USER BISA AKSES TANPA PENGEcUALIAN

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID tidak ditemukan']);
    exit();
}

// GET user by ID
if ($method === 'GET') {
    // ✅ TAMBAHKAN api_key DI SELECT
    $stmt = $pdo->prepare("SELECT id, username, fullname, email, phone, gender, role, is_active, created_at, api_key 
        FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
        exit();
    }

    // Hapus password dari response (jangan dikirim)
    unset($user['password']);
    
    echo json_encode(['success' => true, 'data' => $user]);
}

// PUT update user
elseif ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);

    $fullname = $body['fullname'] ?? null;
    $email = $body['email'] ?? null;
    $phone = $body['phone'] ?? null;
    $gender = $body['gender'] ?? null;
    $role = $body['role'] ?? null;
    $is_active = isset($body['is_active']) ? (int)$body['is_active'] : null;
    $password = $body['password'] ?? null;

    if ($fullname === null && $email === null && $phone === null && $gender === null && $role === null && $is_active === null && $password === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tidak ada data yang diupdate']);
        exit();
    }

    $updates = [];
    $params = [];

    if ($fullname !== null) {
        $updates[] = "fullname = ?";
        $params[] = $fullname;
    }
    if ($email !== null) {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Format email tidak valid!']);
            exit();
        }
        $updates[] = "email = ?";
        $params[] = $email;
    }
    if ($phone !== null) {
        $updates[] = "phone = ?";
        $params[] = $phone;
    }
    if ($gender !== null) {
        if (!in_array($gender, ['Laki-laki', 'Perempuan'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Gender harus Laki-laki atau Perempuan']);
            exit();
        }
        $updates[] = "gender = ?";
        $params[] = $gender;
    }
    if ($role !== null) {
        if (!in_array($role, ['admin', 'staff', 'doctor'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Role harus admin, staff, atau doctor']);
            exit();
        }
        $updates[] = "role = ?";
        $params[] = $role;
    }
    if ($is_active !== null) {
        $updates[] = "is_active = ?";
        $params[] = $is_active;
    }
    if ($password !== null) {
        if (strlen($password) < 4) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Password minimal 4 karakter!']);
            exit();
        }
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $updates[] = "password = ?";
        $params[] = $hashedPassword;
    }

    $params[] = $id;
    $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'User berhasil diupdate']);
}

// DELETE user
elseif ($method === 'DELETE') {
    // ✅ Semua user bisa hapus user lain (tanpa pengecualian)
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'User berhasil dihapus']);
}

else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
}
?>