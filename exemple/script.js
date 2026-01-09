// État de l'application
let elements = initialElements || [];
let isAdmin = false;
let currentReserveIndex = -1;
let currentEditIndex = -1;
let showStatus = false;

// Utilitaires
function sauvegarder() {
    fetch('api.php?action=save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(elements)
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Erreur sauvegarde');
            afficherNotification('Erreur de sauvegarde!', 'error');
        } else {
            afficherNotification('Données sauvegardées!');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        afficherNotification('Erreur de sauvegarde!', 'error');
    });
}

function afficherNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Affichage
function afficherStats() {
    const cadeaux = elements.filter(e => e.type === 'cadeau');
    const total = cadeaux.length;
    
    if (!isAdmin && !showStatus) {
        document.getElementById('stats').innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-gift"></i></div>
                <div class="stat-number">${total}</div>
                <div class="stat-title">Total cadeaux</div>
            </div>`;
        return;
    }
    
    const libres = cadeaux.filter(c => 
        c.statut === 'libre' || 
        (c.multiple && (c.reserved_count < c.max_quantity || c.unlimited))
    ).length;
    const reserves = total - libres;
    
    document.getElementById('stats').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-gift"></i></div>
            <div class="stat-number">${total}</div>
            <div class="stat-title">Total cadeaux</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
            <div class="stat-number">${libres}</div>
            <div class="stat-title">à offrir</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-ban"></i></div>
            <div class="stat-number">${reserves}</div>
            <div class="stat-title">offerts</div>
        </div>
    `;
}

function afficherElements(elementsAffiches = null) {
    if (elementsAffiches === null) {
        elementsAffiches = elements;
    }
    
    afficherStats();
    
    if (elementsAffiches.length === 0) {
        document.getElementById('list').innerHTML = '';
        document.getElementById('emptyState').style.display = 'block';
        return;
    }
    
    document.getElementById('emptyState').style.display = 'none';
    
    let html = '';
    elementsAffiches.forEach((element, i) => {
        if (element.type === 'categorie') {
            html += `
                <div class="categorie-header" data-id="${element.id}">
                    <h2>${element.titre}</h2>
                    ${isAdmin ? `
                        <div class="categorie-actions">
                            <button class="btn btn-secondary" onclick="editerElement(${i})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-secondary" onclick="supprimerElement(${i})"><i class="fas fa-trash"></i></button>
                            <span class="drag-handle"><i class="fas fa-arrows-alt"></i></span>
                        </div>
                    ` : ''}
                </div>
            `;
        } else if (element.type === 'cadeau') {
            const originalIndex = elements.findIndex(e => e.id === element.id);
            
            // Déterminer le statut pour les cadeaux multiples
            let statusText = "Disponible";
            let statusClass = "libre";
            let participants = [];
			let finOffrir = "";
            
            if (element.multiple) {
                if (element.unlimited) {
                    statusText = `(${element.reserved_count} offerts)`;
                    statusClass = "libre";
					finOffrir = `(${element.reserved_count}/∞)`;
                } else if (element.reserved_count >= element.max_quantity) {
                    statusText = "Complet";
                    statusClass = "pris";
                } else {
                    statusText = `À offrir (${element.reserved_count}/${element.max_quantity})`;
                    statusClass = "libre";
					finOffrir = `(${element.reserved_count}/${element.max_quantity})`;
                }
                participants = element.participants || [];
            } else {
                statusText = element.statut === 'libre' ? 'Disponible' : 'Réservé';
                statusClass = element.statut;
                participants = element.reserve_par ? [element.reserve_par] : [];
            }
            
            let actionButtons = '';
            if (isAdmin || showStatus) {
                if (statusClass === 'libre' || (element.multiple && (element.reserved_count < element.max_quantity || element.unlimited))) {
                    actionButtons += `<button class="btn btn-primary" onclick="ouvrirReservation(${originalIndex})">
                        <i class="fas fa-"></i>Offrir ${finOffrir}
                    </button>`;
                }
				
				                if (statusClass === 'pris' || (element.multiple && element.reserved_count > 0)) {
                    actionButtons += `<button class="btn btn-secondary" onclick="annulerReservation(${originalIndex})">
                        <i class="fas fa-undo"></i> Annuler
                    </button>`;
                }
                
            } else {
				actionButtons += `<button class="btn btn-secondary" onclick="toggleStatusVisibility()">
                    <i class="fas fa-eye"></i> Dévoiler
                </button>`;
			}
            
            html += `
                <div class="cadeau" data-id="${element.id}">
                    <div class="cadeau-content">
                        <div class="image-container">
                            <img src="${element.image}" alt="${element.titre}" onerror="this.src='https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'">
                        </div>
                        <div class="details">
                            <h2>${element.titre}</h2>
                            <p>${element.description}</p>
                            
                            <div class="liens">
                                ${element.liens.map(lien => `<a href="${lien.url}" target="_blank">${lien.text}</a>`).join('')}
                            </div>
                            
                            ${(showStatus && participants.length > 0) ? `
                                <div class="participants">
                                    <strong>Offert par : ${finOffrir}</strong>
                                    <ul>
                                        ${participants.map(p => `<li>${p}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="action">
						${actionButtons}
                        ${isAdmin ? `
                            <div class="cadeau-actions">
                                <button class="btn btn-secondary" onclick="editerElement(${originalIndex})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-secondary" onclick="supprimerElement(${originalIndex})"><i class="fas fa-trash"></i></button>
                                <span class="drag-handle"><i class="fas fa-arrows-alt"></i></span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    });
    
    document.getElementById('list').innerHTML = html;
    
    // Appliquer l'état de visibilité des statuts
    if (showStatus) {
        document.body.classList.add('show-status');
    } else {
        document.body.classList.remove('show-status');
    }
    
    // Initialiser le drag and drop si admin
    if (isAdmin) {
        initSortable();
    }
}

// Initialiser le glisser-déposer
function initSortable() {
    const container = document.getElementById('list');
    new Sortable(container, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: function(evt) {
            // Mettre à jour l'ordre dans le tableau
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            
            if (oldIndex !== newIndex) {
                const moved = elements.splice(oldIndex, 1)[0];
                elements.splice(newIndex, 0, moved);
                sauvegarder();
            }
        }
    });
}

// Filtres et recherche
function filtrerElements() {
    const recherche = document.getElementById('searchBar').value.toLowerCase();
    const statutSelectionne = document.getElementById('statusFilter').value;
    
    let elementsFiltres = elements.filter(element => {
        if (element.type === 'categorie') {
            return true;
        }
        
        const correspondRecherche = element.titre.toLowerCase().includes(recherche) || 
                                  element.description.toLowerCase().includes(recherche);
        
        let correspondStatut = true;
        if (statutSelectionne) {
            if (element.multiple) {
                if (statutSelectionne === 'libre') {
                    correspondStatut = element.unlimited || element.reserved_count < element.max_quantity;
                } else {
                    correspondStatut = !element.unlimited && element.reserved_count >= element.max_quantity;
                }
            } else {
                correspondStatut = element.statut === statutSelectionne;
            }
        }
        
        return correspondRecherche && correspondStatut;
    });
    
    afficherElements(elementsFiltres);
}

// Gestion des réservations
function ouvrirReservation(index) {
    currentReserveIndex = index;
    document.getElementById('reserveModal').style.display = 'flex';
    document.getElementById('reserveName').focus();
}

function confirmerReservation() {
    if (currentReserveIndex >= 0) {
        const nom = document.getElementById('reserveName').value.trim() || 'Anonyme';
        const cadeau = elements[currentReserveIndex];
        const id = cadeau.id;
        
        fetch('api.php?action=reserve', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: id, name: nom})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Mettre à jour localement après succès
                if (cadeau.multiple) {
                    cadeau.reserved_count++;
                    if (!cadeau.participants) cadeau.participants = [];
                    cadeau.participants.push(nom);
                } else {
                    cadeau.statut = 'pris';
                    cadeau.reserve_par = nom;
                }
                
                fermerModal('reserveModal');
                afficherElements();
                afficherNotification(`Cadeau offert par ${nom} !`);
                currentReserveIndex = -1;
            } else {
                afficherNotification('Erreur de réservation: ' + (data.error || ''), 'error');
            }
        })
        .catch(error => {
            afficherNotification('Erreur de réservation', 'error');
        });
    }
}

