// Constants
const STAGES = ["Pendiente", "Corte / Mecanizado", "Ensamblaje / Montaje", "Control de Calidad", "Expedición"];
const PRIORITIES = ["Alta", "Media", "Baja"];
const PROBLEM_TYPES = ["Error de mecanizado", "Material defectuoso", "Retraso", "Otro"];

// State
let ofs = [];
let problems = [];
let currentView = 'kanban'; // 'kanban' | 'stats' | 'settings'
let currentStage = 0;
let filterPriority = "Todas";
let sortBy = "fecha";
let searchQuery = "";
let editingUid = null;
let notificationsEnabled = false;

// Storage
const storage = {
  get: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : (key === 'kanban-problems' ? [] : []);
    } catch {
      return [];
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving data:', e);
    }
  }
};

// Date utils
function getDaysLeft(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function formatDateBadge(date) {
  const days = getDaysLeft(date);
  if (days < 0) return { text: `Vencida ${Math.abs(days)}d`, class: 'expired' };
  if (days === 0) return { text: '¡Hoy!', class: 'today' };
  if (days <= 3) return { text: `${days}d`, class: 'urgent' };
  return { text: `${days}d`, class: 'ok' };
}

// Export/Import functions
function exportData() {
  const data = {
    ofs: ofs,
    problems: problems,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kanban-of-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);

  alert('✅ Datos exportados correctamente');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (confirm('¿Estás seguro? Esto reemplazará todos los datos actuales.')) {
          ofs = data.ofs || [];
          problems = data.problems || [];
          storage.set('kanban-ofs', ofs);
          storage.set('kanban-problems', problems);
          render();
          alert('✅ Datos importados correctamente');
        }
      } catch (error) {
        alert('❌ Error al importar: archivo no válido');
      }
    };
    reader.readAsText(file);
  };

  input.click();
}

// Search function
function searchOFs(query) {
  if (!query) return ofs;

  const q = query.toLowerCase();
  return ofs.filter(of =>
    of.id.toLowerCase().includes(q) ||
    of.client.toLowerCase().includes(q) ||
    (of.furniture && of.furniture.toLowerCase().includes(q)) ||
    (of.notes && of.notes.toLowerCase().includes(q))
  );
}

// Problem functions
function getOFProblems(ofUid) {
  return problems.filter(p => p.ofUid === ofUid);
}

function openProblemModal(ofUid) {
  const of = ofs.find(o => o.uid === ofUid);
  if (!of) return;

  const modal = document.getElementById('problem-modal');
  document.getElementById('problem-of-title').textContent = `Reportar Problema - ${of.id}`;
  document.getElementById('problem-of-uid').value = ofUid;
  document.getElementById('problem-form').reset();
  modal.classList.remove('hidden');
}

function closeProblemModal() {
  document.getElementById('problem-modal').classList.add('hidden');
}

function saveProblem() {
  const form = document.getElementById('problem-form');
  const ofUid = parseInt(document.getElementById('problem-of-uid').value);

  const problem = {
    uid: Date.now(),
    ofUid: ofUid,
    type: form.problem_type.value,
    description: form.problem_description.value.trim(),
    timestamp: new Date().toISOString(),
    stage: ofs.find(o => o.uid === ofUid)?.stage || 0
  };

  if (!problem.description) {
    alert('Por favor describe el problema');
    return;
  }

  problems.push(problem);
  storage.set('kanban-problems', problems);
  closeProblemModal();
  render();
  alert('✅ Problema registrado');
}

// Notification functions
function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        notificationsEnabled = true;
        localStorage.setItem('notifications-enabled', 'true');
        alert('✅ Notificaciones activadas');
        scheduleNotificationCheck();
      }
    });
  } else {
    alert('❌ Tu navegador no soporta notificaciones');
  }
}

function toggleNotifications() {
  if (notificationsEnabled) {
    notificationsEnabled = false;
    localStorage.setItem('notifications-enabled', 'false');
    alert('🔕 Notificaciones desactivadas');
  } else {
    requestNotificationPermission();
  }
}

