<?php

/**
 * Deploy Migration Script
 * This script runs Laravel migrations after FTP deployment
 *
 * Usage: https://mobile.rfrma.com/deploy-migrate.php?token=YOUR_SECRET_TOKEN
 */

// Security: Check deploy token
$expectedToken = getenv('DEPLOY_TOKEN') ?: 'your-secret-deploy-token-here';
$providedToken = $_GET['token'] ?? '';

if ($providedToken !== $expectedToken) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

// Set content type
header('Content-Type: application/json');

// Change to Laravel root directory
chdir(dirname(__DIR__));

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
