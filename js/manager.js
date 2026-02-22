// ===========================
// LÓGICA PANEL RESPONSABLE
// ===========================

let currentIncidentId = null;
let currentOPId = null;
let currentTab = 'dashboard';

// ===========================
// INICIALIZACIÓN
// ===========================
document.addEventListener('DOMContentLoaded', function () {
    initializeManagerView();
    loadDashboard();
    setupReportTypeListener();
});

function initializeManagerView() {
    loadMachineFilter();
    loadIncidentsList();
    loadRegistrationDropdowns();
    loadActiveOPs();
}

function loadRegistrationDropdowns() {
    // Load machines
    const machines = dataManager.getMachines();
    const machineSelect = document.getElementById('reg_machine');
    if (machineSelect) {
        machines.forEach(machine => {
            const option = document.createElement('option');
            option.value = machine.id;
            option.textContent = machine.name;
            machineSelect.appendChild(option);
        });
    }

    // Load CNC Operators
    const operators = dataManager.getOperators();
    const cncOperatorSelect = document.getElementById('reg_cnc_operator');
    if (cncOperatorSelect) {
        operators.forEach(op => {
            const option = document.createElement('option');
            option.value = op.name;
            option.textContent = op.name;
            cncOperatorSelect.appendChild(option);
        });
    }
}

function loadMachineFilter() {
    const machines = dataManager.getMachines();
    const select = document.getElementById('filterMachine');

    machines.forEach(machine => {
        const option = document.createElement('option');
        option.value = machine.id;
        option.textContent = machine.name;
        select.appendChild(option);
    });
}

// ===========================
// NAVEGACIÓN TABS
// ===========================
function showTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Mostrar tab seleccionado
    document.getElementById('tab-' + tabName).classList.add('active');
    event.target.classList.add('active');

    currentTab = tabName;

    // Cargar datos según el tab
    if (tabName === 'register') {
        loadActiveOPs();  // Reload active OPs when switching to register tab
    } else if (tabName === 'dashboard') {
        loadDashboard();
    } else if (tabName === 'incidents') {
        loadIncidentsList();
    } else if (tabName === 'ops') {
        loadOPsList();
    } else if (tabName === 'operators') {
        loadOperatorsList();
    } else if (tabName === 'stats') {
        loadStatistics();
    }
}

// ===========================
// DASHBOARD - KPIs
// ===========================
function loadDashboard() {
    const stats = dataManager.getWeeklyStats();

    // Calcular incidencias (excluyendo "Sin problemas")
    const incidents = dataManager.getIncidents();
    const weekIncidents = incidents.filter(inc => {
        const incDate = new Date(inc.date);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        return incDate >= startOfWeek;
    });

    const withProblems = weekIncidents.filter(inc => inc.type !== 'Sin problemas');

    // Calcular total de piezas afectadas
    const totalAffectedPieces = weekIncidents.reduce((sum, inc) => sum + (inc.affected_pieces || 0), 0);

    // Actualizar KPIs
    document.getElementById('kpi-total').textContent = weekIncidents.length;
    document.getElementById('kpi-incidents').textContent = withProblems.length;

    const incidentPercent = weekIncidents.length > 0
        ? Math.round((withProblems.length / weekIncidents.length) * 100)
        : 0;
    document.getElementById('kpi-incidents-percent').textContent = `${incidentPercent}%`;

    document.getElementById('kpi-affected').textContent = totalAffectedPieces;

    // Cargar gráficos
    loadChartByMachine(stats);
    loadChartByType(stats);
    loadChartAffectedByMachine(stats);
    loadChartAffectedByType(stats);
    loadTopProblems(stats);
}