function annulerReservation(index) {
    const cadeau = elements[index];
    const nom = prompt("Entrez votre prénom pour annuler la réservation:");
    
    if (!nom) return;
    
    fetch('api.php?action=cancel', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: cadeau.id, name: nom})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (cadeau.multiple) {
                const idx = cadeau.participants.indexOf(nom);
                if (idx > -1) {
                    cadeau.participants.splice(idx, 1);
                    cadeau.reserved_count = cadeau.participants.length;
                }
            } else {
                if (cadeau.reserve_par === nom) {
                    cadeau.statut = 'libre';
                    cadeau.reserve_par = '';
                }
            }
            afficherElements();
            afficherNotification(`Réservation annulée par ${nom} !`);
        } else {
            afficherNotification('Erreur d\'annulation: ' + (data.error || ''), 'error');
        }
    })
    .catch(error => {
        afficherNotification('Erreur d\'annulation', 'error');
    });
}

// Gestion admin
function validerAdmin() {
    const code = document.getElementById('adminCode').value;
    
    if (code === ADMIN_CODE) {
        isAdmin = true;
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        afficherListeAdmin();
        afficherNotification('Connexion admin réussie !');
    } else {
        afficherNotification('Code incorrect !', 'error');
    }
}

function handleAdminKeyPress(event) {
    if (event.key === 'Enter') {
        validerAdmin();
    }
}

