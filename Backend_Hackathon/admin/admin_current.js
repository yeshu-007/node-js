// ============ ADMIN PAGE PROTECTION ============
if (!localStorage.getItem('token')) {
    window.location.href = '../login/login.html';
}

// Check if user is admin
const userRole = localStorage.getItem('role');
if (userRole !== 'admin') {
    window.location.href = '../main/index.html';
}

// ============ INITIALIZATION FLAG ============
let adminPageReady = false;

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
        adminNav.style.pointerEvents = 'none';
        adminNav.style.opacity = '0.6';
    }
}

// ============ API CONFIGURATION ============
const API = {
    listCells: "/api/admin/cells",
    createCell: "/api/admin/create",
    updateCell: "/api/admin/update/:id",
    deleteCell: "/api/admin/delete/:id",
    listAnomalies: "/api/admin/anomalies",
    anomalyDetails: "/api/admin/anomalies/:id",
    markAnomalyReviewed: "/api/admin/anomalies/:id"
};

// ============ GLOBAL STATE ============
let cellsData = [];
let anomaliesData = [];
let selectedCells = new Set();
let currentCellPage = 1;
let currentAnomalyPage = 1;
let currentAnomalyId = null;
let editingCellId = null;
const itemsPerPage = 10;

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

// Wrapper function to handle fetch with JWT and error handling
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

// ============ UI UTILITIES ============
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}

// ============ FETCH DATA FUNCTION ============
async function fetchData() {
    try {
        const response = await authenticatedFetch(API.listCells);
        
        if (!response.ok) throw new Error("Failed to fetch cells");
        
        const data = await response.json();
        // Handle both direct array and wrapped response
        cellsData = Array.isArray(data) ? data : (data.data || []);
        renderAdminTable();
        populateCellFilter();
    } catch (error) {
        console.error("Error fetching cells:", error);
        showToast("Failed to load cells", "error");
        cellsData = generateMockCells();
        renderAdminTable();
        populateCellFilter();
    }
}

function generateMockCells() {
    return [
        { id: 1, status: "Healthy", chargeCycles: 245, avgVoltage: 3.72, avgTemp: 28.5 },
        { id: 2, status: "Warning", chargeCycles: 487, avgVoltage: 3.64, avgTemp: 32.1 },
        { id: 3, status: "Healthy", chargeCycles: 156, avgVoltage: 3.75, avgTemp: 27.8 },
        { id: 4, status: "Critical", chargeCycles: 892, avgVoltage: 3.21, avgTemp: 38.4 },
        { id: 5, status: "Healthy", chargeCycles: 312, avgVoltage: 3.71, avgTemp: 29.2 }
    ];
}

function renderCellsTable() {
    const tbody = document.getElementById("cellsTableBody");
    const searchTerm = document.getElementById("cellSearchInput").value.toLowerCase();
    
    const filteredCells = cellsData.filter(cell => 
        cell.id.toString().includes(searchTerm) || 
        cell.status.toLowerCase().includes(searchTerm)
    );
    
    const startIdx = (currentCellPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedCells = filteredCells.slice(startIdx, endIdx);
    
    if (paginatedCells.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No cells found</td></tr>';
        return;
    }
    
    tbody.innerHTML = paginatedCells.map(cell => `
        <tr>
            <td><input type="checkbox" class="cell-checkbox" data-cell-id="${cell.id}" ${selectedCells.has(cell.id) ? 'checked' : ''}></td>
            <td>${cell.id}</td>
            <td><span class="status-badge status-${cell.status.toLowerCase()}">${cell.status}</span></td>
            <td>${cell.chargeCycles}</td>
            <td>${cell.avgVoltage ? cell.avgVoltage.toFixed(2) : 'N/A'}</td>
            <td>${cell.avgTemp ? cell.avgTemp.toFixed(1) : 'N/A'}</td>
            <td>
                <button class="btn btn-secondary action-btn edit-cell-btn" data-cell-id="${cell.id}">Edit</button>
                <button class="btn btn-danger action-btn delete-cell-btn" data-cell-id="${cell.id}">Delete</button>
            </td>
        </tr>
    `).join('');
    
    updateCellPagination(filteredCells.length);
    attachCellEventListeners();
}

function updateCellPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById("cellsPageInfo").textContent = `Page ${currentCellPage} of ${totalPages}`;
    document.getElementById("prevCellsPage").disabled = currentCellPage === 1;
    document.getElementById("nextCellsPage").disabled = currentCellPage === totalPages || totalPages === 0;
}

