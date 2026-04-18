<?php

require_once __DIR__ . '/logger.php';

/**
 * Sends a beautifully formatted HTML email for low stock alerts using direct SMTP.
 * Now includes deep handshake tracing and SSL compatibility fixes for Windows.
 */
function sendLowStockEmail(string $recipient, array $lowStockItems): bool
{
    if (empty($lowStockItems)) {
        return false;
    }

    $config = require __DIR__ . '/mail_config.php';
    
    if ($config['username'] === 'your-email@gmail.com') {
        debug_log("SMTP Error: Please update server/mail_config.php with your real credentials.");
        return false;
    }

    $subject = "🚨 StockXpert Alert: Low Inventory Detected";
    
    $rows = "";
    foreach ($lowStockItems as $item) {
        $rows .= "<tr>
            <td style='padding: 12px; border-bottom: 1px solid #eee;'>{$item['name']} (ID: {$item['id']})</td>
            <td style='padding: 12px; border-bottom: 1px solid #eee; text-align: center; color: #e74c3c; font-weight: bold;'>{$item['quantity']}</td>
            <td style='padding: 12px; border-bottom: 1px solid #eee; text-align: center;'>{$item['threshold']}</td>
        </tr>";
    }

    $message = "<html><body style='font-family: Arial, sans-serif;'>
        <h2>⚠️ StockXpert Warning</h2>
        <p>The following items are low in stock:</p>
        <table border='1' cellpadding='10' cellspacing='0'>
            <thead><tr><th>Item</th><th>Qty</th><th>Min</th></tr></thead>
            <tbody>$rows</tbody>
        </table>
    </body></html>";

    try {
        $host = $config['host'];
        $port = $config['port'];
        $user = trim($config['username']);
        $pass = str_replace(' ', '', trim($config['password']));
        $fromName = $config['from_name'];

        debug_log("SMTP: Connecting to $host:$port...");

        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        $socket = stream_socket_client("tcp://$host:$port", $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
        if (!$socket) throw new Exception("Connection Failed: $errstr ($errno)");

        $getResponse = function($socket) {
            $response = "";
            while ($str = fgets($socket, 515)) {
                $response .= $str;
                if (substr($str, 3, 1) === " ") break;
            }
            debug_log("SMTP << " . trim($response));
            return $response;
        };

        $sendCmd = function($socket, $cmd, $logCmd = true) use ($getResponse) {
            if ($logCmd) debug_log("SMTP >> " . $cmd);
            fputs($socket, $cmd . "\r\n");
            return $getResponse($socket);
        };

        $getResponse($socket);
        $sendCmd($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
        
        $res = $sendCmd($socket, "STARTTLS");
        if (strpos($res, '220') === false) throw new Exception("STARTTLS failed");

        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new Exception("Encryption failed (check OpenSSL extension)");
        }
        debug_log("SMTP: Encryption enabled.");

        $sendCmd($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
        
        $res = $sendCmd($socket, "AUTH LOGIN");
        if (strpos($res, '334') === false) throw new Exception("AUTH LOGIN rejected");

        $sendCmd($socket, base64_encode($user), false);
        $res = $sendCmd($socket, base64_encode($pass), false);
        
        if (strpos($res, '235') === false) throw new Exception("Authentication failed: " . $res);
        debug_log("SMTP: Authentication successful.");

        $sendCmd($socket, "MAIL FROM: <$user>");
        $sendCmd($socket, "RCPT TO: <$recipient>");
        
        $res = $sendCmd($socket, "DATA");
        if (strpos($res, '354') === false) throw new Exception("DATA command rejected");

        $msgBody = "MIME-Version: 1.0\r\n";
        $msgBody .= "Content-type: text/html; charset=UTF-8\r\n";
        $msgBody .= "From: $fromName <$user>\r\n";
        $msgBody .= "To: <$recipient>\r\n";
        $msgBody .= "Subject: $subject\r\n\r\n";
        $msgBody .= $message . "\r\n.\r\n";

        fputs($socket, $msgBody);
        $res = $getResponse($socket);
        if (strpos($res, '250') === false) throw new Exception("Message delivery failed: " . $res);

        $sendCmd($socket, "QUIT");
        fclose($socket);
        
        debug_log("SMTP: Process completed successfully.");
        return true;
    } catch (Throwable $t) {
        debug_log("CRITICAL SMTP ERROR: " . $t->getMessage());
        return false;
    }
}
