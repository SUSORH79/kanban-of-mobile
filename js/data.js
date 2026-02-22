// ===========================
// CAPA DE DATOS Y GESTIÓN DE STORAGE
// ===========================

class DataManager {
    constructor() {
        this.STORAGE_KEYS = {
            INCIDENTS: 'cnc_incidents',
            OPS: 'cnc_ops',
            OPERATORS: 'cnc_operators',           // Operarios CNC
            WORKSHOP_OPERATORS: 'workshop_operators',  // Operarios Taller
            MACHINES: 'cnc_machines'
        };

        this.initializeDefaultData();
    }

    // ===========================
    // INICIALIZACIÓN DE DATOS
    // ===========================
    initializeDefaultData() {
        // Inicializar máquinas si no existen
        if (!this.getMachines().length) {
            const defaultMachines = [
                { id: 'CNC_BIESSE', name: 'CNC BIESSE', status: 'active' },
                { id: 'CNC_SCM', name: 'CNC SCM', status: 'active' },
                { id: 'CNC_MORBIDELLI', name: 'CNC MORBIDELLI', status: 'active' },
                { id: 'FRESA', name: 'FRESA', status: 'active' }
            ];
            this.saveMachines(defaultMachines);
        }

        // Inicializar operarios si no existen
        if (!this.getOperators().length) {
            const defaultOperators = [];
            this.saveOperators(defaultOperators);
        }

        // Inicializar OPs vacías
        if (!this.getOPs().length) {
            const defaultOPs = [];
            this.saveOPs(defaultOPs);
        }

        // Inicializar operarios de taller si no existen
        if (!this.getWorkshopOperators().length) {
            const defaultWorkshopOps = [];
            this.saveWorkshopOperators(defaultWorkshopOps);
        }

        // Inicializar incidentes vacío si no existe
        if (!localStorage.getItem(this.STORAGE_KEYS.INCIDENTS)) {
            this.saveIncidents([]);
        }
    }

    // ===========================
    // MÉTODOS DE MÁQUINAS
    // ===========================
    getMachines() {
        const data = localStorage.getItem(this.STORAGE_KEYS.MACHINES);
        return data ? JSON.parse(data) : [];
    }

    saveMachines(machines) {
        localStorage.setItem(this.STORAGE_KEYS.MACHINES, JSON.stringify(machines));
    }

    // ===========================
    // MÉTODOS DE OPERARIOS
    // ===========================
    getOperators() {
        const data = localStorage.getItem(this.STORAGE_KEYS.OPERATORS);
        return data ? JSON.parse(data) : [];
    }

    getOperatorById(operatorId) {
        const operators = this.getOperators();
        return operators.find(op => op.id === operatorId);
    }

    saveOperators(operators) {
        localStorage.setItem(this.STORAGE_KEYS.OPERATORS, JSON.stringify(operators));
    }

    addOperator(operator) {
        const operators = this.getOperators();
        // Generate ID if not provided
        if (!operator.id) {
            const maxId = operators.length > 0
                ? Math.max(...operators.map(o => o.id))
                : 0;
            operator.id = maxId + 1;
        }
        operators.push(operator);
        this.saveOperators(operators);
        return operator;
    }

    updateOperator(operatorId, updates) {
        const operators = this.getOperators();
        const index = operators.findIndex(op => op.id === operatorId);

        if (index !== -1) {
            operators[index] = { ...operators[index], ...updates };
            this.saveOperators(operators);
            return operators[index];
        }

        return null;
    }

    deleteOperator(operatorId) {
        let operators = this.getOperators();
        operators = operators.filter(op => op.id !== operatorId);
        this.saveOperators(operators);
    }

    // ===========================
    // MÉTODOS DE OPs
    // ===========================
    getOPs() {
        const data = localStorage.getItem(this.STORAGE_KEYS.OPS);
        return data ? JSON.parse(data) : [];
    }

    getOPById(opId) {
        const ops = this.getOPs();
        return ops.find(op => op.id === opId);
    }

    saveOPs(ops) {
        localStorage.setItem(this.STORAGE_KEYS.OPS, JSON.stringify(ops));
    }

    addOP(op) {
        const ops = this.getOPs();
        op.status = 'active';
        ops.push(op);
        this.saveOPs(ops);
        return op;
    }

    updateOP(opId, updates) {
        const ops = this.getOPs();
        const index = ops.findIndex(op => op.id === opId);

        if (index !== -1) {
            ops[index] = { ...ops[index], ...updates };
            this.saveOPs(ops);
            return ops[index];
        }

        return null;
    }

    deleteOP(opId) {
        let ops = this.getOPs();
        ops = ops.filter(op => op.id !== opId);
        this.saveOPs(ops);
    }

