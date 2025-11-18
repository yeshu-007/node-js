/* ========================================
   FUTURISTIC BATTERY HEALTH MONITOR JS
   Real-time updates & Chart.js integration
   ======================================== */

// ============ LOGIN/LOGOUT MANAGEMENT ============
function initAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminNav = document.getElementById('adminNav');
    const token = localStorage.getItem('token');

    if (token) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '../login/login.html';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            window.location.href = '../login/login.html';
        });
    }

    if (adminNav) {
        adminNav.addEventListener('click', () => {
            if (!localStorage.getItem('token')) {
                window.location.href = '../login/login.html';
            } else {
                window.location.href = '../admin/admin.html';
            }
        });
    }
}

// ============ JWT FETCH WRAPPER ============
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function authenticatedFetch(url, options = {}) {
    const headers = getAuthHeaders();
    const response = await fetch(url, {
        ...options,
        headers: { ...options.headers, ...headers }
    });
    
    // Check if token expired (401)
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        window.location.href = '../login/login.html';
        throw new Error('Session expired. Please login again.');
    }
    
    return response;
}

// ============ CONFIGURATION ============
const API_CONFIG = {
    baseURL: 'http://localhost:3000/api',
    endpoints: {
        login: '/auth/login',
        telemetry: '/telemetry',
        realtime: '/telemetry/realtime',
        historical: '/telemetry/historical',
        alerts: '/alerts',
        stats: '/telemetry/stats'
    },
    updateInterval: 3000 // 3 seconds
};

// ============ GLOBAL STATE ============
let voltageChart = null;
let temperatureChart = null;
let updateInterval = null;
let authToken = localStorage.getItem('authToken') || null;

// ============ BATTERY DATA ============
let batteryData = [
    { cellId: 1, voltage: 3.87, temp: 27.9, status: 'healthy', lastUpdated: '2 minutes ago' },
    { cellId: 2, voltage: 3.74, temp: 34.2, status: 'warning', lastUpdated: '5 minutes ago' },
    { cellId: 3, voltage: 3.58, temp: 31.8, status: 'critical', lastUpdated: '10 minutes ago' },
    { cellId: 4, voltage: 3.90, temp: 26.7, status: 'healthy', lastUpdated: '3 minutes ago' },
    { cellId: 5, voltage: 3.68, temp: 25.9, status: 'healthy', lastUpdated: '7 minutes ago' }
];

// ============ FETCH DASHBOARD DATA FROM BACKEND ============
async function fetchDashboardData() {
    try {
        const response = await authenticatedFetch('/api/admin/cells');
        if (!response.ok) throw new Error('Failed to fetch cells');
        
        const data = await response.json();
        const cells = Array.isArray(data) ? data : (data.data || []);
        
        // Map backend cell data to dashboard format
        batteryData = cells.map(cell => ({
            cellId: cell.cellId,
            voltage: cell.avgVoltage || 3.85,
            temp: cell.avgTemperature || 28.4,
            status: cell.status.toLowerCase(),
            lastUpdated: 'just now'
        }));
        
        renderDashboard();
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep existing data on error
    }
}

// ============ RENDER DASHBOARD ============
function renderDashboard() {
    populateBatteryTable();
    updateChartData();
}

// ============ SYNC WITH ADMIN CHANGES ============
let lastDataUpdateTimestamp = localStorage.getItem('dataUpdateTimestamp');
window.addEventListener('storage', (e) => {
    if (e.key === 'dataUpdateTimestamp' && e.newValue !== lastDataUpdateTimestamp) {
        lastDataUpdateTimestamp = e.newValue;
        fetchDashboardData();
    }
});

// ============ CHART CONFIGURATION ============
const chartConfig = {
    voltage: {
        label: 'Voltage (V)',
        borderColor: 'rgba(34, 211, 238, 1)',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        pointBackgroundColor: 'rgba(34, 211, 238, 1)',
        min: 3.3,
        max: 4.2
    },
    temperature: {
        label: 'Temperature (°C)',
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        pointBackgroundColor: 'rgba(245, 158, 11, 1)',
        min: 22,
        max: 35
    }
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    initCharts();
    populateBatteryTable();
    startRealtimeUpdates();
    setupEventListeners();
});

