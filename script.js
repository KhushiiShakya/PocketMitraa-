let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let pieChart, barChart;

function addTransaction() {
    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    if (!description || !amount || amount <= 0) return alert('Please enter valid details.');

    // Smart categorization
    let category = 'Other';
    if (description.toLowerCase().includes('food') || description.toLowerCase().includes('coffee') || description.toLowerCase().includes('meal')) category = 'Food';
    else if (description.toLowerCase().includes('rent') || description.toLowerCase().includes('tuition') || description.toLowerCase().includes('book')) category = 'Education';
    else if (description.toLowerCase().includes('salary') || description.toLowerCase().includes('job') || description.toLowerCase().includes('freelance')) category = 'Income';

    transactions.push({ id: Date.now(), type, description, amount, category, date: new Date().toLocaleDateString() });
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();
    checkNotifications();
}

function addGoal() {
    const name = document.getElementById('goalName').value;
    const amount = parseFloat(document.getElementById('goalAmount').value);
    if (!name || !amount || amount <= 0) return alert('Please enter valid goal details.');

    goals.push({ id: Date.now(), name, target: amount, saved: 0 });
    localStorage.setItem('goals', JSON.stringify(goals));
    updateUI();
}

function editTransaction(id) {
    const t = transactions.find(tr => tr.id === id);
    if (!t) return;
    const newDesc = prompt('Edit description:', t.description);
    const newAmount = parseFloat(prompt('Edit amount:', t.amount));
    if (newDesc && newAmount > 0) {
        t.description = newDesc;
        t.amount = newAmount;
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateUI();
    }
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();
}

function filterTransactions() {
    const filter = document.getElementById('filter').value;
    updateUI(filter);
}

function exportData() {
    let csv = 'Type,Description,Amount,Category,Date\n';
    transactions.forEach(t => csv += `${t.type},${t.description},${t.amount},${t.category},${t.date}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget_data.csv';
    a.click();
}

function checkNotifications() {
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    if (totalExpenses > income) alert('Warning: High expenses this month!');
    goals.forEach(g => {
        const progress = (g.saved / g.target) * 100;
        if (progress >= 100) alert(`Goal "${g.name}" achieved!`);
    });
}

function logout() {
    console.log('Logout clicked');  // Debug log
    alert('Logging out...');  // Debug alert
    localStorage.removeItem('user');
    localStorage.removeItem('transactions');  // Optional: Clear data on logout
    localStorage.removeItem('goals');
    window.location.href = 'login.html';  // Ensure this path is correct
}

function updateUI(filter = 'all') {
    const list = document.getElementById('transactions');
    const goalsDiv = document.getElementById('goals');
    list.innerHTML = '';
    goalsDiv.innerHTML = '';

    let income = 0, expenses = 0;
    const categories = {};
    const filteredTransactions = filter === 'all' ? transactions : transactions.filter(t => t.category === filter);

    filteredTransactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else expenses += t.amount;
        categories[t.category] = (categories[t.category] || 0) + t.amount;

        // Conditional progress: 100% if balance >= target, else based on balance
        const totalBalance = income - expenses;
        goals.forEach(g => {
            if (totalBalance >= g.target) {
                g.saved = g.target;  // 100% progress
            } else {
                g.saved = Math.max(0, totalBalance);  // Progress based on balance (non-negative)
            }
        });
        localStorage.setItem('goals', JSON.stringify(goals));

        list.innerHTML += `
        <div class="transaction ${t.type}">
            <div><strong>${t.description}</strong> (${t.category}) - ${t.date}</div>
            <div>₹${t.amount} <div class="actions">
                <button onclick="editTransaction(${t.id})" title="Edit this transaction" class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="deleteTransaction(${t.id})" title="Delete this transaction" class="delete-btn"><i class="fas fa-trash"></i> Delete</button>
            </div></div>
        </div>`;
    });

    goals.forEach(g => {
        const progress = (g.saved / g.target) * 100;  // Calculate % progress
        goalsDiv.innerHTML += `
        <div class="goal">
            <strong>${g.name}:</strong> ₹${g.saved} / ₹${g.target}
            <div class="progress">
                <div class="progress-bar" style="width: ${progress}%"></div>  <!-- Bar fills based on % -->
            </div>
        </div>`;
    });

    document.getElementById('totalIncome').textContent = income.toFixed(2);
    document.getElementById('totalExpenses').textContent = expenses.toFixed(2);
    document.getElementById('balance').textContent = (income - expenses).toFixed(2);

    // Update charts
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(document.getElementById('pieChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{ data: Object.values(categories), backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56'] }]
        },
        options: { responsive: true, plugins: { tooltip: { callbacks: { label: (ctx) => `₹${ctx.raw}` } } } }
    });

    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{ label: 'Amount (₹)', data: [income, expenses], backgroundColor: ['#28a745', '#dc3545'] }]
        },
        options: { responsive: true }
    });
}

// Check login and load
const userData = JSON.parse(localStorage.getItem('user'));
if (!userData || !userData.email) {
    console.log('No user found, redirecting to login');  // Debug log
    window.location.href = 'login.html';
} else {
    document.getElementById('greeting').textContent = `Welcome back, ${userData.name}!`;  // Show name instead of email
    updateUI();
}