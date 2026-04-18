<?php

/**
 * Global logging utility for StockXpert.
 * Records actions to server/stockxpert_debug.log.
 */
function debug_log($msg) {
    // Ensure the message is a string for logging
    if (!is_string($msg)) {
        $msg = print_r($msg, true);
    }
    
    $logFile = __DIR__ . '/stockxpert_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    
    // Attempt to write to log. If it fails, we don't want to crash the app.
    @file_put_contents($logFile, "[$timestamp] $msg" . PHP_EOL, FILE_APPEND);
}
