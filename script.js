
document.addEventListener("DOMContentLoaded", () => {
    // --- INITIALIZE FIREBASE & AUTH ---
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const auth = firebase.auth();
  
    // --- AUTHENTICATION CHECK ---
    auth.onAuthStateChanged((user) => {
      if (user) {
        runApp(user);
      } else {
        window.location.href = "index.html";
      }
    });
  
    // --- MAIN APP FUNCTION ---
    function runApp(user) {
      // --- CORRECTED: Database reference is now user-specific ---
      const sessionsRef = database.ref(`users/${user.uid}/sessions`);
  
      // --- GLOBAL VARIABLES ---
      let currentSessionId = null;
      let sessions = {};
      let materialsListener = null;
  
      // --- DOM ELEMENT REFERENCES ---
      const materialForm = document.getElementById("material-form");
      const materialTable = document.getElementById("material-table").getElementsByTagName("tbody")[0];
      const totalCostValue = document.getElementById("total-cost-value");
      const errorMessage = document.getElementById("error-message");
      const sessionNotes = document.getElementById("session-notes");
      const sidebar = document.getElementById("sidebar");
      const sidebarToggle = document.getElementById("sidebar-toggle");
      const sidebarOverlay = document.getElementById("sidebar-overlay");
      const themeToggle = document.getElementById("theme-toggle");
      const logoutBtn = document.getElementById("logout-btn");
  
      // --- LOGOUT BUTTON ---
      logoutBtn.addEventListener('click', () => {
          auth.signOut();
      });
  
      // --- THEME & SIDEBAR LOGIC ---
      function applyTheme(theme) {
          if (theme === "dark") {
              document.body.classList.add("dark-mode");
              themeToggle.innerHTML = `<i class="fas fa-sun"></i>`;
          } else {
              document.body.classList.remove("dark-mode");
              themeToggle.innerHTML = `<i class="fas fa-moon"></i>`;
          }
      }
      themeToggle.addEventListener("click", () => {
          const newTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
          localStorage.setItem("theme", newTheme);
          applyTheme(newTheme);
      });
      function openSidebar() { sidebar.classList.add("open"); sidebarOverlay.classList.add("active"); }
      function closeSidebar() { sidebar.classList.remove("open"); sidebarOverlay.classList.remove("active"); }
      sidebarToggle.addEventListener("click", () => sidebar.classList.contains("open") ? closeSidebar() : openSidebar());
      sidebarOverlay.addEventListener("click", closeSidebar);
  
      // --- SESSION MANAGEMENT ---
      function switchSession(id) {
          currentSessionId = id;
          localStorage.setItem(`activeSessionId_${user.uid}`, id);
          renderSessions();
          loadMaterials();
          loadSessionNotes();
          if (window.innerWidth <= 1200) closeSidebar();
      }
  
      sessionsRef.on("value", (snapshot) => {
          sessions = snapshot.val() || {};
          const sessionKeys = Object.keys(sessions);
          if (currentSessionId && !sessionKeys.includes(currentSessionId)) {
              const newCurrentId = sessionKeys[0] || null;
              switchSession(newCurrentId);
          }
          renderSessions();
      });
  
      function isDuplicateSessionName(name, excludeId = null) {
          return Object.entries(sessions).some(([id, session]) => {
              return session.name.toLowerCase() === name.toLowerCase() && id !== excludeId;
          });
      }
  
      document.getElementById("create-session-btn").addEventListener("click", () => {
          const name = prompt("Enter new session name:");
          if (name !== null) {
              const sessionName = name.trim();
              if (!sessionName) {
                  alert("Session name cannot be empty.");
                  return;
              }
              if (isDuplicateSessionName(sessionName)) {
                  alert("A session with this name already exists.");
                  return;
              }
              const newSession = { name: sessionName, notes: "" };
              const newSessionRef = sessionsRef.push(newSession);
              switchSession(newSessionRef.key);
          }
      });
  
      function renderSessions() {
          const navbarSessions = document.getElementById("navbar-sessions");
          navbarSessions.innerHTML = "";
          if (Object.keys(sessions).length === 0) {
              navbarSessions.innerHTML = '<span style="padding: 1rem; color: var(--text-secondary);">No sessions yet.</span>';
              return;
          }
          Object.entries(sessions).forEach(([id, session]) => {
              const btn = document.createElement("button");
              btn.className = "session-btn" + (id === currentSessionId ? " active" : "");
              btn.innerHTML = `<span class="session-name">${session.name}</span>`;
              btn.dataset.id = id;
              const actionsWrapper = document.createElement("div");
              actionsWrapper.className = "session-actions";
              const editIcon = document.createElement("i");
              editIcon.className = "fas fa-edit edit-icon";
              editIcon.title = "Rename";
              editIcon.onclick = (e) => { e.stopPropagation(); openRenameModal(id, session.name); };
              const deleteIcon = document.createElement("i");
              deleteIcon.className = "fas fa-trash delete-session-icon";
              deleteIcon.title = "Delete";
              deleteIcon.onclick = (e) => { e.stopPropagation(); if (confirm(`Delete "${session.name}"?`)) { sessionsRef.child(id).remove(); }};
              actionsWrapper.appendChild(editIcon);
              actionsWrapper.appendChild(deleteIcon);
              btn.appendChild(actionsWrapper);
              btn.onclick = () => switchSession(id);
              navbarSessions.appendChild(btn);
          });
      }
  
      // --- MATERIALS & NOTES ---
      function getMaterialsRef() {
          return currentSessionId ? sessionsRef.child(currentSessionId).child("materials") : null;
      }
  
      function loadMaterials() {
          if (materialsListener) materialsListener.off();
          const materialsRef = getMaterialsRef();
          if (!materialsRef) { renderTable(null); updateTotalCost(null); return; }
          materialsListener = materialsRef;
          materialsListener.on("value", (snapshot) => {
              renderTable(snapshot.val());
              updateTotalCost(snapshot.val());
          });
      }
  
      function renderTable(materials) {
          materialTable.innerHTML = "";
          if (!materials) return;
          Object.entries(materials).forEach(([key, material]) => {
              const row = materialTable.insertRow();
              const price = Number(material.price) || 0;
              const quantity = Number(material.quantity) || 0;
              const totalPrice = (quantity * price);
              row.innerHTML = `
                  <td data-label="Material"><span class="material-name-text">${material.name}</span></td>
                  <td data-label="Quantity">${quantity}</td>
                  <td data-label="Price per unit">₹${price.toFixed(2)}</td>
                  <td data-label="Total Price">₹${totalPrice.toFixed(2)}</td>
                  <td data-label="Date & Time">${material.dateTime || ""}</td>
                  <td data-label="Actions">
                  <button class="edit-btn" data-id="${key}" title="Edit"><i class='fas fa-pen'></i></button>
                  <button class="delete-btn" data-id="${key}"><i class='fas fa-trash'></i></button>
                  </td>
              `;
          });
          addDeleteEventListeners();
      }
  
      materialForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const materialsRef = getMaterialsRef();
          if (!materialsRef) { alert("Please select a session first."); return; }
          const name = document.getElementById("material-name").value.trim();
          const quantity = parseFloat(document.getElementById("material-quantity").value);
          const price = parseFloat(document.getElementById("material-price").value);
          if (!name || isNaN(quantity) || quantity <= 0 || isNaN(price) || price < 0) {
              errorMessage.textContent = "Please fill all fields with valid data.";
              return;
          }
          errorMessage.textContent = "";
          await materialsRef.push({ name, quantity, price, dateTime: new Date().toLocaleString("en-IN") });
          materialForm.reset();
      });
  
    //   function addDeleteEventListeners() {
    //       materialTable.querySelectorAll(".delete-btn").forEach((button) => {
    //           button.onclick = (e) => {
    //               const id = e.currentTarget.dataset.id;
    //               const materialsRef = getMaterialsRef();
    //               if (id && materialsRef) { materialsRef.child(id).remove(); }
    //           };
    //       });
    //   }
    // Replace your old addDeleteEventListeners function with this one
   // Replace your old addDeleteEventListeners function with this one
function addDeleteEventListeners() {
    materialTable.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.currentTarget.dataset.id;
            const materialsRef = getMaterialsRef();
            if (id && materialsRef) { 
                if (confirm("Are you sure you want to delete this material?")) {
                    materialsRef.child(id).remove();
                }
            }
        };
    });

    // Add this new part to handle the edit buttons
    materialTable.querySelectorAll('.edit-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.currentTarget.dataset.id;
            openEditMaterialModal(id);
        };
    });
}
      function updateTotalCost(materials) {
          let totalCost = 0;
          if (materials) {
              totalCost = Object.values(materials).reduce((sum, material) => sum + ((material.quantity || 0) * (material.price || 0)), 0);
          }
          totalCostValue.textContent = `₹${totalCost.toFixed(2)}`;
      }
  
      function openRenameModal(id, currentName) {
          const modal = document.getElementById("rename-modal");
          const input = document.getElementById("rename-session-input");
          input.value = currentName;
          modal.style.display = "flex";
          input.focus();
          
          const saveNewName = () => {
              const newName = input.value.trim();
              if (!newName) { alert("Session name cannot be empty."); return; }
              if (isDuplicateSessionName(newName, id)) { alert("A session with this name already exists."); return; }
              sessionsRef.child(id).update({ name: newName });
              modal.style.display = "none";
              document.removeEventListener("keydown", handleKeydown);
          };
  
          const handleKeydown = (e) => {
              if (e.key === 'Enter') saveNewName();
              if (e.key === 'Escape') {
                  modal.style.display = 'none';
                  document.removeEventListener("keydown", handleKeydown);
              }
          };
  
          document.getElementById("save-rename-btn").onclick = saveNewName;
          document.getElementById("close-rename-modal").onclick = () => {
              modal.style.display = "none";
              document.removeEventListener("keydown", handleKeydown);
          };
          document.addEventListener("keydown", handleKeydown);
      }
      
      function loadSessionNotes() {
          sessionNotes.value = "";
          if (!currentSessionId) return;
          sessionsRef.child(currentSessionId).child("notes").once("value", (snapshot) => {
              sessionNotes.value = snapshot.val() || "";
          });
      }
      // Add this new function inside runApp(user)
