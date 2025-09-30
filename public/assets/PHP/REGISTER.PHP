<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Include database configuration
require_once 'config/db_mysql.php';

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
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Validate password length
    if (strlen($password) < 6) {
        throw new Exception('Password must be at least 6 characters long');
    }
    
    // Get database connection
    $conn = getMySQLConnection();
    
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
    
    // Check if email already exists using prepared statement
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    
    if (!$stmt) {
        throw new Exception('Failed to prepare statement');
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $stmt->close();
        $conn->close();
        throw new Exception('Email already registered');
    }
    
    $stmt->close();
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert user using prepared statement
    $stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    
    if (!$stmt) {
        throw new Exception('Failed to prepare insert statement');
    }
    
    $stmt->bind_param("ss", $email, $hashedPassword);
    
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->close();
        throw new Exception('Failed to register user');
    }
    
    $stmt->close();
    $conn->close();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>