// ============ CHART INITIALIZATION ============
function initCharts() {
    const voltageCtx = document.getElementById('voltageChart').getContext('2d');
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');

    // Generate initial data
    const initialData = generateChartData(50);

    // Voltage Chart
    voltageChart = new Chart(voltageCtx, {
        type: 'line',
        data: {
            labels: initialData.labels,
            datasets: [{
                label: chartConfig.voltage.label,
                data: initialData.voltage,
                borderColor: chartConfig.voltage.borderColor,
                backgroundColor: chartConfig.voltage.backgroundColor,
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true
            }]
        },
        options: getChartOptions(chartConfig.voltage.min, chartConfig.voltage.max)
    });

    // Temperature Chart
    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: initialData.labels,
            datasets: [{
                label: chartConfig.temperature.label,
                data: initialData.temperature,
                borderColor: chartConfig.temperature.borderColor,
                backgroundColor: chartConfig.temperature.backgroundColor,
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true
            }]
        },
        options: getChartOptions(chartConfig.temperature.min, chartConfig.temperature.max)
    });
}

// ============ CHART OPTIONS ============
function getChartOptions(min, max) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(10, 14, 39, 0.9)',
                titleColor: '#ffffff',
                bodyColor: '#a0aec0',
                borderColor: 'rgba(96, 165, 250, 0.3)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    title: (context) => `Time: ${context[0].label}`,
                    label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#718096',
                    font: {
                        size: 11
                    },
                    maxTicksLimit: 8
                }
            },
            y: {
                min: min,
                max: max,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#718096',
                    font: {
                        size: 11
                    }
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };
}

// ============ GENERATE CHART DATA ============
function generateChartData(points) {
    const labels = [];
    const voltage = [];
    const temperature = [];
    const now = new Date();

    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now - i * 60000); // 1 minute intervals
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        
        // Generate realistic voltage data (3.65 - 3.95V)
        const voltageBase = 3.75;
        const voltageVariation = Math.sin(i / 5) * 0.1 + Math.random() * 0.05;
        voltage.push(voltageBase + voltageVariation);
        
        // Generate realistic temperature data (25 - 32°C)
        const tempBase = 28;
        const tempVariation = Math.sin(i / 8) * 3 + Math.random() * 2;
        temperature.push(tempBase + tempVariation);
    }

    return { labels, voltage, temperature };
}

// ============ UPDATE CHARTS ============
// ============ UPDATE CHART DATA WITH BATTERY INFO ============
function updateChartData() {
    if (batteryData.length === 0) return;
    
    // Use average values from all cells for the chart
    const avgVoltage = batteryData.reduce((sum, cell) => sum + cell.voltage, 0) / batteryData.length;
    const avgTemp = batteryData.reduce((sum, cell) => sum + cell.temp, 0) / batteryData.length;
    
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Update voltage chart
    voltageChart.data.labels.push(timeLabel);
    voltageChart.data.datasets[0].data.push(avgVoltage);
    
    // Update temperature chart
    temperatureChart.data.labels.push(timeLabel);
    temperatureChart.data.datasets[0].data.push(avgTemp);

    // Keep only last 20 data points
    if (voltageChart.data.labels.length > 20) {
        voltageChart.data.labels.shift();
        voltageChart.data.datasets[0].data.shift();
        temperatureChart.data.labels.shift();
        temperatureChart.data.datasets[0].data.shift();
    }

    voltageChart.update('none');
    temperatureChart.update('none');
}

function updateCharts() {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Generate new data point
    const newVoltage = 3.75 + Math.sin(Date.now() / 5000) * 0.1 + (Math.random() - 0.5) * 0.05;
    const newTemp = 28 + Math.sin(Date.now() / 8000) * 3 + (Math.random() - 0.5) * 2;

    // Update voltage chart
    voltageChart.data.labels.push(timeLabel);
    voltageChart.data.datasets[0].data.push(newVoltage);
    
    // Keep only last 50 points
    if (voltageChart.data.labels.length > 50) {
        voltageChart.data.labels.shift();
        voltageChart.data.datasets[0].data.shift();
    }
    voltageChart.update('none');

    // Update temperature chart
    temperatureChart.data.labels.push(timeLabel);
    temperatureChart.data.datasets[0].data.push(newTemp);
    
    if (temperatureChart.data.labels.length > 50) {
        temperatureChart.data.labels.shift();
        temperatureChart.data.datasets[0].data.shift();
    }
    temperatureChart.update('none');

    // Update metrics
    updateMetrics(newVoltage, newTemp);
}

// ============ UPDATE METRICS ============
function updateMetrics(voltage, temp) {
    const avgVoltageEl = document.getElementById('avgVoltage');
    const avgTempEl = document.getElementById('avgTemp');
    
    if (avgVoltageEl) {
        avgVoltageEl.textContent = `${voltage.toFixed(2)} V`;
    }
    
    if (avgTempEl) {
        avgTempEl.textContent = `${temp.toFixed(1)} °C`;
    }
}