function toggleNewType() {
    const type = document.getElementById('newType').value;
    document.getElementById('newCadeauFields').style.display = 
        type === 'cadeau' ? 'block' : 'none';
    document.getElementById('newCategorieFields').style.display = 
        type === 'categorie' ? 'block' : 'none';
}

function toggleEditType() {
    const type = document.getElementById('editType').value;
    document.getElementById('editCadeauFields').style.display = 
        type === 'cadeau' ? 'block' : 'none';
    document.getElementById('editCategorieFields').style.display = 
        type === 'categorie' ? 'block' : 'none';
}

function toggleNewQuantity() {
    const type = document.getElementById('newGiftType').value;
    document.getElementById('newQuantityContainer').style.display = 
        type === 'limited' ? 'block' : 'none';
}

function toggleEditQuantity() {
    const type = document.getElementById('editGiftType').value;
    document.getElementById('editQuantityContainer').style.display = 
        type === 'limited' ? 'block' : 'none';
}

function ajouterElement() {
    const type = document.getElementById('newType').value;
    
    if (type === 'cadeau') {
        const liens = [];
        const linkItems = document.querySelectorAll('#newLinksContainer .link-item');
        linkItems.forEach(item => {
            const url = item.querySelector('.link-url').value.trim();
            const text = item.querySelector('.link-text').value.trim();
            if (url) {
                liens.push({
                    url: url,
                    text: text || "Lien d'achat"
                });
            }
        });
        
        const giftType = document.getElementById('newGiftType').value;
        const multiple = giftType !== 'unique';
        const unlimited = giftType === 'unlimited';
        const max_quantity = giftType === 'limited' ? parseInt(document.getElementById('newMaxQuantity').value) || 1 : 1;
        
        const nouveau = {
            id: Date.now(),
            type: 'cadeau',
            image: document.getElementById('newImage').value || 'https://via.placeholder.com/150',
            titre: document.getElementById('newTitre').value,
            description: document.getElementById('newDescription').value,
            liens: liens,
            statut: 'libre',
            reserve_par: "",
            date_creation: new Date().toISOString(),
            multiple: multiple,
            max_quantity: max_quantity,
            reserved_count: 0,
            unlimited: unlimited,
            participants: []
        };
        
        if (!nouveau.titre) {
            afficherNotification('Le titre est obligatoire !', 'error');
            return;
        }
        
        elements.push(nouveau);
    } else {
        const titre = document.getElementById('newCategorieTitre').value;
        if (!titre) {
            afficherNotification('Le titre de la catégorie est obligatoire !', 'error');
            return;
        }
        
        elements.push({
            type: 'categorie',
            id: Date.now(),
            titre: titre
        });
    }
    
    sauvegarder();
    afficherElements();
    afficherListeAdmin();
    
    // Vider le formulaire
    document.getElementById('newTitre').value = '';
    document.getElementById('newDescription').value = '';
    document.getElementById('newImage').value = '';
    document.getElementById('newCategorieTitre').value = '';
    document.getElementById('newGiftType').value = 'unique';
    document.getElementById('newQuantityContainer').style.display = 'none';
    
    // Réinitialiser les liens
    document.getElementById('newLinksContainer').innerHTML = `
        <div class="link-item">
            <input type="text" class="link-url" placeholder="URL du lien">
            <input type="text" class="link-text" placeholder="Remarque/Prix">
            <button onclick="supprimerLien(this)"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    afficherNotification('Élément ajouté !');
}

function ajouterLien() {
    const container = document.getElementById('newLinksContainer');
    const div = document.createElement('div');
    div.className = 'link-item';
    div.innerHTML = `
        <input type="text" class="link-url" placeholder="URL du lien">
        <input type="text" class="link-text" placeholder="Remarque/Prix">
        <button onclick="supprimerLien(this)"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
}

