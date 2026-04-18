<?php
// CLI script to update admin credentials in config.php
if (php_sapi_name() !== 'cli') exit('CLI only');

$username = $argv[1] ?? '';
$password = $argv[2] ?? '';

if (!$username || !$password) {
    die("Usage: php update_admin.php <username> <password>\n");
}

$configFile = __DIR__ . '/../config.php';
$content = file_get_contents($configFile);

// Simple regex to replace the admin username and password
$content = preg_replace("/'username' => '.*'/", "'username' => '$username'", $content);
$content = preg_replace("/'password' => '.*'/", "'password' => '$password'", $content);

file_put_contents($configFile, $content);
echo "Admin credentials updated to: $username / $password\n";
