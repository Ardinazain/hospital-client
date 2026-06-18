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

// GET semua user / search user
if ($method === 'GET') {
    $search = $_GET['search'] ?? '';

    if ($search) {
        $stmt = $pdo->prepare("SELECT id, username, fullname, email, phone, gender, role, is_active, created_at 
            FROM users 
            WHERE username LIKE ? 
            OR fullname LIKE ? 
            OR email LIKE ? 
            ORDER BY id ASC");
        $term = "%$search%";
        $stmt->execute([$term, $term, $term]);
    } else {
        $stmt = $pdo->query("SELECT id, username, fullname, email, phone, gender, role, is_active, created_at FROM users ORDER BY id ASC");
    }

    $users = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'total' => count($users),
        'data' => $users
    ]);
}

// POST tambah user baru
elseif ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    $username = trim($body['username'] ?? '');
    $fullname = trim($body['fullname'] ?? '');
    $email = trim($body['email'] ?? '');
    $phone = trim($body['phone'] ?? '');
    $gender = $body['gender'] ?? '';
    $password = $body['password'] ?? '';
    $role = $body['role'] ?? 'staff';
    $is_active = isset($body['is_active']) ? (int)$body['is_active'] : 1;

    // Validasi wajib
    if (!$username || !$fullname || !$email || !$password) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username, fullname, email, dan password wajib diisi!']);
        exit();
    }

    // Validasi email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format email tidak valid!']);
        exit();
    }

    // Validasi password minimal 4 karakter
    if (strlen($password) < 4) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password minimal 4 karakter!']);
        exit();
    }

    // Validasi gender
    if ($gender && !in_array($gender, ['Laki-laki', 'Perempuan'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Gender harus Laki-laki atau Perempuan']);
        exit();
    }

    // Validasi role
    if (!in_array($role, ['admin', 'staff', 'doctor'])) {
        $role = 'staff';
    }

    // Cek username sudah ada
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username sudah digunakan!']);
        exit();
    }

    // Cek email sudah ada
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar!']);
        exit();
    }

    // Generate API Key untuk user baru
    $apiKey = bin2hex(random_bytes(32));
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (username, fullname, email, phone, gender, password, api_key, role, is_active, api_key_created_at, api_key_expires_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY))");
    $stmt->execute([$username, $fullname, $email, $phone, $gender, $hashedPassword, $apiKey, $role, $is_active]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'User berhasil ditambahkan',
        'data' => [
            'id' => $pdo->lastInsertId(),
            'username' => $username,
            'fullname' => $fullname,
            'email' => $email,
            'phone' => $phone,
            'gender' => $gender,
            'role' => $role,
            'is_active' => $is_active,
            'api_key' => $apiKey
        ]
    ]);
}

else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
}
?>