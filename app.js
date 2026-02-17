// Constants
const STAGES = ["Pendiente", "Corte / Mecanizado", "Ensamblaje / Montaje", "Control de Calidad", "Expedición"];
const PRIORITIES = ["Alta", "Media", "Baja"];

// State
let ofs = [];
let currentStage = 0;
let filterPriority = "Todas";
let sortBy = "fecha";
let editingUid = null;

// Storage
const storage = {
    get: (key) => {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : [];
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
    let filtered = ofs.filter(o => filterPriority === "Todas" || o.priority === filterPriority);

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

    return `
    <div class="${cardClass}">
      <div class="card-header">
        <div class="card-id">${of.id}</div>
        <div class="card-badges">
          <span class="badge badge-priority-${of.priority.toLowerCase()}">${of.priority}</span>
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
        <button class="btn-card btn-edit" onclick="editOF(${of.uid})">✏️ Editar</button>
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

function render() {
    document.getElementById('stats').innerHTML = renderStats();
    document.getElementById('stage-tabs').innerHTML = renderStageTabs();
    document.getElementById('cards').innerHTML = renderCards();
    renderFilters();
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

// Actions
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

function moveOF(uid, direction) {
    ofs = ofs.map(o => o.uid === uid ? { ...o, stage: o.stage + direction } : o);
    storage.set('kanban-ofs', ofs);
    render();
}

function deleteOF(uid) {
    if (confirm('¿Eliminar esta orden de fabricación?')) {
        ofs = ofs.filter(o => o.uid !== uid);
        storage.set('kanban-ofs', ofs);
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

    // Build UI
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="header">
      <div class="header-title">🏭 Kanban O.F.</div>
      <div class="header-subtitle">Órdenes de Fabricación</div>
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

    <div class="stage-tabs" id="stage-tabs"></div>
    
    <div class="cards-container" id="cards"></div>

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
  `;

    render();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
