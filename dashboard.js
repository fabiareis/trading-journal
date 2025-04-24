// Variáveis globais
let currentMonth = new Date().getMonth() + 1;
let dailyOperations = [];
let monthlyResults = new Array(12).fill(0);
let patrimony = 2000; // Valor inicial do patrimônio

// Configurações
const CONFIG = {
    dailyLossLimit: 100,
    dailyGainTarget: 200,
    monthlyTarget: 2000,
    defaultGain: 200,
    defaultLoss: 100
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeMonthButtons();
    initializeMultiplierButtons();
    initializeCharts();
    loadSavedData();
    updateDashboard();
});

// Funções de inicialização
function initializeMonthButtons() {
    document.querySelectorAll('.month-button').forEach(button => {
        button.addEventListener('click', () => {
            const month = parseInt(button.dataset.month);
            selectMonth(month);
        });
    });
}

function initializeMultiplierButtons() {
    document.querySelectorAll('.multiplier').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.multiplier').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            updateGainLossTable();
        });
    });

    document.querySelectorAll('.entry-mult').forEach(button => {
        button.addEventListener('click', () => {
            updateGainLossTable();
        });
    });
}

// Funções de atualização
function selectMonth(month) {
    currentMonth = month;
    document.querySelectorAll('.month-button').forEach(button => {
        const buttonMonth = parseInt(button.dataset.month);
        button.classList.toggle('active', buttonMonth === month);
    });
    updateDashboard();
}

