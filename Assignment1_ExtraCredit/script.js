class Expense {
    constructor(id, amount, description, category, date) {
        this.id = id;
        this.amount = amount;
        this.description = description;
        this.category = category;
        this.date = date;
    }
}

class ExpenseTracker {
    constructor(storageKey = 'expenses') {
        this.storageKey = storageKey;
        this.expenses = this._loadFromStorage();
    }

    _loadFromStorage() {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return parsed.map(e => new Expense(e.id, e.amount, e.description, e.category, e.date));
        } catch (e) {
            return [];
        }
    }

    _saveToStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.expenses));
    }

    static _generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    addExpense({ amount, description, category, date }) {
        const expense = new Expense(
            ExpenseTracker._generateId(),
            parseFloat(amount),
            description.trim(),
            category.trim(),
            date
        );
        this.expenses.push(expense);
        this._saveToStorage();
        return expense;
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(e => e.id !== id);
        this._saveToStorage();
    }

    getAllExpenses() {
        return [...this.expenses];
    }

    filterByCategory(category) {
        if (!category || category.toLowerCase() === 'all') {
            return this.getAllExpenses();
        }
        const lower = category.toLowerCase();
        return this.expenses.filter(e => e.category.toLowerCase() === lower);
    }

    static computeTotal(expenseList) {
        return expenseList.reduce((sum, e) => sum + e.amount, 0);
    }

    getUniqueCategories() {
        const set = new Set();
        this.expenses.forEach(e => set.add(e.category));
        return set;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Expense, ExpenseTracker };
}

if (typeof document !== 'undefined') {
const BUDGET_STORAGE_KEY = 'monthly-budget-cap';
const tracker = new ExpenseTracker();
const form = document.getElementById('expense-form');
const tbody = document.querySelector('#expenses-table tbody');
const totalSpan = document.getElementById('total-amount');
const filterSelect = document.getElementById('category-filter');
const budgetInput = document.getElementById('budget-cap');
const budgetAlert = document.getElementById('budget-alert');
const budgetAlertTotal = document.getElementById('budget-alert-total');
const budgetAlertCap = document.getElementById('budget-alert-cap');
const budgetAlertOverage = document.getElementById('budget-alert-overage');

function getBudgetCap() {
    if (!budgetInput) return 0;
    const cap = parseFloat(budgetInput.value);
    return Number.isFinite(cap) && cap > 0 ? cap : 0;
}

function updateBudgetAlert() {
    if (!budgetAlert) return;
    const cap = getBudgetCap();
    const total = ExpenseTracker.computeTotal(tracker.getAllExpenses());
    const overBudget = cap > 0 && total > cap;

    budgetAlert.hidden = !overBudget;
    budgetAlert.classList.toggle('hidden', !overBudget);

    if (overBudget) {
        const overage = total - cap;
        if (budgetAlertTotal) budgetAlertTotal.textContent = total.toFixed(2);
        if (budgetAlertCap) budgetAlertCap.textContent = cap.toFixed(2);
        if (budgetAlertOverage) budgetAlertOverage.textContent = overage.toFixed(2);
    }
}

function renderExpenses(expenseList) {
    if (!tbody) return;
    tbody.innerHTML = '';
    expenseList.forEach(exp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${exp.date}</td>
            <td>${exp.category}</td>
            <td>${exp.description}</td>
            <td>$${exp.amount.toFixed(2)}</td>
            <td><button class="delete-btn" data-id="${exp.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });

    const total = ExpenseTracker.computeTotal(expenseList);
    if (totalSpan) totalSpan.textContent = total.toFixed(2);

    const countEl = document.getElementById('expense-count');
    if (countEl) countEl.textContent = String(expenseList.length);

    const categoryCountEl = document.getElementById('category-count');
    if (categoryCountEl) {
        const unique = new Set(expenseList.map(e => e.category));
        categoryCountEl.textContent = String(unique.size);
    }

    updateBudgetAlert();
}

function populateCategoryFilter() {
    if (!filterSelect) return;
    const categories = Array.from(tracker.getUniqueCategories()).sort();
    filterSelect.innerHTML = '<option value="all">All</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        filterSelect.appendChild(opt);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const savedCap = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (budgetInput && savedCap !== null && savedCap !== '') {
        budgetInput.value = savedCap;
    }

    renderExpenses(tracker.getAllExpenses());
    populateCategoryFilter();
    updateBudgetAlert();

    if (budgetInput) {
        budgetInput.addEventListener('input', () => {
            localStorage.setItem(BUDGET_STORAGE_KEY, budgetInput.value);
            updateBudgetAlert();
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = document.getElementById('amount').value;
            const description = document.getElementById('description').value;
            const category = document.getElementById('category').value;
            const date = document.getElementById('date').value;

            tracker.addExpense({ amount, description, category, date });
            renderExpenses(tracker.getAllExpenses());
            populateCategoryFilter();
            form.reset();
        });
    }

    if (tbody) {
        tbody.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const id = e.target.dataset.id;
                tracker.deleteExpense(id);
                renderExpenses(tracker.getAllExpenses());
                populateCategoryFilter();
            }
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const filtered = tracker.filterByCategory(e.target.value);
            renderExpenses(filtered);
        });
    }
});

}
