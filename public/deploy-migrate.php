<?php

/**
 * Deploy Migration Script
 * This script runs Laravel migrations after FTP deployment
 *
 * Usage: https://mobile.rfrma.com/deploy-migrate.php?token=YOUR_SECRET_TOKEN
 */

// Change to Laravel root directory first
chdir(dirname(__DIR__));

// Deploy token - must match GitHub secret DEPLOY_TOKEN
$expectedToken = 'mobile2024deploy';

$providedToken = $_GET['token'] ?? '';

if ($providedToken !== $expectedToken) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

// Set content type
header('Content-Type: application/json');

$output = [];
$returnCode = 0;

// Run migrations
exec('php artisan migrate --force 2>&1', $output, $returnCode);

if ($returnCode !== 0) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Migration failed',
        'output' => implode("\n", $output)
    ]);
    exit;
}

// Clear and cache config/routes/views
$cacheOutput = [];
exec('php artisan config:cache 2>&1', $cacheOutput);
exec('php artisan route:cache 2>&1', $cacheOutput);
exec('php artisan view:cache 2>&1', $cacheOutput);

echo json_encode([
    'success' => true,
    'message' => 'Deployment completed successfully',
    'migration_output' => implode("\n", $output),
    'cache_output' => implode("\n", $cacheOutput),
    'timestamp' => date('Y-m-d H:i:s')
]);