// ============ POPULATE BATTERY TABLE ============
function populateBatteryTable() {
    const tbody = document.getElementById('batteryTableBody');
    tbody.innerHTML = '';

    batteryData.forEach(cell => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${cell.cellId}</td>
            <td>${cell.voltage.toFixed(2)} V</td>
            <td>${cell.temp.toFixed(1)} °C</td>
            <td><span class="status-badge status-${cell.status}">${capitalize(cell.status)}</span></td>
            <td>${cell.lastUpdated}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============ UPDATE BATTERY TABLE ============
function updateBatteryTable() {
    batteryData.forEach(cell => {
        // Add small random variations
        cell.voltage += (Math.random() - 0.5) * 0.02;
        cell.temp += (Math.random() - 0.5) * 0.5;
        
        // Ensure voltage stays in realistic range
        cell.voltage = Math.max(3.5, Math.min(4.0, cell.voltage));
        cell.temp = Math.max(20, Math.min(40, cell.temp));
        
        // Update status based on voltage and temp
        if (cell.voltage < 3.6 || cell.temp > 33) {
            cell.status = 'critical';
        } else if (cell.voltage < 3.7 || cell.temp > 30) {
            cell.status = 'warning';
        } else {
            cell.status = 'healthy';
        }
    });
    
    populateBatteryTable();
}

// ============ REAL-TIME UPDATES ============
function startRealtimeUpdates() {
    updateInterval = setInterval(() => {
        updateCharts();
        updateBatteryTable();
    }, API_CONFIG.updateInterval);
}

function stopRealtimeUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// ============ AUTHENTICATION ============
async function login(username, password) {
    try {
        // Replace with actual API call
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.login}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) throw new Error('Login failed');

        const data = await response.json();
        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        return { success: true, token: authToken };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

function handleLogout() {
    authToken = null;
    localStorage.removeItem('authToken');
    stopRealtimeUpdates();
    window.location.href = '/login.html'; // Redirect to login page
}

// ============ API FUNCTIONS ============

/**
 * Fetch real-time telemetry data
 * @returns {Promise<Object>} Real-time battery data
 */
async function fetchRealtimeData() {
    if (!authToken) return null;
    
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.realtime}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch realtime data');
        
        return await response.json();
    } catch (error) {
        console.error('Realtime data fetch error:', error);
        return null;
    }
}

/**
 * Fetch historical telemetry data
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Promise<Object>} Historical battery data
 */
async function fetchHistoricalData(startDate, endDate) {
    if (!authToken) return null;
    
    try {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.historical}?start=${startDate}&end=${endDate}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch historical data');
        
        return await response.json();
    } catch (error) {
        console.error('Historical data fetch error:', error);
        return null;
    }
}

/**
 * Fetch active alerts and anomalies
 * @returns {Promise<Array>} Array of alerts
 */
async function fetchAlerts() {
    if (!authToken) return null;
    
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.alerts}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch alerts');
        
        return await response.json();
    } catch (error) {
        console.error('Alerts fetch error:', error);
        return null;
    }
}

/**
 * Fetch aggregated statistics
 * @returns {Promise<Object>} Statistical data
 */
async function fetchStats() {
    if (!authToken) return null;
    
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.stats}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');
        
        return await response.json();
    } catch (error) {
        console.error('Stats fetch error:', error);
        return null;
    }
}

/**
 * Send telemetry data to backend
 * @param {Object} telemetryData - Battery telemetry data
 * @returns {Promise<Object>} Response from server
 */
async function sendTelemetryData(telemetryData) {
    if (!authToken) return null;
    
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.telemetry}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(telemetryData)
        });

        if (!response.ok) throw new Error('Failed to send telemetry data');
        
        return await response.json();
    } catch (error) {
        console.error('Telemetry send error:', error);
        return null;
    }
}

// ============ UTILITY FUNCTIONS ============

/**
 * Capitalize first letter of string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format timestamp to relative time
 * @param {Date} date - Date object
 * @returns {string} Relative time string
 */
function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 second ago';
    if (minutes < 60) return `${minutes} seconds ago`;
}

/**
 * Generate random battery cell data
 * @returns {Object} Random cell data
 */
function generateRandomCellData() {
    return {
        voltage: (3.5 + Math.random() * 0.5).toFixed(2),
        temperature: (25 + Math.random() * 10).toFixed(1),
        chargeCycles: Math.floor(100 + Math.random() * 200),
        timestamp: new Date().toISOString()
    };
}

// ============ EXPORT FOR BACKEND INTEGRATION ============
// These functions can be called from your backend integration
window.batteryMonitor = {
    fetchRealtimeData,
    fetchHistoricalData,
    fetchAlerts,
    fetchStats,
    sendTelemetryData,
    login,
    handleLogout
};