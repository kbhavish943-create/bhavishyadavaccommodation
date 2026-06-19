<?php
/**
 * Post-Payment Cancellation Page
 * Displayed when user cancels payment
 * 
 * GET /cancel.php
 */
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Cancelled</title>
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
            background: #fff3cd;
            color: #856404;
            font-weight: 600;
            margin-bottom: 20px;
            font-size: 14px;
        }

        p {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: left;
            color: #1565c0;
            font-size: 14px;
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

        .support {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 13px;
            color: #666;
        }

        .support a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }

        .support a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="status-icon">⏸️</div>

    <h1>Payment Cancelled</h1>
    
    <div class="status">CANCELLED</div>

    <p>
        Your payment has been cancelled. Your money has not been charged.
        <br>You can retry the payment at any time.
    </p>

    <div class="info-box">
        💡 <strong>Need help?</strong><br>
        Your payment information was not processed. If you encountered any issues or need assistance, please contact our support team.
    </div>

    <div class="button-group">
        <button class="btn-primary" onclick="window.location.href='/payment-standalone.html'">
            Try Again
        </button>
        <button class="btn-secondary" onclick="window.location.href='/'">
            Back to Home
        </button>
    </div>

    <div class="support">
        Questions? <a href="mailto:support@yourdomain.com">Contact Support</a> or call <strong>+1 (555) 123-4567</strong>
    </div>
</div>

</body>
</html>
