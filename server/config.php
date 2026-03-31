<?php

// Central DB configuration for the API.
// Defaults mirror the legacy Java fallback values (root / 12345678).
return [
    'db' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => getenv('DB_PORT') ?: '3306',
        'name' => getenv('DB_NAME') ?: 'inventory_db',
        'user' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASSWORD') ?: '@Hrithik2323',
    ],
    'session' => [
        // Keep sessions compatible with browser fetch.
        'cookie_lifetime' => 3600 * 8,
    ],
    'admin' => [
        // Keep legacy admin credentials behavior.
        'username' => 'admin123',
        'password' => 'admin@123',
    ],
];

