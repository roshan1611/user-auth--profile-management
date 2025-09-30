<?php
// Redis Configuration
define('REDIS_HOST', '127.0.0.1');
define('REDIS_PORT', 6379);
define('SESSION_EXPIRY', 86400); // 24 hours in seconds

// Get Redis connection
function getRedisConnection() {
    try {
        $redis = new Redis();
        $redis->connect(REDIS_HOST, REDIS_PORT);
        
        return $redis;
        
    } catch (Exception $e) {
        error_log("Redis Connection Error: " . $e->getMessage());
        return null;
    }
}

// Store session in Redis
function storeSession($sessionToken, $userId, $email) {
    try {
        $redis = getRedisConnection();
        
        if (!$redis) {
            return false;
        }
        
        $sessionData = json_encode([
            'userId' => $userId,
            'email' => $email,
            'created_at' => time()
        ]);
        
        $result = $redis->setex($sessionToken, SESSION_EXPIRY, $sessionData);
        $redis->close();
        
        return $result;
        
    } catch (Exception $e) {
        error_log("Redis Store Session Error: " . $e->getMessage());
        return false;
    }
}

// Validate session from Redis
function validateSession($sessionToken) {
    try {
        $redis = getRedisConnection();
        
        if (!$redis) {
            return null;
        }
        
        $sessionData = $redis->get($sessionToken);
        $redis->close();
        
        if ($sessionData === false) {
            return null;
        }
        
        return json_decode($sessionData, true);
        
    } catch (Exception $e) {
        error_log("Redis Validate Session Error: " . $e->getMessage());
        return null;
    }
}

// Delete session from Redis
function deleteSession($sessionToken) {
    try {
        $redis = getRedisConnection();
        
        if (!$redis) {
            return false;
        }
        
        $result = $redis->del($sessionToken);
        $redis->close();
        
        return $result > 0;
        
    } catch (Exception $e) {
        error_log("Redis Delete Session Error: " . $e->getMessage());
        return false;
    }
}

// Generate unique session token
function generateSessionToken() {
    return bin2hex(random_bytes(32));
}
?>