function openEditMaterialModal(materialId) {
    const materialsRef = getMaterialsRef();
    if (!materialsRef) return;

    // 1. Get references to the modal and its inputs
    const modal = document.getElementById('edit-material-modal');
    const nameInput = document.getElementById('edit-material-name');
    const quantityInput = document.getElementById('edit-material-quantity');
    const priceInput = document.getElementById('edit-material-price');
    const saveBtn = document.getElementById('save-edit-material-btn');
    const closeBtn = document.getElementById('close-edit-material-modal');

    // 2. Fetch the current data for that material from Firebase
    materialsRef.child(materialId).once('value', (snapshot) => {
        const material = snapshot.val();
        if (material) {
            // 3. Fill the form with the existing data
            nameInput.value = material.name;
            quantityInput.value = material.quantity;
            priceInput.value = material.price;

            // 4. Show the modal
            modal.style.display = 'flex';
        }
    });

    // 5. Handle the save button click
    saveBtn.onclick = () => {
        const newName = nameInput.value.trim();
        const newQuantity = parseFloat(quantityInput.value);
        const newPrice = parseFloat(priceInput.value);

        if (!newName || isNaN(newQuantity) || newQuantity <= 0 || isNaN(newPrice) || newPrice < 0) {
            alert("Please fill all fields with valid data.");
            return;
        }

        // 6. Update the data in Firebase
        materialsRef.child(materialId).update({
            name: newName,
            quantity: newQuantity,
            price: newPrice
        });

        modal.style.display = 'none';
    };

    // 7. Handle the close button click
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
}
  
      function debounce(func, delay) {
          let timeout;
          return (...args) => {
              clearTimeout(timeout);
              timeout = setTimeout(() => func.apply(this, args), delay);
          };
      }
      const debouncedSaveNotes = debounce(() => {
          if (!currentSessionId) return;
          sessionsRef.child(currentSessionId).child("notes").set(sessionNotes.value);
      }, 500);
      sessionNotes.addEventListener("input", debouncedSaveNotes);
  
      // --- INITIAL APP LOAD ---
      function initializeApp() {
          const savedTheme = localStorage.getItem("theme") || "light";
          applyTheme(savedTheme);
  
          sessionsRef.once("value", (snapshot) => {
              sessions = snapshot.val() || {};
              const sessionKeys = Object.keys(sessions);
              const savedSessionId = localStorage.getItem(`activeSessionId_${user.uid}`);
              
              if (savedSessionId && sessionKeys.includes(savedSessionId)) {
                  currentSessionId = savedSessionId;
              } else {
                  currentSessionId = sessionKeys[0] || null;
                  localStorage.setItem(`activeSessionId_${user.uid}`, currentSessionId);
              }
  
              renderSessions();
              if (currentSessionId) {
                  loadMaterials();
                  loadSessionNotes();
              }
          });
      }
  
      initializeApp();
    }
  });