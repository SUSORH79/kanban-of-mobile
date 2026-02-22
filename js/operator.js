// ===========================
// LÓGICA DE LA VISTA OPERARIO
// ===========================

// Variables globales para el formulario
let currentStep = 1;
let selectedMachine = null;
let selectedOperator = null;
let selectedShift = null;
let selectedOP = null;

// ===========================
// INICIALIZACIÓN
// ===========================
document.addEventListener('DOMContentLoaded', function () {
    initializeOperatorView();
    updateTime();
    setInterval(updateTime, 1000);
});

function initializeOperatorView() {
    loadMachines();
    loadOperators();
    setupEventListeners();
}

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

// ===========================
// CARGA DE DATOS
// ===========================
function loadMachines() {
    const machines = dataManager.getMachines();
    const select = document.getElementById('machineSelect');

    machines.forEach(machine => {
        const option = document.createElement('option');
        option.value = machine.id;
        option.textContent = machine.name;
        select.appendChild(option);
    });
}

function loadOperators() {
    const operators = dataManager.getOperators();
    const select = document.getElementById('operatorSelect');

    operators.forEach(operator => {
        const option = document.createElement('option');
        option.value = operator.name;
        option.textContent = operator.name;
        select.appendChild(option);
    });
}



function loadOPs() {
    const ops = dataManager.getOPs();
    const opList = document.getElementById('opList');
    opList.innerHTML = '';

    ops.forEach(op => {
        const opItem = createOPItem(op);
        opList.appendChild(opItem);
    });
}

function createOPItem(op) {
    const div = document.createElement('div');
    div.className = 'op-item';
    div.onclick = () => selectOP(op.id);

    div.innerHTML = `
        <div class="op-item-header">
            <span class="op-id">${op.id}</span>
        </div>
        <div class="op-description">${op.description}</div>
        <div class="op-meta">
            <div class="op-meta-item">
                <span class="op-meta-label">Cliente</span>
                <span>${op.client}</span>
            </div>
            <div class="op-meta-item">
                <span class="op-meta-label">Cantidad</span>
                <span>${op.quantity} piezas</span>
            </div>
            <div class="op-meta-item">
                <span class="op-meta-label">Material</span>
                <span>${op.material}</span>
            </div>
        </div>
    `;

    return div;
}

// ===========================
// EVENT LISTENERS
// ===========================
function setupEventListeners() {
    // Machine change
    document.getElementById('machineSelect').addEventListener('change', validateStep1);

    // Operator change
    document.getElementById('operatorSelect').addEventListener('change', validateStep1);

    // Shift radio buttons
    document.querySelectorAll('input[name="shift"]').forEach(radio => {
        radio.addEventListener('change', validateStep1);
    });

    // OP Search
    document.getElementById('opSearch').addEventListener('input', filterOPs);
}

function validateStep1() {
    const machine = document.getElementById('machineSelect').value;
    const operator = document.getElementById('operatorSelect').value;
    const shift = document.querySelector('input[name="shift"]:checked');

    const isValid = machine && operator && shift;
    document.getElementById('continueBtn').disabled = !isValid;

    if (isValid) {
        selectedMachine = machine;
        selectedOperator = operator;
        selectedShift = shift.value;
    }
}

