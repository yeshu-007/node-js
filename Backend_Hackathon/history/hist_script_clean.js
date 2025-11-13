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
            window.location.href = 'http://127.0.0.1:5500/login/login.html';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            window.location.href = 'http://127.0.0.1:5500/login/login.html';
        });
    }

    if (adminNav) {
        adminNav.addEventListener('click', () => {
            if (!localStorage.getItem('token')) {
                window.location.href = 'http://127.0.0.1:5500/login/login.html';
            } else {
                window.location.href = 'http://127.0.0.1:5500/admin/admin.html';
            }
        });
    }
}

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
    
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        window.location.href = 'http://127.0.0.1:5500/login/login.html';
        throw new Error('Session expired. Please login again.');
    }
    
    return response;
}

const API = {
    cellList: '/api/cells',
    historicalVoltage: '/api/cells/:id/voltage/history',
    historicalTemperature: '/api/cells/:id/temperature/history',
    cellInfo: '/api/cells/:id/info'
};

let currentCellId = 1;
let voltageChart = null;
let temperatureChart = null;

const dummyCellData = {
    1: {
        id: 1,
        avgVoltage: 3.82,
        avgTemp: 27.5,
        chargeCycles: 123,
        status: 'healthy',
        lastUpdated: '2 minutes ago'
    },
    2: {
        id: 2,
        avgVoltage: 3.75,
        avgTemp: 29.8,
        chargeCycles: 145,
        status: 'warning',
        lastUpdated: '5 minutes ago'
    },
    3: {
        id: 3,
        avgVoltage: 3.58,
        avgTemp: 32.1,
        chargeCycles: 178,
        status: 'critical',
        lastUpdated: '1 minute ago'
    },
    4: {
        id: 4,
        avgVoltage: 3.88,
        avgTemp: 26.3,
        chargeCycles: 98,
        status: 'healthy',
        lastUpdated: '3 minutes ago'
    },
    5: {
        id: 5,
        avgVoltage: 3.79,
        avgTemp: 28.2,
        chargeCycles: 134,
        status: 'healthy',
        lastUpdated: '4 minutes ago'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    initializeCharts();
    loadCellData(currentCellId);
    setupEventListeners();
});

function setupEventListeners() {
    const cellSelector = document.getElementById('cellSelector');
    cellSelector.addEventListener('change', (e) => {
        currentCellId = parseInt(e.target.value);
        loadCellData(currentCellId);
    });
}

function initializeCharts() {
    const voltageCtx = document.getElementById('voltageChart').getContext('2d');
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');

    const labels = generateDateLabels(30);

    voltageChart = new Chart(voltageCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Voltage (V)',
                data: generateVoltageData(30, currentCellId),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#06b6d4',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: getChartOptions('Voltage (V)', 3.0, 4.0)
    });

    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: generateTemperatureData(30, currentCellId),
                borderColor: '#fb923c',
                backgroundColor: 'rgba(251, 146, 60, 0.1)',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#fb923c',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: getChartOptions('Temperature (°C)', 16, 36)
    });
}

function getChartOptions(label, minY, maxY) {
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
                backgroundColor: 'rgba(10, 25, 41, 0.95)',
                titleColor: '#e0e7ff',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(6, 182, 212, 0.5)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: (context) => `${label}: ${context.parsed.y.toFixed(2)}`
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(56, 189, 248, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#64748b',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                min: minY,
                max: maxY,
                grid: {
                    color: 'rgba(56, 189, 248, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#64748b',
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
        },
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        }
    };
}

function generateDateLabels(days) {
    const labels = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        if (i === days - 1) {
            labels.push('30 ago');
        } else if (i === Math.floor(days * 2/3)) {
            labels.push('20');
        } else if (i === Math.floor(days / 3)) {
            labels.push('10 ago');
        } else if (i === 0) {
            labels.push('Today');
        } else {
            labels.push('');
        }
    }
    
    return labels;
}

function generateVoltageData(days, cellId) {
    const data = [];
    const baseVoltage = dummyCellData[cellId].avgVoltage;
    
    for (let i = 0; i < days; i++) {
        const wave1 = Math.sin(i / 3) * 0.08;
        const wave2 = Math.sin(i / 7) * 0.05;
        const noise = (Math.random() - 0.5) * 0.03;
        const voltage = baseVoltage + wave1 + wave2 + noise;
        data.push(Math.max(3.2, Math.min(3.8, voltage)));
    }
    
    return data;
}

function generateTemperatureData(days, cellId) {
    const data = [];
    const baseTemp = dummyCellData[cellId].avgTemp;
    
    for (let i = 0; i < days; i++) {
        const wave1 = Math.sin(i / 4) * 3;
        const wave2 = Math.cos(i / 8) * 2;
        const noise = (Math.random() - 0.5) * 1.5;
        const temp = baseTemp + wave1 + wave2 + noise;
        data.push(Math.max(20, Math.min(32, temp)));
    }
    
    return data;
}

function updateCharts(cellId) {
    const labels = generateDateLabels(30);
    const voltageData = generateVoltageData(30, cellId);
    const tempData = generateTemperatureData(30, cellId);

    voltageChart.data.labels = labels;
    voltageChart.data.datasets[0].data = voltageData;
    voltageChart.update();

    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = tempData;
    temperatureChart.update();
}

function updateTable(cellData) {
    const infoGrid = document.getElementById('cellInfoGrid');
    infoGrid.innerHTML = '';

    const items = [
        { label: 'Cell ID', value: cellData.id },
        { label: 'Average Voltage', value: `${cellData.avgVoltage.toFixed(2)} V` },
        { label: 'Average Temperature', value: `${cellData.avgTemp.toFixed(1)} °C` },
        { label: 'Charge Cycles', value: cellData.chargeCycles },
        { 
            label: 'Status', 
            value: `<span class="status-badge status-${cellData.status}">${capitalize(cellData.status)}</span>` 
        },
        { label: 'Last Updated', value: cellData.lastUpdated }
    ];

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'info-item';
        itemDiv.innerHTML = `
            <div class="info-label">${item.label}</div>
            <div class="info-value">${item.value}</div>
        `;
        infoGrid.appendChild(itemDiv);
    });
}

function loadCellData(cellId) {
    const cellData = fetchCellInfo(cellId);
    updateCharts(cellId);
    updateTable(cellData);
}

function fetchCellInfo(cellId) {
    console.log(`[API] Fetching cell info for Cell ${cellId}`);
    return dummyCellData[cellId];
}

function fetchVoltageHistory(cellId) {
    console.log(`[API] Fetching voltage history for Cell ${cellId}`);
    return generateVoltageData(30, cellId);
}

function fetchTemperatureHistory(cellId) {
    console.log(`[API] Fetching temperature history for Cell ${cellId}`);
    return generateTemperatureData(30, cellId);
}

function fetchCellList() {
    console.log('[API] Fetching cell list');
    return Object.values(dummyCellData);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
}
