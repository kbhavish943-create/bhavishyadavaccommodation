<?php
/**
 * Razorpay Create Order Endpoint
 * Creates a new Razorpay order for payment processing
 * 
 * POST /razorpay_create_order.php
 * Body: { "amount": 15000, "method": "card" }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Load environment variables
require_once __DIR__ . '/../.env.php';

// Validate API keys
if (empty(RAZORPAY_KEY_ID) || empty(RAZORPAY_KEY_SECRET)) {
    http_response_code(500);
    die(json_encode(['error' => 'Razorpay credentials not configured']));
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$amount = $input['amount'] ?? null;
$method = $input['method'] ?? 'card';

// Validate amount
if (!$amount || $amount < 1 || $amount > 100000000) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid amount']));
}

// Database connection (if storing orders)
$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($mysqli->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed']));
}

// Initialize Razorpay API (using cURL or SDK)
$api_url = 'https://api.razorpay.com/v1/orders';

$order_data = [
    'amount' => $amount,
    'currency' => 'INR',
    'receipt' => 'order_' . time(),
    'notes' => [
        'payment_method' => $method,
        'user_ip' => $_SERVER['REMOTE_ADDR']
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $api_url);
curl_setopt($ch, CURLOPT_USERPWD, RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($order_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200) {
    http_response_code(500);
    die(json_encode(['error' => 'Failed to create order with Razorpay']));
}

$order = json_decode($response, true);

if (empty($order['id'])) {
    http_response_code(500);
    die(json_encode(['error' => 'Invalid Razorpay response']));
}

// Store order in database
$orderId = $order['id'];
$stmt = $mysqli->prepare('INSERT INTO orders (provider, provider_order_id, amount, currency, method, status, user_ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())');
$status = 'pending';
$stmt->bind_param('ssisis', $provider, $orderId, $amount, $currency, $method, $status, $_SERVER['REMOTE_ADDR']);
$provider = 'razorpay';
$currency = 'INR';
$stmt->execute();
$stmt->close();
$mysqli->close();

// Return response
echo json_encode([
    'success' => true,
    'orderId' => $order['id'],
    'keyId' => RAZORPAY_KEY_ID,
    'amount' => $amount,
    'currency' => 'INR'
]);
?>
