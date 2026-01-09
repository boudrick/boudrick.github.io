<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'functions.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'save':
            $rawData = file_get_contents('php://input');
            $data = json_decode($rawData, true);
            
            if ($data === null) {
                throw new Exception('Invalid JSON data');
            }
            
            saveWishlist($data);
            echo json_encode(['success' => true]);
            break;
            
        case 'reserve':
            $rawData = file_get_contents('php://input');
            $data = json_decode($rawData, true);
            
            if ($data === null) {
                throw new Exception('Invalid JSON data');
            }
            
            $id = $data['id'];
            $name = $data['name'];
            $elements = loadWishlist();
            
            $found = false;
            foreach ($elements as &$element) {
                if ($element['id'] == $id && $element['type'] === 'cadeau') {
                    $found = true;
                    if ($element['multiple']) {
                        $element['reserved_count']++;
                        if (!isset($element['participants'])) {
                            $element['participants'] = [];
                        }
                        $element['participants'][] = $name;
                    } else {
                        $element['statut'] = 'pris';
                        $element['reserve_par'] = $name;
                    }
                    break;
                }
            }
            
            if ($found) {
                saveWishlist($elements);
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Cadeau non trouvé']);
            }
            break;

        case 'cancel':
            $rawData = file_get_contents('php://input');
            $data = json_decode($rawData, true);
            
            if ($data === null) {
                throw new Exception('Invalid JSON data');
            }
            
            $id = $data['id'];
            $name = $data['name'];
            $elements = loadWishlist();
            
            $found = false;
            foreach ($elements as &$element) {
                if ($element['id'] == $id && $element['type'] === 'cadeau') {
                    $found = true;
                    if ($element['multiple']) {
                        $index = array_search($name, $element['participants']);
                        if ($index !== false) {
                            array_splice($element['participants'], $index, 1);
                            $element['reserved_count'] = count($element['participants']);
                        }
                    } else {
                        if ($element['reserve_par'] === $name) {
                            $element['statut'] = 'libre';
                            $element['reserve_par'] = '';
                        }
                    }
                    break;
                }
            }
            
            if ($found) {
                saveWishlist($elements);
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Cadeau non trouvé']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Action inconnue']);
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}