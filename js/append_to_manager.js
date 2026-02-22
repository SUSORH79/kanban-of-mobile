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
    const workshopOperator = document.getElementById('reg_workshop_operator').value || null;

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
            workshop_operator: workshopOperator,
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
