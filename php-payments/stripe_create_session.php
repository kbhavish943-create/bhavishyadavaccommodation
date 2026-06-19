<?php
/**
 * Stripe Create Session Endpoint
 * Creates a Stripe Checkout Session for payment
 * 
 * POST /stripe_create_session.php
 * Body: { "amount": 1500, "method": "card" }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../.env.php';

if (empty(STRIPE_SECRET_KEY)) {
    http_response_code(500);
    die(json_encode(['error' => 'Stripe credentials not configured']));
}

\Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

$input = json_decode(file_get_contents('php://input'), true);
$amount = $input['amount'] ?? null;
$method = $input['method'] ?? 'card';

if (!$amount || $amount < 50) { // Stripe minimum is $0.50
    http_response_code(400);
    die(json_encode(['error' => 'Invalid amount (minimum $0.50)']));
}

try {
    // Database connection
    $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
    
    // Create checkout session
    $session = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price_data' => [
                'currency' => 'usd',
                'product_data' => [
                    'name' => 'Payment',
            'description' => 'Secure payment transaction'
                ],
                'unit_amount' => $amount,
            ],
            'quantity' => 1,
        ]],
        'mode' => 'payment',
        'success_url' => 'https://yourdomain.com/success.php?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => 'https://yourdomain.com/cancel.php',
        'metadata' => [
            'payment_method' => $method
        ]
    ]);

    // Store session info in database
    if ($mysqli->connect_error === null) {
        $stmt = $mysqli->prepare('INSERT INTO orders (provider, provider_order_id, amount, currency, method, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
        $provider = 'stripe';
        $sessionId = $session->id;
        $currency = 'USD';
        $status = 'pending';
        $stmt->bind_param('ssisis', $provider, $sessionId, $amount, $currency, $method, $status);
        $stmt->execute();
        $stmt->close();
        $mysqli->close();
    }

    echo json_encode([
        'success' => true,
        'sessionId' => $session->id,
        'publishableKey' => STRIPE_PUBLISHABLE_KEY,
        'amount' => $amount,
        'currency' => 'USD'
    ]);

} catch (\Stripe\Exception\ApiErrorException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
