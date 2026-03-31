<?php

declare(strict_types=1);

function cors_headers(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    } else {
        header('Access-Control-Allow-Origin: *');
    }
    header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

function json_response(array $data, int $status = 200): void
{
    header('Content-Type: application/json; charset=utf-8', true, $status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body(): ?array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return null;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return null;
    }
    return $decoded;
}

function ensure_method_or_options(string $expectedMethod): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        json_response(['ok' => true], 200);
    }
    if ($_SERVER['REQUEST_METHOD'] !== $expectedMethod) {
        json_response(['error' => 'Method not allowed'], 405);
    }
}

