<?php
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/mail_helper.php';

$config = require __DIR__ . '/mail_config.php';

/**
 * Deep Diagnostic Tool for StockXpert SMTP.
 * Reachable at http://localhost:8000/test_mail_system.php
 */

echo "<h1>StockXpert SMTP Deep Diagnostic</h1>";
debug_log("Starting manual mail system test...");

if ($config['username'] === 'your-email@gmail.com') {
    echo "<h3 style='color: orange;'>⚠️ ACTION REQUIRED: Configuration Needed</h3>";
    echo "<p>Please edit <b>server/mail_config.php</b> first.</p>";
    exit;
}

$testItem = [
    ['id' => 'TRACE-001', 'name' => 'Deep Trace Test Item', 'quantity' => 1, 'threshold' => 10]
];

$recipient = $config['receiver_email'];
echo "<p>Performing <b>Trace-Level SMTP Handshake</b> to <b>$recipient</b>...</p>";

$success = sendLowStockEmail($recipient, $testItem);

if ($success) {
    echo "<h3 style='color: green;'>✅ SUCCESS: Message accepted by Gmail!</h3>";
    echo "<p>Check your inbox at <b>$recipient</b>.</p>";
} else {
    echo "<h3 style='color: red;'>❌ FAILED: The connection was interrupted.</h3>";
}

echo "<div style='background: #f4f4f4; padding: 20px; border-radius: 8px; font-family: monospace; border: 1px solid #ddd;'>";
echo "<h3>Live Handshake Log Preview:</h3>";
echo "<pre>";

// Read the last 20 lines of the debug log to show here
$logFile = __DIR__ . '/stockxpert_debug.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -20);
    echo htmlspecialchars(implode("", $lastLines));
} else {
    echo "Log file not created. Verify folder permissions.";
}

echo "</pre>";
echo "</div>";

echo "<p style='margin-top:20px;'><a href='/test_mail_system.php'>Refresh Test</a> | <a href='/index.php'>Back to App</a></p>";