function updateGainLossTable() {
    const activeMultiplier = document.querySelector('.multiplier.active');
    const multiplierText = activeMultiplier.textContent;
    let [gain, loss] = getGainLossValues(multiplierText);

    const tbody = document.querySelector('#gainLossTable tbody');
    tbody.innerHTML = '';

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>R$ ${gain.toFixed(2)}</td>
        <td>R$ ${loss.toFixed(2)}</td>
        <td>R$ ${(loss / 2).toFixed(2)}</td>
        <td>R$ ${(loss / 3).toFixed(2)}</td>
        <td>R$ ${(loss / 4).toFixed(2)}</td>
    `;
    tbody.appendChild(row);
}

function getGainLossValues(multiplierText) {
    const [gainMult, lossMult] = multiplierText.split('x').map(n => parseFloat(n));
    const baseValue = CONFIG.defaultLoss;
    return [baseValue * gainMult, baseValue * lossMult];
}

function updateDashboard() {
    updateOperationsTable();
    updateMonthlyResultChart();
    updateEquityChart();
    updateGainLossEstimateChart();
}

function updateOperationsTable() {
    const tbody = document.querySelector('#dailyOperations tbody');
    tbody.innerHTML = '';

    const monthOperations = dailyOperations.filter(op => {
        const opDate = new Date(op.date);
        return opDate.getMonth() + 1 === currentMonth;
    });

    monthOperations.forEach(op => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(op.date)}</td>
            <td>R$ ${op.tradeValue.toFixed(2)}</td>
            <td>R$ ${op.expenses.toFixed(2)}</td>
            <td>R$ ${op.iss.toFixed(2)}</td>
            <td>R$ ${op.irrf.toFixed(2)}</td>
            <td class="${op.result >= 0 ? 'positive' : 'negative'}">R$ ${op.result.toFixed(2)}</td>
            <td class="${op.netTotal >= 0 ? 'positive' : 'negative'}">R$ ${op.netTotal.toFixed(2)}</td>
            <td><span class="badge badge-${op.status === 'gain' ? 'success' : 'error'}">${op.status === 'gain' ? '✓' : '✗'}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Funções dos gráficos
function initializeCharts() {
    createMonthlyResultChart();
    createEquityChart();
    createGainLossEstimateChart();
}

function createMonthlyResultChart() {
    const ctx = document.getElementById('monthlyResultChart').getContext('2d');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthNames,
            datasets: [{
                label: 'Resultado Mensal',
                data: monthlyResults,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução do Resultado Mensal'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createEquityChart() {
    const ctx = document.getElementById('equityChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Patrimônio'],
            datasets: [{
                label: 'Valor Atual',
                data: [patrimony],
                backgroundColor: patrimony >= 0 ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)',
                borderColor: patrimony >= 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Patrimônio Atual'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createGainLossEstimateChart() {
    const ctx = document.getElementById('gainLossEstimateChart').getContext('2d');
    const days = Array.from({length: 11}, (_, i) => i + 1);
    const gainValues = days.map(day => CONFIG.dailyGainTarget * day);
    const lossValues = days.map(day => CONFIG.dailyLossLimit * day);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days.map(d => d + ' Dias'),
            datasets: [{
                label: 'Gain Estimado',
                data: gainValues,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1
            }, {
                label: 'Loss Máximo',
                data: lossValues,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Estimativas de Ganhos / Perdas'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Funções auxiliares
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function loadSavedData() {
    const savedOperations = localStorage.getItem('dailyOperations');
    if (savedOperations) {
        dailyOperations = JSON.parse(savedOperations);
        calculateMonthlyResults();
    }
}

function calculateMonthlyResults() {
    monthlyResults = new Array(12).fill(0);
    dailyOperations.forEach(op => {
        const date = new Date(op.date);
        const month = date.getMonth();
        monthlyResults[month] += op.netTotal;
    });
}

// Adicionar a função de registro de operações
function handleOperationSubmit(event) {
    event.preventDefault();

    const operation = {
        date: document.getElementById('operationDate').value,
        tradeValue: parseFloat(document.getElementById('tradeValue').value),
        expenses: parseFloat(document.getElementById('expenses').value),
        iss: parseFloat(document.getElementById('iss').value),
        irrf: parseFloat(document.getElementById('irrf').value)
    };

    // Calcular resultado e total líquido
    operation.result = operation.tradeValue;
    operation.netTotal = operation.result - operation.expenses - operation.iss - operation.irrf;
    operation.status = operation.netTotal >= 0 ? 'gain' : 'loss';

    // Verificar limites
    if (operation.netTotal < -CONFIG.dailyLossLimit) {
        if (!confirm('O prejuízo excede o limite diário de loss. Deseja continuar?')) {
            return;
        }
    }

    // Adicionar operação ao array
    dailyOperations.push(operation);
    localStorage.setItem('dailyOperations', JSON.stringify(dailyOperations));

    // Atualizar patrimônio
    patrimony += operation.netTotal;

    // Limpar formulário
    document.getElementById('operationForm').reset();

    // Atualizar dashboard
    calculateMonthlyResults();
    updateDashboard();

    // Mostrar mensagem de sucesso
    alert('Operação registrada com sucesso!');
}

// Atualizar funções de gráficos para recriar ao atualizar
function updateMonthlyResultChart() {
    const chart = Chart.getChart('monthlyResultChart');
    if (chart) {
        chart.destroy();
    }
    createMonthlyResultChart();
}

function updateEquityChart() {
    const chart = Chart.getChart('equityChart');
    if (chart) {
        chart.destroy();
    }
    createEquityChart();
}

function updateGainLossEstimateChart() {
    const chart = Chart.getChart('gainLossEstimateChart');
    if (chart) {
        chart.destroy();
    }
    createGainLossEstimateChart();
}

// Adicionar função para exportar relatório mensal
function exportMonthlyReport() {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.text(`Relatório Mensal - ${monthNames[currentMonth - 1]}`, 105, 20, { align: 'center' });
    
    // Resultados do mês
    const monthOperations = dailyOperations.filter(op => {
        const opDate = new Date(op.date);
        return opDate.getMonth() + 1 === currentMonth;
    });
    
    const totalResult = monthOperations.reduce((sum, op) => sum + op.netTotal, 0);
    const totalGains = monthOperations.filter(op => op.netTotal > 0).length;
    const totalLosses = monthOperations.filter(op => op.netTotal < 0).length;
    const winRate = (totalGains / monthOperations.length * 100) || 0;
    
    let y = 40;
    doc.setFontSize(12);
    doc.text(`Total de Operações: ${monthOperations.length}`, 20, y); y += 10;
    doc.text(`Operações Positivas: ${totalGains}`, 20, y); y += 10;
    doc.text(`Operações Negativas: ${totalLosses}`, 20, y); y += 10;
    doc.text(`Taxa de Acerto: ${winRate.toFixed(2)}%`, 20, y); y += 10;
    doc.text(`Resultado Total: R$ ${totalResult.toFixed(2)}`, 20, y); y += 20;
    
    // Tabela de operações
    const headers = ['Data', 'Valor Neg.', 'Despesas', 'ISS', 'IRRF', 'Result.', 'Total Líq.'];
    let startY = y;
    
    // Cabeçalho da tabela
    doc.setFillColor(200, 200, 200);
    headers.forEach((header, i) => {
        doc.rect(20 + i * 25, startY - 5, 25, 7, 'F');
        doc.text(header, 22 + i * 25, startY);
    });
    
    // Dados da tabela
    monthOperations.forEach((op, index) => {
        y = startY + 10 + (index * 7);
        if (y > 280) {
            doc.addPage();
            y = 20;
            startY = y;
            
            // Cabeçalho na nova página
            headers.forEach((header, i) => {
                doc.rect(20 + i * 25, startY - 5, 25, 7, 'F');
                doc.text(header, 22 + i * 25, startY);
            });
            y += 10;
        }
        
        doc.text(formatDate(op.date), 22, y);
        doc.text(`R$ ${op.tradeValue.toFixed(2)}`, 47, y);
        doc.text(`R$ ${op.expenses.toFixed(2)}`, 72, y);
        doc.text(`R$ ${op.iss.toFixed(2)}`, 97, y);
        doc.text(`R$ ${op.irrf.toFixed(2)}`, 122, y);
        doc.text(`R$ ${op.result.toFixed(2)}`, 147, y);
        doc.text(`R$ ${op.netTotal.toFixed(2)}`, 172, y);
    });
    
    // Salvar PDF
    doc.save(`Relatorio_${monthNames[currentMonth - 1]}.pdf`);
}

// Adicionar event listeners para os botões de navegação
document.getElementById('annualBtn').addEventListener('click', () => {
    // Implementar visualização anual
});

document.getElementById('lrBtn').addEventListener('click', () => {
    // Implementar visualização de lucros e riscos
});

document.getElementById('grBtn').addEventListener('click', () => {
    // Implementar gerenciamento de risco
});

document.getElementById('tutorialBtn').addEventListener('click', () => {
    alert('Tutorial em desenvolvimento...');
}); 