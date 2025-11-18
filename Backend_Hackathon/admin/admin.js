// ADMIN PAGE SCRIPT - Fully Patched Version

// Ensure shared.js is loaded before this file.
// Uses: API_BASE, getAuthToken(), isAdmin(), showNotification()

// ---------------------------------------------
// AUTH CHECK (Fix #1)
// ---------------------------------------------
if (!getAuthToken()) {
  window.location.href = '../login/login.html';
}

if (!isAdmin()) {
  showNotification('Admin access required', 'error');
  setTimeout(() => (window.location.href = '../main/index.html'), 800);
}

// ---------------------------------------------
// GLOBAL STATE
// ---------------------------------------------
let cellsData = [];
let anomaliesData = [];
let selectedCells = new Set();
let currentCellPage = 1;
let currentAnomalyPage = 1;
let editingCellId = null;
const itemsPerPage = 10;

// ---------------------------------------------
// FIX #2 — API Endpoints using API_BASE
// ---------------------------------------------
const API = {
  listCells: `${API_BASE}/admin/cells`,
  createCell: `${API_BASE}/admin/cells`,
  updateCell: `${API_BASE}/admin/cells/:id`,
  deleteCell: `${API_BASE}/admin/cells/:id`,
  listAnomalies: `${API_BASE}/admin/anomalies`,
  anomalyDetails: `${API_BASE}/admin/anomalies/:id`,
  markAnomalyReviewed: `${API_BASE}/admin/anomalies/:id`
};

// ---------------------------------------------
// AUTH HEADERS
// ---------------------------------------------
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`
  };
}

// ---------------------------------------------
// AUTH FETCH (handles 401/403)
// ---------------------------------------------
async function authenticatedFetch(url, options = {}) {
  const finalOptions = {
    ...options,
    headers: { ...(options.headers || {}), ...getAuthHeaders() }
  };

  const res = await fetch(url, finalOptions);

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    showNotification('Session expired. Redirecting...', 'error');
    setTimeout(() => (window.location.href = '../login/login.html'), 700);
  }

  return res;
}

// ---------------------------------------------
// TOAST
// ---------------------------------------------
function showToast(msg, type = 'success') {
  if (typeof showNotification === 'function') return showNotification(msg, type);

  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ---------------------------------------------
// FETCH CELLS
// ---------------------------------------------
async function fetchData() {
  try {
    const res = await authenticatedFetch(API.listCells);
    const payload = await res.json();
    cellsData = payload.data || payload;

    renderAdminTable();
    populateCellFilter();
  } catch (err) {
    console.error(err);
    showToast('Failed to load cells. Using mock data.', 'error');
    cellsData = generateMockCells();
    renderAdminTable();
    populateCellFilter();
  }
}

// Mock fallback
function generateMockCells() {
  return [
    { _id: '1', cellId: 1, status: 'Healthy', chargeCycles: 245, avgVoltage: 3.72, avgTemperature: 28.5 },
    { _id: '2', cellId: 2, status: 'Warning', chargeCycles: 487, avgVoltage: 3.64, avgTemperature: 32.1 }
  ];
}

// ---------------------------------------------
// RENDER CELLS TABLE
// ---------------------------------------------
function renderAdminTable() {
  const tbody = document.getElementById('cellsTableBody');
  const search = document.getElementById('cellSearchInput').value.toLowerCase();

  const filtered = cellsData.filter(
    c =>
      c.cellId.toString().includes(search) ||
      c.status.toLowerCase().includes(search)
  );

  const start = (currentCellPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(start, start + itemsPerPage);

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading">No cells found</td></tr>`;
    updateCellPagination(filtered.length);
    return;
  }

  tbody.innerHTML = pageItems
    .map(
      cell => `
      <tr>
        <td><input type="checkbox" class="cell-checkbox" data-cell-id="${cell._id}" ${selectedCells.has(cell._id) ? 'checked' : ''}></td>
        <td>${cell.cellId}</td>
        <td><span class="status-badge status-${cell.status.toLowerCase()}">${cell.status}</span></td>
        <td>${cell.chargeCycles}</td>
        <td>${Number(cell.avgVoltage).toFixed(2)}</td>
        <td>${Number(cell.avgTemperature).toFixed(1)}</td>
        <td>
          <button class="btn btn-secondary edit-cell-btn" data-cell-id="${cell._id}">✎ Edit</button>
          <button class="btn btn-danger delete-cell-btn" data-cell-id="${cell._id}">✕ Delete</button>
        </td>
      </tr>`
    )
    .join('');

  updateCellPagination(filtered.length);
  attachCellEventListeners();
}