function checkUpcomingDeliveries() {
  if (!notificationsEnabled) return;

  const upcoming = ofs.filter(of => {
    const days = getDaysLeft(of.date);
    return days === 2 && of.stage < 4;
  });

  upcoming.forEach(of => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ Entrega próxima', {
        body: `${of.id} - ${of.client} se entrega en 2 días`,
        icon: 'icons/icon-192.png',
        tag: `of-${of.uid}`
      });
    }
  });
}

function scheduleNotificationCheck() {
  // Check every hour
  setInterval(checkUpcomingDeliveries, 3600000);
  checkUpcomingDeliveries(); // Check immediately
}

// Render functions
function renderStats() {
  const total = ofs.length;
  const delayed = ofs.filter(o => getDaysLeft(o.date) < 0 && o.stage < 4).length;
  const urgent = ofs.filter(o => {
    const days = getDaysLeft(o.date);
    return days <= 3 && days >= 0 && o.stage < 4;
  }).length;
  const done = ofs.filter(o => o.stage === 4).length;

  return `
    <div class="stat-card">
      <div class="stat-number">${total}</div>
      <div class="stat-label">Total</div>
    </div>
    <div class="stat-card" style="background: var(--red-700);">
      <div class="stat-number" style="color: #fca5a5;">${delayed}</div>
      <div class="stat-label" style="color: #fca5a5;">Retrasadas</div>
    </div>
    <div class="stat-card" style="background: var(--yellow-700);">
      <div class="stat-number" style="color: #fde047;">${urgent}</div>
      <div class="stat-label" style="color: #fde047;">Urgentes</div>
    </div>
    <div class="stat-card" style="background: var(--emerald-900);">
      <div class="stat-number" style="color: #6ee7b7;">${done}</div>
      <div class="stat-label" style="color: #6ee7b7;">Expedidas</div>
    </div>
  `;
}

function renderStageTabs() {
  const stageOFs = STAGES.map((_, i) => getFilteredOFs().filter(o => o.stage === i));

  return STAGES.map((stage, i) => `
    <button 
      class="stage-tab ${i === currentStage ? 'active' : ''}"
      onclick="setStage(${i})"
    >
      ${stage}
      <span class="count">${stageOFs[i].length}</span>
    </button>
  `).join('');
}

function getFilteredOFs() {
  let filtered = searchQuery ? searchOFs(searchQuery) : ofs;
  filtered = filtered.filter(o => filterPriority === "Todas" || o.priority === filterPriority);

  filtered.sort((a, b) => {
    if (sortBy === "fecha") return new Date(a.date) - new Date(b.date);
    const po = { Alta: 0, Media: 1, Baja: 2 };
    return po[a.priority] - po[b.priority];
  });

  return filtered;
}

function renderOFCard(of) {
  const days = getDaysLeft(of.date);
  let cardClass = 'of-card';
  if (days < 0) cardClass += ' delayed';
  else if (days <= 3) cardClass += ' urgent';

  const dateBadge = formatDateBadge(of.date);
  const ofProblems = getOFProblems(of.uid);
  const problemCount = ofProblems.length;

  return `
    <div class="${cardClass}">
      <div class="card-header">
        <div class="card-id">${of.id}</div>
        <div class="card-badges">
          <span class="badge badge-priority-${of.priority.toLowerCase()}">${of.priority}</span>
          ${problemCount > 0 ? `<span class="badge badge-problems">⚠️ ${problemCount}</span>` : ''}
        </div>
      </div>
      <div class="card-client">${of.client}</div>
      ${of.furniture ? `<div class="card-furniture">🪑 ${of.furniture}</div>` : ''}
      <div class="card-date-row">
        <span class="card-date">📅 ${of.date}</span>
        <span class="badge-date ${dateBadge.class}">${dateBadge.text}</span>
      </div>
      ${of.notes ? `<div class="card-notes">${of.notes}</div>` : ''}
      <div class="card-actions">
        ${of.stage > 0 ? `<button class="btn-card btn-back" onclick="moveOF(${of.uid}, -1)">← Atrás</button>` : ''}
        <button class="btn-card btn-edit" onclick="editOF(${of.uid})">✏️</button>
        <button class="btn-card btn-problem" onclick="openProblemModal(${of.uid})">⚠️</button>
        ${of.stage < 4 ? `<button class="btn-card btn-forward" onclick="moveOF(${of.uid}, 1)">Avanzar →</button>` : ''}
        <button class="btn-card btn-delete" onclick="deleteOF(${of.uid})">🗑️</button>
      </div>
    </div>
  `;
}

