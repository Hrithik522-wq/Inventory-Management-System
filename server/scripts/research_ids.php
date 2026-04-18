<?php
require 'server/db.php';
try {
    $pdo = db_pdo(true);
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute(['HR@gmail']);
    $uid = $stmt->fetchColumn();
    echo "USER_ID: $uid\n";

    echo "CATEGORIES:\n";
    foreach($pdo->query('SELECT * FROM categories') as $r) echo "- {$r['name']} (ID: {$r['id']})\n";

    echo "\nSUPPLIERS:\n";
    foreach($pdo->query('SELECT * FROM suppliers') as $r) echo "- {$r['name']} (ID: {$r['id']})\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
