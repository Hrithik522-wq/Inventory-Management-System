<?php

declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../config.php';

function db_init_if_needed(): void
{
    // Cheap guard: if roles table exists, assume schema exists.
    // This matches the "run schema on first start" behavior.
    $cfg = require __DIR__ . '/../config.php';
    $dbName = $cfg['db']['name'];

    $rolesExists = false;
    try {
        $pdo = db_pdo(true);
        $stmt = $pdo->query("SELECT 1 FROM roles LIMIT 1");
        $rolesExists = ($stmt !== false);
    } catch (Throwable $e) {
        $rolesExists = false;
    }

    if ($rolesExists) {
        // Roles/schema may have been created manually without seeding users.
        // Ensure the default login user exists so the UI works out-of-the-box.
        try {
            $pdo = db_pdo(true);
            $stmt = $pdo->prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1');
            $stmt->execute(['HR@gmail']);
            $hasDefaultUser = ($stmt->fetchColumn() !== false);
        } catch (Throwable $e) {
            $hasDefaultUser = false;
        }

        // Ensure new tables exist even if previously initialized
        try {
            $pdo = db_pdo(true);
            $pdo->exec("
CREATE TABLE IF NOT EXISTS purchase_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    quantity INT NOT NULL,
    supplier_name VARCHAR(150),
    purchase_date DATE,
    price_per_unit DOUBLE NOT NULL,
    total_price DOUBLE GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
    product_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
            ");
        } catch (Throwable $e) {}

        if ($hasDefaultUser) {
            return;
        }
    }

    // Use PDO only (avoid mysqli extension requirement).
    // 1) Create database if missing.
    $pdoNoDb = db_pdo(false);
    $pdoNoDb->exec(
        "CREATE DATABASE IF NOT EXISTS {$dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );

    // 2) Execute SQL files statement-by-statement.
    $pdo = db_pdo(true);

    $setupSqlPath = __DIR__ . '/../../database_setup.sql';
    $defaultUserSqlPath = __DIR__ . '/../../create_test_user.sql';

    $runFile = function (string $path) use ($pdo): void {
        if (!is_file($path)) {
            return;
        }
        $sql = file_get_contents($path);
        if (!is_string($sql) || trim($sql) === '') {
            return;
        }

        // Remove /* ... */ blocks.
        $sql = preg_replace('~/\\*.*?\\*/~s', ' ', $sql) ?? $sql;
        // Remove -- ... line comments.
        $sql = preg_replace('/--.*(\r?\n)/', "\n", $sql) ?? $sql;

        // Split on semicolons not inside quoted strings.
        $statements = [];
        $buf = '';
        $inSingle = false;
        $inDouble = false;
        $len = strlen($sql);
        for ($i = 0; $i < $len; $i++) {
            $ch = $sql[$i];
            if ($ch === "'" && !$inDouble) {
                $inSingle = !$inSingle;
            } elseif ($ch === '"' && !$inSingle) {
                $inDouble = !$inDouble;
            }

            if ($ch === ';' && !$inSingle && !$inDouble) {
                $stmt = trim($buf);
                if ($stmt !== '') {
                    $statements[] = $stmt;
                }
                $buf = '';
                continue;
            }
            $buf .= $ch;
        }
        $tail = trim($buf);
        if ($tail !== '') {
            $statements[] = $tail;
        }

        foreach ($statements as $stmt) {
            // PDO::exec will ignore empty results and is fine for DDL/DML.
            $pdo->exec($stmt);
        }
    };

    $runFile($setupSqlPath);
    $runFile($defaultUserSqlPath);
}

