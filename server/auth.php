<?php

declare(strict_types=1);

require_once __DIR__ . '/response.php';

// Session is started by index.php with proper cookie params.
// auth.php only provides helper functions.

function session_admin(): bool
{
    return !empty($_SESSION['admin']);
}

function current_user_id(): ?int
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    return (int)$_SESSION['user_id'];
}

function require_login(): int
{
    $uid = current_user_id();
    if ($uid === null || $uid <= 0) {
        json_response(['error' => 'Unauthorized'], 401);
    }
    return $uid;
}

function require_admin(): void
{
    if (!session_admin()) {
        json_response(['error' => 'Forbidden'], 403);
    }
}

