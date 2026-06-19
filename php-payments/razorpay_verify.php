<?php
/**
 * Razorpay Payment Verification Endpoint
 * Verifies the payment signature and marks order as paid
 * 
 * POST /razorpay_verify.php
 * Body: { "orderId": "order_xxx", "paymentId": "pay_xxx", "signature": "sig_xxx" }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/../.env.php';

if (empty(RAZORPAY_KEY_SECRET)) {
    http_response_code(500);
    die(json_encode(['error' => 'Razorpay credentials not configured']));
}

$input = json_decode(file_get_contents('php://input'), true);
$orderId = $input['orderId'] ?? null;
$paymentId = $input['paymentId'] ?? null;
$signature = $input['signature'] ?? null;

if (!$orderId || !$paymentId || !$signature) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing required fields']));
}

// Verify signature
$body = $orderId . '|' . $paymentId;
$expectedSignature = hash_hmac('sha256', $body, RAZORPAY_KEY_SECRET);

if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(401);
    die(json_encode(['error' => 'Invalid signature', 'success' => false]));
}

// Update order status in database
$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($mysqli->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed']));
}

$stmt = $mysqli->prepare('UPDATE orders SET status = ?, payment_id = ?, verified_at = NOW() WHERE provider_order_id = ?');
$status = 'paid';
$stmt->bind_param('sss', $status, $paymentId, $orderId);
$stmt->execute();
$stmt->close();
$mysqli->close();

echo json_encode([
    'success' => true,
    'message' => 'Payment verified successfully',
    'orderId' => $orderId,
    'paymentId' => $paymentId
]);
?>
