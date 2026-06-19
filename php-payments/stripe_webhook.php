<?php
/**
 * Stripe Webhook Handler
 * Handles payment status updates from Stripe
 * 
 * POST /stripe_webhook.php
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../.env.php';

if (empty(STRIPE_WEBHOOK_SECRET)) {
    http_response_code(500);
    die(json_encode(['error' => 'Webhook secret not configured']));
}

\Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

$endpoint_secret = STRIPE_WEBHOOK_SECRET;
$request_body = file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? null;

if (!$sig_header) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing signature header']));
}

try {
    $event = \Stripe\Webhook::constructEvent(
        $request_body, $sig_header, $endpoint_secret
    );
} catch (\UnexpectedValueException $e) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid payload']));
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    http_response_code(401);
    die(json_encode(['error' => 'Invalid signature']));
}

// Database connection
$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($mysqli->connect_error) {
    error_log('Webhook DB Error: ' . $mysqli->connect_error);
    http_response_code(500);
    die(json_encode(['error' => 'Database error']));
}

// Handle different payment events
switch ($event->type) {
    case 'checkout.session.completed':
        $session = $event->data->object;
        
        // Update order status
        $stmt = $mysqli->prepare('UPDATE orders SET status = ?, payment_id = ? WHERE provider_order_id = ?');
        $status = 'paid';
        $paymentId = $session->payment_intent;
        $sessionId = $session->id;
        $stmt->bind_param('sss', $status, $paymentId, $sessionId);
        $stmt->execute();
        $stmt->close();
        break;

    case 'charge.refunded':
        $charge = $event->data->object;
        
        $stmt = $mysqli->prepare('UPDATE orders SET status = ? WHERE payment_id = ?');
        $status = 'refunded';
        $paymentId = $charge->id;
        $stmt->bind_param('ss', $status, $paymentId);
        $stmt->execute();
        $stmt->close();
        break;

    case 'charge.dispute.created':
        $dispute = $event->data->object;
        
        $stmt = $mysqli->prepare('UPDATE orders SET status = ? WHERE payment_id = ?');
        $status = 'disputed';
        $paymentId = $dispute->charge;
        $stmt->bind_param('ss', $status, $paymentId);
        $stmt->execute();
        $stmt->close();
        break;
}

$mysqli->close();

// Log webhook
error_log('Stripe Webhook: ' . $event->type);

echo json_encode(['received' => true]);
?>
