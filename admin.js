/**
 * VALLEY TRANSIT HP - ADMIN PORTAL CONTROLLER (admin.js)
 * Manages admin authorization with password: valleytravels@3417
 * Controls route publishing, daily update posting, and schedule management.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminView();
});

function initAdminView() {
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  const loginForm = document.getElementById('admin-login-form');
  const loginPassInput = document.getElementById('admin-pass-input');
  const loginErrorBox = document.getElementById('login-error-box');
  const logoutBtn = document.getElementById('admin-logout-btn');

  // Pre-fill today's date for bulletin form
  const dateInput = document.getElementById('update-date-input');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Check login state
  if (window.transitStore.isAdminLoggedIn()) {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    setupDashboard();
  } else {
    loginView.style.display = 'block';
    dashboardView.style.display = 'none';
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPassword = loginPassInput.value.trim();

      if (window.transitStore.verifyAdmin(enteredPassword)) {
        loginErrorBox.style.display = 'none';
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        showAdminToast('Depot credentials verified. Welcome Admin.');
        setupDashboard();
      } else {
        loginErrorBox.textContent = 'Authorization Failed: Incorrect password key. Access restricted to authorized depot personnel.';
        loginErrorBox.style.display = 'block';
        loginPassInput.value = '';
        loginPassInput.focus();
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.transitStore.logoutAdmin();
      dashboardView.style.display = 'none';
      loginView.style.display = 'block';
      if (loginPassInput) loginPassInput.value = '';
      showAdminToast('Depot session ended securely.');
    });
  }
}

function setupDashboard() {
  setupTabs();
  setupAddRouteForm();
  setupAddUpdateForm();
  renderAdminRoutesTable();
  renderAdminUpdatesList();
  setupBackupTools();
}

// Tab Switching
function setupTabs() {
  const tabButtons = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.style.display = 'block';
      }

      // Re-render when switching to list tabs
      if (targetId === 'tab-manage-routes') {
        renderAdminRoutesTable();
      } else if (targetId === 'tab-manage-updates') {
        renderAdminUpdatesList();
      }
    });
  });
}

// Add Route Form Handler
function setupAddRouteForm() {
  const form = document.getElementById('add-route-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const routeData = {
      type: document.getElementById('route-type-select').value,
      routeNo: document.getElementById('route-no-input').value,
      origin: document.getElementById('route-origin-input').value,
      destination: document.getElementById('route-destination-input').value,
      via: document.getElementById('route-via-input').value,
      departureTime: document.getElementById('route-dept-time-input').value,
      arrivalTime: document.getElementById('route-arr-time-input').value,
      busType: document.getElementById('route-bus-type-select').value,
      fare: document.getElementById('route-fare-input').value,
      distanceKm: document.getElementById('route-distance-input').value,
      schedule: document.getElementById('route-schedule-select').value,
      status: document.getElementById('route-status-select').value
    };

    try {
      const created = window.transitStore.addRoute(routeData);
      showAdminToast(`Route ${created.routeNo} successfully published to public register!`);
      form.reset();
      
      // Update counts
      updateAdminCounts();

      // Ask user or redirect to view
      if (confirm(`Route ${created.routeNo} published! Would you like to view the Published Routes table now?`)) {
        const manageTab = document.querySelector('[data-tab=tab-manage-routes]');
        if (manageTab) manageTab.click();
      }
    } catch (err) {
      alert(err.message);
    }
  });
}

// Add Daily Update Form Handler
function setupAddUpdateForm() {
  const form = document.getElementById('add-update-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const updateData = {
      title: document.getElementById('update-title-input').value,
      category: document.getElementById('update-category-select').value,
      severity: document.getElementById('update-severity-select').value,
      date: document.getElementById('update-date-input').value,
      content: document.getElementById('update-content-input').value
    };

    try {
      const created = window.transitStore.addUpdate(updateData);
      showAdminToast(`Daily Bulletin: "${created.title}" published to live home page!`);
      form.reset();
      
      // Reset date to today
      const dateInput = document.getElementById('update-date-input');
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

      updateAdminCounts();

      if (confirm('Bulletin posted to home page! View published updates now?')) {
        const manageTab = document.querySelector('[data-tab=tab-manage-updates]');
        if (manageTab) manageTab.click();
      }
    } catch (err) {
      alert(err.message);
    }
  });
}

// Render Admin Routes Management Table
function renderAdminRoutesTable() {
  const tbody = document.getElementById('admin-routes-tbody');
  const emptyBox = document.getElementById('admin-routes-empty');
  const routes = window.transitStore.getRoutes();

  updateAdminCounts();

  if (!tbody) return;

  if (routes.length === 0) {
    tbody.parentElement.style.display = 'none';
    if (emptyBox) emptyBox.style.display = 'block';
    return;
  }

  tbody.parentElement.style.display = 'table';
  if (emptyBox) emptyBox.style.display = 'none';

  tbody.innerHTML = routes.map(r => `
    <tr>
      <td><span class="route-no-badge">${escapeAdminHTML(r.routeNo)}</span></td>
      <td>
        <span class="bus-type-tag" style="background:${r.type === 'local' ? '#fdedef' : '#f4f4f4'}; color:${r.type === 'local' ? 'var(--color-red-primary)' : '#111'};">
          ${r.type === 'local' ? 'LOCAL' : 'LONG'}
        </span>
      </td>
      <td>
        <strong>${escapeAdminHTML(r.origin)}</strong> &rarr; <strong>${escapeAdminHTML(r.destination)}</strong>
      </td>
      <td style="font-size: 0.8125rem; color: var(--color-text-muted); max-width: 220px;">
        ${escapeAdminHTML(r.via)}
      </td>
      <td style="font-size: 0.8125rem;">
        ${escapeAdminHTML(r.departureTime)} - ${escapeAdminHTML(r.arrivalTime)}
      </td>
      <td>
        <strong style="color: var(--color-red-primary);">₹${escapeAdminHTML(r.fare)}</strong>
      </td>
      <td>
        <select class="form-control" style="padding: 4px 6px; font-size: 0.75rem;" onchange="toggleRouteStatus('${r.id}', this.value)">
          <option value="Active" ${r.status === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Suspended" ${r.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
          <option value="Special" ${r.status === 'Special' ? 'selected' : ''}>Special</option>
        </select>
      </td>
      <td>
        <button type="button" class="btn btn-danger btn-sm" onclick="deleteRouteById('${r.id}', '${escapeAdminHTML(r.routeNo)}')">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

// Render Admin Updates Management List
function renderAdminUpdatesList() {
  const container = document.getElementById('admin-updates-list');
  const updates = window.transitStore.getUpdates();

  updateAdminCounts();

  if (!container) return;

  if (updates.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <h3 class="empty-state-title">No Daily Bulletins Active</h3>
        <p class="empty-state-desc">Use the 'Post Daily Update' tab to publish transit notifications.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = updates.map(u => `
    <div style="background: var(--color-white); border: 1px solid var(--color-border); border-left: 4px solid ${u.severity === 'urgent' ? 'var(--color-red-primary)' : 'var(--color-border-strong)'}; padding: 18px 20px; border-radius: var(--card-radius); display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
      <div style="flex: 1;">
        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 6px;">
          <span class="update-category-tag ${u.severity === 'urgent' ? 'tag-urgent' : ''}">
            ${escapeAdminHTML(u.category)}
          </span>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-muted);">
            Effective: ${escapeAdminHTML(u.date)}
          </span>
          ${u.severity === 'urgent' ? '<span style="color: var(--color-red-primary); font-weight: 700; font-size: 0.75rem;">HIGH URGENCY</span>' : ''}
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 6px;">
          ${escapeAdminHTML(u.title)}
        </h3>
        <p style="font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.5;">
          ${escapeAdminHTML(u.content)}
        </p>
      </div>

      <div>
        <button type="button" class="btn btn-danger btn-sm" onclick="deleteUpdateById('${u.id}', '${escapeAdminHTML(u.title)}')">
          Delete Bulletin
        </button>
      </div>
    </div>
  `).join('');
}

// Global Actions for table inline buttons
window.toggleRouteStatus = function(routeId, newStatus) {
  try {
    window.transitStore.updateRouteStatus(routeId, newStatus);
    showAdminToast(`Route status updated to ${newStatus}`);
  } catch (err) {
    alert(err.message);
  }
};

window.deleteRouteById = function(routeId, routeNo) {
  if (confirm(`Are you sure you want to delete route ${routeNo}? This will remove it from the public schedule.`)) {
    try {
      window.transitStore.deleteRoute(routeId);
      showAdminToast(`Route ${routeNo} deleted.`);
      renderAdminRoutesTable();
    } catch (err) {
      alert(err.message);
    }
  }
};

window.deleteUpdateById = function(updateId, title) {
  if (confirm(`Delete bulletin: "${title}"?`)) {
    try {
      window.transitStore.deleteUpdate(updateId);
      showAdminToast('Bulletin removed from home page.');
      renderAdminUpdatesList();
    } catch (err) {
      alert(err.message);
    }
  }
};

// Update count badges on tabs
function updateAdminCounts() {
  const routes = window.transitStore.getRoutes();
  const updates = window.transitStore.getUpdates();

  const tabRoutesCount = document.getElementById('tab-routes-count');
  const tabUpdatesCount = document.getElementById('tab-updates-count');

  if (tabRoutesCount) tabRoutesCount.textContent = routes.length;
  if (tabUpdatesCount) tabUpdatesCount.textContent = updates.length;
}

// Backup & Tools Setup
function setupBackupTools() {
  const exportBtn = document.getElementById('export-backup-btn');
  const importFile = document.getElementById('import-backup-file');
  const importBtn = document.getElementById('import-backup-btn');
  const clearBtn = document.getElementById('clear-all-routes-btn');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = window.transitStore.exportDataJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `valley_transit_hp_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showAdminToast('Schedule JSON backup downloaded.');
    });
  }

  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
      importFile.click();
    });

    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          window.transitStore.importDataJSON(event.target.result);
          showAdminToast('Backup restored successfully!');
          renderAdminRoutesTable();
          renderAdminUpdatesList();
        } catch (err) {
          alert('Failed to parse backup file: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const pass = prompt('CONFIRMATION REQUIRED: Type "CONFIRM" to wipe all published routes:');
      if (pass === 'CONFIRM') {
        localStorage.setItem('valley_transit_hp_routes', JSON.stringify([]));
        showAdminToast('All routes cleared from register.');
        renderAdminRoutesTable();
      }
    });
  }
}

function showAdminToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function escapeAdminHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
