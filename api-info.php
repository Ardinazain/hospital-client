<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config/database.php';

// Ambil jumlah resource dari database (misalnya dari tabel yang mendaftar resource)
// Atau tetap pakai hardcode tapi mudah diubah
$resources = [
    'patients' => 6,
    'doctors' => 3,
    'appointments' => 3,
    'users' => 6
];

// Bisa juga dihitung otomatis dari folder yang ada
// $folders = array_filter(glob('*'), 'is_dir');
// $totalResources = count($folders);

$totalEndpoints = array_sum($resources);
$totalResources = count($resources);
$httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];

echo json_encode([
    'success' => true,
    'data' => [
        'total_endpoints' => $totalEndpoints,
        'http_methods' => count($httpMethods),
        'total_resources' => $totalResources,
        'methods_list' => $httpMethods,
        'resources_list' => array_keys($resources),
        'endpoints_per_resource' => $resources
    ]
]);
?>