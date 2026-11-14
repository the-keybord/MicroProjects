<?php
/**
 * PocketBase Backend Integration & Server-Side Token Cache for RFALL (Alliance Roster)
 * Target Backend: https://db.zece.info
 * Assigned Prefix: RFALL_
 * Dedicated User: rfall@zece.info
 * Deployment: Compatible with any basic shared hosting (Apache / Nginx / PHP 7.4+ / PHP 8.x)
 */

define('RFALL_PB_URL', 'https://db.zece.info');
define('RFALL_PB_USER', 'rfall@zece.info');
define('RFALL_PB_PASS', 'rfall_Zece2026!secret');
define('RFALL_AUTH_COLL', 'users');

/**
 * Token cache path in system temporary directory or local directory (Rule 6)
 */
function rfall_token_cache_file(): string {
    $tempDir = rtrim(sys_get_temp_dir(), '/\\');
    $tempFile = $tempDir . '/rfall_pb_token.json';
    if (is_writable($tempDir) || (!file_exists($tempFile) && is_writable($tempDir))) {
        return $tempFile;
    }
    return __DIR__ . '/.pb_token.json';
}

/**
 * Get or refresh PocketBase JWT token for rfall@zece.info
 */
function rfall_get_token(bool $forceRefresh = false): ?string {
    $cacheFile = rfall_token_cache_file();

    if (!$forceRefresh && file_exists($cacheFile)) {
        $cached = json_decode(@file_get_contents($cacheFile), true);
        if (!empty($cached['token']) && !empty($cached['exp']) && time() < ($cached['exp'] - 60)) {
            return $cached['token'];
        }
    }

    $ch = curl_init(RFALL_PB_URL . '/api/collections/' . rawurlencode(RFALL_AUTH_COLL) . '/auth-with-password');
    $payload = json_encode([
        'identity' => RFALL_PB_USER,
        'password' => RFALL_PB_PASS,
    ]);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300 && $resp) {
        $data = json_decode($resp, true);
        if (!empty($data['token'])) {
            $token = $data['token'];
            $exp = time() + (5 * 86400); // 5 days default
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payloadData = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
                if (!empty($payloadData['exp'])) {
                    $exp = (int)$payloadData['exp'];
                }
            }
            @file_put_contents($cacheFile, json_encode([
                'token' => $token,
                'exp'   => $exp,
                'email' => RFALL_PB_USER,
                'cached_at' => time()
            ]));
            return $token;
        }
    }

    return null;
}

// API endpoint for runtime token verification / status check
if (isset($_GET['api']) && $_GET['api'] === 'token') {
    header('Content-Type: application/json; charset=utf-8');
    $token = rfall_get_token(isset($_GET['refresh']));
    if ($token) {
        echo json_encode([
            'status' => 'ok',
            'identity' => RFALL_PB_USER,
            'token' => $token
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Unable to authenticate with PocketBase backend'
        ]);
    }
    exit;
}

// Default action: Serve the Alliance Roster static application
if (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
    exit;
}

header('Content-Type: text/plain; charset=utf-8');
echo "RFALL Alliance Roster application files not found.";
