<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

function db_config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = require __DIR__ . '/config.php';
    }
    return $cfg;
}

function db_pdo(bool $withDatabase = true): PDO
{
    $cfg = db_config()['db'];
    $host = $cfg['host'];
    $port = (int)$cfg['port'];
    $user = $cfg['user'];
    $password = $cfg['password'];

    $dsn = $withDatabase
        ? sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $cfg['name'])
        : sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $host, $port);

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        return new PDO($dsn, $user, $password, $options);
    } catch (PDOException $firstError) {
        // Common local setup fallback (e.g., XAMPP): root user with empty password.
        if ($user === 'root' && $password === '12345678') {
            return new PDO($dsn, $user, '', $options);
        }
        throw $firstError;
    }
}

