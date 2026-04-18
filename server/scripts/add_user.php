<?php
// CLI script to add a regular user to the database
if (php_sapi_name() !== 'cli') exit('CLI only');

require_once __DIR__ . '/../db.php';

$name = $argv[1] ?? '';
$email = $argv[2] ?? '';
$password = $argv[3] ?? '';

if (!$name || !$email || !$password) {
    die("Usage: php add_user.php <name> <email> <password>\n");
}

try {
    $pdo = db_pdo(true);
    // Insert if not exists
    $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, NULL)');
    $stmt->execute([$name, $email, $password]);
    echo "User '$name' ($email) added successfully!\n";
} catch (Throwable $e) {
    die("Error adding user: " . $e->getMessage() . "\n");
}
