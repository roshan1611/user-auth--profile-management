<?php
// MySQL Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'auth_system');

// Create MySQL connection
function getMySQLConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("MySQL Connection failed: " . $conn->connect_error);
        }
        
        $conn->set_charset("utf8mb4");
        return $conn;
        
    } catch (Exception $e) {
        error_log($e->getMessage());
        return null;
    }
}

// Initialize database and create users table if not exists
function initializeDatabase() {
    try {
        // Connect without database selection first
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        // Create database if not exists
        $sql = "CREATE DATABASE IF NOT EXISTS " . DB_NAME;
        $conn->query($sql);
        
        // Select the database
        $conn->select_db(DB_NAME);
        
        // Create users table
        $sql = "CREATE TABLE IF NOT EXISTS users (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $conn->query($sql);
        $conn->close();
        
        return true;
        
    } catch (Exception $e) {
        error_log($e->getMessage());
        return false;
    }
}

// Auto-initialize database
initializeDatabase();
?>