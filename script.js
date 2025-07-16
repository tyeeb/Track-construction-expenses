document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const sessionsRef = database.ref('sessions');
    let currentSessionId = null;
    let sessions = {};

    const materialForm = document.getElementById('material-form');
    const materialTable = document.getElementById('material-table').getElementsByTagName('tbody')[0];
    const totalCostValue = document.getElementById('total-cost-value');
    const errorMessage = document.getElementById('error-message');
    
    // --- SESSION MANAGEMENT ---
    function renderSessions() {
        const navbarSessions = document.getElementById('navbar-sessions');
        navbarSessions.innerHTML = '';
        Object.entries(sessions).forEach(([id, session]) => {
            const btn = document.createElement('button');
            btn.className = 'session-btn' + (id === currentSessionId ? ' active' : '');
            btn.textContent = session.name;
            btn.setAttribute('data-id', id);
            // Edit icon
            const editIcon = document.createElement('span');
            editIcon.className = 'fas fa-edit edit-icon';
            editIcon.title = 'Edit session name';
            editIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                openRenameModal(id, session.name);
            });
            btn.appendChild(editIcon);
            // Delete icon
            const deleteIcon = document.createElement('span');
            deleteIcon.className = 'fas fa-trash delete-session-icon';
            deleteIcon.title = 'Delete session';
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this session and all its data?')) {
                    sessionsRef.child(id).remove();
                    if (id === currentSessionId) {
                        currentSessionId = null;
                    }
                }
            });
            btn.appendChild(deleteIcon);
            btn.addEventListener('click', () => switchSession(id));
            navbarSessions.appendChild(btn);
        });
    }

    function switchSession(id) {
        if (id === currentSessionId) return;
        currentSessionId = id;
        renderSessions();
        loadMaterials();
    }

    function createSession(name) {
        const newSession = { name: name || 'New Session' };
        const ref = sessionsRef.push(newSession);
        ref.then(snap => {
            currentSessionId = snap.key;
            renderSessions();
            loadMaterials();
        });
    }

    function openRenameModal(id, currentName) {
        const modal = document.getElementById('rename-modal');
        const input = document.getElementById('rename-session-input');
        input.value = currentName;
        modal.style.display = 'flex';
        input.focus();
        document.getElementById('save-rename-btn').onclick = () => {
            const newName = input.value.trim();
            if (newName) {
                sessionsRef.child(id).update({ name: newName });
                modal.style.display = 'none';
            }
        };
        document.getElementById('close-rename-modal').onclick = () => {
            modal.style.display = 'none';
        };
    }

    document.getElementById('create-session-btn').addEventListener('click', () => {
        const name = prompt('Enter session name:');
        if (name) createSession(name);
    });

    sessionsRef.on('value', (snapshot) => {
        sessions = snapshot.val() || {};
        // If no session selected, select the first one
        if (!currentSessionId || !sessions[currentSessionId]) {
            currentSessionId = Object.keys(sessions)[0] || null;
        }
        renderSessions();
        loadMaterials();
        loadSessionNotes();
    });

    // --- MATERIALS MANAGEMENT (per session) ---
    function getMaterialsRef() {
        if (!currentSessionId) return null;
        return sessionsRef.child(currentSessionId).child('materials');
    }

    function loadMaterials() {
        const materialsRef = getMaterialsRef();
        if (!materialsRef) {
            renderTable(null);
            updateTotalCost(null);
            return;
        }
        materialsRef.off();
        materialsRef.on('value', (snapshot) => {
            const materials = snapshot.val();
            renderTable(materials);
            updateTotalCost(materials);
        });
    }

    function renderTable(materials) {
        materialTable.innerHTML = '';
        if (materials) {
            Object.keys(materials).forEach(key => {
                const material = materials[key];
                const row = materialTable.insertRow();
                const totalPrice = material.quantity * material.price;

                row.innerHTML = `
                    <td data-label="Material"><i class='fas fa-cube material-icon'></i>${material.name}</td>
                    <td data-label="Quantity">${material.quantity}</td>
                    <td data-label="Price per unit">₹${material.price.toFixed(2)}</td>
                    <td data-label="Total Price">₹${totalPrice.toFixed(2)}</td>
                    <td data-label="Date & Time">${material.dateTime ? material.dateTime : ''}</td>
                    <td data-label="Actions"><button class="delete-btn" data-id="${key}"><i class='fas fa-trash'></i> Delete</button></td>
                `;
            });
            addDeleteEventListeners();
        }
    }

    // Update materialForm event to use getMaterialsRef()
    materialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        const name = document.getElementById('material-name').value.trim();
        const quantity = parseFloat(document.getElementById('material-quantity').value);
        const price = parseFloat(document.getElementById('material-price').value);
        const now = new Date();
        const dateTime = now.toLocaleString();

        if (!name) {
            errorMessage.textContent = 'Material name is required.';
            return;
        }
        if (isNaN(quantity) || quantity <= 0) {
            errorMessage.textContent = 'Quantity must be a positive number.';
            return;
        }
        if (isNaN(price) || price <= 0) {
            errorMessage.textContent = 'Price must be a positive number.';
            return;
        }
        materialForm.querySelector('button[type="submit"]').disabled = true;
        try {
            const materialsRef = getMaterialsRef();
            if (materialsRef) {
                await materialsRef.push({ name, quantity, price, dateTime });
                materialForm.reset();
            }
        } catch (err) {
            errorMessage.textContent = 'Failed to add material. Please try again.';
        } finally {
            materialForm.querySelector('button[type="submit"]').disabled = false;
        }
    });

    // Update addDeleteEventListeners to use getMaterialsRef()
    function addDeleteEventListeners() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const materialsRef = getMaterialsRef();
                if (id && materialsRef) {
                    materialsRef.child(id).remove();
                }
            });
        });
    }

    // function addDeleteEventListeners() {
    //     const deleteButtons = document.querySelectorAll('.delete-btn');
    //     deleteButtons.forEach(button => {
    //         button.addEventListener('click', (e) => {
    //             const id = e.target.dataset.id;
    //             database.ref('materials/' + id).remove();
    //         });
    //     });
    // }

    function updateTotalCost(materials) {
        let totalCost = 0;
        if (materials) {
            totalCost = Object.values(materials).reduce((sum, material) => sum + (material.quantity * material.price), 0);
        }
        totalCostValue.textContent = `${totalCost.toFixed(2)}`;
    }

    // --- SESSION NOTES ---
    const sessionNotes = document.getElementById('session-notes');
    function loadSessionNotes() {
        sessionNotes.value = '';
        if (!currentSessionId) return;
        sessionsRef.child(currentSessionId).child('notes').once('value', (snapshot) => {
            sessionNotes.value = snapshot.val() || '';
        });
    }
    function saveSessionNotes() {
        if (!currentSessionId) return;
        sessionsRef.child(currentSessionId).child('notes').set(sessionNotes.value);
    }
    sessionNotes.addEventListener('change', saveSessionNotes);
    sessionNotes.addEventListener('blur', saveSessionNotes);
});