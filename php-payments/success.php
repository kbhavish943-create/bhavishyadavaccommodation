<?php
/**
 * Post-Payment Success Page
 * Displays payment confirmation and order details
 * 
 * GET /success.php?order=order_id or ?session_id=stripe_session_id
 */

require_once __DIR__ . '/.env.php';

$orderId = $_GET['order'] ?? $_GET['session_id'] ?? null;

if (!$orderId) {
    die('No order found');
}

// Fetch order details
$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($mysqli->connect_error) {
    die('Database connection failed');
}

$stmt = $mysqli->prepare('SELECT id, provider, provider_order_id, amount, currency, method, status, created_at FROM orders WHERE provider_order_id = ? LIMIT 1');
$stmt->bind_param('s', $orderId);
$stmt->execute();
$result = $stmt->get_result();
$order = $result->fetch_assoc();
$stmt->close();

if (!$order || $order['status'] !== 'paid') {
    $status = 'ERROR';
    $statusClass = 'error';
    $message = 'Order not found or payment not confirmed yet. Please contact support.';
} else {
    $status = 'SUCCESS';
    $statusClass = 'success';
    $message = 'Your payment has been processed successfully!';
}

$mysqli->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment <?php echo $status; ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            text-align: center;
        }

        .status-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }

        h1 {
            font-size: 28px;
            color: #333;
            margin-bottom: 12px;
        }

        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            font-size: 14px;
        }

        .status.success {
            background: #d4edda;
            color: #155724;
        }

        .status.error {
            background: #f8d7da;
            color: #721c24;
        }

        p {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .order-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: left;
            border-left: 4px solid #667eea;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            color: #666;
            font-weight: 600;
        }

        .detail-value {
            color: #333;
            font-family: 'Courier New', monospace;
        }

        .button-group {
            display: flex;
            gap: 12px;
        }

        button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: #f0f0f0;
            color: #333;
        }

        .btn-secondary:hover {
            background: #e0e0e0;
        }

        .security-note {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #999;
        }

        .security-note strong {
            color: #333;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="status-icon">
        <?php echo ($status === 'SUCCESS') ? '✅' : '❌'; ?>
    </div>

    <h1><?php echo $status === 'SUCCESS' ? 'Payment Confirmed!' : 'Payment Issue'; ?></h1>
    
    <div class="status <?php echo $statusClass; ?>">
        <?php echo $status; ?>
    </div>

    <p><?php echo $message; ?></p>

    <?php if ($order): ?>
    <div class="order-details">
        <div class="detail-row">
            <span class="detail-label">Order ID</span>
            <span class="detail-value"><?php echo htmlspecialchars($order['provider_order_id']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Amount</span>
            <span class="detail-value"><?php echo $order['currency'] . ' ' . ($order['amount'] / 100); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Payment Method</span>
            <span class="detail-value"><?php echo ucfirst($order['method']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Gateway</span>
            <span class="detail-value"><?php echo ucfirst($order['provider']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value"><?php echo date('M d, Y H:i', strtotime($order['created_at'])); ?></span>
        </div>
    </div>
    <?php endif; ?>

    <div class="button-group">
        <button class="btn-primary" onclick="window.location.href='/'">
            Back to Home
        </button>
        <button class="btn-secondary" onclick="window.print()">
            Print Receipt
        </button>
    </div>

    <div class="security-note">
        🔒 <strong>A confirmation email has been sent to your registered email address.</strong>
        <br>Save this order ID for your records: <strong><?php echo htmlspecialchars($orderId); ?></strong>
    </div>
</div>

</body>
</html>
