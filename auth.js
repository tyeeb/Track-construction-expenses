document.addEventListener('DOMContentLoaded', () => {
    firebase.initializeApp(firebaseConfig);

    const auth = firebase.auth();

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showLoginBtn = document.getElementById('show-login-btn');
    const showSignupBtn = document.getElementById('show-signup-btn');
    const authError = document.getElementById('auth-error');

    // Toggle between Sign In and Sign Up forms
    showLoginBtn.addEventListener('click', () => {
        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';
        showLoginBtn.classList.add('active');
        showSignupBtn.classList.remove('active');
        authError.textContent = '';
    });

    showSignupBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
        showLoginBtn.classList.remove('active');
        showSignupBtn.classList.add('active');
        authError.textContent = '';
    });

    // Handle Sign Up
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Signed up successfully, redirect to the app
                window.location.href = 'app.html';
            })
            .catch(error => {
                authError.textContent = error.message;
            });
    });

    // Handle Sign In
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Signed in successfully, redirect to the app
                window.location.href = 'app.html';
            })
            .catch(error => {
                authError.textContent = error.message;
            });
    });
});