// ---------------------------------------------
// PAGINATION
// ---------------------------------------------
function updateCellPagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  document.getElementById('cellsPageInfo').textContent = `Page ${currentCellPage} of ${totalPages}`;
  document.getElementById('prevCellsPage').disabled = currentCellPage === 1;
  document.getElementById('nextCellsPage').disabled = currentCellPage === totalPages;
}

// ---------------------------------------------
// EVENT LISTENERS FOR EACH CELL
// ---------------------------------------------
function attachCellEventListeners() {
  document.querySelectorAll('.cell-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      const id = e.target.dataset.cellId;
      if (e.target.checked) selectedCells.add(id);
      else selectedCells.delete(id);
      updateDeleteSelectedButton();
    });
  });

  document.querySelectorAll('.edit-cell-btn').forEach(btn => {
    btn.addEventListener('click', e => openEditModal(e.target.dataset.cellId));
  });

  document.querySelectorAll('.delete-cell-btn').forEach(btn => {
    btn.addEventListener('click', e => handleDelete(e.target.dataset.cellId));
  });
}

// ---------------------------------------------
// DELETE SELECTED ENABLE
// ---------------------------------------------
function updateDeleteSelectedButton() {
  document.getElementById('deleteSelectedBtn').disabled = selectedCells.size === 0;
}

