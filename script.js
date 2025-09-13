
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const transactionList = document.getElementById('transaction-list');
const addBtn = document.getElementById('add-btn');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const type = document.getElementById('type');
const category = document.getElementById('category');
const themeToggle = document.getElementById('theme-toggle');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');


let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
const THEME_KEY = 'exp-theme';

if (localStorage.getItem(THEME_KEY) === 'dark') {
  document.body.classList.add('dark-mode');
}


const CATEGORY_COLORS = {
  General: '#9e9e9e',
  Food: '#ff6384',
  Travel: '#36a2eb',
  Shopping: '#ffce56',
  Entertainment: '#9966ff',
  Bills: '#ff9f40',
  Salary: '#4caf50'
};


const fmt = n => Number(n).toLocaleString('en-IN');

function save() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function salaryOnlyForIncome() {
  const salaryOpt = category.querySelector('option[value="Salary"]');
  if (!salaryOpt) return;
  const isExpense = type.value === 'expense';
  salaryOpt.disabled = isExpense;
  if (isExpense && category.value === 'Salary') {
    category.value = 'General';
  }
}


addBtn.addEventListener('click', () => {
  const desc = text.value.trim();
  const amt = +amount.value;

  if (!desc) { alert('Please enter a description.'); return; }
  if (!amt || isNaN(amt) || amt <= 0) { alert('Amount must be a positive number.'); return; }

  const tx = {
    id: Date.now(),
    text: desc,
    amount: amt,
    type: type.value,        
    category: category.value 
  };

  
  if (tx.type === 'expense' && tx.category === 'Salary') {
    alert('Salary can only be added as Income.');
    return;
  }

  transactions.push(tx);
  save();
  text.value = '';
  amount.value = '';
  renderTransactions();
});


type.addEventListener('change', () => {
  salaryOnlyForIncome();
});


function renderTransactions() {
  transactionList.innerHTML = '';

  const filtered = transactions.filter(tx =>
    (filterType.value === 'all' || tx.type === filterType.value) &&
    (filterCategory.value === 'all' || tx.category === filterCategory.value)
  );

  if (filtered.length === 0) {
    const li = document.createElement('li');
    li.className = 'income'; // neutral border color; purely for layout
    li.style.borderColor = '#bbb';
    li.innerHTML = '<span class="item-left">No transactions to show</span>';
    transactionList.appendChild(li);
  } else {
    filtered.forEach(tx => {
      const li = document.createElement('li');
      li.classList.add(tx.type); // income | expense

      const left = document.createElement('span');
      left.className = 'item-left';
      left.textContent = `${tx.text} (${tx.category})`;

      const rightWrap = document.createElement('span');
      rightWrap.style.display = 'flex';
      rightWrap.style.alignItems = 'center';
      rightWrap.style.gap = '10px';

      const amountEl = document.createElement('span');
      amountEl.textContent = `₹${fmt(tx.amount)}`;

      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.title = 'Delete';
      del.textContent = '❌';
      del.addEventListener('click', () => deleteTransaction(tx.id));

      rightWrap.appendChild(amountEl);
      rightWrap.appendChild(del);

      li.appendChild(left);
      li.appendChild(rightWrap);
      transactionList.appendChild(li);
    });
  }

  updateTotals();
  updateCharts();
}


function deleteTransaction(id) {
  transactions = transactions.filter(tx => tx.id !== id);
  save();
  renderTransactions();
}


function updateTotals() {
  const income = transactions.filter(tx => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);
  const expense = transactions.filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);

  balanceEl.textContent = fmt(income - expense);
  incomeEl.textContent = fmt(income);
  expenseEl.textContent = fmt(expense);
}


let balanceChart, categoryChart;

function updateCharts() {
  const income = transactions.filter(tx => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);
  const expense = transactions.filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);

  
  if (balanceChart) balanceChart.destroy();
  if (income > 0 || expense > 0) {
    const ctx1 = document.getElementById('balanceChart').getContext('2d');
    balanceChart = new Chart(ctx1, {
      type: 'pie',
      data: {
        labels: ['Income', 'Expense'],
        datasets: [{
          data: [income, expense],
          backgroundColor: ['#2e7d32', '#c62828']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  
  const categories = [...new Set(transactions.map(tx => tx.category))];
  const categoryTotals = categories.map(cat =>
    transactions.filter(tx => tx.category === cat)
      .reduce((a, b) => a + b.amount, 0)
  );

  if (categoryChart) categoryChart.destroy();
  if (categories.length > 0) {
    const ctx2 = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: categoryTotals,
          backgroundColor: categories.map(cat => CATEGORY_COLORS[cat] || '#90a4ae')
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }
}


themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem(THEME_KEY, document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});


filterType.addEventListener('change', renderTransactions);
filterCategory.addEventListener('change', renderTransactions);


salaryOnlyForIncome();
renderTransactions();
