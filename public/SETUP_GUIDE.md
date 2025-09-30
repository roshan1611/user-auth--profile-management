# Authentication System Setup Guide

This is a complete PHP-based authentication system with MySQL, MongoDB, and Redis. Follow these steps to set up and run the application.

## Prerequisites

Before running this application, ensure you have the following installed:

1. **PHP 7.4 or higher** with the following extensions:
   - mysqli
   - mongodb (PHP MongoDB driver)
   - redis (PHP Redis extension)

2. **MySQL Server** (version 5.7 or higher)
3. **MongoDB Server** (version 4.0 or higher)
4. **Redis Server** (version 5.0 or higher)

## Installation Steps

### 1. Install Required PHP Extensions

#### Install MongoDB PHP Extension
```bash
# On Ubuntu/Debian
sudo apt-get install php-mongodb

# On macOS (using PECL)
pecl install mongodb

# On Windows
# Download php_mongodb.dll and add to php.ini: extension=php_mongodb.dll
```

#### Install Redis PHP Extension
```bash
# On Ubuntu/Debian
sudo apt-get install php-redis

# On macOS (using PECL)
pecl install redis

# On Windows
# Download php_redis.dll and add to php.ini: extension=php_redis.dll
```

### 2. Start Required Services

#### Start MySQL Server
```bash
# On Ubuntu/Debian
sudo service mysql start

# On macOS (Homebrew)
brew services start mysql

# On Windows
# Use MySQL Workbench or Services panel
```

#### Start MongoDB Server
```bash
# On Ubuntu/Debian
sudo service mongod start

# On macOS (Homebrew)
brew services start mongodb-community

# On Windows
# Start MongoDB service from Services panel
```

#### Start Redis Server
```bash
# On Ubuntu/Debian
sudo service redis-server start

# On macOS (Homebrew)
brew services start redis

# On Windows
# Download Redis for Windows and start redis-server.exe
```

### 3. Configure Database Settings

Edit the configuration files if needed:

**MySQL Configuration** (`public/assets/PHP/config/db_mysql.php`):
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Set your MySQL password
define('DB_NAME', 'auth_system');
```

**MongoDB Configuration** (`public/assets/PHP/config/db_mongodb.php`):
```php
define('MONGO_HOST', 'localhost');
define('MONGO_PORT', '27017');
define('MONGO_DB', 'auth_system');
```

**Redis Configuration** (`public/assets/PHP/config/redis_config.php`):
```php
define('REDIS_HOST', '127.0.0.1');
define('REDIS_PORT', 6379);
```

### 4. Start PHP Built-in Server

Navigate to the `public` directory and start the PHP server:

```bash
cd public
php -S localhost:8000
```

### 5. Access the Application

Open your web browser and navigate to:
- **Registration Page**: http://localhost:8000/INDEX.HTML
- **Login Page**: http://localhost:8000/LOGIN.HTML
- **Profile Page**: http://localhost:8000/PROFILE.HTML (requires login)

## Folder Structure

```
public/
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── LOGIN.JS
│   │   ├── PROFILE.JS
│   │   └── REGISTER.JS
│   └── PHP/
│       ├── config/
│       │   ├── db_mysql.php
│       │   ├── db_mongodb.php
│       │   └── redis_config.php
│       ├── LOGIN.PHP
│       ├── PROFILE.PHP
│       └── REGISTER.PHP
├── INDEX.HTML (Registration)
├── LOGIN.HTML
└── PROFILE.HTML
```

## Features

### 1. User Registration (INDEX.HTML)
- Email and password validation
- Password confirmation
- MySQL storage with prepared statements
- Password hashing with bcrypt

### 2. User Login (LOGIN.HTML)
- Email and password authentication
- Redis session storage
- LocalStorage for client-side session management
- Automatic redirect to profile on successful login

### 3. User Profile (PROFILE.HTML)
- View and update profile details:
  - Full Name
  - Age
  - Date of Birth
  - Contact Number
  - Address
  - City
  - Country
- MongoDB storage for profile data
- Session validation with Redis
- Logout functionality

## Security Features

1. **Prepared Statements**: All MySQL queries use prepared statements to prevent SQL injection
2. **Password Hashing**: Passwords are hashed using PHP's `password_hash()` with bcrypt
3. **Session Management**: Sessions are stored in Redis with 24-hour expiry
4. **Input Validation**: Client-side and server-side validation
5. **CORS Headers**: Properly configured for security

## Troubleshooting

### MySQL Connection Failed
- Check if MySQL server is running
- Verify credentials in `config/db_mysql.php`
- Ensure MySQL user has proper permissions

### MongoDB Connection Failed
- Check if MongoDB server is running: `sudo service mongod status`
- Verify MongoDB connection string
- Install MongoDB PHP extension if not installed

### Redis Connection Failed
- Check if Redis server is running: `redis-cli ping` (should return PONG)
- Verify Redis host and port in configuration
- Install Redis PHP extension if not installed

### Session Expired Errors
- Check if Redis server is running
- Verify session token is being stored in localStorage
- Check browser console for JavaScript errors

## Database Schema

### MySQL - users table
```sql
CREATE TABLE users (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);
```

### MongoDB - profiles collection
```javascript
{
    userId: Integer,
    email: String,
    full_name: String,
    age: Integer,
    dob: String,
    contact: String,
    address: String,
    city: String,
    country: String,
    updated_at: String
}
```

### Redis - Session Storage
```
Key: sessionToken (64-character hex string)
Value: JSON string containing userId, email, created_at
TTL: 86400 seconds (24 hours)
```

## API Endpoints

### POST /assets/PHP/REGISTER.PHP
Register a new user
```json
Request: { "email": "user@example.com", "password": "password123" }
Response: { "success": true, "message": "Registration successful" }
```

### POST /assets/PHP/LOGIN.PHP
Login user
```json
Request: { "email": "user@example.com", "password": "password123" }
Response: { 
    "success": true, 
    "sessionToken": "abc123...",
    "userId": 1,
    "email": "user@example.com"
}
```

### GET /assets/PHP/PROFILE.PHP
Get user profile
```
Request: ?sessionToken=abc123&userId=1
Response: { "success": true, "profile": {...} }
```

### POST /assets/PHP/PROFILE.PHP
Update user profile
```json
Request: { 
    "sessionToken": "abc123",
    "userId": 1,
    "full_name": "John Doe",
    ...
}
Response: { "success": true, "message": "Profile updated successfully" }
```

## Notes

- The database and tables are automatically created on first run
- Sessions expire after 24 hours
- All passwords are securely hashed and never stored in plain text
- Profile data is stored separately in MongoDB for scalability
- Redis is used for fast session lookup and management