<?php
// MongoDB Configuration
define('MONGO_HOST', 'localhost');
define('MONGO_PORT', '27017');
define('MONGO_DB', 'auth_system');

// Get MongoDB connection
function getMongoDBConnection() {
    try {
        $connectionString = "mongodb://" . MONGO_HOST . ":" . MONGO_PORT;
        $client = new MongoDB\Driver\Manager($connectionString);
        
        return $client;
        
    } catch (Exception $e) {
        error_log("MongoDB Connection Error: " . $e->getMessage());
        return null;
    }
}

// Get MongoDB collection
function getMongoCollection($collectionName) {
    try {
        $manager = getMongoDBConnection();
        
        if (!$manager) {
            throw new Exception("Failed to connect to MongoDB");
        }
        
        return [
            'manager' => $manager,
            'namespace' => MONGO_DB . '.' . $collectionName
        ];
        
    } catch (Exception $e) {
        error_log("MongoDB Collection Error: " . $e->getMessage());
        return null;
    }
}

// Insert document into MongoDB
function mongoInsert($collectionName, $document) {
    try {
        $collection = getMongoCollection($collectionName);
        
        if (!$collection) {
            return false;
        }
        
        $bulk = new MongoDB\Driver\BulkWrite;
        $bulk->insert($document);
        
        $result = $collection['manager']->executeBulkWrite(
            $collection['namespace'],
            $bulk
        );
        
        return $result->getInsertedCount() > 0;
        
    } catch (Exception $e) {
        error_log("MongoDB Insert Error: " . $e->getMessage());
        return false;
    }
}

// Update document in MongoDB
function mongoUpdate($collectionName, $filter, $update, $options = []) {
    try {
        $collection = getMongoCollection($collectionName);
        
        if (!$collection) {
            return false;
        }
        
        $bulk = new MongoDB\Driver\BulkWrite;
        $bulk->update($filter, ['$set' => $update], $options + ['upsert' => true]);
        
        $result = $collection['manager']->executeBulkWrite(
            $collection['namespace'],
            $bulk
        );
        
        return ($result->getModifiedCount() > 0 || $result->getUpsertedCount() > 0);
        
    } catch (Exception $e) {
        error_log("MongoDB Update Error: " . $e->getMessage());
        return false;
    }
}

// Find document in MongoDB
function mongoFindOne($collectionName, $filter) {
    try {
        $collection = getMongoCollection($collectionName);
        
        if (!$collection) {
            return null;
        }
        
        $query = new MongoDB\Driver\Query($filter, ['limit' => 1]);
        $cursor = $collection['manager']->executeQuery($collection['namespace'], $query);
        
        $documents = $cursor->toArray();
        
        return !empty($documents) ? $documents[0] : null;
        
    } catch (Exception $e) {
        error_log("MongoDB Find Error: " . $e->getMessage());
        return null;
    }
}
?>