const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'http://127.0.0.1:5500/main/index.html';
    }
});

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');
    const registerBtn = document.querySelector('.register-btn');

    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');

    if (!username || !email || !password || !confirmPassword) {
        showError('Please fill in all fields', errorMsg);
        return;
    }

    if (username.length < 3) {
        showError('Username must be at least 3 characters', errorMsg);
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address', errorMsg);
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters', errorMsg);
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match', errorMsg);
        return;
    }

    try {
        registerBtn.disabled = true;
        registerBtn.classList.add('loading');
        registerBtn.textContent = 'Registering...';

        console.log('Attempting registration with:', { username, email, apiBase: API_BASE });

        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok && data.success) {
            showSuccess('Registration successful! Redirecting to login...', successMsg);
            setTimeout(() => {
                window.location.href = 'http://127.0.0.1:5500/login/login.html';
            }, 2000);
        } else {
            const message = data.message || 'Registration failed. Please try again.';
            console.error('Registration failed:', message);
            showError(message, errorMsg);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Connection error. Please ensure backend is running on http://localhost:5000', errorMsg);
    } finally {
        registerBtn.disabled = false;
        registerBtn.classList.remove('loading');
        registerBtn.textContent = 'Register';
    }
}

function showError(message, element) {
    element.textContent = message;
    element.classList.remove('hidden');
}

function showSuccess(message, element) {
    element.textContent = message;
    element.classList.remove('hidden');
}
