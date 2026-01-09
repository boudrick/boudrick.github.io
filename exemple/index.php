<?php
require_once 'functions.php';
$elements = loadWishlist();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Liste de Cadeaux d'Audrick – Boudrick.fr</title>
	  <meta name="description" content="Découvrez la liste de cadeaux souhaités par Audrick : idées de cadeaux uniques, favoris et inspirations pour offrir.">
	  <meta name="keywords" content="liste de cadeaux, cadeaux Audrick, idées de cadeaux, wishlist, Boudrick">
	  <link rel="canonical" href="https://www.boudrick.fr/">
	  <meta property="og:title" content="Liste de Cadeaux d'Audrick">
	  <meta property="og:description" content="Sélection d’idées cadeaux pour Audrick – des objets pratiques, utiles ou souhaités.">
	  <meta property="og:url" content="https://www.boudrick.fr/">
	  <meta property="og:type" content="website">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="style.css">
    <script>
        const initialElements = <?php echo json_encode($elements, JSON_UNESCAPED_UNICODE); ?>;
        const ADMIN_CODE = "<?= ADMIN_CODE ?>";
    </script>
</head>
<body>
    <div class="floating-btn" onclick="toggleAdmin()">
        <i class="fas fa-user-cog"></i>
    </div>
    
    <div class="container">
        <header>
            <h1>🎁 Liste de Cadeaux d'Audrick 🎁</h1>
            <p class="subtitle">La liste des cadeaux qui me feront plaisir !</p>
            
            <div class="header-actions">
                <input type="text" class="search-bar" id="searchBar" placeholder="🔍 Rechercher un cadeau...">
                <select class="filter-select" id="statusFilter">
                    <option value="">Tout</option>
                    <option value="libre">À offrir</option>
                    <option value="pris">Offert</option>
                </select>
                <button class="btn btn-secondary" id="toggleStatusBtn">
                    <i class="fas fa-eye"></i> Dévoiler
                </button>
                <button class="btn btn-admin" onclick="toggleAdmin()">
                    <i class="fas fa-user-cog"></i> Administration
                </button>
            </div>
            
            <div class="stats" id="stats"></div>
        </header>
        
        <div class="elements-container" id="list"></div>
        
        <div class="empty-state" id="emptyState" style="display: none;">
            <i class="fas fa-gift"></i>
            <h3>Aucun élément trouvé</h3>
            <p>Essayez de modifier vos critères de recherche ou revenez plus tard !</p>
        </div>
        
        <footer>
            <p>Fait par Audrick</p>
        </footer>
    </div>

    <!-- Modal de réservation -->
    <div id="reserveModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="fermerModal('reserveModal')">&times;</span>
            <h2><i class="fas fa-gift"></i> Voulez-vous offrir ce cadeau ?</h2>
            <input type="text" id="reserveName" placeholder="Votre prénom (facultatif)">
            <div class="btn-group">
                <button class="btn btn-primary" onclick="confirmerReservation()">
                    <i class="fas fa-check"></i> Oui
                </button>
                <button class="btn btn-secondary" onclick="fermerModal('reserveModal')">
                    <i class="fas fa-times"></i> Non
                </button>
            </div>
        </div>
    </div>

    <!-- Modal admin - NOUVELLE STRUCTURE -->
    <div id="adminModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="fermerModal('adminModal')">&times;</span>
            <div id="adminLogin">
                <h2><i class="fas fa-lock"></i> Accès Admin</h2>
                <input type="password" id="adminCode" placeholder="Code d'accès" onkeypress="handleAdminKeyPress(event)">
                <button class="btn btn-primary" onclick="validerAdmin()">
                    <i class="fas fa-sign-in-alt"></i> Se connecter
                </button>
            </div>
            <div id="adminPanel" style="display: none;">
                <h2><i class="fas fa-user-cog"></i> Édition</h2>
                
                <div class="admin-layout">
                    <!-- Colonne gauche - Formulaire d'ajout/édition -->
                    <div class="admin-form-column">
                        <div id="adminEditPanel" style="display: none;">
                            <h3><i class="fas fa-edit"></i> Modifier l'élément</h3>
                            <div class="form-group">
                                <label>Type d'élément:</label>
                                <select id="editType" onchange="toggleEditType()">
                                    <option value="cadeau">Cadeau</option>
                                    <option value="categorie">Catégorie</option>
                                </select>
                            </div>
                            
                            <div id="editCadeauFields">
                                <div class="form-group">
                                    <label>Titre du cadeau:</label>
                                    <input type="text" id="editTitre" placeholder="Titre du cadeau">
                                </div>
                                <div class="form-group">
                                    <label>Description:</label>
                                    <textarea id="editDescription" placeholder="Description" rows="3"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>URL de l'image:</label>
                                    <input type="text" id="editImage" placeholder="URL de l'image">
                                </div>
                                
                                <div class="form-group">
                                    <label>Type de cadeau:</label>
                                    <select id="editGiftType" onchange="toggleEditQuantity()">
                                        <option value="unique">Unique (1 personne)</option>
                                        <option value="limited">Multiple (quantité limitée)</option>
                                        <option value="unlimited">Multiple (illimité)</option>
                                    </select>
                                </div>
                                
                                <div id="editQuantityContainer" style="display: none; margin-top: 10px;">
                                    <div class="form-group">
                                        <label>Quantité maximale:</label>
                                        <input type="number" id="editMaxQuantity" min="1" value="1">
                                    </div>
                                </div>
                            </div>
                            
                            <div id="editCategorieFields" style="display: none;">
                                <div class="form-group">
                                    <label>Titre de la catégorie:</label>
                                    <input type="text" id="editCategorieTitre" placeholder="Titre de la catégorie">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Liens:</label>
                                <div id="editLinksContainer" style="margin: 10px 0;"></div>
                                <button class="btn btn-secondary" onclick="ajouterLienEdit()">
                                    <i class="fas fa-plus"></i> Ajouter un lien
                                </button>
                            </div>
                            
                            <div class="btn-group">
                                <button class="btn btn-primary" onclick="sauvegarderEdition()">
                                    <i class="fas fa-save"></i> Enregistrer
                                </button>
                                <button class="btn btn-secondary" onclick="annulerEdition()">
                                    <i class="fas fa-times"></i> Annuler
                                </button>
                            </div>
                        </div>
                        
                        <div id="adminAddPanel">
                            <h3><i class="fas fa-plus-circle"></i> Ajouter un élément</h3>
                            <div class="form-group">
                                <label>Type d'élément:</label>
                                <select id="newType" onchange="toggleNewType()">
                                    <option value="cadeau">Cadeau</option>
                                    <option value="categorie">Catégorie</option>
                                </select>
                            </div>
                            
                            <div id="newCadeauFields">
                                <div class="form-group">
                                    <label>Titre du cadeau:</label>
                                    <input type="text" id="newTitre" placeholder="Titre du cadeau">
                                </div>
                                <div class="form-group">
                                    <label>Description:</label>
                                    <textarea id="newDescription" placeholder="Description" rows="3"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>URL de l'image:</label>
                                    <input type="text" id="newImage" placeholder="URL de l'image">
                                </div>
                                
                                <div class="form-group">
                                    <label>Type de cadeau:</label>
                                    <select id="newGiftType" onchange="toggleNewQuantity()">
                                        <option value="unique">Unique (1 personne)</option>
                                        <option value="limited">Multiple (quantité limitée)</option>
                                        <option value="unlimited">Multiple (illimité)</option>
                                    </select>
                                </div>
                                
                                <div id="newQuantityContainer" style="display: none; margin-top: 10px;">
                                    <div class="form-group">
                                        <label>Quantité maximale:</label>
                                        <input type="number" id="newMaxQuantity" min="1" value="1">
                                    </div>
                                </div>
                            </div>
                            
                            <div id="newCategorieFields" style="display: none;">
                                <div class="form-group">
                                    <label>Titre de la catégorie:</label>
                                    <input type="text" id="newCategorieTitre" placeholder="Titre de la catégorie">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Liens:</label>
                                <div id="newLinksContainer" style="margin: 10px 0;">
                                    <div class="link-item">
                                        <input type="text" class="link-url" placeholder="URL du lien">
                                        <input type="text" class="link-text" placeholder="Remarque/Prix">
                                        <button onclick="supprimerLien(this)"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                                <button class="btn btn-secondary" onclick="ajouterLien()">
                                    <i class="fas fa-plus"></i> Ajouter un lien
                                </button>
                            </div>
                            
                            <button class="btn btn-primary" onclick="ajouterElement()">
                                <i class="fas fa-plus"></i> Ajouter
                            </button>
                        </div>
                    </div>
                    
                    <!-- Colonne droite - Gestion et sauvegarde -->
                    <div class="admin-management-column">
                        <div class="admin-management-section">
                            <h3><i class="fas fa-cog"></i> Gestion des éléments</h3>
                            <div id="adminList"></div>
                        </div>
                        
                        <div class="admin-management-section">
                            <h3><i class="fas fa-database"></i> Sauvegarde</h3>
                            <button class="btn btn-primary" onclick="exporterDonnees()">
                                <i class="fas fa-download"></i> Exporter les données
                            </button>
                            <input type="file" id="importFile" accept=".json" style="display: none;" onchange="importerDonnees(event)">
                            <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">
                                <i class="fas fa-upload"></i> Importer des données
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <script src="script.js"></script>
</body>
</html>