<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Include configurations
require_once 'config/db_mysql.php';
require_once 'config/redis_config.php';

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Get POST data
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    // Validate input
    if (empty($email) || empty($password)) {
        throw new Exception('Email and password are required');
    }
    
    // Get database connection
    $conn = getMySQLConnection();
    
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
    
    // Get user from database using prepared statement
    $stmt = $conn->prepare("SELECT id, email, password FROM users WHERE email = ?");
    
    if (!$stmt) {
        throw new Exception('Failed to prepare statement');
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        $conn->close();
        throw new Exception('Invalid email or password');
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    $conn->close();
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        throw new Exception('Invalid email or password');
    }
    
    // Generate session token
    $sessionToken = generateSessionToken();
    
    // Store session in Redis
    if (!storeSession($sessionToken, $user['id'], $user['email'])) {
        throw new Exception('Failed to create session');
    }
    
    // Return success response with session token
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'sessionToken' => $sessionToken,
        'userId' => $user['id'],
        'email' => $user['email']
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>