function attachCellEventListeners() {
    document.querySelectorAll(".cell-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", (e) => {
            const cellId = parseInt(e.target.dataset.cellId);
            if (e.target.checked) {
                selectedCells.add(cellId);
            } else {
                selectedCells.delete(cellId);
            }
            updateDeleteSelectedButton();
        });
    });
    
    document.querySelectorAll(".delete-cell-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const cellId = parseInt(e.target.dataset.cellId);
            deleteCell(cellId);
        });
    });
    
    document.querySelectorAll(".edit-cell-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const cellId = parseInt(e.target.dataset.cellId);
            showToast("Edit functionality coming soon", "success");
        });
    });
}

function updateDeleteSelectedButton() {
    const btn = document.getElementById("deleteSelectedBtn");
    btn.disabled = selectedCells.size === 0;
}

async function addCell(cellData) {
    try {
        const response = await authenticatedFetch(API.addCell, {
            method: "POST",
            body: JSON.stringify(cellData)
        });
        
        if (!response.ok) throw new Error("Failed to add cell");
        
        const newCell = await response.json();
        cellsData.push(newCell);
        renderCellsTable();
        showToast("Cell added successfully");
        closeModal("addCellModal");
    } catch (error) {
        console.error("Error adding cell:", error);
        showToast("Failed to add cell", "error");
        const mockCell = {
            id: cellData.cellId,
            status: cellData.status,
            chargeCycles: cellData.chargeCycles,
            avgVoltage: 3.70,
            avgTemp: 28.0
        };
        cellsData.push(mockCell);
        renderCellsTable();
        closeModal("addCellModal");
        showToast("Cell added (mock data)", "success");
    }
}

async function deleteCell(cellId) {
    if (!confirm(`Are you sure you want to delete cell ${cellId}?`)) return;
    
    try {
        const url = API.deleteCell.replace(":id", cellId);
        const response = await authenticatedFetch(url, {
            method: "DELETE"
        });
        
        if (!response.ok) throw new Error("Failed to delete cell");
        
        cellsData = cellsData.filter(cell => cell.id !== cellId);
        selectedCells.delete(cellId);
        renderCellsTable();
        updateDeleteSelectedButton();
        showToast("Cell deleted successfully", "success");
    } catch (error) {
        console.error("Error deleting cell:", error);
        cellsData = cellsData.filter(cell => cell.id !== cellId);
        selectedCells.delete(cellId);
        renderCellsTable();
        updateDeleteSelectedButton();
        showToast("Cell deleted (mock)", "success");
    }
}

async function deleteSelectedCells() {
    if (selectedCells.size === 0) return;
    if (!confirm(`Delete ${selectedCells.size} selected cell(s)?`)) return;
    
    const deletePromises = Array.from(selectedCells).map(cellId => {
        const url = API.deleteCell.replace(":id", cellId);
        return authenticatedFetch(url, {
            method: "DELETE"
        }).catch(err => console.error(`Failed to delete cell ${cellId}:`, err));
    });
    
    try {
        await Promise.all(deletePromises);
        cellsData = cellsData.filter(cell => !selectedCells.has(cell.id));
        selectedCells.clear();
        renderCellsTable();
        updateDeleteSelectedButton();
        showToast("Selected cells deleted", "success");
    } catch (error) {
        console.error("Error deleting cells:", error);
        cellsData = cellsData.filter(cell => !selectedCells.has(cell.id));
        selectedCells.clear();
        renderCellsTable();
        updateDeleteSelectedButton();
        showToast("Selected cells deleted (partial)", "success");
    }
}

async function fetchAnomalies(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        if (filters.severity) params.append("severity", filters.severity);
        if (filters.cellId) params.append("cellId", filters.cellId);
        
        const url = `${API.listAnomalies}?${params.toString()}`;
        const response = await authenticatedFetch(url);
        
        if (!response.ok) throw new Error("Failed to fetch anomalies");
        
        anomaliesData = await response.json();
        renderAnomaliesTable();
    } catch (error) {
        console.error("Error fetching anomalies:", error);
        showToast("Failed to load anomalies", "error");
        anomaliesData = generateMockAnomalies();
        renderAnomaliesTable();
    }
}

