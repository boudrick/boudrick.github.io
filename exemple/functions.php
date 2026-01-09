<?php

define('DATA_FILE', __dir__.'/data.json');
define('ADMIN_CODE', 'faget2025');

function loadWishlist() {
    if (!file_exists(DATA_FILE)) {
        return createInitialData();    
    }
    
    $data = file_get_contents(DATA_FILE);
    if (empty($data)) {
        return createInitialData();
    }
    
    $decoded = json_decode($data, true);
    if ($decoded === null) {
        return createInitialData();
    }
    
    return $decoded;
}

function saveWishlist($data) {
    file_put_contents(DATA_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function createInitialData() {
    $initialData = [
        [
            'type' => 'categorie',
            'id' => time(),
            'titre' => "Photographie"
        ],
        [
            'id' => time() + 1,
            'type' => 'cadeau',
            'image' => "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
            'titre' => "Appareil photo instantané",
            'description' => "Un appareil photo instantané pour capturer tous mes souvenirs.",
            'liens' => [
                ['url' => "https://amazon.fr", 'text' => "Amazon - 89€"],
                ['url' => "https://fnac.com", 'text' => "Fnac - 92€"]
            ],
            'statut' => "libre",
            'reserve_par' => "",
            'date_creation' => date('c'),
            'multiple' => false,
            'max_quantity' => 1,
            'reserved_count' => 0,
            'unlimited' => false,
            'participants' => []
        ],
        [
            'type' => 'categorie',
            'id' => time() + 2,
            'titre' => "Livres"
        ],
        [
            'id' => time() + 3,
            'type' => 'cadeau',
            'image' => "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
            'titre' => "Livre sur l'histoire de l'art",
            'description' => "Un beau livre illustré sur l'histoire de l'art à travers les siècles.",
            'liens' => [
                ['url' => "https://amazon.fr/livre-art", 'text' => "Amazon - 45€"]
            ],
            'statut' => "libre",
            'reserve_par' => "",
            'date_creation' => date('c'),
            'multiple' => false,
            'max_quantity' => 1,
            'reserved_count' => 0,
            'unlimited' => false,
            'participants' => []
        ]
    ];
    
    saveWishlist($initialData);
    return $initialData;
}