// ===========================
// LÓGICA PANEL RESPONSABLE
// ===========================

let currentIncidentId = null;
let currentOPId = null;
let currentTab = 'register';  // Changed default to register

// ===========================
// INICIALIZACIÓN
// ===========================
document.addEventListener('DOMContentLoaded', function () {
    initializeManagerView();
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

    // Load Workshop Operators
    const workshopOps = dataManager.getWorkshopOperators();
    const workshopSelect = document.getElementById('reg_workshop_operator');
    if (workshopSelect) {
        workshopOps.forEach(op => {
            const option = document.createElement('option');
            option.value = op.name;
            option.textContent = op.name;
            workshopSelect.appendChild(option);
        });
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
            option.textContent = `${op.id} - ${op.description || ''}`;
            opSelect.appendChild(option);
        });
    }
}

function loadMachineFilter() {
    const machines = dataManager.getMachines();
    const select = document.getElementById('filterMachine');

    if (select) {
        machines.forEach(machine => {
            const option = document.createElement('option');
            option.value = machine.id;
            option.textContent = machine.name;
            select.appendChild(option);
        });
    }
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
// FUNCIONES DE REGISTRO
// ===========================
function toggleProblemFields() {
    const hasProblems = document.querySelector('input[name="hasProblems"]:checked').value;
    const problemFields = document.getElementById('problemFields');

    if (hasProblems === 'yes') {
        problemFields.style.display = 'block';
    } else {
        problemFields.style.display = 'none';
    }
}

function saveRegistration(event) {
    event.preventDefault();

    const hasProblems = document.querySelector('input[name="hasProblems"]:checked').value;
    const machine = document.getElementById('reg_machine').value;
    const opId = document.getElementById('reg_op').value;
    const cncOperator = document.getElementById('reg_cnc_operator').value;
    const workshopOperator = document.getElementById('reg_workshop_operator').value || null;

    if (!machine || !opId || !cncOperator) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }

    let incident;

    if (hasProblems === 'no') {
        // Sin problemas
        incident = {
            op_id: opId,
            machine: machine,
            cnc_operator: cncOperator,
            workshop_operator: workshopOperator,
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
        const severity = document.querySelector('input[name="severity"]:checked').value;

        if (problemTypes.length === 0) {
            alert('Por favor selecciona al menos un tipo de problema');
            return;
        }

        incident = {
            op_id: opId,
            machine: machine,
            cnc_operator: cncOperator,
            workshop_operator: workshopOperator,
            type: problemTypes.join(', '),
            description: description,
            severity: severity,
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
    document.getElementById('problemFields').style.display = 'none';
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
    const pendingReview = weekIncidents.filter(inc => inc.status === 'pending' && inc.needs_review);

    // Actualizar KPIs
    document.getElementById('kpi-total').textContent = weekIncidents.length;
    document.getElementById('kpi-incidents').textContent = withProblems.length;

    const incidentPercent = weekIncidents.length > 0
        ? Math.round((withProblems.length / weekIncidents.length) * 100)
        : 0;
    document.getElementById('kpi-incidents-percent').textContent = `${incidentPercent}%`;

    document.getElementById('kpi-pending').textContent = pendingReview.length;

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

// Rest of the manager.js file continues with all the existing functions...
// (I'll need to keep the rest of the file as it was)
