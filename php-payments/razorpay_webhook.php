<?php
/**
 * Razorpay Webhook Handler
 * Handles payment status updates from Razorpay
 * 
 * POST /razorpay_webhook.php
 * Razorpay sends webhook events with payment status
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../.env.php';

if (empty(RAZORPAY_WEBHOOK_SECRET)) {
    http_response_code(500);
    die(json_encode(['error' => 'Webhook secret not configured']));
}

// Get webhook signature
$webhook_signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? null;
$request_body = file_get_contents('php://input');

if (!$webhook_signature) {
    http_response_code(401);
    die(json_encode(['error' => 'Missing webhook signature']));
}

// Verify webhook signature
$expected_signature = hash_hmac('sha256', $request_body, RAZORPAY_WEBHOOK_SECRET);

if (!hash_equals($expected_signature, $webhook_signature)) {
    http_response_code(401);
    die(json_encode(['error' => 'Invalid webhook signature']));
}

// Parse webhook data
$event = json_decode($request_body, true);
$eventType = $event['event'] ?? null;
$eventData = $event['payload']['payment']['entity'] ?? null;

if (!$eventType || !$eventData) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid webhook payload']));
}

// Database connection
$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($mysqli->connect_error) {
    error_log('Webhook DB Error: ' . $mysqli->connect_error);
    http_response_code(500);
    die(json_encode(['error' => 'Database error']));
}

// Handle different payment events
switch ($eventType) {
    case 'payment.authorized':
    case 'payment.captured':
        // Payment successful
        $stmt = $mysqli->prepare('UPDATE orders SET status = ?, payment_id = ? WHERE provider_order_id = ?');
        $status = 'paid';
        $paymentId = $eventData['id'];
        $orderId = $eventData['order_id'];
        $stmt->bind_param('sss', $status, $paymentId, $orderId);
        $stmt->execute();
        $stmt->close();
        break;

    case 'payment.failed':
        // Payment failed
        $stmt = $mysqli->prepare('UPDATE orders SET status = ? WHERE provider_order_id = ?');
        $status = 'failed';
        $orderId = $eventData['order_id'];
        $stmt->bind_param('ss', $status, $orderId);
        $stmt->execute();
        $stmt->close();
        break;

    case 'refund.created':
        // Refund processed
        $stmt = $mysqli->prepare('UPDATE orders SET status = ? WHERE payment_id = ?');
        $status = 'refunded';
        $paymentId = $eventData['payment_id'];
        $stmt->bind_param('ss', $status, $paymentId);
        $stmt->execute();
        $stmt->close();
        break;
}

$mysqli->close();

// Log webhook for debugging
error_log('Razorpay Webhook: ' . $eventType . ' - ' . json_encode($eventData));

echo json_encode(['success' => true, 'event' => $eventType]);
?>
