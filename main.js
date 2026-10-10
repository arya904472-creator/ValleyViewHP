/**
 * VALLEY TRANSIT HP - PUBLIC PAGES CONTROLLER (main.js)
 * Manages public view: Timetables, Search, Filters, Daily Updates Feed & Status Badges
 */

document.addEventListener('DOMContentLoaded', () => {
  initCommonElements();

  // Page-specific initialization
  if (document.getElementById('home-updates-list')) {
    initHomePage();
  }
  if (document.getElementById('local-routes-table')) {
    initRoutesPage('local');
  }
  if (document.getElementById('long-routes-table')) {
    initRoutesPage('long');
  }
});

// Common elements across pages
function initCommonElements() {
  // Admin status badge in gov strip
  const adminBadge = document.getElementById('header-admin-status');
  if (adminBadge && window.transitStore.isAdminLoggedIn()) {
    adminBadge.innerHTML = `
      <span class="admin-badge-indicator">
        ADMIN ACTIVE
      </span>
    `;
  }

  // Live alert ticker
  const tickerEl = document.getElementById('live-ticker-text');
  if (tickerEl) {
    const updates = window.transitStore.getUpdates();
    if (updates.length > 0) {
      const urgent = updates.find(u => u.severity === 'urgent');
      const top = urgent || updates[0];
      tickerEl.textContent = `[${top.category.toUpperCase()}] ${top.title} - Effective ${top.date}`;
    } else {
      tickerEl.textContent = 'All Himachal mountain transit corridors operating under standard depot timetable.';
    }
  }
}

