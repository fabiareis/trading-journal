// Variáveis globais
let trades = [];
let currentTab = 'overview';

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadSavedTrades();
    initializeTabButtons();
    updateDashboard();
    handleAccountTypeChange();
});

// Funções de inicialização
function initializeTabButtons() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tab);
    });
    currentTab = tab;
    if (tab === 'evolution') {
        updateEvolutionChart();
    }
}

// Funções de manipulação de dados
function handleTradeSubmit(event) {
    event.preventDefault();
    const trade = {
        date: document.getElementById('date').value,
        accountType: document.getElementById('accountType').value,
        asset: document.getElementById('asset').value,
        operationType: document.getElementById('operationType').value,
        analysisType: document.getElementById('analysisType').value,
        contracts: parseInt(document.getElementById('contracts').value),
        entryPrice: parseFloat(document.getElementById('entryPrice').value),
        exitPrice: parseFloat(document.getElementById('exitPrice').value),
        entryReason: document.getElementById('entryReason').value
    };

    if (trade.accountType === 'Conta pessoal') {
        trade.allocatedCapital = parseFloat(document.getElementById('allocatedCapital').value) || 0;
    } else if (trade.accountType.startsWith('Mesa Proprietária')) {
        trade.testValue = parseFloat(document.getElementById('testValue').value) || 0;
    }

    trade.points = calculatePoints(trade);
    trade.result = calculateResult(trade);

    trades.push(trade);
    saveTrades();
    updateDashboard();
    event.target.reset();
    alert('Operação registrada com sucesso!');
}

function calculatePoints(trade) {
    const multiplier = trade.operationType === 'Compra' ? 1 : -1;
    return multiplier * (trade.exitPrice - trade.entryPrice);
}

function calculateResult(trade) {
    const pointValue = 5; // Valor do ponto em reais
    return trade.points * trade.contracts * pointValue;
}

function handleAccountTypeChange() {
    const accountType = document.getElementById('accountType').value;
    const capitalGroup = document.getElementById('capitalGroup');
    const testValueGroup = document.getElementById('testValueGroup');

    if (accountType === 'Conta pessoal') {
        capitalGroup.style.display = 'block';
        testValueGroup.style.display = 'none';
    } else if (accountType.startsWith('Mesa Proprietária')) {
        capitalGroup.style.display = 'none';
        testValueGroup.style.display = 'block';
    } else {
        capitalGroup.style.display = 'none';
        testValueGroup.style.display = 'none';
    }
}

// Funções de atualização do dashboard
function updateDashboard() {
    updateMetrics();
    updateTradesTable();
    if (currentTab === 'evolution') {
        updateEvolutionChart();
    }
}