// ---------------------------------------------
// CREATE CELL
// ---------------------------------------------
async function handleCreate(data) {
  try {
    const res = await authenticatedFetch(API.createCell, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const payload = await res.json();
    const created = payload.data;

    cellsData.unshift(created);
    showToast('Cell created');
    closeModal('addCellModal');
    fetchData();
  } catch (err) {
    showToast('Create failed', 'error');
  }
}

// ---------------------------------------------
// UPDATE CELL
// ---------------------------------------------
async function handleUpdate(cellId, data) {
  try {
    const res = await authenticatedFetch(API.updateCell.replace(':id', cellId), {
      method: 'PUT',
      body: JSON.stringify(data)
    });

    const payload = await res.json();
    const updated = payload.data;

    const index = cellsData.findIndex(c => c._id === cellId);
    if (index !== -1) cellsData[index] = updated;

    showToast('Cell updated');
    closeModal('editCellModal');
    fetchData();
  } catch (err) {
    showToast('Update failed', 'error');
  }
}

// ---------------------------------------------
// DELETE SINGLE CELL
// ---------------------------------------------
async function handleDelete(cellId) {
  if (!confirm('Delete this cell?')) return;

  try {
    await authenticatedFetch(API.deleteCell.replace(':id', cellId), {
      method: 'DELETE'
    });

    cellsData = cellsData.filter(c => c._id !== cellId);
    showToast('Cell deleted');
    renderAdminTable();
  } catch (err) {
    showToast('Delete failed', 'error');
  }
}

// ---------------------------------------------
// DELETE MULTIPLE CELLS
// ---------------------------------------------
async function deleteSelectedCells() {
  if (!confirm('Delete selected cells?')) return;

  try {
    const ids = [...selectedCells];
    await Promise.all(
      ids.map(id =>
        authenticatedFetch(API.deleteCell.replace(':id', id), {
          method: 'DELETE'
        })
      )
    );

    cellsData = cellsData.filter(c => !selectedCells.has(c._id));
    selectedCells.clear();
    renderAdminTable();
    showToast('Deleted selected cells');
  } catch (err) {
    showToast('Delete failed', 'error');
  }
}

// ---------------------------------------------
// EDIT MODAL
// ---------------------------------------------
function openEditModal(cellId) {
  editingCellId = cellId;
  const cell = cellsData.find(c => c._id === cellId);

  document.getElementById('editCellIdInput').value = cell.cellId;
  document.getElementById('editStatusInput').value = cell.status;
  document.getElementById('editChargeCyclesInput').value = cell.chargeCycles;
  document.getElementById('editAvgVoltageInput').value = cell.avgVoltage;
  document.getElementById('editAvgTempInput').value = cell.avgTemperature;

  openModal('editCellModal');
}

// ---------------------------------------------
// BROADCAST
// ---------------------------------------------
function broadcastDataUpdate() {
  localStorage.setItem('dataUpdateTimestamp', Date.now());
}

// ---------------------------------------------
// FETCH ANOMALIES (Fix #4)
// ---------------------------------------------
async function fetchAnomalies(filters = {}) {
  try {
    const params = new URLSearchParams(filters);

    const res = await authenticatedFetch(`${API.listAnomalies}?${params}`);
    const payload = await res.json();

    // Fix: extract anomalies array
    anomaliesData =
      payload.data?.anomalies ||
      payload.data ||
      [];

    renderAnomaliesTable();
  } catch (err) {
    showToast('Failed to load anomalies', 'error');
    anomaliesData = generateMockAnomalies();
    renderAnomaliesTable();
  }
}

// Mock anomalies
function generateMockAnomalies() {
  return [
    {
      _id: '1',
      timestamp: '2024-04-03T15:24:00Z',
      cellId: 3,
      severity: 'high',
      description: 'Voltage spike'
    }
  ];
}

// ---------------------------------------------
// RENDER ANOMALIES TABLE
// ---------------------------------------------
function renderAnomaliesTable() {
  const tbody = document.getElementById('anomaliesTableBody');

  const start = (currentAnomalyPage - 1) * itemsPerPage;
  const pageItems = anomaliesData.slice(start, start + itemsPerPage);

  if (!pageItems.length) {
    tbody.innerHTML = `<tr><td colspan="5">No anomalies found</td></tr>`;
    return;
  }

  tbody.innerHTML = pageItems
    .map(a => {
      const date = new Date(a.timestamp);
      return `
        <tr>
          <td>${date.toLocaleString()}</td>
          <td>${a.cellId}</td>
          <td><span class="status-badge severity-${a.severity}">${a.severity}</span></td>
          <td>${a.description}</td>
          <td><button class="btn btn-primary view-anomaly-btn" data-anomaly-id="${a._id}">View</button></td>
        </tr>
      `;
    })
    .join('');

  attachAnomalyEventListeners();
}

// ---------------------------------------------
// VIEW ANOMALY DETAIL (Fix #4)
// ---------------------------------------------
async function viewAnomalyDetails(id) {
  try {
    const res = await authenticatedFetch(API.anomalyDetails.replace(':id', id));
    const payload = await res.json();

    const anomaly = payload.data || payload;

    displayAnomalyDetails(anomaly);
  } catch (err) {
    showToast('Unable to load anomaly details', 'error');
  }
}

function displayAnomalyDetails(a) {
  document.getElementById('detailTimestamp').textContent = new Date(a.timestamp).toLocaleString();
  document.getElementById('detailCellId').textContent = a.cellId;
  document.getElementById('detailSeverity').innerHTML = `<span class="status-badge severity-${a.severity}">${a.severity}</span>`;
  document.getElementById('detailDescription').textContent = a.description;

  openModal('anomalyDetailModal');
}

// ---------------------------------------------
// EXPORT CSV
// ---------------------------------------------
function exportToCSV() {
  const csv = [
    ['Cell ID', 'Status', 'Cycles', 'Voltage', 'Temperature'],
    ...cellsData.map(c => [
      c.cellId,
      c.status,
      c.chargeCycles,
      c.avgVoltage,
      c.avgTemperature
    ])
  ]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cells.csv';
  a.click();
}

// ---------------------------------------------
// FILTERS HANDLERS
// ---------------------------------------------
document.getElementById('applyFiltersBtn').addEventListener('click', () => {
  const filters = {
    startDate: document.getElementById('startDateFilter').value,
    endDate: document.getElementById('endDateFilter').value,
    severity: document.getElementById('severityFilter').value,
    cellId: document.getElementById('cellFilter').value
  };
  fetchAnomalies(filters);
});

// ---------------------------------------------
// DELETE SELECTED CELLS
// ---------------------------------------------
document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedCells);

// ---------------------------------------------
// SEARCH
// ---------------------------------------------
document
  .getElementById('cellSearchInput')
  .addEventListener('input', () => renderAdminTable());

// ---------------------------------------------
// PAGINATION
// ---------------------------------------------
document.getElementById('prevCellsPage').addEventListener('click', () => {
  if (currentCellPage > 1) currentCellPage--;
  renderAdminTable();
});

document.getElementById('nextCellsPage').addEventListener('click', () => {
  currentCellPage++;
  renderAdminTable();
});

// ---------------------------------------------
// LOGOUT
// ---------------------------------------------
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  window.location.href = '../login/login.html';
});

// ---------------------------------------------
// INITIAL LOAD
// ---------------------------------------------
fetchData();
fetchAnomalies();
