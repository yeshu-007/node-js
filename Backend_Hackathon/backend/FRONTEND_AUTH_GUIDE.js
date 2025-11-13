// FRONTEND AUTHENTICATION GUIDE
// ======================================================
// This guide shows how to use the backend auth endpoints
// from your JavaScript files (script.js, hist_script.js, admin.js)
// ======================================================

// ============================================
// 1. REGISTER NEW USER
// ============================================
// Call this when user submits registration form

async function registerUser(username, email, password) {
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
        role: 'user' 
      }),
    });

    const data = await response.json();

    if (data.success) {
      
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      console.log('✓ User registered:', data.data.user);
      return data.data;
    } else {
      console.error('✗ Registration failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('✗ Registration error:', error);
    return null;
  }
}

// ============================================
// 2. LOGIN USER
// ============================================
// Call this when user submits login form

async function loginUser(usernameOrEmail, password) {
  try {
    // Determine if input is email or username
    const isEmail = usernameOrEmail.includes('@');
    const loginData = isEmail
      ? { email: usernameOrEmail, password }
      : { username: usernameOrEmail, password };

    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (data.success) {
      // Store token in localStorage
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      console.log('✓ Login successful:', data.data.user);
      return data.data;
    } else {
      console.error('✗ Login failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('✗ Login error:', error);
    return null;
  }
}

// ============================================
// 3. LOGOUT USER
// ============================================
// Call this to clear authentication

function logoutUser() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  console.log('✓ Logged out successfully');
}

// ============================================
// 4. GET STORED TOKEN
// ============================================
// Use this before making authenticated requests

function getAuthToken() {
  return localStorage.getItem('authToken');
}

// ============================================
// 5. CHECK IF USER IS LOGGED IN
// ============================================

function isUserLoggedIn() {
  return !!localStorage.getItem('authToken');
}

// ============================================
// 6. GET CURRENT USER INFO
// ============================================

function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// ============================================
// 7. CHECK IF CURRENT USER IS ADMIN
// ============================================

function isAdmin() {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

// ============================================
// 8. MAKE AUTHENTICATED REQUEST (TEMPLATE)
// ============================================
// Use this pattern for all protected endpoints

async function makeAuthenticatedRequest(url, method = 'GET', body = null) {
  const token = getAuthToken();

  if (!token) {
    console.error('✗ No authentication token found. Please login.');
    return null;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // THIS IS HOW TO SEND TOKEN
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.status === 401) {
      // Token expired or invalid
      console.error('✗ Session expired. Please login again.');
      logoutUser();
      window.location.href = '/main/index.html'; // Redirect to login
      return null;
    }

    return data;
  } catch (error) {
    console.error('✗ Request error:', error);
    return null;
  }
}

// ============================================
// 9. EXAMPLE: FETCH REAL-TIME TELEMETRY DATA
// ============================================
// (From dashboard - script.js)

async function fetchRealtimeTelemetry() {
  const data = await makeAuthenticatedRequest('http://localhost:5000/api/telemetry/realtime');
  if (data?.success) {
    console.log('✓ Real-time data:', data.data);
    return data.data;
  }
  return null;
}

// ============================================
// 10. EXAMPLE: INGEST TELEMETRY DATA
// ============================================
// (From dashboard - script.js)

async function ingestTelemetryData(cellId, voltage, temperature, cycleCount) {
  const data = await makeAuthenticatedRequest(
    'http://localhost:5000/api/telemetry',
    'POST',
    {
      cellId,
      voltage,
      temperature,
      cycleCount,
    }
  );

  if (data?.success) {
    console.log('✓ Telemetry ingested');
    return data.data;
  }
  return null;
}

// ============================================
// 11. EXAMPLE: GET VOLTAGE HISTORY
// ============================================
// (From history - hist_script.js)

async function getVoltageHistory(cellId, days = 30) {
  const data = await makeAuthenticatedRequest(
    `http://localhost:5000/api/telemetry/${cellId}/voltage/history?days=${days}`
  );

  if (data?.success) {
    console.log('✓ Voltage history:', data.data);
    return data.data;
  }
  return null;
}

// ============================================
// 12. EXAMPLE: GET ALL CELLS (ADMIN)
// ============================================
// (From admin - admin.js)

async function getAllCells() {
  const data = await makeAuthenticatedRequest('http://localhost:5000/api/admin/cells');

  if (data?.success) {
    console.log('✓ All cells:', data.data);
    return data.data;
  }
  return null;
}

// ============================================
// 13. EXAMPLE: ADD NEW CELL (ADMIN)
// ============================================
// (From admin - admin.js)

async function addNewCell(cellId, status = 'Healthy', chargeCycles = 0) {
  const data = await makeAuthenticatedRequest(
    'http://localhost:5000/api/admin/cells',
    'POST',
    {
      cellId,
      status,
      chargeCycles,
    }
  );

  if (data?.success) {
    console.log('✓ Cell added:', data.data);
    return data.data;
  }
  return null;
}

// ============================================
// 14. EXAMPLE: DELETE CELL (ADMIN)
// ============================================
// (From admin - admin.js)

async function deleteCell(cellId) {
  const data = await makeAuthenticatedRequest(
    `http://localhost:5000/api/admin/cells/${cellId}`,
    'DELETE'
  );

  if (data?.success) {
    console.log('✓ Cell deleted');
    return true;
  }
  return false;
}

// ============================================
// 15. EXAMPLE: GET ALL ANOMALIES (ADMIN)
// ============================================
// (From admin - admin.js)

async function getAllAnomalies(severity = '', resolved = '', limit = 50) {
  let url = 'http://localhost:5000/api/admin/anomalies?';
  if (severity) url += `severity=${severity}&`;
  if (resolved) url += `resolved=${resolved}&`;
  url += `limit=${limit}`;

  const data = await makeAuthenticatedRequest(url);

  if (data?.success) {
    console.log('✓ Anomalies:', data.data);
    return data.data;
  }
  return null;
}

// ============================================
// INTEGRATION CHECKLIST FOR FRONTEND
// ============================================
/*
1. ✓ Add login/register form to index.html
2. ✓ Call loginUser() when user submits login
3. ✓ Call registerUser() when user submits registration
4. ✓ Check isUserLoggedIn() on page load to redirect if not logged in
5. ✓ Use makeAuthenticatedRequest() for all protected API calls
6. ✓ Include token in Authorization header: `Bearer ${token}`
7. ✓ Call logoutUser() on logout button click
8. ✓ Redirect to login if token expires (401 response)
9. ✓ Check isAdmin() before showing admin panel
10. ✓ Store token & user in localStorage after login
*/

// ============================================
// EXAMPLE: ON PAGE LOAD (ADD TO ALL PAGES)
// ============================================
/*
window.addEventListener('DOMContentLoaded', () => {
  if (!isUserLoggedIn()) {
    // Redirect to login/registration page
    window.location.href = '/main/index.html?redirect=login';
  } else {
    const user = getCurrentUser();
    console.log('✓ Logged in as:', user.username);
    
    // Load page-specific data
    if (isAdmin()) {
      // Load admin-only content
    }
  }
});
*/

// ============================================
// EXAMPLE: LOGOUT BUTTON HANDLER
// ============================================
/*
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  logoutUser();
  window.location.href = '/main/index.html?redirect=login';
});
*/