function generateMockAnomalies() {
    return [
        { id: 1, timestamp: "2024-04-03T15:24:00", cellId: 2, severity: "medium", description: "Cell voltage out of range" },
        { id: 2, timestamp: "2024-04-03T12:08:00", cellId: 2, severity: "high", description: "Cell temperature out of range" },
        { id: 3, timestamp: "2024-04-03T09:42:00", cellId: 3, severity: "low", description: "Minor voltage fluctuation detected" },
        { id: 4, timestamp: "2024-04-02T18:15:00", cellId: 4, severity: "critical", description: "Critical temperature spike" },
        { id: 5, timestamp: "2024-04-02T14:30:00", cellId: 1, severity: "low", description: "Charge cycle anomaly" }
    ];
}

function renderAnomaliesTable() {
    const tbody = document.getElementById("anomaliesTableBody");
    
    const startIdx = (currentAnomalyPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedAnomalies = anomaliesData.slice(startIdx, endIdx);
    
    if (paginatedAnomalies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No anomalies found</td></tr>';
        return;
    }
    
    tbody.innerHTML = paginatedAnomalies.map(anomaly => {
        const date = new Date(anomaly.timestamp);
        const formattedDate = date.toLocaleString();
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${anomaly.cellId}</td>
                <td><span class="status-badge severity-${anomaly.severity}">${anomaly.severity}</span></td>
                <td>${anomaly.description}</td>
                <td>
                    <button class="btn btn-primary action-btn view-anomaly-btn" data-anomaly-id="${anomaly.id}">View</button>
                </td>
            </tr>
        `;
    }).join('');
    
    updateAnomalyPagination(anomaliesData.length);
    attachAnomalyEventListeners();
}

function updateAnomalyPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById("anomaliesPageInfo").textContent = `Page ${currentAnomalyPage} of ${totalPages}`;
    document.getElementById("prevAnomaliesPage").disabled = currentAnomalyPage === 1;
    document.getElementById("nextAnomaliesPage").disabled = currentAnomalyPage === totalPages || totalPages === 0;
}

function attachAnomalyEventListeners() {
    document.querySelectorAll(".view-anomaly-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const anomalyId = parseInt(e.target.dataset.anomalyId);
            viewAnomalyDetails(anomalyId);
        });
    });
}

async function viewAnomalyDetails(anomalyId) {
    currentAnomalyId = anomalyId;
    try {
        const url = API.anomalyDetails.replace(":id", anomalyId);
        const response = await authenticatedFetch(url);
        
        if (!response.ok) throw new Error("Failed to fetch anomaly details");
        
        const anomaly = await response.json();
        displayAnomalyDetails(anomaly);
    } catch (error) {
        console.error("Error fetching anomaly details:", error);
        const anomaly = anomaliesData.find(a => a.id === anomalyId);
        if (anomaly) {
            const mockDetails = {
                ...anomaly,
                telemetry: {
                    voltage: 3.45,
                    temperature: 35.2,
                    chargeCycles: 487,
                    current: 2.1,
                    resistance: 0.012
                }
            };
            displayAnomalyDetails(mockDetails);
        }
    }
}

function displayAnomalyDetails(anomaly) {
    const date = new Date(anomaly.timestamp);
    document.getElementById("detailTimestamp").textContent = date.toLocaleString();
    document.getElementById("detailCellId").textContent = anomaly.cellId;
    document.getElementById("detailSeverity").innerHTML = `<span class="status-badge severity-${anomaly.severity}">${anomaly.severity}</span>`;
    document.getElementById("detailDescription").textContent = anomaly.description;
    
    const telemetryContainer = document.getElementById("telemetrySnapshot");
    if (anomaly.telemetry) {
        telemetryContainer.innerHTML = Object.entries(anomaly.telemetry).map(([key, value]) => `
            <div class="telemetry-item">
                <span class="telemetry-label">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span class="telemetry-value">${typeof value === 'number' ? value.toFixed(2) : value}</span>
            </div>
        `).join('');
    } else {
        telemetryContainer.innerHTML = '<p class="loading">No telemetry data available</p>';
    }
    
    openModal("anomalyDetailModal");
}

async function markAnomalyAsReviewed() {
    if (!currentAnomalyId) return;
    
    try {
        const url = API.markAnomalyReviewed.replace(":id", currentAnomalyId);
        const response = await authenticatedFetch(url, {
            method: "POST",
            body: JSON.stringify({ reviewed: true })
        });
        
        if (!response.ok) throw new Error("Failed to mark anomaly as reviewed");
        
        showToast("Anomaly marked as reviewed", "success");
        closeModal("anomalyDetailModal");
    } catch (error) {
        console.error("Error marking anomaly:", error);
        showToast("Anomaly marked as reviewed (mock)", "success");
        closeModal("anomalyDetailModal");
    }
}

function populateCellFilter() {
    const cellFilter = document.getElementById("cellFilter");
    const uniqueCellIds = [...new Set(cellsData.map(cell => cell.id))].sort((a, b) => a - b);
    
    cellFilter.innerHTML = '<option value="">All</option>' + 
        uniqueCellIds.map(id => `<option value="${id}">${id}</option>`).join('');
}

function exportToCSV() {
    const headers = ["Date", "Cell ID", "Severity", "Description"];
    const rows = anomaliesData.map(anomaly => [
        new Date(anomaly.timestamp).toLocaleString(),
        anomaly.cellId,
        anomaly.severity,
        anomaly.description
    ]);
    
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anomalies_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported successfully", "success");
}

document.getElementById("addCellBtn").addEventListener("click", () => {
    openModal("addCellModal");
});

document.getElementById("closeAddCellModal").addEventListener("click", () => {
    closeModal("addCellModal");
});

document.getElementById("cancelAddCellBtn").addEventListener("click", () => {
    closeModal("addCellModal");
});

document.getElementById("addCellForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const cellData = {
        cellId: parseInt(document.getElementById("cellIdInput").value),
        status: document.getElementById("statusInput").value,
        chargeCycles: parseInt(document.getElementById("chargeCyclesInput").value)
    };
    addCell(cellData);
    e.target.reset();
});

document.getElementById("deleteSelectedBtn").addEventListener("click", () => {
    deleteSelectedCells();
});

document.getElementById("selectAllCells").addEventListener("change", (e) => {
    const checkboxes = document.querySelectorAll(".cell-checkbox");
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        const cellId = parseInt(checkbox.dataset.cellId);
        if (e.target.checked) {
            selectedCells.add(cellId);
        } else {
            selectedCells.delete(cellId);
        }
    });
    updateDeleteSelectedButton();
});

document.getElementById("cellSearchInput").addEventListener("input", () => {
    currentCellPage = 1;
    renderCellsTable();
});

document.getElementById("prevCellsPage").addEventListener("click", () => {
    if (currentCellPage > 1) {
        currentCellPage--;
        renderCellsTable();
    }
});

document.getElementById("nextCellsPage").addEventListener("click", () => {
    currentCellPage++;
    renderCellsTable();
});

document.getElementById("prevAnomaliesPage").addEventListener("click", () => {
    if (currentAnomalyPage > 1) {
        currentAnomalyPage--;
        renderAnomaliesTable();
    }
});

document.getElementById("nextAnomaliesPage").addEventListener("click", () => {
    currentAnomalyPage++;
    renderAnomaliesTable();
});

document.getElementById("applyFiltersBtn").addEventListener("click", () => {
    const filters = {
        startDate: document.getElementById("startDateFilter").value,
        endDate: document.getElementById("endDateFilter").value,
        severity: document.getElementById("severityFilter").value,
        cellId: document.getElementById("cellFilter").value
    };
    currentAnomalyPage = 1;
    fetchAnomalies(filters);
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
    exportToCSV();
});

document.getElementById("closeAnomalyDetailModal").addEventListener("click", () => {
    closeModal("anomalyDetailModal");
});

document.getElementById("closeDetailBtn").addEventListener("click", () => {
    closeModal("anomalyDetailModal");
});

document.getElementById("markReviewedBtn").addEventListener("click", () => {
    markAnomalyAsReviewed();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("token");
        window.location.href = "/login";
    }
});

window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
        e.target.classList.remove("active");
    }
});

initAuthUI();
fetchCells();
fetchAnomalies();