// ===========================
// CONFIGURACIÓN DE GRÁFICOS
// ===========================

let chartByMachine = null;
let chartByType = null;
let chartBySeverity = null;
let chartAffectedByMachine = null;
let chartAffectedByType = null;

// ===========================
// GRÁFICO: INCIDENCIAS POR MÁQUINA
// ===========================
function loadChartByMachine(stats) {
    const ctx = document.getElementById('chartByMachine');

    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (chartByMachine) {
        chartByMachine.destroy();
    }

    const labels = Object.keys(stats.byMachine);
    const data = Object.values(stats.byMachine);

    chartByMachine = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Incidencias',
                data: data,
                backgroundColor: [
                    'rgba(37, 99, 235, 0.8)',
                    'rgba(8, 145, 178, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgb(37, 99, 235)',
                    'rgb(8, 145, 178)',
                    'rgb(16, 185, 129)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ===========================
// GRÁFICO: INCIDENCIAS POR TIPO
// ===========================
function loadChartByType(stats) {
    const ctx = document.getElementById('chartByType');

    if (!ctx) return;

    if (chartByType) {
        chartByType.destroy();
    }

    const filtered = Object.entries(stats.byType).filter(([type]) => type !== 'Sin problemas');
    const labels = filtered.map(([type]) => type);
    const data = filtered.map(([, count]) => count);

    chartByType = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(8, 145, 178, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(245, 158, 11)',
                    'rgb(234, 179, 8)',
                    'rgb(16, 185, 129)',
                    'rgb(8, 145, 178)',
                    'rgb(168, 85, 247)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#cbd5e1',
                        padding: 15
                    }
                }
            }
        }
    });
}

// ===========================
// GRÁFICO: SEVERIDAD
// ===========================
function loadChartBySeverity(stats) {
    const ctx = document.getElementById('chartBySeverity');

    if (!ctx) return;

    if (chartBySeverity) {
        chartBySeverity.destroy();
    }

    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const severityLabels = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta',
        'critical': 'Crítica'
    };

    const labels = severityOrder.map(s => severityLabels[s]);
    const data = severityOrder.map(s => stats.bySeverity[s] || 0);

    chartBySeverity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Incidencias por severidad',
                data: data,
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(234, 179, 8)',
                    'rgb(249, 115, 22)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e1',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1',
                        padding: 15
                    }
                }
            }
        }
    });
}

// ===========================
// GRÁFICO: PIEZAS AFECTADAS POR MÁQUINA
// ===========================
function loadChartAffectedByMachine(stats) {
    const ctx = document.getElementById('chartAffectedByMachine');

    if (!ctx) return;

    if (chartAffectedByMachine) {
        chartAffectedByMachine.destroy();
    }

    const affectedData = stats.affectedByMachine || {};
    const labels = Object.keys(affectedData);
    const data = Object.values(affectedData);

    chartAffectedByMachine = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Piezas afectadas',
                data: data,
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ===========================
// GRÁFICO: PIEZAS AFECTADAS POR TIPO
// ===========================
function loadChartAffectedByType(stats) {
    const ctx = document.getElementById('chartAffectedByType');

    if (!ctx) return;

    if (chartAffectedByType) {
        chartAffectedByType.destroy();
    }

    const affectedData = stats.affectedByType || {};
    const filtered = Object.entries(affectedData)
        .filter(([type]) => type !== 'Sin problemas')
        .sort((a, b) => b[1] - a[1]);

    const labels = filtered.map(([type]) => type);
    const data = filtered.map(([, count]) => count);

    const colors = [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(14, 165, 233, 0.8)'
    ];

    chartAffectedByType = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Piezas afectadas',
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: colors.slice(0, labels.length).map(c => c.replace('0.8', '1')),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ===========================
// UTILIDAD PARA REPORTES (CAPTURA EN TEMA CLARO)
// ===========================
function captureChartLight(chart) {
    if (!chart) return null;

    // Guardar opciones originales
    const originalOptions = JSON.parse(JSON.stringify(chart.options));

    // Forzar tema claro para la captura
    chart.options.plugins.legend.labels.color = '#1f2937';
    if (chart.options.scales) {
        if (chart.options.scales.x && chart.options.scales.x.ticks) {
            chart.options.scales.x.ticks.color = '#1f2937';
        }
        if (chart.options.scales.y && chart.options.scales.y.ticks) {
            chart.options.scales.y.ticks.color = '#1f2937';
        }
    }

    // Actualizar sin animación para que sea instantáneo
    chart.update('none');
    const image = chart.toBase64Image();

    // Restaurar opciones originales
    chart.options = originalOptions;
    chart.update('none');

    return image;
}