    // ===========================
    // MÉTODOS DE OPERARIOS DE TALLER
    // ===========================
    getWorkshopOperators() {
        const data = localStorage.getItem(this.STORAGE_KEYS.WORKSHOP_OPERATORS);
        return data ? JSON.parse(data) : [];
    }

    saveWorkshopOperators(operators) {
        localStorage.setItem(this.STORAGE_KEYS.WORKSHOP_OPERATORS, JSON.stringify(operators));
    }

    addWorkshopOperator(operator) {
        const operators = this.getWorkshopOperators();
        if (!operator.id) {
            const maxId = operators.length > 0
                ? Math.max(...operators.map(o => o.id))
                : 0;
            operator.id = maxId + 1;
        }
        operators.push(operator);
        this.saveWorkshopOperators(operators);
        return operator;
    }

    updateWorkshopOperator(operatorId, updates) {
        const operators = this.getWorkshopOperators();
        const index = operators.findIndex(op => op.id === operatorId);

        if (index !== -1) {
            operators[index] = { ...operators[index], ...updates };
            this.saveWorkshopOperators(operators);
            return operators[index];
        }

        return null;
    }

    deleteWorkshopOperator(operatorId) {
        let operators = this.getWorkshopOperators();
        operators = operators.filter(op => op.id !== operatorId);
        this.saveWorkshopOperators(operators);
    }

    // ===========================
    // MÉTODOS DE INCIDENCIAS
    // ===========================
    getIncidents() {
        const data = localStorage.getItem(this.STORAGE_KEYS.INCIDENTS);
        return data ? JSON.parse(data) : [];
    }

    saveIncidents(incidents) {
        localStorage.setItem(this.STORAGE_KEYS.INCIDENTS, JSON.stringify(incidents));
    }

    addIncident(incident) {
        const incidents = this.getIncidents();

        // Generar ID único
        incident.id = this.generateId();
        incident.date = new Date().toISOString();
        incident.status = 'pending';

        incidents.push(incident);
        this.saveIncidents(incidents);

        return incident;
    }

    updateIncident(incidentId, updates) {
        const incidents = this.getIncidents();
        const index = incidents.findIndex(inc => inc.id === incidentId);

        if (index !== -1) {
            incidents[index] = { ...incidents[index], ...updates };
            this.saveIncidents(incidents);
            return incidents[index];
        }

        return null;
    }

    deleteIncident(incidentId) {
        let incidents = this.getIncidents();
        incidents = incidents.filter(inc => inc.id !== incidentId);
        this.saveIncidents(incidents);
    }

    // ===========================
    // ESTADÍSTICAS Y REPORTES
    // ===========================
    getStatsByDateRange(startDate, endDate) {
        const incidents = this.getIncidents();
        const filtered = incidents.filter(inc => {
            const incDate = new Date(inc.date);
            return incDate >= new Date(startDate) && incDate <= new Date(endDate);
        });

        // Filtrar solo incidencias reales (excluir "Sin problemas")
        const withProblems = filtered.filter(inc => inc.type !== 'Sin problemas');

        return {
            total: filtered.length,  // Total de registros (con y sin problemas)
            totalWithProblems: withProblems.length,  // Solo registros con problemas
            byType: this.groupBy(withProblems, 'type'),  // Solo contar problemas reales
            byMachine: this.groupBy(withProblems, 'machine'),  // Solo máquinas con problemas
            bySeverity: this.groupBy(withProblems, 'severity'),
            totalAffected: withProblems.reduce((sum, inc) => sum + (inc.affected_pieces || 0), 0),
            affectedByMachine: this.sumAffectedBy(withProblems, 'machine'),
            affectedByType: this.sumAffectedBy(withProblems, 'type')
        };
    }

    getWeeklyStats() {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lunes
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return this.getStatsByDateRange(startOfWeek, endOfWeek);
    }

    getMonthlyStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return this.getStatsByDateRange(startOfMonth, endOfMonth);
    }

    // ===========================
    // UTILIDADES
    // ===========================
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key] || 'Sin especificar';
            result[group] = (result[group] || 0) + 1;
            return result;
        }, {});
    }

    sumAffectedBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key] || 'Sin especificar';
            result[group] = (result[group] || 0) + (item.affected_pieces || 0);
            return result;
        }, {});
    }

    generateId() {
        return 'INC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Método para exportar datos (para debugging)
    exportAllData() {
        return {
            incidents: this.getIncidents(),
            ops: this.getOPs(),
            operators: this.getOperators(),
            machines: this.getMachines()
        };
    }

    // Método para limpiar datos (para testing)
    clearAllData() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.initializeDefaultData();
    }
}

// Instancia global del gestor de datos
const dataManager = new DataManager();