function renderCards() {
  const stageOFs = getFilteredOFs().filter(o => o.stage === currentStage);

  if (stageOFs.length === 0) {
    return '<div class="empty-state">Sin órdenes en esta etapa</div>';
  }

  return stageOFs.map(renderOFCard).join('');
}

function renderDashboard() {
  const total = ofs.length;
  const byStage = STAGES.map((_, i) => ofs.filter(o => o.stage === i).length);
  const onTime = ofs.filter(o => getDaysLeft(o.date) >= 0 || o.stage === 4).length;
  const delayed = total - onTime;
  const completionRate = total > 0 ? ((onTime / total) * 100).toFixed(1) : 0;

  const problemsByType = PROBLEM_TYPES.map(type => ({
    type,
    count: problems.filter(p => p.type === type).length
  }));

  const maxProblems = Math.max(...problemsByType.map(p => p.count), 1);

  return `
    <div class="dashboard">
      <h2 class="dashboard-title">📊 Dashboard de Estadísticas</h2>
      
      <div class="dashboard-section">
        <h3>Órdenes por Etapa</h3>
        <div class="bar-chart">
          ${STAGES.map((stage, i) => `
            <div class="bar-item">
              <div class="bar-label">${stage}</div>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${total > 0 ? (byStage[i] / total) * 100 : 0}%">
                  <span class="bar-value">${byStage[i]}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="dashboard-section">
        <h3>Resumen General</h3>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-number">${total}</div>
            <div class="summary-label">Total OFs</div>
          </div>
          <div class="summary-card">
            <div class="summary-number">${onTime}</div>
            <div class="summary-label">A tiempo</div>
          </div>
          <div class="summary-card">
            <div class="summary-number">${delayed}</div>
            <div class="summary-label">Retrasadas</div>
          </div>
          <div class="summary-card">
            <div class="summary-number">${completionRate}%</div>
            <div class="summary-label">Tasa de cumplimiento</div>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <h3>Problemas Reportados (${problems.length} total)</h3>
        <div class="bar-chart">
          ${problemsByType.map(item => `
            <div class="bar-item">
              <div class="bar-label">${item.type}</div>
              <div class="bar-container">
                <div class="bar-fill bar-problems" style="width: ${(item.count / maxProblems) * 100}%">
                  <span class="bar-value">${item.count}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="settings">
      <h2 class="settings-title">⚙️ Configuración</h2>
      
      <div class="settings-section">
        <h3>Datos</h3>
        <button class="settings-btn" onclick="exportData()">
          💾 Exportar datos (JSON)
        </button>
        <button class="settings-btn" onclick="importData()">
          📂 Importar datos (JSON)
        </button>
      </div>

      <div class="settings-section">
        <h3>Notificaciones</h3>
        <button class="settings-btn" onclick="toggleNotifications()">
          ${notificationsEnabled ? '🔔 Desactivar notificaciones' : '🔕 Activar notificaciones'}
        </button>
        <p class="settings-note">
          ${notificationsEnabled ? '✅ Recibirás alertas 2 días antes de las entregas' : 'Las notificaciones están desactivadas'}
        </p>
      </div>

      <div class="settings-section">
        <h3>Información</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Total OFs:</span>
            <span class="info-value">${ofs.length}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Problemas reportados:</span>
            <span class="info-value">${problems.length}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Versión:</span>
            <span class="info-value">2.0</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function render() {
  if (currentView === 'kanban') {
    document.getElementById('main-content').innerHTML = `
      <div class="stage-tabs" id="stage-tabs"></div>
      <div class="cards-container" id="cards"></div>
    `;
    document.getElementById('stats').innerHTML = renderStats();
    document.getElementById('stage-tabs').innerHTML = renderStageTabs();
    document.getElementById('cards').innerHTML = renderCards();
    renderFilters();
  } else if (currentView === 'stats') {
    document.getElementById('main-content').innerHTML = renderDashboard();
  } else if (currentView === 'settings') {
    document.getElementById('main-content').innerHTML = renderSettings();
  }

  updateNavButtons();
}

function renderFilters() {
  const priorities = ["Todas", ...PRIORITIES];
  document.getElementById('filter-priority').innerHTML = priorities.map(p => `
    <button 
      class="filter-btn ${filterPriority === p ? 'active' : ''}"
      onclick="setFilterPriority('${p}')"
    >${p}</button>
  `).join('');

  document.getElementById('filter-fecha').className = `filter-btn ${sortBy === 'fecha' ? 'active' : ''}`;
  document.getElementById('filter-prioridad').className = `filter-btn ${sortBy === 'prioridad' ? 'active' : ''}`;
}

function updateNavButtons() {
  document.getElementById('nav-kanban').className = `nav-btn ${currentView === 'kanban' ? 'active' : ''}`;
  document.getElementById('nav-stats').className = `nav-btn ${currentView === 'stats' ? 'active' : ''}`;
  document.getElementById('nav-settings').className = `nav-btn ${currentView === 'settings' ? 'active' : ''}`;
}

// Actions
function setView(view) {
  currentView = view;
  render();
}

function setStage(index) {
  currentStage = index;
  render();
}

function setFilterPriority(priority) {
  filterPriority = priority;
  render();
}

function setSortBy(sort) {
  sortBy = sort;
  render();
}

function handleSearch(event) {
  searchQuery = event.target.value;
  render();
}

function moveOF(uid, direction) {
  ofs = ofs.map(o => o.uid === uid ? { ...o, stage: o.stage + direction } : o);
  storage.set('kanban-ofs', ofs);
  render();
}

function deleteOF(uid) {
  if (confirm('¿Eliminar esta orden de fabricación?')) {
    ofs = ofs.filter(o => o.uid !== uid);
    problems = problems.filter(p => p.ofUid !== uid);
    storage.set('kanban-ofs', ofs);
    storage.set('kanban-problems', problems);
    render();
  }
}

function openModal(uid = null) {
  editingUid = uid;
  const modal = document.getElementById('modal');
  const form = document.getElementById('of-form');

  if (uid) {
    const of = ofs.find(o => o.uid === uid);
    form.id_input.value = of.id;
    form.client.value = of.client;
    form.furniture.value = of.furniture || '';
    form.date.value = of.date;
    form.priority.value = of.priority;
    form.notes.value = of.notes || '';
    document.getElementById('modal-title').textContent = 'Editar O.F.';
    document.getElementById('btn-save').textContent = 'Guardar cambios';
  } else {
    form.reset();
    form.priority.value = 'Media';
    document.getElementById('modal-title').textContent = 'Nueva O.F.';
    document.getElementById('btn-save').textContent = 'Crear O.F.';
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  editingUid = null;
}

function editOF(uid) {
  openModal(uid);
}

function saveOF() {
  const form = document.getElementById('of-form');
  const data = {
    id: form.id_input.value.trim(),
    client: form.client.value.trim(),
    furniture: form.furniture.value.trim(),
    date: form.date.value,
    priority: form.priority.value,
    notes: form.notes.value.trim()
  };

  if (!data.id || !data.client || !data.furniture || !data.date) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }

  if (editingUid) {
    ofs = ofs.map(o => o.uid === editingUid ? { ...o, ...data } : o);
  } else {
    ofs.push({ ...data, uid: Date.now(), stage: 0 });
  }

  storage.set('kanban-ofs', ofs);
  closeModal();
  render();
}

// Init
function init() {
  ofs = storage.get('kanban-ofs');
  problems = storage.get('kanban-problems');
  notificationsEnabled = localStorage.getItem('notifications-enabled') === 'true';

  // Build UI
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="header">
      <div class="header-title">🏭 Kanban O.F.</div>
      <div class="header-subtitle">Órdenes de Fabricación</div>
      
      <div class="search-container">
        <input 
          type="search" 
          class="search-input" 
          placeholder="🔍 Buscar por OF, cliente o producto..."
          oninput="handleSearch(event)"
        >
      </div>
      
      <div class="stats-row" id="stats"></div>
      <button class="btn-new" onclick="openModal()">+ Nueva O.F.</button>
      
      <div class="filters">
        <span class="filter-label">Filtrar:</span>
        <div id="filter-priority"></div>
        <span class="filter-label" style="margin-left: 8px;">Ordenar:</span>
        <button id="filter-fecha" class="filter-btn" onclick="setSortBy('fecha')">Fecha</button>
        <button id="filter-prioridad" class="filter-btn" onclick="setSortBy('prioridad')">Prioridad</button>
      </div>
    </div>

    <div id="main-content"></div>

    <div class="bottom-nav">
      <button id="nav-kanban" class="nav-btn active" onclick="setView('kanban')">
        📋<br><span>Kanban</span>
      </button>
      <button id="nav-stats" class="nav-btn" onclick="setView('stats')">
        📊<br><span>Stats</span>
      </button>
      <button id="nav-settings" class="nav-btn" onclick="setView('settings')">
        ⚙️<br><span>Config</span>
      </button>
    </div>

    <div id="modal" class="modal-overlay hidden" onclick="if(event.target === this) closeModal()">
      <div class="modal">
        <div class="modal-header">
          <span id="modal-title">Nueva O.F.</span>
          <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <form id="of-form" onsubmit="event.preventDefault(); saveOF();">
          <div class="form-group">
            <label class="form-label">Nº O.F. *</label>
            <input type="text" name="id_input" class="form-input" placeholder="Ej: OF-2024-001" required>
          </div>
          <div class="form-group">
            <label class="form-label">Cliente *</label>
            <input type="text" name="client" class="form-input" placeholder="Nombre del cliente" required>
          </div>
          <div class="form-group">
            <label class="form-label">Mueble / Producto *</label>
            <input type="text" name="furniture" class="form-input" placeholder="Ej: Armario 2 puertas" required>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha de entrega *</label>
            <input type="date" name="date" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Prioridad</label>
            <select name="priority" class="form-select">
              <option>Alta</option>
              <option>Media</option>
              <option>Baja</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Notas (opcional)</label>
            <textarea name="notes" class="form-textarea" placeholder="Observaciones..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button>
            <button type="submit" id="btn-save" class="btn-save">Crear O.F.</button>
          </div>
        </form>
      </div>
    </div>

    <div id="problem-modal" class="modal-overlay hidden" onclick="if(event.target === this) closeProblemModal()">
      <div class="modal">
        <div class="modal-header">
          <span id="problem-of-title">Reportar Problema</span>
          <button class="btn-close" onclick="closeProblemModal()">×</button>
        </div>
        <form id="problem-form" onsubmit="event.preventDefault(); saveProblem();">
          <input type="hidden" id="problem-of-uid">
          <div class="form-group">
            <label class="form-label">Tipo de problema *</label>
            <select name="problem_type" class="form-select" required>
              ${PROBLEM_TYPES.map(t => `<option>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Descripción *</label>
            <textarea name="problem_description" class="form-textarea" placeholder="Describe el problema..." rows="4" required></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" onclick="closeProblemModal()">Cancelar</button>
            <button type="submit" class="btn-save">Guardar Problema</button>
          </div>
        </form>
      </div>
    </div>
  `;

  render();

  if (notificationsEnabled) {
    scheduleNotificationCheck();
  }
}

//Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
