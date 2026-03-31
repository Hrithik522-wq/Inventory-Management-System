<?php

declare(strict_types=1);

require_once __DIR__ . '/response.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/db/init.php';

cors_headers();
if (session_status() !== PHP_SESSION_ACTIVE) {
    $cfg = require __DIR__ . '/config.php';
    $lifetime = (int)($cfg['session']['cookie_lifetime'] ?? 28800);
    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path'     => '/',
        'samesite' => 'Lax',
        'httponly' => true,
        'secure'   => false, // set to true if using HTTPS
    ]);
    session_start();
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

function require_json_body(): array
{
    $body = read_json_body();
    if ($body === null) {
        json_response(['error' => 'Invalid or missing JSON body'], 400);
    }
    return $body;
}

function row_to_product(array $row): array
{
    return [
        'id' => (string)$row['id'],
        'name' => (string)$row['name'],
        'price' => (float)$row['price'],
        'quantity' => (int)$row['quantity'],
        'userId' => (int)$row['user_id'],
        'categoryId' => $row['category_id'] !== null ? (int)$row['category_id'] : null,
        'supplierId' => $row['supplier_id'] !== null ? (int)$row['supplier_id'] : null,
        'lowStockThreshold' => (int)$row['low_stock_threshold'],
        'alertEnabled' => (bool)$row['alert_enabled'],
    ];
}

function row_to_user(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => (string)$row['name'],
        'email' => (string)$row['email'],
        'roleId' => $row['role_id'] !== null ? (int)$row['role_id'] : null,
        'createdAt' => isset($row['created_at']) ? (string)$row['created_at'] : null,
    ];
}

function row_to_category(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => (string)$row['name'],
        'description' => $row['description'] !== null ? (string)$row['description'] : '',
    ];
}

function row_to_supplier(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => (string)$row['name'],
        'contactPerson' => $row['contact_person'] !== null ? (string)$row['contact_person'] : '',
        'phone' => $row['phone'] !== null ? (string)$row['phone'] : '',
        'email' => $row['email'] !== null ? (string)$row['email'] : '',
        'address' => $row['address'] !== null ? (string)$row['address'] : '',
    ];
}

