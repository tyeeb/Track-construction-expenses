// // const { default: firebase } = require("@firebase/app-compat");

// document.addEventListener("DOMContentLoaded", () => {
//   // --- INITIALIZE FIREBASE & REFERENCES ---
//   firebase.initializeApp(firebaseConfig);
//   const database = firebase.database();
//   const auth = firebase.auth();
//   // const storage = firebase.storage();
//   auth.onAuthStateChanged((user) => {
//     if (user) {
//       // If a user is logged in, run the main app logic
//       runApp(user);
//     } else {
//       // If no user is logged in, redirect to the login page
//       window.location.href = "index.html";
//     }
//   });


//   function runApp(user) {
//     const userRef = database.ref(`users/${user.uid}`);

//     const sessionsRef = database.ref("sessions");
//     // const imagesRef = database.ref('images');

//     // --- GLOBAL VARIABLES ---
//     let currentSessionId = null;
//     let sessions = {};
//     let materialsListener = null; // To keep track of the current data listener

//     // --- DOM ELEMENT REFERENCES ---
//     const appLayout = document.querySelector(".app-layout");
//     const materialForm = document.getElementById("material-form");
//     const materialTable = document
//       .getElementById("material-table")
//       .getElementsByTagName("tbody")[0];
//     const totalCostValue = document.getElementById("total-cost-value");
//     const errorMessage = document.getElementById("error-message");
//     const sessionNotes = document.getElementById("session-notes");
//     const sidebar = document.getElementById("sidebar");
//     const sidebarToggle = document.getElementById("sidebar-toggle");
//     const sidebarOverlay = document.getElementById("sidebar-overlay");
//     const themeToggle = document.getElementById("theme-toggle");
//     const trackerView = document.getElementById("tracker-view");
//     const logoutBtn = document.getElementById("logout-btn");

//     logoutBtn.addEventListener('click', () => {
//         auth.signOut(); // This will trigger the onAuthStateChanged listener, which redirects to index.html
//     });
//     // const imagesView = document.getElementById('images-view');
//     // const imagesSectionBtn = document.getElementById('images-section-btn');
//     // const insertImageBtn = document.getElementById('insert-image-btn');
//     // const imageUploadInput = document.getElementById('image-upload-input');
//     // const imageGalleryContainer = document.getElementById('image-gallery-container');

//     // --- VIEW MANAGEMENT ---
//     function switchView(viewName) {
//       document
//         .querySelectorAll(".view")
//         .forEach((v) => v.classList.remove("active-view"));
//       document
//         .querySelectorAll(".nav-btn, .session-btn")
//         .forEach((b) => b.classList.remove("active"));
//       // if (viewName === 'images') {
//       //     imagesView.classList.add('active-view');
//       //     imagesSectionBtn.classList.add('active');
//       //     loadImages();
//       // } else {
//       trackerView.classList.add("active-view");
//       renderSessions(); // Re-render to set the correct active session button
//       // }
//     }
//     // imagesSectionBtn.addEventListener('click', () => switchView('images'));

//     // --- CORE DATA LOADING LOGIC (Corrected) ---
//     function getMaterialsRef() {
//       return currentSessionId
//         ? sessionsRef.child(currentSessionId).child("materials")
//         : null;
//     }

//     function loadMaterials() {
//       // First, detach any existing listener to prevent data bleeding between sessions
//       if (materialsListener) {
//         materialsListener.off();
//       }

//       const materialsRef = getMaterialsRef();

//       if (materialsRef) {
//         // Attach a new listener for the current session
//         materialsListener = materialsRef; // Store the reference
//         materialsListener.on("value", (snapshot) => {
//           renderTable(snapshot.val());
//           updateTotalCost(snapshot.val());
//         });
//       } else {
//         // If no session is selected, clear the table
//         renderTable(null);
//         updateTotalCost(null);
//       }
//     }

//     // --- SESSION MANAGEMENT ---
//     function switchSession(id) {
//       if (
//         id === currentSessionId &&
//         trackerView.classList.contains("active-view")
//       )
//         return;

