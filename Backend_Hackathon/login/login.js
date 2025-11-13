/* ====================================
   LOGIN PAGE - JAVASCRIPT
   ===================================== */

const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '../main/index.html';
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const usernameOrEmail = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');
    const loginBtn = document.querySelector('.login-btn');

    // Clear messages
    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');

    if (!usernameOrEmail || !password) {
        showError('Please fill in all fields', errorMsg);
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        loginBtn.textContent = 'Logging in...';

        // Determine if input is email or username
        const isEmail = usernameOrEmail.includes('@');
        const bodyData = {
            ...(isEmail ? { email: usernameOrEmail } : { username: usernameOrEmail }),
            password: password
        };

        console.log('Attempting login with:', { ...bodyData, apiBase: API_BASE });

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        const receivedToken = data?.data?.token || data?.token || data?.accessToken || null;
        const receivedUser = data?.data?.user || data?.user || null;
        const successFlag = typeof data?.success === 'undefined' ? null : data.success;

        const hasToken = Boolean(receivedToken);
        const considerSuccess = response.ok && (hasToken || successFlag === true || successFlag === null);

        if (considerSuccess) {
            if (receivedToken) {
                localStorage.setItem('token', receivedToken);
                localStorage.setItem('authToken', receivedToken);
            }

            if (receivedUser) {
                localStorage.setItem('user', JSON.stringify(receivedUser));
                localStorage.setItem('role', receivedUser.role || 'user');
            }

            console.log('Login successful. User role:', receivedUser?.role || localStorage.getItem('role'));

            showSuccess('Login successful! Redirecting...', successMsg);

            const userRole = receivedUser?.role || localStorage.getItem('role') || 'user';
            const redirectUrl = userRole === 'admin'
                ? '../admin/admin.html'
                : '../main/index.html';

            console.log('Redirecting to:', redirectUrl);

            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
        } else {
            const message = data?.message || data?.error || 'Login failed. Please check your credentials.';
            console.error('Login failed:', message, data);
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