function updateMetrics() {
    const results = trades.map(trade => trade.result);
    const totalResult = results.reduce((sum, result) => sum + result, 0);
    const winningTrades = trades.filter(trade => trade.result > 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
    const averageResult = trades.length > 0 ? totalResult / trades.length : 0;

    document.getElementById('totalResult').textContent = formatCurrency(totalResult);
    document.getElementById('winRate').textContent = `${winRate.toFixed(1)}%`;
    document.getElementById('winRate').style.width = `${winRate}%`;
    document.getElementById('averageResult').textContent = formatCurrency(averageResult);

    updateAccountSummary();
}

function updateAccountSummary() {
    const personalTrades = trades.filter(trade => trade.accountType === 'Conta pessoal');
    const proprietaryTrades = trades.filter(trade => trade.accountType.startsWith('Mesa Proprietária'));

    const personalResult = personalTrades.reduce((sum, trade) => sum + trade.result, 0);
    const proprietaryResult = proprietaryTrades.reduce((sum, trade) => sum + trade.result, 0);

    const lastPersonalTrade = personalTrades[personalTrades.length - 1];
    const personalCapital = lastPersonalTrade ? lastPersonalTrade.allocatedCapital : 0;
    const personalReturn = personalCapital > 0 ? (personalResult / personalCapital) * 100 : 0;

    const testValues = proprietaryTrades.reduce((sum, trade) => sum + (trade.testValue || 0), 0);

    document.getElementById('personalCapital').textContent = formatCurrency(personalCapital);
    document.getElementById('personalResult').textContent = formatCurrency(personalResult);
    document.getElementById('personalReturn').textContent = `${personalReturn.toFixed(2)}%`;
    document.getElementById('testValues').textContent = formatCurrency(testValues);
    document.getElementById('proprietaryResult').textContent = formatCurrency(proprietaryResult);
}

function updateTradesTable() {
    const tbody = document.querySelector('#tradesTable tbody');
    tbody.innerHTML = '';

    const filteredTrades = filterTrades();
    
    filteredTrades.forEach(trade => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(trade.date)}</td>
            <td>${trade.accountType}</td>
            <td>${trade.asset}</td>
            <td>${trade.operationType}</td>
            <td>${trade.analysisType}</td>
            <td>${trade.contracts}</td>
            <td>${trade.entryPrice}</td>
            <td>${trade.exitPrice}</td>
            <td>${trade.points.toFixed(1)}</td>
            <td class="${trade.result >= 0 ? 'positive' : 'negative'}">${formatCurrency(trade.result)}</td>
            <td>${trade.entryReason}</td>
            <td><button onclick="generateReport(${trades.indexOf(trade)})">📊</button></td>
        `;
        tbody.appendChild(row);
    });
}

function filterTrades() {
    const account = document.getElementById('filterAccount').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    return trades.filter(trade => {
        const matchesAccount = !account || trade.accountType === account;
        const matchesDateRange = (!startDate || trade.date >= startDate) && 
                               (!endDate || trade.date <= endDate);
        return matchesAccount && matchesDateRange;
    });
}

function updateEvolutionChart() {
    const ctx = document.getElementById('evolutionChart').getContext('2d');
    const personalData = [];
    const proprietaryData = [];
    let currentPersonalBalance = 0;
    let currentProprietaryBalance = 0;

    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const dates = [...new Set(sortedTrades.map(trade => trade.date))];

    dates.forEach(date => {
        const dayTrades = sortedTrades.filter(trade => trade.date === date);
        
        const personalDayResult = dayTrades
            .filter(trade => trade.accountType === 'Conta pessoal')
            .reduce((sum, trade) => sum + trade.result, 0);
        currentPersonalBalance += personalDayResult;
        personalData.push({ x: date, y: currentPersonalBalance });

        const proprietaryDayResult = dayTrades
            .filter(trade => trade.accountType.startsWith('Mesa Proprietária'))
            .reduce((sum, trade) => sum + trade.result, 0);
        currentProprietaryBalance += proprietaryDayResult;
        proprietaryData.push({ x: date, y: currentProprietaryBalance });
    });

    if (window.evolutionChart) {
        window.evolutionChart.destroy();
    }

    window.evolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Conta Pessoal',
                data: personalData,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }, {
                label: 'Mesa Proprietária',
                data: proprietaryData,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    updateEvolutionSummary(personalData, proprietaryData);
}

function updateEvolutionSummary(personalData, proprietaryData) {
    if (personalData.length > 0 || proprietaryData.length > 0) {
        const allData = [...personalData, ...proprietaryData].sort((a, b) => new Date(a.x) - new Date(b.x));
        const startDate = allData[0].x;
        const currentDate = allData[allData.length - 1].x;
        const startValue = personalData[0]?.y || 0 + proprietaryData[0]?.y || 0;
        const currentValue = (personalData[personalData.length - 1]?.y || 0) + 
                           (proprietaryData[proprietaryData.length - 1]?.y || 0);

        document.getElementById('startPoint').textContent = formatCurrency(startValue);
        document.getElementById('currentPoint').textContent = formatCurrency(currentValue);
        document.getElementById('startDate').textContent = formatDate(startDate);
        document.getElementById('currentDate').textContent = formatDate(currentDate);
    }
}

// Funções de relatório
function generateReport(tradeIndex) {
    const trade = trades[tradeIndex];
    const report = `
RELATÓRIO DA OPERAÇÃO

Data: ${formatDate(trade.date)}
Conta: ${trade.accountType}
Ativo: ${trade.asset}
Tipo de Operação: ${trade.operationType}
Tipo de Análise: ${trade.analysisType}
Contratos: ${trade.contracts}
Preço de Entrada: ${trade.entryPrice}
Preço de Saída: ${trade.exitPrice}
Pontos: ${trade.points.toFixed(1)}
Resultado: ${formatCurrency(trade.result)}

Motivo da Entrada:
${trade.entryReason}
    `;

    const reportWindow = window.open('', 'Relatório da Operação', 'width=600,height=400');
    reportWindow.document.write(`<pre>${report}</pre>`);
}

// Funções auxiliares
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function saveTrades() {
    localStorage.setItem('trades', JSON.stringify(trades));
}

function loadSavedTrades() {
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades) {
        trades = JSON.parse(savedTrades);
    }
} 