function ajouterLienEdit() {
    const container = document.getElementById('editLinksContainer');
    const div = document.createElement('div');
    div.className = 'link-item';
    div.innerHTML = `
        <input type="text" class="link-url" placeholder="URL du lien">
        <input type="text" class="link-text" placeholder="Remarque/Prix">
        <button onclick="supprimerLien(this)"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
}

function supprimerLien(button) {
    button.parentElement.remove();
}

function editerElement(index) {
    currentEditIndex = index;
    const element = elements[index];
    
    document.getElementById('adminAddPanel').style.display = 'none';
    document.getElementById('adminEditPanel').style.display = 'block';
    
    document.getElementById('editType').value = element.type;
    toggleEditType();
    
    if (element.type === 'cadeau') {
        document.getElementById('editImage').value = element.image || '';
        document.getElementById('editTitre').value = element.titre;
        document.getElementById('editDescription').value = element.description;
        
        // Liens
        const linksContainer = document.getElementById('editLinksContainer');
        linksContainer.innerHTML = '';
        element.liens.forEach(lien => {
            const div = document.createElement('div');
            div.className = 'link-item';
            div.innerHTML = `
                <input type="text" class="link-url" value="${lien.url}" placeholder="URL du lien">
                <input type="text" class="link-text" value="${lien.text}" placeholder="Remarque/Prix">
                <button onclick="supprimerLien(this)"><i class="fas fa-trash"></i></button>
            `;
            linksContainer.appendChild(div);
        });
        
        // Type de cadeau
        let giftType = 'unique';
        if (element.multiple) {
            giftType = element.unlimited ? 'unlimited' : 'limited';
        }
        document.getElementById('editGiftType').value = giftType;
        toggleEditQuantity();
        
        if (giftType === 'limited') {
            document.getElementById('editMaxQuantity').value = element.max_quantity;
        }
    } else {
        document.getElementById('editCategorieTitre').value = element.titre;
    }
}

function sauvegarderEdition() {
    if (currentEditIndex === -1) return;
    
    const element = elements[currentEditIndex];
    
    if (element.type === 'cadeau') {
        // Mettre à jour les propriétés
        element.image = document.getElementById('editImage').value;
        element.titre = document.getElementById('editTitre').value;
        element.description = document.getElementById('editDescription').value;
        
        // Liens
        const liens = [];
        const linkItems = document.querySelectorAll('#editLinksContainer .link-item');
        linkItems.forEach(item => {
            const url = item.querySelector('.link-url').value.trim();
            const text = item.querySelector('.link-text').value.trim();
            if (url) {
                liens.push({
                    url: url,
                    text: text || "Lien d'achat"
                });
            }
        });
        element.liens = liens;
        
        // Type de cadeau
        const giftType = document.getElementById('editGiftType').value;
        element.multiple = giftType !== 'unique';
        element.unlimited = giftType === 'unlimited';
        element.max_quantity = giftType === 'limited' ? parseInt(document.getElementById('editMaxQuantity').value) || 1 : 1;
    } else {
        element.titre = document.getElementById('editCategorieTitre').value;
    }
    
    sauvegarder();
    afficherElements();
    afficherListeAdmin();
    annulerEdition();
    afficherNotification('Élément modifié avec succès !');
}

function annulerEdition() {
    document.getElementById('adminAddPanel').style.display = 'block';
    document.getElementById('adminEditPanel').style.display = 'none';
    currentEditIndex = -1;
}

function supprimerElement(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
        elements.splice(index, 1);
        sauvegarder();
        afficherElements();
        if (isAdmin) afficherListeAdmin();
        afficherNotification('Élément supprimé !');
    }
}

function afficherListeAdmin() {
    let html = '';
    elements.forEach((e, i) => {
        const icon = e.type === 'categorie' ? 'fa-tag' : 'fa-gift';
        const color = e.type === 'categorie' ? '#FFD700' : '#4CAF50';
        
        html += `
            <div class="admin-item" data-id="${e.id}">
                <div class="admin-item-info">
                    <div class="item-icon" style="color: ${color}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <strong>${e.titre}</strong>
                </div>
                <div class="admin-item-actions">
                    <button class="btn btn-secondary" onclick="editerElement(${i})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-secondary" onclick="supprimerElement(${i})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <span class="drag-handle"><i class="fas fa-arrows-alt"></i></span>
                </div>
            </div>
        `;
    });
    document.getElementById('adminList').innerHTML = html || '<p>Aucun élément dans la liste</p>';
    
    // Activer le tri pour la liste admin
    if (isAdmin) {
        const adminList = document.getElementById('adminList');
        new Sortable(adminList, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: function(evt) {
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;
                
                if (oldIndex !== newIndex) {
                    const moved = elements.splice(oldIndex, 1)[0];
                    elements.splice(newIndex, 0, moved);
                    sauvegarder();
                }
            }
        });
    }
}

function exporterDonnees() {
    const dataStr = JSON.stringify(elements, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wishlist-audrick.json';
    link.click();
    URL.revokeObjectURL(url);
    afficherNotification('Données exportées !');
}

function importerDonnees(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                elements = importedData;
                sauvegarder();
                afficherElements();
                afficherListeAdmin();
                afficherNotification('Données importées !');
            } else {
                afficherNotification('Format de fichier invalide !', 'error');
            }
        } catch (error) {
            afficherNotification('Erreur lors de l\'importation !', 'error');
        }
    };
    reader.readAsText(file);
}

// Gestion des modales
function toggleAdmin() {
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminCode').focus();
}

function fermerModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'adminModal') {
        isAdmin = false;
        document.getElementById('adminLogin').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminCode').value = '';
        annulerEdition();
        afficherElements();
    }
    if (modalId === 'reserveModal') {
        document.getElementById('reserveName').value = '';
    }
}

function toggleStatusVisibility() {
    showStatus = !showStatus;
    afficherElements();
    
    const btn = document.getElementById('toggleStatusBtn');
    if (showStatus) {
        btn.innerHTML = '<i class="fas fa-eye-slash"></i> Masquer';
        btn.style.background = 'linear-gradient(to right, #311b92, #1a237e)';
    } else {
        btn.innerHTML = '<i class="fas fa-eye"></i> Dévoiler';
        btn.style.background = 'linear-gradient(to right, #4a148c, #311b92)';
    }
}

// Événements
document.addEventListener('DOMContentLoaded', function() {
    // Cacher les stats par défaut
    document.getElementById('stats').innerHTML = '';
    
    // Gestion des champs type d'élément
    document.getElementById('newType').addEventListener('change', toggleNewType);
    document.getElementById('editType').addEventListener('change', toggleEditType);
    
    // Gestion des champs type de cadeau
    document.getElementById('newGiftType').addEventListener('change', toggleNewQuantity);
    document.getElementById('editGiftType').addEventListener('change', toggleEditQuantity);
    
    // Bouton de statut
    document.getElementById('toggleStatusBtn').addEventListener('click', toggleStatusVisibility);
    
    afficherElements();
    
    // Recherche en temps réel
    document.getElementById('searchBar').addEventListener('input', filtrerElements);
    document.getElementById('statusFilter').addEventListener('change', filtrerElements);
    
    // Fermeture des modales
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            fermerModal(modal.id);
        });
    });
    
    // Fermeture modal en cliquant à l'extérieur
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            fermerModal(event.target.id);
        }
    });
    
    // Raccourcis clavier
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'flex') {
                    fermerModal(modal.id);
                }
            });
        }
        if (event.key === 'Enter' && document.getElementById('reserveModal').style.display === 'flex') {
            confirmerReservation();
        }
    });
});