try {
    // Initialize DB schema on first start (idempotent).
    // Keep this inside try so DB/bootstrap failures return JSON, not fatal HTML.
    db_init_if_needed();

    // Handle CORS preflight (OPTIONS) for ALL routes.
    if ($method === 'OPTIONS') {
        json_response(['ok' => true], 200);
    }

    // Preflight / health
    if ($path === '/' && $method === 'GET') {
        json_response(['ok' => true, 'service' => 'stockxpert-api']);
    }

    if ($path === '/api/logout' && $method === 'POST') {
        // Simple session logout for both regular user + admin.
        $_SESSION = [];
        if (session_id() !== '') {
            session_destroy();
        }
        json_response(['ok' => true]);
    }

    // --- Auth (regular users) ---
    if ($path === '/api/login' && $method === 'POST') {
        $body = require_json_body();
        $email = isset($body['email']) ? trim((string)$body['email']) : '';
        $password = isset($body['password']) ? (string)$body['password'] : '';

        if ($email === '' || $password === '') {
            json_response(['error' => 'Email and password required'], 400);
        }

        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? AND password = ? LIMIT 1');
        $stmt->execute([$email, $password]);
        $row = $stmt->fetch();

        if (!$row) {
            json_response(['error' => 'Invalid email or password'], 401);
        }

        $_SESSION['user_id'] = (int)$row['id'];
        json_response(['ok' => true, 'userId' => (int)$row['id'], 'name' => (string)$row['name']]);
    }

    if ($path === '/api/signup' && $method === 'POST') {
        $body = require_json_body();
        $name = isset($body['name']) ? trim((string)$body['name']) : '';
        $email = isset($body['email']) ? trim((string)$body['email']) : '';
        $password = isset($body['password']) ? (string)$body['password'] : '';

        if ($name === '' || $email === '' || $password === '') {
            json_response(['error' => 'Name, email and password required'], 400);
        }

        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $exists = (int)$stmt->fetchColumn() > 0;

        if ($exists) {
            json_response(['error' => 'Email already exists'], 409);
        }

        $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, NULL)');
        $ok = $stmt->execute([$name, $email, $password]);
        if (!$ok) {
            json_response(['error' => 'Failed to create account'], 500);
        }

        json_response(['ok' => true]);
    }

    // --- Auth (admin) ---
    if ($path === '/api/admin/login' && $method === 'POST') {
        $body = require_json_body();
        $username = isset($body['username']) ? trim((string)$body['username']) : '';
        $password = isset($body['password']) ? (string)$body['password'] : '';

        $cfg = require __DIR__ . '/config.php';
        $adminUser = $cfg['admin']['username'];
        $adminPass = $cfg['admin']['password'];

        // Keep legacy behavior exactly (hardcoded credentials).
        if ($username === $adminUser && $password === $adminPass) {
            $_SESSION['admin'] = true;
            json_response(['ok' => true, 'admin' => true]);
        }
        json_response(['error' => 'Invalid admin credentials'], 401);
    }

    // --- Categories ---
    if ($path === '/api/categories' && $method === 'GET') {
        require_login(); // allow only logged-in users (mirrors app-level flow)
        $pdo = db_pdo(true);
        $rows = $pdo->query('SELECT * FROM categories')->fetchAll();
        json_response(['ok' => true, 'categories' => array_map('row_to_category', $rows)]);
    }

    if ($path === '/api/categories' && $method === 'POST') {
        require_login();
        $body = require_json_body();
        $name = isset($body['name']) ? trim((string)$body['name']) : '';
        $description = isset($body['description']) ? trim((string)$body['description']) : '';
        if ($name === '') {
            json_response(['error' => 'Category name is required'], 400);
        }

        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
        $ok = $stmt->execute([$name, $description]);
        if (!$ok) {
            json_response(['error' => 'Failed to add category'], 500);
        }
        json_response(['ok' => true]);
    }

    // --- Suppliers ---
    if ($path === '/api/suppliers' && $method === 'GET') {
        require_login();
        $pdo = db_pdo(true);
        $rows = $pdo->query('SELECT * FROM suppliers')->fetchAll();
        json_response(['ok' => true, 'suppliers' => array_map('row_to_supplier', $rows)]);
    }

    if ($path === '/api/suppliers' && $method === 'POST') {
        require_login();
        $body = require_json_body();
        $name = isset($body['name']) ? trim((string)$body['name']) : '';
        $contactPerson = isset($body['contactPerson']) ? (string)$body['contactPerson'] : '';
        $phone = isset($body['phone']) ? (string)$body['phone'] : '';
        $email = isset($body['email']) ? (string)$body['email'] : '';
        $address = isset($body['address']) ? (string)$body['address'] : '';

        if ($name === '') {
            json_response(['error' => 'Supplier name is required'], 400);
        }

        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)');
        $ok = $stmt->execute([$name, $contactPerson, $phone, $email, $address]);
        if (!$ok) {
            json_response(['error' => 'Failed to add supplier'], 500);
        }
        json_response(['ok' => true]);
    }

    // --- Products (regular user) ---
    if ($path === '/api/products' && $method === 'GET') {
        $userId = require_login();
        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('SELECT * FROM products WHERE user_id = ?');
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();
        json_response(['ok' => true, 'products' => array_map('row_to_product', $rows)]);
    }

    if ($path === '/api/products' && $method === 'POST') {
        $userId = require_login();
        $body = require_json_body();

        $id = isset($body['id']) ? trim((string)$body['id']) : '';
        $name = isset($body['name']) ? trim((string)$body['name']) : '';
        $price = isset($body['price']) ? (float)$body['price'] : 0.0;
        $quantity = isset($body['quantity']) ? (int)$body['quantity'] : 0;
        $lowStockThreshold = isset($body['threshold']) ? (int)$body['threshold'] : 10;
        $alertEnabled = isset($body['alertEnabled']) ? (bool)$body['alertEnabled'] : true;

        $categoryId = isset($body['categoryId']) && $body['categoryId'] !== null ? (int)$body['categoryId'] : null;
        $supplierId = isset($body['supplierId']) && $body['supplierId'] !== null ? (int)$body['supplierId'] : null;

        if ($id === '' || $name === '') {
            json_response(['error' => 'Product id and name are required'], 400);
        }

        $pdo = db_pdo(true);
        $stmt = $pdo->prepare(
            'INSERT INTO products (id, name, price, quantity, user_id, category_id, supplier_id, low_stock_threshold, alert_enabled)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            $name,
            $price,
            $quantity,
            $userId,
            $categoryId,
            $supplierId,
            $lowStockThreshold,
            $alertEnabled ? 1 : 0,
        ]);

        json_response(['ok' => true]);
    }

    if (preg_match('#^/api/products/([^/]+)/quantity$#', $path, $m) === 1 && $method === 'PUT') {
        $userId = require_login();
        $productId = $m[1];
        $body = require_json_body();
        if (!isset($body['quantity'])) {
            json_response(['error' => 'quantity is required'], 400);
        }
        $newQuantity = (int)$body['quantity'];

        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('UPDATE products SET quantity = ? WHERE id = ? AND user_id = ?');
        $stmt->execute([$newQuantity, $productId, $userId]);

        // Return updated product like the Java controller re-fetch does.
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? AND user_id = ? LIMIT 1');
        $stmt->execute([$productId, $userId]);
        $row = $stmt->fetch();
        if (!$row) {
            json_response(['error' => 'Product not found'], 404);
        }

        json_response(['ok' => true, 'product' => row_to_product($row)]);
    }

    if (preg_match('#^/api/products/([^/]+)$#', $path, $m) === 1 && $method === 'DELETE') {
        $userId = require_login();
        $productId = $m[1];

        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('DELETE FROM products WHERE id = ? AND user_id = ?');
        $stmt->execute([$productId, $userId]);

        json_response(['ok' => true]);
    }

    if ($path === '/api/products/search' && $method === 'GET') {
        $userId = require_login();
        $productId = isset($_GET['id']) ? (string)$_GET['id'] : '';
        if ($productId === '') {
            json_response(['error' => 'Missing id query param'], 400);
        }
        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? AND user_id = ?');
        $stmt->execute([$productId, $userId]);
        $rows = $stmt->fetchAll();
        json_response(['ok' => true, 'products' => array_map('row_to_product', $rows)]);
    }

    if ($path === '/api/products/low-stock' && $method === 'GET') {
        $userId = require_login();
        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('SELECT * FROM products WHERE user_id = ? AND quantity <= low_stock_threshold AND alert_enabled = TRUE');
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();
        json_response(['ok' => true, 'products' => array_map('row_to_product', $rows)]);
    }

    // --- Products (admin) ---
    if ($path === '/api/admin/users' && $method === 'GET') {
        require_admin();
        $pdo = db_pdo(true);
        $rows = $pdo->query('SELECT * FROM users')->fetchAll();
        json_response(['ok' => true, 'users' => array_map('row_to_user', $rows)]);
    }

    if ($path === '/api/admin/users/search' && $method === 'GET') {
        require_admin();
        $q = isset($_GET['q']) ? (string)$_GET['q'] : '';
        if ($q === '') {
            json_response(['ok' => true, 'users' => []]);
        }
        $pdo = db_pdo(true);
        $pattern = '%' . $q . '%';
        $stmt = $pdo->prepare('SELECT * FROM users WHERE name LIKE ? OR email LIKE ?');
        $stmt->execute([$pattern, $pattern]);
        $rows = $stmt->fetchAll();
        json_response(['ok' => true, 'users' => array_map('row_to_user', $rows)]);
    }

    if (preg_match('#^/api/admin/users/(\d+)$#', $path, $m) === 1 && $method === 'DELETE') {
        require_admin();
        $userId = (int)$m[1];

        $pdo = db_pdo(true);
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('DELETE FROM products WHERE user_id = ?');
            $stmt->execute([$userId]);

            $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
            $stmt->execute([$userId]);

            $pdo->commit();
            json_response(['ok' => true]);
        } catch (Throwable $e) {
            $pdo->rollBack();
            json_response(['error' => 'Failed to delete user'], 500);
        }
    }

    if ($path === '/api/admin/products' && $method === 'GET') {
        require_admin();
        $pdo = db_pdo(true);
        $rows = $pdo->query('SELECT * FROM products')->fetchAll();
        json_response(['ok' => true, 'products' => array_map('row_to_product', $rows)]);
    }

    if ($path === '/api/admin/products/search' && $method === 'GET') {
        require_admin();
        $q = isset($_GET['id']) ? (string)$_GET['id'] : '';
        if ($q === '') {
            json_response(['ok' => true, 'products' => []]);
        }
        $pdo = db_pdo(true);
        $pattern = '%' . $q . '%';
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id LIKE ?');
        $stmt->execute([$pattern]);
        $rows = $stmt->fetchAll();
        json_response(['ok' => true, 'products' => array_map('row_to_product', $rows)]);
    }

    if (preg_match('#^/api/admin/products/delete-all$#', $path, $m) === 1 && $method === 'POST') {
        require_admin();
        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('DELETE FROM products');
        $stmt->execute();
        json_response(['ok' => true]);
    }

    if (preg_match('#^/api/admin/products/([^/]+)$#', $path, $m) === 1 && $method === 'DELETE') {
        require_admin();
        $productId = $m[1];

        // Admin deletion needs both product_id and user_id (matches Java ProductDAO.deleteProduct(productId, userId)).
        $userId = isset($_GET['userId']) ? (int)$_GET['userId'] : 0;
        if ($userId <= 0) {
            json_response(['error' => 'Missing userId query param'], 400);
        }

        $pdo = db_pdo(true);
        $stmt = $pdo->prepare('DELETE FROM products WHERE id = ? AND user_id = ?');
        $stmt->execute([$productId, $userId]);
        json_response(['ok' => true]);
    }

    json_response(['error' => 'Not found'], 404);
} catch (Throwable $e) {
    json_response(['error' => 'Server error', 'detail' => $e->getMessage()], 500);
}