//       currentSessionId = id;
//       localStorage.setItem(`activeSessionId_${user.uid}`, id); // user specific rendering
//       switchView("tracker"); // This function now calls renderSessions internally
//       loadMaterials();
//       loadSessionNotes();

//       if (window.innerWidth <= 900) closeSidebar();
//     }

//     sessionsRef.on("value", (snapshot) => {
//       sessions = snapshot.val() || {};
//       const sessionKeys = Object.keys(sessions);

//       // If the active session was deleted, select a new one
//       if (currentSessionId && !sessionKeys.includes(currentSessionId)) {
//         const newCurrentId = sessionKeys[0] || null;
//         switchSession(newCurrentId);
//       }

//       renderSessions();
//     });

//     // Helper function to check for duplicate session names
//     function isDuplicateSessionName(name, excludeId = null) {
//       return Object.entries(sessions).some(([id, session]) => {
//         return (
//           session.name.toLowerCase() === name.toLowerCase() && id !== excludeId
//         );
//       });
//     }

//     document
//       .getElementById("create-session-btn")
//       .addEventListener("click", () => {
//         const name = prompt("Enter new session name:");
//         if (name !== null) {
//           const sessionName = name.trim();
//           if (!sessionName) {
//             alert("Session name cannot be empty.");
//             return;
//           }

//           if (isDuplicateSessionName(sessionName)) {
//             alert(
//               "A session with this name already exists. Please choose a different name."
//             );
//             return;
//           }

//           const newSession = { name: sessionName, notes: "" };
//           const newSessionRef = sessionsRef.push(newSession);
//           switchSession(newSessionRef.key);
//         }
//       });

//     function renderSessions() {
//       const navbarSessions = document.getElementById("navbar-sessions");
//       navbarSessions.innerHTML = "";
//       if (Object.keys(sessions).length === 0) {
//         navbarSessions.innerHTML =
//           '<span style="padding: 1rem; color: var(--text-secondary);">No sessions yet.</span>';
//         return;
//       }
//       Object.entries(sessions).forEach(([id, session]) => {
//         const btn = document.createElement("button");
//         btn.className = "session-btn";
//         if (
//           id === currentSessionId &&
//           trackerView.classList.contains("active-view")
//         ) {
//           btn.classList.add("active");
//         }
//         btn.innerHTML = `<span class="session-name">${session.name}</span>`;
//         btn.dataset.id = id;
//         const actionsWrapper = document.createElement("div");
//         actionsWrapper.className = "session-actions";
//         const editIcon = document.createElement("i");
//         editIcon.className = "fas fa-edit edit-icon";
//         editIcon.title = "Rename";
//         editIcon.onclick = (e) => {
//           e.stopPropagation();
//           openRenameModal(id, session.name);
//         };
//         const deleteIcon = document.createElement("i");
//         deleteIcon.className = "fas fa-trash delete-session-icon";
//         deleteIcon.title = "Delete";
//         deleteIcon.onclick = (e) => {
//           e.stopPropagation();
//           if (confirm(`Delete "${session.name}"?`)) {
//             sessionsRef.child(id).remove();
//           }
//         };
//         actionsWrapper.appendChild(editIcon);
//         actionsWrapper.appendChild(deleteIcon);
//         btn.appendChild(actionsWrapper);
//         btn.onclick = () => switchSession(id);
//         navbarSessions.appendChild(btn);
//       });
//     }

//     // --- INITIAL APP LOAD ---
//     function initializeApp() {
//       const savedTheme = localStorage.getItem("theme") || "light";
//       applyTheme(savedTheme);

//       const savedSessionId = localStorage.getItem("activeSessionId");

//       // Use a one-time fetch to initialize the app state
//       sessionsRef.once("value", (snapshot) => {
//         sessions = snapshot.val() || {};
//         const sessionKeys = Object.keys(sessions);
//         const savedSessionId = localStorage.getItem(`activeSessionId_${user.uid}`);

//         if (savedSessionId && sessionKeys.includes(savedSessionId)) {
//           currentSessionId = savedSessionId;
//         } else {
//           currentSessionId = sessionKeys[0] || null;
//           localStorage.setItem(`activeSessionId_${user.uid}`, currentSessionId);
//         }

