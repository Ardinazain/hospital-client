<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    
    $action = $body['action'] ?? '';
    
    // ============ LOGIN ============
    if ($action === 'login') {
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Username dan password harus diisi!']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND is_active = 1");
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password'])) {
                // Jika user belum punya API Key, generate sekaligus
                if (empty($user['api_key'])) {
                    $newApiKey = bin2hex(random_bytes(32));
                    $updateStmt = $pdo->prepare("UPDATE users SET api_key = ?, api_key_created_at = NOW(), api_key_expires_at = DATE_ADD(NOW(), INTERVAL 365 DAY) WHERE id = ?");
                    $updateStmt->execute([$newApiKey, $user['id']]);
                    $user['api_key'] = $newApiKey;
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Login berhasil',
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'fullname' => $user['fullname'],
                        'email' => $user['email'],
                        'phone' => $user['phone'],
                        'gender' => $user['gender'],
                        'role' => $user['role'],
                        'api_key' => $user['api_key']
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Username atau password salah!']);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()]);
        }
    }
    
    // ============ REGISTER ============
    elseif ($action === 'register') {
        $fullname = trim($body['fullname'] ?? '');
        $email = trim($body['email'] ?? '');
        $phone = trim($body['phone'] ?? '');
        $gender = $body['gender'] ?? '';
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';
        $role = $body['role'] ?? 'staff';
        
        // Validasi
        if (empty($fullname) || empty($email) || empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Nama lengkap, email, username, dan password harus diisi!']);
            exit();
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Format email tidak valid!']);
            exit();
        }
        
        if (!in_array($gender, ['Laki-laki', 'Perempuan'])) {
            $gender = null;
        }
        
        if (strlen($password) < 4) {
            echo json_encode(['success' => false, 'message' => 'Password minimal 4 karakter!']);
            exit();
        }
        
        if (!in_array($role, ['admin', 'staff', 'doctor'])) {
            $role = 'staff';
        }
        
        try {
            // Cek username
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Username sudah digunakan! Silakan pilih username lain.']);
                exit();
            }
            
            // Cek email
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar! Silakan gunakan email lain.']);
                exit();
            }
            
            // GENERATE API KEY (64 karakter hex)
            $apiKey = bin2hex(random_bytes(32));
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            $stmt = $pdo->prepare("INSERT INTO users (fullname, email, phone, gender, username, password, api_key, role, is_active, api_key_created_at, api_key_expires_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY))");
            $stmt->execute([$fullname, $email, $phone, $gender, $username, $hashedPassword, $apiKey, $role]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Registrasi berhasil! Silakan login untuk mendapatkan API Key.',
                'api_key' => $apiKey
            ]);
            
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan: ' . $e->getMessage()]);
        }
    }
    
    else {
        echo json_encode(['success' => false, 'message' => 'Aksi tidak dikenal']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
}
?>