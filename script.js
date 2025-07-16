document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const materialsRef = database.ref('materials');

    const materialForm = document.getElementById('material-form');
    const materialTable = document.getElementById('material-table').getElementsByTagName('tbody')[0];
    const totalCostValue = document.getElementById('total-cost-value');
    const errorMessage = document.getElementById('error-message');
    
    materialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        const name = document.getElementById('material-name').value.trim();
        const quantity = parseFloat(document.getElementById('material-quantity').value);
        const price = parseFloat(document.getElementById('material-price').value);

        const now = new Date(); 
        // const dateTime = now.toLocaleString();
        const dateTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

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
            await materialsRef.push({ name, quantity, price, dateTime });
            materialForm.reset();
        } catch (err) {
            errorMessage.textContent = 'Failed to add material. Please try again.';
        } finally {
            materialForm.querySelector('button[type="submit"]').disabled = false;
        }
    });

    materialsRef.on('value', (snapshot) => {
        const materials = snapshot.val();
        renderTable(materials);
        updateTotalCost(materials);
    });

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
    function addDeleteEventListeners() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (id) {
                    database.ref('materials/' + id).remove();
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
});