//         switchView("tracker");
//         if (currentSessionId) {
//           loadMaterials();
//           loadSessionNotes();
//         }
//       });
//     }

//     initializeApp();

//     function applyTheme(theme) {
//       if (theme === "dark") {
//         document.body.classList.add("dark-mode");
//         themeToggle.innerHTML = `<i class="fas fa-sun"></i>`;
//       } else {
//         document.body.classList.remove("dark-mode");
//         themeToggle.innerHTML = `<i class="fas fa-moon"></i>`;
//       }
//     }
//     themeToggle.addEventListener("click", () => {
//       const newTheme = document.body.classList.contains("dark-mode")
//         ? "light"
//         : "dark";
//       localStorage.setItem("theme", newTheme);
//       applyTheme(newTheme);
//     });
//     function openSidebar() {
//       sidebar.classList.add("open");
//       sidebarOverlay.classList.add("active");
//     }
//     function closeSidebar() {
//       sidebar.classList.remove("open");
//       sidebarOverlay.classList.remove("active");
//     }
//     sidebarToggle.addEventListener("click", () =>
//       sidebar.classList.contains("open") ? closeSidebar() : openSidebar()
//     );
//     sidebarOverlay.addEventListener("click", closeSidebar);
//     // insertImageBtn.addEventListener('click', () => imageUploadInput.click());
//     // imageUploadInput.addEventListener('change', async (e) => {
//     //     const file = e.target.files[0];
//     //     if (!file) return;
//     //     insertImageBtn.disabled = true;
//     //     insertImageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
//     //     try {
//     //         const filePath = `gallery/${Date.now()}_${file.name}`;
//     //         const storageRef = storage.ref(filePath);
//     //         const uploadTask = await storageRef.put(file);
//     //         const imageUrl = await uploadTask.ref.getDownloadURL();
//     //         await imagesRef.push({ imageUrl, timestamp: firebase.database.ServerValue.TIMESTAMP, fileName: file.name });
//     //     } catch (error) {
//     //         console.error("Image Upload Error:", error);
//     //         alert("Failed to upload image.");
//     //     } finally {
//     //         insertImageBtn.disabled = false;
//     //         insertImageBtn.innerHTML = '<i class="fas fa-upload"></i> Insert Image';
//     //         imageUploadInput.value = '';
//     //     }
//     // });
//     // function loadImages() {
//     //     imagesRef.off();
//     //     imagesRef.on('value', (snapshot) => {
//     //         imageGalleryContainer.innerHTML = '';
//     //         const images = snapshot.val();
//     //         if (images) {
//     //             Object.values(images).reverse().forEach(img => {
//     //                 const card = document.createElement('div');
//     //                 card.className = 'image-card';
//     //                 const date = new Date(img.timestamp).toLocaleString('en-IN');
//     //                 card.innerHTML = `<img src="${img.imageUrl}" alt="${img.fileName}" loading="lazy"><div class="image-card-info"><p>Uploaded: ${date}</p></div>`;
//     //                 imageGalleryContainer.appendChild(card);
//     //             });
//     //         } else {
//     //             imageGalleryContainer.innerHTML = '<p style="color: var(--text-secondary); padding: 1rem;">No images uploaded yet.</p>';
//     //         }
//     //     });
//     // }
//     materialForm.addEventListener("submit", async (e) => {
//       e.preventDefault();
//       const materialsRef = getMaterialsRef();
//       if (!materialsRef) {
//         alert("Please select a session first.");
//         return;
//       }
//       const name = document.getElementById("material-name").value.trim();
//       const quantity = parseFloat(
//         document.getElementById("material-quantity").value
//       );
//       const price = parseFloat(document.getElementById("material-price").value);
//       if (
//         !name ||
//         isNaN(quantity) ||
//         quantity <= 0 ||
//         isNaN(price) ||
//         price < 0
//       ) {
//         errorMessage.textContent = "Please fill all fields with valid data.";
//         return;
//       }
//       errorMessage.textContent = "";
//       try {
//         await materialsRef.push({
//           name,
//           quantity,
//           price,
//           dateTime: new Date().toLocaleString("en-IN"),
//         });
//         materialForm.reset();
//       } catch (error) {
//         errorMessage.textContent = "Failed to add material.";
//       }
//     });
//     function renderTable(materials) {
//       materialTable.innerHTML = "";
//       if (!materials) return;
//       Object.entries(materials).forEach(([key, material]) => {
//         const row = materialTable.insertRow();
//         const price = Number(material.price) || 0;
//         const quantity = Number(material.quantity) || 0;
//         const totalPrice = (quantity * price).toFixed(2);
//         row.innerHTML = `
//               <td data-label="Material"><span class="material-name-text">${
//                 material.name
//               }</span></td>
//               <td data-label="Quantity">${quantity}</td>
//               <td data-label="Price per unit">₹${price.toFixed(2)}</td>
//               <td data-label="Total Price">₹${totalPrice}</td>
//               <td data-label="Date & Time">${material.dateTime || ""}</td>
//               <td data-label="Actions"><button class="delete-btn" data-id="${key}"><i class='fas fa-trash'></i></button></td>
//           `;
//       });
//       addDeleteEventListeners();
//     }
//     function addDeleteEventListeners() {
//       materialTable.querySelectorAll(".delete-btn").forEach((button) => {
//         button.onclick = (e) => {
//           const id = e.currentTarget.dataset.id;
//           const materialsRef = getMaterialsRef();
//           if (id && materialsRef) {
//             materialsRef.child(id).remove();
//           }
//         };
//       });
//     }
//     function updateTotalCost(materials) {
//       let totalCost = 0;
//       if (materials) {
//         totalCost = Object.values(materials).reduce(
//           (sum, material) =>
//             sum + (material.quantity || 0) * (material.price || 0),
//           0
//         );
//       }
//       totalCostValue.textContent = `₹${totalCost.toFixed(2)}`;
//     }
//     function openRenameModal(id, currentName) {
//       const modal = document.getElementById("rename-modal");
//       const input = document.getElementById("rename-session-input");
//       input.value = currentName;
//       modal.style.display = "flex";
//       input.focus();

