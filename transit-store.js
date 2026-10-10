/**
 * VALLEY TRANSIT HP - DATA STORE & AUTHENTICATION MANAGER
 * Ensures strict security:
 * - Public visitors have READ-ONLY access.
 * - Only the verified Administrator can publish/modify routes & daily bulletins.
 * - Verified admin password: "valleytravels@3417"
 * - Routes array initialized strictly EMPTY (0 pre-added routes as mandated).
 */

const STORAGE_KEYS = {
  ROUTES: 'valley_transit_hp_routes',
  UPDATES: 'valley_transit_hp_updates',
  AUTH: 'valley_transit_hp_auth_session'
};

const ADMIN_PASSCODE = 'valleytravels@3417';

// Initial updates notice (can be managed/edited by admin)
const DEFAULT_UPDATES = [
  {
    id: 'upd_init_01',
    title: 'Valley Transit HP Official Portal Live',
    category: 'Official Notice',
    severity: 'normal',
    content: 'Welcome to the official Valley Transit HP schedule and bulletin portal. Timetable entries and fare charts are officially published by the transport depot authority. All passenger inquiries may contact central control at +91-177-2803001.',
    date: new Date().toISOString().split('T')[0]
  }
];

class TransitStore {
  constructor() {
    this._initStorage();
  }

  _initStorage() {
    // Crucial: Routes MUST start strictly empty as mandated: "no routes would be added by you"
    if (!localStorage.getItem(STORAGE_KEYS.ROUTES)) {
      localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.UPDATES)) {
      localStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify(DEFAULT_UPDATES));
    }
  }

  // --- AUTHENTICATION ---
  verifyAdmin(password) {
    if (password === ADMIN_PASSCODE) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({
        authenticated: true,
        loginTime: new Date().toISOString()
      }));
      return true;
    }
    return false;
  }

  isAdminLoggedIn() {
    try {
      const session = sessionStorage.getItem(STORAGE_KEYS.AUTH);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return parsed && parsed.authenticated === true;
    } catch (e) {
      return false;
    }
  }

  logoutAdmin() {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
  }

  // --- ROUTES MANAGEMENT ---
  /**
   * Get all published routes
   * @param {string} [type] Optional filter by 'local' or 'long'
   */
  getRoutes(type = null) {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROUTES) || '[]');
      if (!type) return data;
      return data.filter(r => r.type === type);
    } catch (e) {
      console.error('Error fetching routes:', e);
      return [];
    }
  }

  /**
   * Add a new route (Admin Only)
   */
  addRoute(routeData) {
    if (!this.isAdminLoggedIn()) {
      throw new Error('Access Denied: Only authenticated administrator can publish routes.');
    }

    const routes = this.getRoutes();
    const newRoute = {
      id: 'rt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      routeNo: (routeData.routeNo || 'VT-HP').trim().toUpperCase(),
      type: routeData.type === 'long' ? 'long' : 'local',
      origin: (routeData.origin || '').trim(),
      destination: (routeData.destination || '').trim(),
      via: (routeData.via || '').trim(),
      departureTime: (routeData.departureTime || '').trim(),
      arrivalTime: (routeData.arrivalTime || '').trim(),
      busType: routeData.busType || 'Ordinary',
      fare: parseFloat(routeData.fare) || 0,
      distanceKm: parseFloat(routeData.distanceKm) || 0,
      schedule: routeData.schedule || 'Daily',
      status: routeData.status || 'Active',
      publishedAt: new Date().toISOString()
    };

    routes.unshift(newRoute);
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
    return newRoute;
  }

  /**
   * Delete route (Admin Only)
   */
  deleteRoute(routeId) {
    if (!this.isAdminLoggedIn()) {
      throw new Error('Access Denied: Only authenticated administrator can delete routes.');
    }

    let routes = this.getRoutes();
    routes = routes.filter(r => r.id !== routeId);
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
    return true;
  }

  /**
   * Update route status (Admin Only)
   */
  updateRouteStatus(routeId, newStatus) {
    if (!this.isAdminLoggedIn()) {
      throw new Error('Access Denied: Only authenticated administrator can update route status.');
    }

    const routes = this.getRoutes();
    const target = routes.find(r => r.id === routeId);
    if (target) {
      target.status = newStatus;
      localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
      return target;
    }
    return null;
  }

  // --- DAILY UPDATES MANAGEMENT ---
  getUpdates() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.UPDATES) || '[]');
    } catch (e) {
      console.error('Error fetching updates:', e);
      return [];
    }
  }

  /**
   * Add a daily update / bulletin (Admin Only)
   */
  addUpdate(updateData) {
    if (!this.isAdminLoggedIn()) {
      throw new Error('Access Denied: Only authenticated administrator can post updates.');
    }

    const updates = this.getUpdates();
    const newUpdate = {
      id: 'upd_' + Date.now(),
      title: (updateData.title || '').trim(),
      category: updateData.category || 'General Notice',
      severity: updateData.severity || 'normal', // 'normal' | 'urgent'
      content: (updateData.content || '').trim(),
      date: updateData.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    updates.unshift(newUpdate);
    localStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify(updates));
    return newUpdate;
  }

  /**
   * Delete daily update (Admin Only)
   */
  deleteUpdate(updateId) {
    if (!this.isAdminLoggedIn()) {
      throw new Error('Access Denied: Only authenticated administrator can delete updates.');
    }

    let updates = this.getUpdates();
    updates = updates.filter(u => u.id !== updateId);
    localStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify(updates));
    return true;
  }

  // Backup & Restore for Administrator convenience
  exportDataJSON() {
    return JSON.stringify({
      routes: this.getRoutes(),
      updates: this.getUpdates(),
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  importDataJSON(jsonString) {
    if (!this.isAdminLoggedIn()) {
      throw new Error('Access Denied: Only authenticated administrator can import data.');
    }
    const data = JSON.parse(jsonString);
    if (Array.isArray(data.routes)) {
      localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(data.routes));
    }
    if (Array.isArray(data.updates)) {
      localStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify(data.updates));
    }
    return true;
  }
}

// Global instance
window.transitStore = new TransitStore();
