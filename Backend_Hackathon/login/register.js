/* ====================================
   REGISTRATION PAGE - JAVASCRIPT
   ===================================== */

const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '../main/index.html';
    }
});

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');
    const registerBtn = document.querySelector('.register-btn') || document.querySelector('.login-btn') || document.querySelector('button[type="submit"]');

    // Clear messages
    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');

    // Validation
    if (!username || !email || !password) {
        showError('Please fill in all fields', errorMsg);
        return;
    }

    if (username.length < 3) {
        showError('Username must be at least 3 characters', errorMsg);
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters', errorMsg);
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address', errorMsg);
        return;
    }

    try {
        registerBtn.disabled = true;
        registerBtn.classList.add('loading');
        registerBtn.textContent = 'Creating account...';

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

        const receivedToken = data?.data?.token || data?.token || null;
        const receivedUser = data?.data?.user || data?.user || null;
        const successFlag = typeof data?.success === 'undefined' ? null : data.success;
        const considerSuccess = response.ok && (successFlag === true || successFlag === null || receivedToken);

        if (considerSuccess) {
            console.log('Registration successful response:', data);
            showSuccess('Registration successful! Redirecting to login...', successMsg);
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1500);
        } else {
            const message = data?.message || data?.error || 'Registration failed. Please try again.';
            console.error('Registration failed:', message, data);
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