//       const saveNewName = () => {
//         const newName = input.value.trim();
//         if (!newName) {
//           alert("Session name cannot be empty.");
//           return;
//         }

//         if (isDuplicateSessionName(newName, id)) {
//           alert(
//             "A session with this name already exists. Please choose a different name."
//           );
//           return;
//         }

//         sessionsRef.child(id).update({ name: newName });
//         modal.style.display = "none";
//       };

//       document.getElementById("save-rename-btn").onclick = saveNewName;

//       document.addEventListener("keydown", (e) => {
//         if (e.key === "Escape") {
//           modal.style.display = "none";
//         }
//       });

//       input.onkeydown = (e) => {
//         if (e.key === "Enter") {
//           saveNewName();
//         }
//       };

//       document.getElementById("close-rename-modal").onclick = () =>
//         (modal.style.display = "none");
//     }
//     function loadSessionNotes() {
//       sessionNotes.value = "";
//       if (!currentSessionId) return;
//       sessionsRef
//         .child(currentSessionId)
//         .child("notes")
//         .once("value", (snapshot) => {
//           sessionNotes.value = snapshot.val() || "";
//         });
//     }
//     function debounce(func, delay) {
//       let timeout;
//       return (...args) => {
//         clearTimeout(timeout);
//         timeout = setTimeout(() => func.apply(this, args), delay);
//       };
//     }
//     const debouncedSaveNotes = debounce(() => {
//       if (!currentSessionId) return;
//       sessionsRef
//         .child(currentSessionId)
//         .child("notes")
//         .set(sessionNotes.value);
//     }, 500);
//     sessionNotes.addEventListener("input", debouncedSaveNotes);
//   }
// });
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
                  <td data-label="Actions"><button class="delete-btn" data-id="${key}"><i class='fas fa-trash'></i></button></td>
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
  
      function addDeleteEventListeners() {
          materialTable.querySelectorAll(".delete-btn").forEach((button) => {
              button.onclick = (e) => {
                  const id = e.currentTarget.dataset.id;
                  const materialsRef = getMaterialsRef();
                  if (id && materialsRef) { materialsRef.child(id).remove(); }
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