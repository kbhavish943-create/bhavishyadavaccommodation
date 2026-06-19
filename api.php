<?php
/**
 * Contact Form Handler with SQL Database
 * Handles form submissions and stores data
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'my_website');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set response header
header('Content-Type: application/json');

class DatabaseHandler {
    private $connection;
    
    public function __construct() {
        try {
            $this->connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
            
            if ($this->connection->connect_error) {
                throw new Exception("Connection failed: " . $this->connection->connect_error);
            }
            
            $this->connection->set_charset("utf8mb4");
        } catch (Exception $e) {
            http_response_code(500);
            die(json_encode(['success' => false, 'message' => 'Database connection error']));
        }
    }
    
    /**
     * Save contact form submission
     */
    public function saveContact($data) {
        try {
            // Validate input
            $name = trim($data['name'] ?? '');
            $email = trim($data['email'] ?? '');
            $message = trim($data['message'] ?? '');
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
            
            // Basic validation
            if (empty($name) || empty($email) || empty($message)) {
                return [
                    'success' => false,
                    'message' => 'All fields are required'
                ];
            }
            
            if (strlen($name) < 2) {
                return [
                    'success' => false,
                    'message' => 'Name must be at least 2 characters'
                ];
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return [
                    'success' => false,
                    'message' => 'Invalid email address'
                ];
            }
            
            if (strlen($message) < 10) {
                return [
                    'success' => false,
                    'message' => 'Message must be at least 10 characters'
                ];
            }
            
            // Prepare SQL statement
            $stmt = $this->connection->prepare(
                "INSERT INTO contacts (name, email, message, ip_address) VALUES (?, ?, ?, ?)"
            );
            
            if (!$stmt) {
                throw new Exception($this->connection->error);
            }
            
            // Bind parameters
            $stmt->bind_param("ssss", $name, $email, $message, $ip_address);
            
            // Execute
            if ($stmt->execute()) {
                $contact_id = $this->connection->insert_id;
                
                // Log the activity
                $this->logActivity(null, 'contact_form_submitted', 'contact', $contact_id);
                
                return [
                    'success' => true,
                    'message' => 'Thank you! Your message has been received. We will get back to you soon.',
                    'contact_id' => $contact_id
                ];
            } else {
                throw new Exception($stmt->error);
            }
        } catch (Exception $e) {
            error_log("Error saving contact: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error saving contact. Please try again.'
            ];
        }
    }
    
    /**
     * Get all contacts (for admin)
     */
    public function getContacts($limit = 50, $offset = 0) {
        try {
            $stmt = $this->connection->prepare(
                "SELECT id, name, email, message, submitted_at, read_status 
                 FROM contacts 
                 ORDER BY submitted_at DESC 
                 LIMIT ? OFFSET ?"
            );
            
            if (!$stmt) {
                throw new Exception($this->connection->error);
            }
            
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $contacts = [];
            while ($row = $result->fetch_assoc()) {
                $contacts[] = $row;
            }
            
            return [
                'success' => true,
                'data' => $contacts,
                'count' => count($contacts)
            ];
        } catch (Exception $e) {
            error_log("Error fetching contacts: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error fetching contacts'
            ];
        }
    }
    
    /**
     * Get contact statistics
     */
    public function getContactStats() {
        try {
            $result = $this->connection->query("SELECT * FROM contact_summary");
            
            if (!$result) {
                throw new Exception($this->connection->error);
            }
            
            $stats = $result->fetch_assoc();
            
            return [
                'success' => true,
                'data' => $stats
            ];
        } catch (Exception $e) {
            error_log("Error fetching stats: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error fetching statistics'
            ];
        }
    }
    
    /**
     * Get all features
     */
    public function getFeatures($category = null) {
        try {
            if ($category) {
                $stmt = $this->connection->prepare(
                    "SELECT * FROM features 
                     WHERE is_active = TRUE AND category = ? 
                     ORDER BY order_position"
                );
                $stmt->bind_param("s", $category);
            } else {
                $stmt = $this->connection->prepare(
                    "SELECT * FROM features 
                     WHERE is_active = TRUE 
                     ORDER BY category, order_position"
                );
            }
            
            if (!$stmt) {
                throw new Exception($this->connection->error);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            $features = [];
            while ($row = $result->fetch_assoc()) {
                $features[] = $row;
            }
            
            return [
                'success' => true,
                'data' => $features
            ];
        } catch (Exception $e) {
            error_log("Error fetching features: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error fetching features'
            ];
        }
    }
    
    /**
     * Get site settings
     */
    public function getSettings() {
        try {
            $result = $this->connection->query("SELECT setting_key, setting_value FROM settings");
            
            if (!$result) {
                throw new Exception($this->connection->error);
            }
            
            $settings = [];
            while ($row = $result->fetch_assoc()) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
            
            return [
                'success' => true,
                'data' => $settings
            ];
        } catch (Exception $e) {
            error_log("Error fetching settings: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error fetching settings'
            ];
        }
    }
    
    /**
     * Log user activity
     */
    private function logActivity($user_id, $action, $entity_type, $entity_id) {
        try {
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            
            $stmt = $this->connection->prepare(
                "INSERT INTO activity_log (user_id, action, entity_type, entity_id, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?)"
            );
            
            if ($stmt) {
                $stmt->bind_param("isssss", $user_id, $action, $entity_type, $entity_id, $ip_address, $user_agent);
                $stmt->execute();
                $stmt->close();
            }
        } catch (Exception $e) {
            error_log("Error logging activity: " . $e->getMessage());
        }
    }
    
    public function close() {
        if ($this->connection) {
            $this->connection->close();
        }
    }
}

// Handle API requests
$db = new DatabaseHandler();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($action === 'submit_contact') {
            echo json_encode($db->saveContact($input));
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } else if ($method === 'GET') {
        if ($action === 'contacts') {
            $limit = intval($_GET['limit'] ?? 50);
            $offset = intval($_GET['offset'] ?? 0);
            echo json_encode($db->getContacts($limit, $offset));
        } else if ($action === 'stats') {
            echo json_encode($db->getContactStats());
        } else if ($action === 'features') {
            $category = $_GET['category'] ?? null;
            echo json_encode($db->getFeatures($category));
        } else if ($action === 'settings') {
            echo json_encode($db->getSettings());
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    error_log("API Error: " . $e->getMessage());
} finally {
    $db->close();
}
?>