function filterOPs() {
    const searchTerm = document.getElementById('opSearch').value.toLowerCase();
    const opItems = document.querySelectorAll('.op-item');

    opItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// ===========================
// NAVEGACIÓN ENTRE PASOS
// ===========================
function goToStep1() {
    hideAllSteps();
    document.getElementById('step1').classList.remove('hidden');
    currentStep = 1;
}

function goToStep2() {
    if (!selectedMachine || !selectedShift) {
        alert('Por favor completa todos los campos antes de continuar');
        return;
    }

    hideAllSteps();
    document.getElementById('step2').classList.remove('hidden');
    loadOPs();
    currentStep = 2;
}

function goToStep3() {
    if (!selectedOP) {
        alert('Por favor selecciona una Orden de Producción');
        return;
    }

    hideAllSteps();
    document.getElementById('step3').classList.remove('hidden');
    currentStep = 3;
}

function showProblemForm() {
    hideAllSteps();
    document.getElementById('step4').classList.remove('hidden');
    currentStep = 4;
}

function hideAllSteps() {
    document.querySelectorAll('section.card').forEach(step => {
        step.classList.add('hidden');
    });
}

// ===========================
// SELECCIÓN DE OP
// ===========================
function selectOP(opId) {
    selectedOP = dataManager.getOPById(opId);

    // Marcar visualmente
    document.querySelectorAll('.op-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // Mostrar detalle
    showOPDetail(selectedOP);

    // Habilitar botón
    document.getElementById('continueOpBtn').disabled = false;
}

function showOPDetail(op) {
    const detailDiv = document.getElementById('opDetail');
    detailDiv.classList.remove('hidden');

    detailDiv.innerHTML = `
        <h3>✓ OP Seleccionada</h3>
        <div class="op-detail-grid">
            <div class="op-detail-item">
                <span class="op-detail-label">Orden de Producción</span>
                <span class="op-detail-value">${op.id}</span>
            </div>
            <div class="op-detail-item">
                <span class="op-detail-label">Descripción</span>
                <span class="op-detail-value">${op.description}</span>
            </div>
            <div class="op-detail-item">
                <span class="op-detail-label">Cliente</span>
                <span class="op-detail-value">${op.client}</span>
            </div>
            <div class="op-detail-item">
                <span class="op-detail-label">Cantidad</span>
                <span class="op-detail-value">${op.quantity} piezas</span>
            </div>
            <div class="op-detail-item">
                <span class="op-detail-label">Material</span>
                <span class="op-detail-value">${op.material}</span>
            </div>
            <div class="op-detail-item">
                <span class="op-detail-label">Programa CNC</span>
                <span class="op-detail-value">${op.program}</span>
            </div>
        </div>
    `;
}

// ===========================
// REGISTRO SIN PROBLEMAS
// ===========================
function registerNoProblems() {
    // Crear registro simple
    const incident = {
        op_id: selectedOP.id,
        machine: selectedMachine,
        operator: selectedOperator,
        shift: selectedShift,
        type: 'Sin problemas',
        severity: 'low',
        description: 'Todo correcto. Sin incidencias.',
        affected_pieces: 0,
        needs_review: false
    };

    dataManager.addIncident(incident);

    showConfirmation('Sin problemas registrados',
        `Registro guardado correctamente para ${selectedOP.id}. Todo funcionó sin incidencias.`);
}

// ===========================
// GUARDAR INCIDENCIA
// ===========================
function saveIncident() {
    // Recoger tipos de problema seleccionados
    const problemTypes = [];
    document.querySelectorAll('input[name="problemType"]:checked').forEach(checkbox => {
        problemTypes.push(checkbox.value);
    });

    if (problemTypes.length === 0) {
        alert('Por favor selecciona al menos un tipo de problema');
        return;
    }

    const description = document.getElementById('problemDescription').value;
    if (!description.trim()) {
        alert('Por favor describe el problema');
        return;
    }

    const severity = document.querySelector('input[name="severity"]:checked');
    if (!severity) {
        alert('Por favor selecciona la severidad');
        return;
    }

    // Crear incidente
    const incident = {
        op_id: selectedOP.id,
        machine: selectedMachine,
        operator: selectedOperator,
        shift: selectedShift,
        type: problemTypes.join(', '),
        severity: severity.value,
        description: description,
        affected_pieces: parseInt(document.getElementById('affectedPieces').value) || 0,
        needs_review: document.getElementById('needsReview').checked
    };

    dataManager.addIncident(incident);

    showConfirmation('Incidencia registrada',
        `Incidencia guardada para ${selectedOP.id}. 
        ${incident.needs_review ? 'El responsable será notificado para revisión.' : ''}`);
}

// ===========================
// CONFIRMACIÓN Y RESET
// ===========================
function showConfirmation(title, message) {
    hideAllSteps();
    document.getElementById('step5').classList.remove('hidden');
    document.getElementById('confirmationMessage').textContent = message;
    currentStep = 5;
}

function resetForm() {
    // Limpiar selecciones
    selectedMachine = null;
    selectedOperator = null;
    selectedShift = null;
    selectedOP = null;

    // Resetear formularios
    document.getElementById('machineSelect').value = '';
    document.getElementById('operatorSelect').value = '';
    document.querySelectorAll('input[name="shift"]').forEach(radio => radio.checked = false);
    document.getElementById('opSearch').value = '';
    document.getElementById('problemDescription').value = '';
    document.getElementById('affectedPieces').value = '0';
    document.getElementById('needsReview').checked = false;
    document.querySelectorAll('input[name="problemType"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="severity"]').forEach(radio => radio.checked = false);

    // Volver al paso 1
    goToStep1();
}