// Home Page Controller
function initHomePage() {
  const updatesContainer = document.getElementById('home-updates-list');
  const countBadge = document.getElementById('update-count-badge');
  const statLocal = document.getElementById('stat-local-count');
  const statLong = document.getElementById('stat-long-count');

  const updates = window.transitStore.getUpdates();
  const localRoutes = window.transitStore.getRoutes('local');
  const longRoutes = window.transitStore.getRoutes('long');

  if (statLocal) statLocal.textContent = localRoutes.length;
  if (statLong) statLong.textContent = longRoutes.length;
  if (countBadge) countBadge.textContent = `${updates.length} Bulletins`;

  if (!updatesContainer) return;

  if (updates.length === 0) {
    updatesContainer.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--color-text-muted);">
        No operational bulletins published today. All services on standard timetable.
      </div>
    `;
    return;
  }

  updatesContainer.innerHTML = updates.map(u => {
    const isUrgent = u.severity === 'urgent';
    return `
      <article class="update-entry ${isUrgent ? 'priority-urgent' : ''}">
        <div class="update-meta-row">
          <span class="update-category-tag ${isUrgent ? 'tag-urgent' : ''}">
            ${escapeHTML(u.category)}
          </span>
          <span class="update-date">${escapeHTML(u.date)}</span>
          ${isUrgent ? '<span style="color: var(--color-red-primary); font-weight: 700; font-size: 0.75rem;">HIGH URGENCY ALERT</span>' : ''}
        </div>
        <h3 class="update-title">${escapeHTML(u.title)}</h3>
        <p class="update-content">${escapeHTML(u.content)}</p>
      </article>
    `;
  }).join('');
}

// Routes Directory Page Controller (used for both 'local' and 'long')
function initRoutesPage(routeType) {
  const tbody = document.getElementById(`${routeType}-routes-tbody`);
  const emptyState = document.getElementById(`${routeType}-empty-state`);
  const table = document.getElementById(`${routeType}-routes-table`);
  const countLabel = document.getElementById('route-count-label');
  const searchInput = document.getElementById('route-search-input');
  const busTypeFilter = document.getElementById('bus-type-filter');
  const statusFilter = document.getElementById('status-filter');
  const resetBtn = document.getElementById('reset-filters-btn');

  function render() {
    const allRoutes = window.transitStore.getRoutes(routeType);
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const selectedBusType = busTypeFilter ? busTypeFilter.value : 'all';
    const selectedStatus = statusFilter ? statusFilter.value : 'all';

    const filtered = allRoutes.filter(r => {
      // Query match (origin, destination, via, routeNo)
      const matchesQuery = !query || 
        r.routeNo.toLowerCase().includes(query) ||
        r.origin.toLowerCase().includes(query) ||
        r.destination.toLowerCase().includes(query) ||
        r.via.toLowerCase().includes(query);

      // Bus type filter
      const matchesBusType = selectedBusType === 'all' || 
        r.busType.toLowerCase().includes(selectedBusType.toLowerCase());

      // Status filter
      const matchesStatus = selectedStatus === 'all' || 
        r.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesQuery && matchesBusType && matchesStatus;
    });

    if (countLabel) {
      countLabel.textContent = `Showing ${filtered.length} of ${allRoutes.length} ${routeType === 'local' ? 'Local' : 'Long Distance'} Routes`;
    }

    if (allRoutes.length === 0) {
      // Depot has 0 routes added
      if (table) table.parentElement.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (filtered.length === 0) {
      // Filters yielded 0 matches
      if (table) table.parentElement.style.display = 'none';
      if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
          <div class="empty-state-icon">!</div>
          <h3 class="empty-state-title">No Matching Routes Found</h3>
          <p class="empty-state-desc">No published routes match your search filters. Try adjusting your search query or reset the filters.</p>
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('reset-filters-btn').click()">
            Reset All Filters
          </button>
        `;
      }
      return;
    }

    // Has matching routes
    if (table) table.parentElement.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    if (routeType === 'local') {
      tbody.innerHTML = filtered.map(r => `
        <tr>
          <td><span class="route-no-badge">${escapeHTML(r.routeNo)}</span></td>
          <td><span class="location-name">${escapeHTML(r.origin)}</span></td>
          <td><span class="location-name">${escapeHTML(r.destination)}</span></td>
          <td><span class="via-stops-text">${escapeHTML(r.via)}</span></td>
          <td><strong>${escapeHTML(r.departureTime)}</strong></td>
          <td><strong>${escapeHTML(r.arrivalTime)}</strong></td>
          <td><span class="bus-type-tag">${escapeHTML(r.busType)}</span></td>
          <td><span class="fare-display">₹${escapeHTML(r.fare)}</span></td>
          <td style="font-size: 0.8125rem; color: var(--color-text-muted);">${escapeHTML(r.schedule)}</td>
          <td>${renderStatusBadge(r.status)}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = filtered.map(r => `
        <tr>
          <td><span class="route-no-badge">${escapeHTML(r.routeNo)}</span></td>
          <td><span class="location-name">${escapeHTML(r.origin)}</span></td>
          <td><span class="location-name">${escapeHTML(r.destination)}</span></td>
          <td><span class="via-stops-text">${escapeHTML(r.via)}</span></td>
          <td style="font-family: var(--font-mono); font-size: 0.8125rem;">${r.distanceKm ? escapeHTML(r.distanceKm) + ' km' : '--'}</td>
          <td><strong>${escapeHTML(r.departureTime)}</strong></td>
          <td><strong>${escapeHTML(r.arrivalTime)}</strong></td>
          <td><span class="bus-type-tag">${escapeHTML(r.busType)}</span></td>
          <td><span class="fare-display">₹${escapeHTML(r.fare)}</span></td>
          <td style="font-size: 0.8125rem; color: var(--color-text-muted);">${escapeHTML(r.schedule)}</td>
          <td>${renderStatusBadge(r.status)}</td>
        </tr>
      `).join('');
    }
  }

  // Event listeners for filters
  if (searchInput) searchInput.addEventListener('input', render);
  if (busTypeFilter) busTypeFilter.addEventListener('change', render);
  if (statusFilter) statusFilter.addEventListener('change', render);
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (busTypeFilter) busTypeFilter.value = 'all';
      if (statusFilter) statusFilter.value = 'all';
      render();
    });
  }

  render();
}

function renderStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('active') || s.includes('time')) {
    return `<span class="status-badge status-active">On-Time</span>`;
  }
  if (s.includes('suspend') || s.includes('delay')) {
    return `<span class="status-badge status-suspended">Suspended</span>`;
  }
  return `<span class="status-badge status-special">${escapeHTML(status)}</span>`;
}

function showToast(message) {
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

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
