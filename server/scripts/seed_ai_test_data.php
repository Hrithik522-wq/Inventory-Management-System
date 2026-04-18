<?php
require_once __DIR__ . '/../db.php';

try {
    $pdo = db_pdo(true);
    $userId = 2; // HR@gmail

    echo "Seeding data for User ID: $userId\n";

    // 1. Ensure Categories
    $categories = [
        'PC Components' => 'Processors, GPUs, RAM, etc.',
        'Portable Electronics' => 'Mobile phones, tablets, earbuds',
        'Peripherals' => 'Monitors, keyboards, mice'
    ];
    $catIds = [];
    foreach ($categories as $name => $desc) {
        $stmt = $pdo->prepare("SELECT id FROM categories WHERE name = ?");
        $stmt->execute([$name]);
        $id = $stmt->fetchColumn();
        if (!$id) {
            $stmt = $pdo->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
            $stmt->execute([$name, $desc]);
            $id = $pdo->lastInsertId();
        }
        $catIds[$name] = (int)$id;
    }

    // 2. Ensure Suppliers
    $suppliers = [
        'Silicon Valley Distri' => 'USA Based Distributor',
        'TechHut Global' => 'Global Electronics Supplier'
    ];
    $supIds = [];
    foreach ($suppliers as $name => $desc) {
        $stmt = $pdo->prepare("SELECT id FROM suppliers WHERE name = ?");
        $stmt->execute([$name]);
        $id = $stmt->fetchColumn();
        if (!$id) {
            $stmt = $pdo->prepare("INSERT INTO suppliers (name, contact_person) VALUES (?, ?)");
            $stmt->execute([$name, 'Test Contact']);
            $id = $pdo->lastInsertId();
        }
        $supIds[$name] = (int)$id;
    }

    // 3. Products Definition (20 items)
    $products = [
        ['RTX 4090 GPU', 1599.99, 5, 'PC Components', 'Silicon Valley Distri', 10],
        ['RTX 4070 Ti', 799.99, 12, 'PC Components', 'Silicon Valley Distri', 15],
        ['Core i9-14900K', 589.99, 8, 'PC Components', 'TechHut Global', 10],
        ['Ryzen 7 7800X3D', 349.99, 4, 'PC Components', 'TechHut Global', 15],
        ['32GB DDR5 RAM', 129.99, 25, 'PC Components', 'Silicon Valley Distri', 20],
        ['16GB DDR4 RAM', 45.99, 50, 'PC Components', 'Silicon Valley Distri', 30],
        ['Samsung 990 Pro 2TB', 169.99, 15, 'PC Components', 'TechHut Global', 15],
        ['Crucial P5 Plus 1TB', 89.99, 3, 'PC Components', 'TechHut Global', 10],
        ['ASUS Z790 MB', 299.99, 7, 'PC Components', 'Silicon Valley Distri', 10],
        ['850W Gold PSU', 119.99, 10, 'PC Components', 'Silicon Valley Distri', 15],
        ['iPhone 15 Pro', 999.99, 6, 'Portable Electronics', 'TechHut Global', 20],
        ['Galaxy S23 Ultra', 1199.99, 2, 'Portable Electronics', 'TechHut Global', 10],
        ['iPad Pro M2', 799.99, 4, 'Portable Electronics', 'TechHut Global', 10],
        ['Sony XM5 Headphones', 349.99, 18, 'Portable Electronics', 'Silicon Valley Distri', 15],
        ['LG 27" 144Hz Monitor', 249.99, 9, 'Peripherals', 'Silicon Valley Distri', 10],
        ['Samsung Odyssey G9', 1299.99, 3, 'Peripherals', 'TechHut Global', 5],
        ['Logitech G Pro Mouse', 129.99, 30, 'Peripherals', 'TechHut Global', 25],
        ['Razer Keyboard V3', 159.99, 14, 'Peripherals', 'Silicon Valley Distri', 15],
        ['AirPods Pro 2', 249.99, 40, 'Portable Electronics', 'TechHut Global', 20],
        ['MacBook Pro 14"', 1999.99, 5, 'Portable Electronics', 'Silicon Valley Distri', 10],
    ];

    $productIds = [];
    foreach ($products as $p) {
        $id = strtolower(str_replace([' ', '"'], '-', $p[0]));
        $name = $p[0];
        $price = $p[1];
        $qty = $p[2];
        $catId = $catIds[$p[3]];
        $supId = $supIds[$p[4]];
        $threshold = $p[5];

        // Check if exists
        $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            $stmt = $pdo->prepare("INSERT INTO products (id, name, price, quantity, user_id, category_id, supplier_id, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $name, $price, $qty, $userId, $catId, $supId, $threshold]);
        } else {
             $stmt = $pdo->prepare("UPDATE products SET quantity = ?, price = ?, low_stock_threshold = ? WHERE id = ? AND user_id = ?");
             $stmt->execute([$qty, $price, $threshold, $id, $userId]);
        }
        $productIds[] = $id;
    }

    // 4. Generate Purchase History (Last 4 Months)
    // We want some High Demand (10+ per month), Medium (5+), Low (1+).
    $months = ['2026-01', '2026-02', '2026-03', '2026-04'];
    
    // Clear existing history to make predictions deterministic for this test
    $pdo->prepare("DELETE FROM purchase_records WHERE user_id = ?")->execute([$userId]);

    foreach ($productIds as $idx => $pid) {
        $demandLevel = ($idx % 3); // 0 = High, 1 = Medium, 2 = Low
        
        foreach ($months as $m) {
            $count = 0;
            if ($demandLevel == 0) $count = rand(15, 25);
            if ($demandLevel == 1) $count = rand(6, 12);
            if ($demandLevel == 2) $count = rand(1, 3);

            for ($i = 0; $i < $count; $i++) {
                $day = str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT);
                $date = "$m-$day";
                $perUnit = ($products[$idx][1] * 0.9); // Cost approx 90% of sell price
                $qty = rand(1, 10);
                
                $stmt = $pdo->prepare("INSERT INTO purchase_records (user_id, item_name, category, quantity, supplier_name, purchase_date, price_per_unit, product_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$userId, $products[$idx][0], $products[$idx][3], $qty, $products[$idx][4], $date, $perUnit, $pid]);
            }
        }
    }

    echo "SUCCESS: 20 products and randomized purchase history seeded for HR@gmail.\n";

} catch (Throwable $e) {
    die("ERROR: " . $e->getMessage() . "\n");
}
