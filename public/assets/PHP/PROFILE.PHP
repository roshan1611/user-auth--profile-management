<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Include configurations
require_once 'config/redis_config.php';
require_once 'config/db_mongodb.php';

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get request data based on method
$sessionToken = '';
$userId = '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sessionToken = isset($_GET['sessionToken']) ? $_GET['sessionToken'] : '';
    $userId = isset($_GET['userId']) ? $_GET['userId'] : '';
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $sessionToken = isset($_POST['sessionToken']) ? $_POST['sessionToken'] : '';
    $userId = isset($_POST['userId']) ? $_POST['userId'] : '';
}

try {
    // Validate session token
    if (empty($sessionToken) || empty($userId)) {
        throw new Exception('Session token and user ID are required');
    }
    
    // Validate session from Redis
    $sessionData = validateSession($sessionToken);
    
    if (!$sessionData || $sessionData['userId'] != $userId) {
        throw new Exception('Invalid session');
    }
    
    // Handle GET request - Retrieve profile
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $profile = mongoFindOne('profiles', ['userId' => (int)$userId]);
        
        if ($profile) {
            // Convert MongoDB document to array
            $profileData = [
                'full_name' => isset($profile->full_name) ? $profile->full_name : '',
                'age' => isset($profile->age) ? $profile->age : '',
                'dob' => isset($profile->dob) ? $profile->dob : '',
                'contact' => isset($profile->contact) ? $profile->contact : '',
                'address' => isset($profile->address) ? $profile->address : '',
                'city' => isset($profile->city) ? $profile->city : '',
                'country' => isset($profile->country) ? $profile->country : ''
            ];
            
            echo json_encode([
                'success' => true,
                'profile' => $profileData
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'profile' => null
            ]);
        }
    }
    // Handle POST request - Update profile
    else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get profile data from POST
        $profileData = [
            'userId' => (int)$userId,
            'email' => isset($_POST['email']) ? trim($_POST['email']) : '',
            'full_name' => isset($_POST['full_name']) ? trim($_POST['full_name']) : '',
            'age' => isset($_POST['age']) && !empty($_POST['age']) ? (int)$_POST['age'] : null,
            'dob' => isset($_POST['dob']) ? trim($_POST['dob']) : '',
            'contact' => isset($_POST['contact']) ? trim($_POST['contact']) : '',
            'address' => isset($_POST['address']) ? trim($_POST['address']) : '',
            'city' => isset($_POST['city']) ? trim($_POST['city']) : '',
            'country' => isset($_POST['country']) ? trim($_POST['country']) : '',
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        // Remove null values
        $profileData = array_filter($profileData, function($value) {
            return $value !== null && $value !== '';
        });
        
        // Update or insert profile in MongoDB
        $result = mongoUpdate('profiles', ['userId' => (int)$userId], $profileData);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);
        } else {
            throw new Exception('Failed to update profile');
        }
    } else {
        throw new Exception('Invalid request method');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>