const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'http://127.0.0.1:5500/main/index.html';
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');
    const loginBtn = document.querySelector('.login-btn');

    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');

    if (!username || !password) {
        showError('Please fill in all fields', errorMsg);
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        loginBtn.textContent = 'Logging in...';

        console.log('Attempting login with:', { username, apiBase: API_BASE });

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok && data.success) {
            localStorage.setItem('token', data.data.token);
            if (data.data.user) {
                localStorage.setItem('user', JSON.stringify(data.data.user));
                localStorage.setItem('role', data.data.user.role || 'user');
            }

            console.log('Login successful. User role:', data.data.user?.role);

            showSuccess('Login successful! Redirecting...', successMsg);
            
            const userRole = data.data.user?.role || 'user';
            const redirectUrl = userRole === 'admin' 
                ? 'http://127.0.0.1:5500/admin/admin.html'
                : 'http://127.0.0.1:5500/main/index.html';
            
            console.log('Redirecting to:', redirectUrl);
            
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
        } else {
            const message = data.message || 'Login failed. Please check your credentials.';
            console.error('Login failed:', message);
            showError(message, errorMsg);
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Connection error. Please ensure backend is running on http://localhost:5000', errorMsg);
    } finally {
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
        loginBtn.textContent = 'Login';
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