function loadTopProblems(stats) {
    const container = document.getElementById('topProblems');
    container.innerHTML = '';

    // Convert object to array and filter/sort
    const problems = Object.entries(stats.byType)
        .filter(([type]) => type !== 'Sin problemas')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (problems.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No hay problemas registrados esta semana</p>';
        return;
    }

    problems.forEach(([type, count], index) => {
        const severity = index === 0 ? 'critical' : index === 1 ? 'high' : index === 2 ? 'medium' : 'low';
        const div = document.createElement('div');
        div.className = `problem-item ${severity}`;
        div.innerHTML = `
            <div>
                <span style="color: var(--text-muted); font-size: 0.875rem;">#${index + 1}</span>
                <div class="problem-name">${type}</div>
            </div>
            <div class="problem-count">
                <span class="problem-badge">${count} ${count === 1 ? 'vez' : 'veces'}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

// ===========================
// LISTA DE INCIDENCIAS
// ===========================
function loadIncidentsList() {
    filterIncidents();
}

function filterIncidents() {
    const period = document.getElementById('filterPeriod').value;
    const machine = document.getElementById('filterMachine').value;
    const status = document.getElementById('filterStatus').value;
    const opSearch = document.getElementById('filterOP').value.toLowerCase();

    let incidents = dataManager.getIncidents();

    // Filter by period
    const now = new Date();
    if (period === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        incidents = incidents.filter(inc => new Date(inc.date) >= startOfWeek);
    } else if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        incidents = incidents.filter(inc => new Date(inc.date) >= startOfMonth);
    }

    // Filter by machine
    if (machine) {
        incidents = incidents.filter(inc => inc.machine === machine);
    }

    // Filter by status
    if (status) {
        incidents = incidents.filter(inc => inc.status === status);
    }

    // Filter by OP
    if (opSearch) {
        incidents = incidents.filter(inc => inc.op_id.toLowerCase().includes(opSearch));
    }

    // Sort by date (most recent first)
    incidents.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render
    renderIncidentsList(incidents);
}

function renderIncidentsList(incidents) {
    const container = document.getElementById('incidentsList');
    container.innerHTML = '';

    if (incidents.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No se encontraron registros</p>';
        return;
    }

    incidents.forEach(incident => {
        const div = document.createElement('div');
        div.className = `incident-item ${incident.needs_review ? 'needs-review' : ''}`;
        div.onclick = () => showIncidentDetail(incident.id);

        const date = new Date(incident.date);
        const dateStr = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const severityIcon = {
            'low': '🟢',
            'medium': '🟡',
            'high': '🟠',
            'critical': '🔴'
        }[incident.severity] || '⚪';

        const statusText = incident.status === 'pending' ? 'Pendiente' : 'Revisado';

        div.innerHTML = `
            <div class="incident-header">
                <div class="incident-title">
                    <span class="incident-op">${incident.op_id}</span>
                    ${incident.type !== 'Sin problemas' ? '⚠️' : '✅'}
                </div>
                <div class="incident-badges">
                    <span class="badge badge-severity-${incident.severity}">${severityIcon} ${incident.severity}</span>
                    <span class="badge badge-status-${incident.status}">${statusText}</span>
                </div>
            </div>
            <div class="incident-info">
                <div class="incident-info-item">
                    <span class="incident-info-label">Fecha</span>
                    <span class="incident-info-value">${dateStr}</span>
                </div>
                <div class="incident-info-item">
                    <span class="incident-info-label">Máquina</span>
                    <span class="incident-info-value">${incident.machine}</span>
                </div>
                <div class="incident-info-item">
                    <span class="incident-info-label">Turno</span>
                    <span class="incident-info-value">${incident.shift}</span>
                </div>
                </div>
            </div>
            <div><strong>Tipo:</strong> ${incident.type}</div>
            ${incident.description ? `<div class="incident-description">${incident.description}</div>` : ''}
        `;

        container.appendChild(div);
    });
}

// ===========================
// DETALLE DE INCIDENCIA
// ===========================
function showIncidentDetail(incidentId) {
    const incidents = dataManager.getIncidents();
    const incident = incidents.find(inc => inc.id === incidentId);

    if (!incident) return;

    currentIncidentId = incidentId;

    const date = new Date(incident.date);
    const dateStr = date.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const content = document.getElementById('incidentDetailContent');
    content.innerHTML = `
        <div class="incident-detail-grid">
            <div class="incident-detail-item">
                <span class="incident-detail-label">Orden de Producción</span>
                <span class="incident-detail-value">${incident.op_id}</span>
            </div>
            <div class="incident-detail-item">
                <span class="incident-detail-label">Fecha y Hora</span>
                <span class="incident-detail-value">${dateStr}</span>
            </div>
            <div class="incident-detail-item">
                <span class="incident-detail-label">Máquina</span>
                <span class="incident-detail-value">${incident.machine}</span>
            </div>
            <div class="incident-detail-item">
                <span class="incident-detail-label">Turno</span>
                <span class="incident-detail-value">${incident.shift}</span>
            </div>
            <div class="incident-detail-item">
                <span class="incident-detail-label">Severidad</span>
                <span class="incident-detail-value">${incident.severity}</span>
            </div>
            <div class="incident-detail-item">
                <span class="incident-detail-label">Piezas Afectadas</span>
                <span class="incident-detail-value">${incident.affected_pieces || 0}</span>
            </div>
        </div>
        
        <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Tipo de Problema</h4>
        <div class="incident-detail-description">${incident.type}</div>
        
        <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Descripción</h4>
        <div class="incident-detail-description">${incident.description || 'Sin descripción'}</div>
        
        ${incident.needs_review ? '<div style="background: rgba(245, 158, 11, 0.1); padding: 1rem; border-radius: 0.5rem; border-left: 4px solid var(--color-warning); margin-top: 1.5rem;">⚠️ <strong>Esta incidencia requiere revisión del responsable</strong></div>' : ''}
    `;

    // Show/hide mark as reviewed button
    const markBtn = document.getElementById('markReviewedBtn');
    if (incident.status === 'reviewed') {
        markBtn.style.display = 'none';
    } else {
        markBtn.style.display = 'inline-flex';
    }

    document.getElementById('incidentDetailModal').classList.add('active');
}

function closeIncidentDetailModal() {
    document.getElementById('incidentDetailModal').classList.remove('active');
    currentIncidentId = null;
}

function markAsReviewed() {
    if (!currentIncidentId) return;

    dataManager.updateIncident(currentIncidentId, { status: 'reviewed' });
    closeIncidentDetailModal();
    loadIncidentsList();
    loadDashboard();
}

// ===========================
// GESTIÓN DE OPs
// ===========================
function loadOPsList() {
    filterOPs();
}

function filterOPs() {
    const searchTerm = document.getElementById('searchOPs')?.value.toLowerCase() || '';
    let ops = dataManager.getOPs();

    if (searchTerm) {
        ops = ops.filter(op =>
            op.id.toLowerCase().includes(searchTerm) ||
            op.description.toLowerCase().includes(searchTerm) ||
            op.client.toLowerCase().includes(searchTerm)
        );
    }

    renderOPsList(ops);
}

function renderOPsList(ops) {
    const container = document.getElementById('opsList');
    container.innerHTML = '';

    if (ops.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No se encontraron órdenes de producción</p>';
        return;
    }

    ops.forEach(op => {
        const div = document.createElement('div');
        div.className = 'op-item-card';
        div.innerHTML = `
            <div class="op-item-header">
                <div class="op-item-title">
                    <span class="op-id-badge">${op.id}</span>
                    <span class="op-description">${op.description}</span>
                </div>
                <div class="op-actions">
                    <button class="btn-icon" onclick="editOP('${op.id}')" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteOPConfirm('${op.id}')" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="op-meta-grid">
                <div class="op-meta-item">
                    <span class="op-meta-label">Cliente</span>
                    <span class="op-meta-value">${op.client}</span>
                </div>
                <div class="op-meta-item">
                    <span class="op-meta-label">Cantidad</span>
                    <span class="op-meta-value">${op.quantity} piezas</span>
                </div>
                <div class="op-meta-item">
                    <span class="op-meta-label">Material</span>
                    <span class="op-meta-value">${op.material}</span>
                </div>
                ${op.program ? `
                <div class="op-meta-item">
                    <span class="op-meta-label">Programa</span>
                    <span class="op-meta-value">${op.program}</span>
                </div>
                ` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

function showNewOPModal() {
    currentOPId = null;
    document.getElementById('opModalTitle').textContent = 'Nueva Orden de Producción';
    document.getElementById('opEditId').value = '';
    document.getElementById('opId').value = '';
    document.getElementById('opDescription').value = '';
    document.getElementById('opClient').value = '';
    document.getElementById('opQuantity').value = '1';
    document.getElementById('opMaterial').value = '';
    document.getElementById('opProgram').value = '';
    document.getElementById('opModal').classList.add('active');
}

function editOP(opId) {
    const op = dataManager.getOPById(opId);
    if (!op) return;

    currentOPId = opId;
    document.getElementById('opModalTitle').textContent = 'Editar Orden de Producción';
    document.getElementById('opEditId').value = opId;
    document.getElementById('opId').value = op.id;
    document.getElementById('opId').disabled = true; // No permitir cambiar el ID
    document.getElementById('opDescription').value = op.description;
    document.getElementById('opClient').value = op.client;
    document.getElementById('opQuantity').value = op.quantity;
    document.getElementById('opMaterial').value = op.material;
    document.getElementById('opProgram').value = op.program || '';
    document.getElementById('opModal').classList.add('active');
}

function closeOPModal() {
    document.getElementById('opModal').classList.remove('active');
    document.getElementById('opId').disabled = false;
    currentOPId = null;
}

function saveOP() {
    const opId = document.getElementById('opId').value.trim();
    const description = document.getElementById('opDescription').value.trim();
    const client = document.getElementById('opClient').value.trim();
    const quantity = parseInt(document.getElementById('opQuantity').value);
    const material = document.getElementById('opMaterial').value.trim();
    const program = document.getElementById('opProgram').value.trim();

    // Validación
    if (!opId || !description || !client || !quantity || !material) {
        alert('Por favor completa todos los campos obligatorios (*)');
        return;
    }

    const op = {
        id: opId,
        description: description,
        client: client,
        quantity: quantity,
        material: material,
        program: program || '',
        status: 'active'
    };

    if (currentOPId) {
        // Editar
        dataManager.updateOP(currentOPId, op);
    } else {
        // Nueva OP - verificar que no existe
        const existing = dataManager.getOPById(opId);
        if (existing) {
            alert('Ya existe una OP con ese ID');
            return;
        }
        dataManager.addOP(op);
    }

    closeOPModal();
    loadOPsList();
}

function deleteOPConfirm(opId) {
    if (confirm(`¿Estás seguro de que deseas eliminar la OP ${opId}?`)) {
        dataManager.deleteOP(opId);
        loadOPsList();
    }
}

// ===========================
// ESTADÍSTICAS
// ===========================
function loadStatistics() {
    const stats = dataManager.getWeeklyStats();
    loadChartBySeverity(stats);
    loadOperatorStats();
}

function loadOperatorStats() {
    const incidents = dataManager.getIncidents();
    const container = document.getElementById('operatorStats');

    if (!container) return;

    // Agrupar por operario CNC
    const operatorStats = {};

    incidents.forEach(inc => {
        const operator = inc.cnc_operator || 'Sin especificar';

        if (!operatorStats[operator]) {
            operatorStats[operator] = {
                total: 0,
                withProblems: 0,
                affectedPieces: 0
            };
        }

        operatorStats[operator].total++;
        if (inc.type !== 'Sin problemas') {
            operatorStats[operator].withProblems++;
            operatorStats[operator].affectedPieces += inc.affected_pieces || 0;
        }
    });

    const sorted = Object.entries(operatorStats)
        .sort((a, b) => b[1].total - a[1].total);

    container.innerHTML = '';

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #9ca3af;">No hay datos para mostrar</p>';
        return;
    }

    sorted.forEach(([operator, stats]) => {
        const percent = stats.total > 0
            ? ((stats.withProblems / stats.total) * 100).toFixed(1)
            : 0;

        const div = document.createElement('div');
        div.className = 'operator-stat-item';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #e5e7eb;">
                <div>
                    <div style="font-weight: 600; font-size: 15px; margin-bottom: 5px;">${operator}</div>
                    <div style="font-size: 13px; color: #6b7280;">
                        ${stats.total} registros · ${stats.withProblems} con problemas (${percent}%) · ${stats.affectedPieces} piezas afectadas
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 24px; font-weight: 700; color: ${percent > 20 ? '#ef4444' : percent > 10 ? '#f59e0b' : '#10b981'};">
                        ${percent}%
                    </div>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// ===========================
// REPORTES
// ===========================
function setupReportTypeListener() {
    const reportType = document.getElementById('reportType');
    if (reportType) {
        reportType.addEventListener('change', function () {
            const customRange = document.getElementById('customDateRange');
            if (this.value === 'custom') {
                customRange.classList.remove('hidden');
            } else {
                customRange.classList.add('hidden');
            }
        });
    }
}

function showReportModal() {
    document.getElementById('reportModal').classList.add('active');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.remove('active');
}

function generateReport() {
    const type = document.getElementById('reportType').value;

    let stats;
    let title;

    if (type === 'weekly') {
        stats = dataManager.getWeeklyStats();
        title = 'Reporte Semanal CNC';
    } else if (type === 'monthly') {
        stats = dataManager.getMonthlyStats();
        title = 'Reporte Mensual CNC';
    } else {
        // Custom
        const dateFrom = document.getElementById('reportDateFrom').value;
        const dateTo = document.getElementById('reportDateTo').value;

        if (!dateFrom || !dateTo) {
            alert('Por favor selecciona las fechas');
            return;
        }

        stats = dataManager.getStatsByDateRange(new Date(dateFrom), new Date(dateTo));
        title = `Reporte CNC - ${dateFrom} a ${dateTo}`;
    }

    // Asegurarse de que el dashboard está cargado para capturar gráficos
    if (typeof chartByType === 'undefined' || !chartByType) {
        loadDashboard();
        // Esperar un momento para que los gráficos se rendericen
        setTimeout(() => {
            const chartImage = typeof captureChartLight === 'function' ? captureChartLight(chartByType) : chartByType.toBase64Image();
            generatePrintableReport(title, stats, chartImage);
            closeReportModal();
        }, 500);
    } else {
        // Capturar el gráfico de tipos de problema en modo claro
        const chartImage = typeof captureChartLight === 'function' ? captureChartLight(chartByType) : chartByType.toBase64Image();
        generatePrintableReport(title, stats, chartImage);
        closeReportModal();
    }
}

function generatePrintableReport(title, stats, chartImage) {
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Por favor, permite las ventanas emergentes para ver el reporte.');
        return;
    }

    const incidentsByType = Object.entries(stats.byType).filter(([type]) => type !== 'Sin problemas');
    const totalWithProblems = incidentsByType.reduce((sum, [, count]) => sum + count, 0);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                @page {
                    size: A4;
                    margin: 20mm;
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    line-height: 1.5;
                    color: #1f2937;
                    background: white;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #2563eb;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }
                .title-area h1 {
                    color: #2563eb;
                    font-size: 24pt;
                    margin: 0;
                }
                .date {
                    color: #6b7280;
                    font-size: 10pt;
                    text-align: right;
                }
                .summary {
                    background: #f8fafc;
                    padding: 25px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    border: 1px solid #e2e8f0;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                .summary-item {
                    text-align: center;
                    border-right: 1px solid #e2e8f0;
                }
                .summary-item:last-child {
                    border-right: none;
                }
                .summary-value {
                    font-size: 28pt;
                    font-weight: bold;
                    color: #2563eb;
                    display: block;
                }
                .summary-label {
                    font-size: 9pt;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-top: 5px;
                }
                .section {
                    margin-bottom: 35px;
                    break-inside: avoid;
                }
                .section h2 {
                    font-size: 16pt;
                    margin-bottom: 15px;
                    color: #1e293b;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .section h2::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 12px 15px;
                    text-align: left;
                    border-bottom: 1px solid #e2e8f0;
                }
                th {
                    background: #f1f5f9;
                    font-weight: 600;
                    color: #475569;
                    font-size: 10pt;
                    text-transform: uppercase;
                }
                tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .chart-container {
                    text-align: center;
                    margin-top: 20px;
                    padding: 20px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                }
                .chart-img {
                    max-width: 500px;
                    width: 100%;
                    height: auto;
                }
                .footer {
                    margin-top: 50px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 9pt;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                }
                @media print {
                    body { padding: 0; }
                    .summary { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title-area">
                    <h1>📊 Reporte CNC</h1>
                    <p style="color: #64748b;">${title}</p>
                </div>
                <div class="date">
                    Generado el<br>
                    <strong>${new Date().toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })}</strong>
                </div>
            </div>
            
            <div class="summary">
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="summary-value">${stats.total}</span>
                        <span class="summary-label">Total Registros</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-value">${totalWithProblems}</span>
                        <span class="summary-label">Con Incidencias</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-value">${stats.totalAffected || 0}</span>
                        <span class="summary-label">Piezas Afectadas</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Incidencias por Tipo</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Tipo de Problema</th>
                            <th>Cantidad</th>
                            <th>% sobre Incidencias</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${incidentsByType.length > 0 ? incidentsByType.map(([type, count]) => {
        const percent = totalWithProblems > 0 ? ((count / totalWithProblems) * 100).toFixed(1) : 0;
        return `
                                <tr>
                                    <td><strong>${type}</strong></td>
                                    <td>${count}</td>
                                    <td>${percent}%</td>
                                </tr>
                            `;
    }).join('') : '<tr><td colspan="3" style="text-align: center;">No se registraron incidencias en este periodo</td></tr>'}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>Incidencias por Máquina</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Máquina</th>
                            <th>Cantidad de Incidencias</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(stats.byMachine).length > 0 ? Object.entries(stats.byMachine).map(([machine, count]) => `
                            <tr>
                                <td><strong>${machine}</strong></td>
                                <td>${count}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="2" style="text-align: center;">Sin incidencias por máquina</td></tr>'}
                    </tbody>
                </table>
            </div>
            
            ${chartImage ? `
            <div class="section">
                <h2>Distribución Visual de Problemas</h2>
                <div class="chart-container">
                    <img src="${chartImage}" class="chart-img" />
                    <p style="margin-top: 15px; color: #64748b; font-size: 9pt; italic;">Visualización de proporcionalidad por tipo de incidencia</p>
                </div>
            </div>` : ''}
            
            <div class="footer">
                Sistema de Gestión CNC - Mejora Continua | Documento generado automáticamente
            </div>
            
            <script>
                window.onload = function() {
                    // Pequeño delay para asegurar renderizado de imagen si es necesario
                    setTimeout(() => {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
}

// ===========================
// GESTIÓN DE OPERARIOS
// ===========================
let currentOperatorId = null;

function loadOperatorsList() {
    filterOperators();
}

function filterOperators() {
    const searchTerm = document.getElementById('searchOperators')?.value.toLowerCase() || '';
    let operators = dataManager.getOperators();

    if (searchTerm) {
        operators = operators.filter(op =>
            op.name.toLowerCase().includes(searchTerm)
        );
    }

    renderOperatorsList(operators);
}

function renderOperatorsList(operators) {
    const container = document.getElementById('operatorsList');
    container.innerHTML = '';

    if (operators.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay operarios registrados</p>';
        return;
    }

    operators.forEach(operator => {
        const div = document.createElement('div');
        div.className = 'op-item-card';
        div.innerHTML = `
            <div class="op-item-header">
                <div class="op-item-title">
                    <span class="op-id-badge">👤</span>
                    <span class="op-description">${operator.name}</span>
                </div>
                <div class="op-actions">
                    <button class="btn-icon" onclick="editOperator(${operator.id})" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteOperatorConfirm(${operator.id})" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function showNewOperatorModal() {
    currentOperatorId = null;
    document.getElementById('operatorModalTitle').textContent = 'Nuevo Operario';
    document.getElementById('operatorEditId').value = '';
    document.getElementById('operatorName').value = '';
    document.getElementById('operatorModal').classList.add('active');
}

function editOperator(operatorId) {
    const operator = dataManager.getOperatorById(operatorId);
    if (!operator) return;

    currentOperatorId = operatorId;
    document.getElementById('operatorModalTitle').textContent = 'Editar Operario';
    document.getElementById('operatorEditId').value = operatorId;
    document.getElementById('operatorName').value = operator.name;
    document.getElementById('operatorModal').classList.add('active');
}

function closeOperatorModal() {
    document.getElementById('operatorModal').classList.remove('active');
    currentOperatorId = null;
}

function saveOperator() {
    const name = document.getElementById('operatorName').value.trim();

    // Validación
    if (!name) {
        alert('Por favor ingresa el nombre del operario');
        return;
    }

    const editId = document.getElementById('operatorEditId').value;

    if (editId) {
        // Editar
        dataManager.updateOperator(parseInt(editId), { name: name });
    } else {
        // Nuevo
        dataManager.addOperator({ name: name });
    }

    closeOperatorModal();
    loadOperatorsList();
}

function deleteOperatorConfirm(operatorId) {
    const operator = dataManager.getOperatorById(operatorId);
    if (confirm(`¿Estás seguro de que deseas eliminar al operario ${operator.name}?`)) {
        dataManager.deleteOperator(operatorId);
        loadOperatorsList();
    }
}

// ===========================
// FUNCIONES DE REGISTRO (TAB REGISTRAR)
// ===========================
function toggleProblemFields() {
    const hasProblems = document.querySelector('input[name="hasProblems"]:checked');
    if (!hasProblems) return;

    const problemFields = document.getElementById('problemFields');

    if (hasProblems.value === 'yes') {
        problemFields.style.display = 'block';
    } else {
        problemFields.style.display = 'none';
    }
}

function loadActiveOPs() {
    const ops = dataManager.getOPs();
    const incidents = dataManager.getIncidents();

    // Get OPs that don't have incidents yet
    const registeredOPIds = incidents.map(inc => inc.op_id);
    const activeOPs = ops.filter(op => !registeredOPIds.includes(op.id) && op.status === 'active');

    const opSelect = document.getElementById('reg_op');
    if (opSelect) {
        // Clear existing options except first
        opSelect.innerHTML = '<option value="">Seleccionar OP...</option>';

        activeOPs.forEach(op => {
            const option = document.createElement('option');
            option.value = op.id;
            option.textContent = `${op.id}${op.description ? ' - ' + op.description : ''}`;
            opSelect.appendChild(option);
        });
    }
}

function saveRegistration(event) {
    event.preventDefault();

    const hasProblemsRadio = document.querySelector('input[name="hasProblems"]:checked');
    if (!hasProblemsRadio) {
        alert('Por favor indica si hubo problemas o no');
        return;
    }

    const hasProblems = hasProblemsRadio.value;
    const machine = document.getElementById('reg_machine').value;
    const opId = document.getElementById('reg_op').value;
    const cncOperator = document.getElementById('reg_cnc_operator').value;

    if (!machine || !opId || !cncOperator) {
        alert('Por favor completa todos los campos obligatorios (Máquina, OP y Operario CNC)');
        return;
    }

    let incident;

    if (hasProblems === 'no') {
        // Sin problemas
        incident = {
            op_id: opId,
            machine: machine,
            cnc_operator: cncOperator,
            type: 'Sin problemas',
            description: 'Producción completada sin incidencias.',
            severity: 'low',
            affected_pieces: 0,
            needs_review: false
        };
    } else {
        // Con problemas
        const problemTypes = Array.from(document.querySelectorAll('input[name="problemType"]:checked'))
            .map(cb => cb.value);

        const description = document.getElementById('reg_description').value;
        const affectedPieces = parseInt(document.getElementById('reg_affected_pieces').value) || 0;
        const severityRadio = document.querySelector('input[name="severity"]:checked');

        if (problemTypes.length === 0) {
            alert('Por favor selecciona al menos un tipo de problema');
            return;
        }

        if (!severityRadio) {
            alert('Por favor selecciona la severidad del problema');
            return;
        }

        incident = {
            op_id: opId,
            machine: machine,
            cnc_operator: cncOperator,
            type: problemTypes.join(', '),
            description: description,
            severity: severityRadio.value,
            affected_pieces: affectedPieces,
            needs_review: false
        };
    }

    // Guardar incidencia
    dataManager.addIncident(incident);

    // Mostrar confirmación
    alert(`✅ Registro guardado correctamente para OP ${opId}`);

    // Limpiar formulario y recargar OPs activas
    resetRegistrationForm();
    loadActiveOPs();
}

function resetRegistrationForm() {
    document.getElementById('registerForm').reset();
    const problemFields = document.getElementById('problemFields');
    if (problemFields) {
        problemFields.style.display = 'none';
    }
}

// ===========================
// BACKUP Y RESTAURACIÓN
// ===========================
function exportBackup() {
    try {
        // Obtener todos los datos de localStorage
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                incidents: localStorage.getItem('cnc_incidents') || '[]',
                ops: localStorage.getItem('cnc_ops') || '[]',
                operators: localStorage.getItem('cnc_operators') || '[]',
                machines: localStorage.getItem('cnc_machines') || '[]',
                workshop_operators: localStorage.getItem('workshop_operators') || '[]'
            }
        };

        // Convertir a JSON
        const jsonString = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Crear enlace de descarga
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Nombre del archivo con fecha
        const date = new Date().toISOString().split('T')[0];
        link.download = `backup-cnc-${date}.json`;

        // Descargar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('✅ Copia de seguridad exportada correctamente');
    } catch (error) {
        console.error('Error al exportar backup:', error);
        alert('❌ Error al exportar la copia de seguridad');
    }
}

function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const backup = JSON.parse(e.target.result);

            // Validar estructura
            if (!backup.data || !backup.timestamp) {
                throw new Error('Formato de backup inválido');
            }

            // Confirmar antes de restaurar
            const confirmMsg = `¿Estás seguro de que deseas restaurar la copia de seguridad?\n\n` +
                `Fecha del backup: ${new Date(backup.timestamp).toLocaleString('es-ES')}\n\n` +
                `⚠️ ADVERTENCIA: Esto sobrescribirá todos los datos actuales.`;

            if (!confirm(confirmMsg)) {
                event.target.value = ''; // Reset file input
                return;
            }

            // Confirmar dos veces para seguridad
            if (!confirm('¿Estás COMPLETAMENTE seguro? Esta acción no se puede deshacer.')) {
                event.target.value = '';
                return;
            }

            // Restaurar datos
            localStorage.setItem('cnc_incidents', backup.data.incidents);
            localStorage.setItem('cnc_ops', backup.data.ops);
            localStorage.setItem('cnc_operators', backup.data.operators);
            localStorage.setItem('cnc_machines', backup.data.machines);
            if (backup.data.workshop_operators) {
                localStorage.setItem('workshop_operators', backup.data.workshop_operators);
            }

            alert('✅ Copia de seguridad restaurada correctamente.\n\nLa página se recargará para aplicar los cambios.');

            // Recargar la página
            window.location.reload();

        } catch (error) {
            console.error('Error al importar backup:', error);
            alert('❌ Error al importar la copia de seguridad.\n\nAsegúrate de que el archivo es válido.');
        }

        // Reset file input
        event.target.value = '';
    };

    reader.readAsText(file);
}
