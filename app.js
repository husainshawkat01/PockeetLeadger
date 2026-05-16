/* ============================================================
   PocketLedger — Application Logic (app.js)
   Supabase integration + full CRUD + Charts + Export
   ============================================================ */

// ── Supabase Config ───────────────────────────────────────────
// Replace with your actual Supabase project credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabase = null;

function initSupabase() {
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return true;
  }
  return false;
}

// ── State ─────────────────────────────────────────────────────
const state = {
  user: null,
  incomes: [],
  expenses: [],
  ledger: [],
  bills: [],
  notes: [],
  settings: { theme: 'dark', language: 'en', currency: 'BDT' },
  currentSection: 'dashboard',
  inactivityTimer: null,
  charts: {},
};

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

// ── i18n ──────────────────────────────────────────────────────
const i18n = {
  en: {
    dashboard: 'Dashboard', income: 'Income', expenses: 'Expenses',
    ledger: 'People Ledger', bills: 'Bills', reports: 'Reports',
    notes: 'Notes', settings: 'Settings',
    balance: 'Current Balance', totalIncome: 'Income This Month',
    totalExpense: 'Expenses This Month', savings: 'Total Savings',
    iOwe: 'Total I Owe', owesMe: 'Others Owe Me',
    totalLent: 'Total Lent', totalBorrowed: 'Total Borrowed',
    addIncome: 'Add Income', addExpense: 'Add Expense',
    addEntry: 'Add Entry', addBill: 'Add Bill', addNote: 'Add Note',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
    markPaid: 'Mark Paid', settled: 'Settled', unsettled: 'Unsettled',
    paid: 'Paid', unpaid: 'Unpaid', overdue: 'Overdue',
    amount: 'Amount (৳)', source: 'Source', date: 'Date', note: 'Note',
    category: 'Category', person: 'Person Name',
    gaveMoney: 'I Gave Money', tookMoney: 'I Took Money',
    owesMe2: 'Person Owes Me', iOwePerson: 'I Owe Person',
    isSettled: 'Settled/Paid', title: 'Title', dueDate: 'Due Date',
    noData: 'No records found', search: 'Search...',
    exportPDF: 'Export PDF', exportCSV: 'Export CSV',
    exportJSON: 'Export JSON', exportXLSX: 'Export Excel',
    logout: 'Logout', darkMode: 'Dark Mode', language: 'Language',
    currency: 'Currency', success: 'Success', error: 'Error',
    savedOk: 'Record saved successfully!',
    deletedOk: 'Record deleted.',
    confirmDelete: 'Delete this record?',
    receiptImg: 'Receipt Image (optional)',
    pinNote: 'Pin', unpinNote: 'Unpin',
    filter: 'Filter', allMonths: 'All Months', allTypes: 'All Types',
    allPeople: 'All People', allStatus: 'All Status',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড', income: 'আয়', expenses: 'ব্যয়',
    ledger: 'ব্যক্তি লেজার', bills: 'বিল', reports: 'রিপোর্ট',
    notes: 'নোট', settings: 'সেটিং',
    balance: 'বর্তমান ব্যালেন্স', totalIncome: 'এই মাসে আয়',
    totalExpense: 'এই মাসে ব্যয়', savings: 'মোট সঞ্চয়',
    iOwe: 'আমি যা দিতে হবে', owesMe: 'অন্যরা দিতে হবে',
    totalLent: 'মোট ধার দিয়েছি', totalBorrowed: 'মোট ধার নিয়েছি',
    addIncome: 'আয় যোগ করুন', addExpense: 'ব্যয় যোগ করুন',
    addEntry: 'এন্ট্রি যোগ করুন', addBill: 'বিল যোগ করুন', addNote: 'নোট যোগ করুন',
    save: 'সংরক্ষণ', cancel: 'বাতিল', delete: 'মুছুন', edit: 'সম্পাদনা',
    markPaid: 'পরিশোধ করুন', settled: 'নিষ্পত্তি', unsettled: 'অনিষ্পত্তি',
    paid: 'পরিশোধিত', unpaid: 'অপরিশোধিত', overdue: 'মেয়াদোত্তীর্ণ',
    amount: 'পরিমাণ (৳)', source: 'উৎস', date: 'তারিখ', note: 'নোট',
    category: 'বিভাগ', person: 'ব্যক্তির নাম',
    gaveMoney: 'আমি দিয়েছি', tookMoney: 'আমি নিয়েছি',
    owesMe2: 'সে আমাকে দেবে', iOwePerson: 'আমি তাকে দেব',
    isSettled: 'নিষ্পত্তি হয়েছে', title: 'শিরোনাম', dueDate: 'পরিশোধের তারিখ',
    noData: 'কোনো রেকর্ড নেই', search: 'অনুসন্ধান...',
    exportPDF: 'PDF রপ্তানি', exportCSV: 'CSV রপ্তানি',
    exportJSON: 'JSON রপ্তানি', exportXLSX: 'Excel রপ্তানি',
    logout: 'লগআউট', darkMode: 'ডার্ক মোড', language: 'ভাষা',
    currency: 'মুদ্রা', success: 'সফল', error: 'ত্রুটি',
    savedOk: 'রেকর্ড সফলভাবে সংরক্ষিত হয়েছে!',
    deletedOk: 'রেকর্ড মুছে ফেলা হয়েছে।',
    confirmDelete: 'এই রেকর্ড মুছবেন?',
    receiptImg: 'রসিদ ছবি (ঐচ্ছিক)',
    pinNote: 'পিন করুন', unpinNote: 'আনপিন করুন',
    filter: 'ফিল্টার', allMonths: 'সব মাস', allTypes: 'সব ধরন',
    allPeople: 'সব ব্যক্তি', allStatus: 'সব অবস্থা',
  }
};

function t(key) {
  const lang = state.settings.language || 'en';
  return (i18n[lang] && i18n[lang][key]) || i18n.en[key] || key;
}

function fmt(amount) {
  const currency = state.settings.currency === 'BDT' ? '৳' : '$';
  return `${currency}${Number(amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Auth ──────────────────────────────────────────────────────
async function login(email, password) {
  if (!supabase) { showToast('Supabase not configured', 'error'); return; }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function logout() {
  if (supabase) await supabase.auth.signOut();
  window.location.href = 'index.html';
}

function resetInactivityTimer() {
  clearTimeout(state.inactivityTimer);
  state.inactivityTimer = setTimeout(() => {
    showToast('Session expired due to inactivity', 'info');
    setTimeout(logout, 2000);
  }, INACTIVITY_LIMIT);
}

// ── Data Access (Supabase wrappers) ───────────────────────────
async function fetchTable(table, extraFilter = null) {
  if (!supabase || !state.user) return [];
  let q = supabase.from(table).select('*').eq('user_id', state.user.id).order('created_at', { ascending: false });
  if (extraFilter) q = extraFilter(q);
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return data || [];
}

async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert({ ...row, user_id: state.user.id }).select().single();
  if (error) throw error;
  return data;
}

async function updateRow(table, id, updates) {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).eq('user_id', state.user.id).select().single();
  if (error) throw error;
  return data;
}

async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', state.user.id);
  if (error) throw error;
}

// ── Load all data ─────────────────────────────────────────────
async function loadAllData() {
  if (!supabase) {
    // Demo data when Supabase not configured
    loadDemoData();
    return;
  }
  const [incomes, expenses, ledger, bills, notes] = await Promise.all([
    fetchTable('incomes'),
    fetchTable('expenses'),
    fetchTable('people_ledger'),
    fetchTable('bills'),
    fetchTable('notes'),
  ]);
  state.incomes  = incomes;
  state.expenses = expenses;
  state.ledger   = ledger;
  state.bills    = bills;
  state.notes    = notes;
  refreshAll();
}

function loadDemoData() {
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

  state.incomes = [
    { id: '1', amount: 15000, source: 'Family — Abba', transaction_date: today, note: 'Monthly allowance', created_at: today },
    { id: '2', amount: 5000, source: 'Part-time work', transaction_date: lastMonth, note: '', created_at: lastMonth },
  ];
  state.expenses = [
    { id: '1', amount: 3500, category: 'Mess Rent', transaction_date: today, note: 'June rent', created_at: today },
    { id: '2', amount: 800, category: 'Meal Charge', transaction_date: today, note: '', created_at: today },
    { id: '3', amount: 500, category: 'WiFi', transaction_date: lastMonth, note: '', created_at: lastMonth },
    { id: '4', amount: 1200, category: 'Transportation', transaction_date: today, note: 'Rickshaw + bus', created_at: today },
  ];
  state.ledger = [
    { id: '1', person_name: 'Rahim', amount: 500, transaction_date: today, note: 'Lunch', gave_money: true, took_money: false, owes_me: true, i_owe: false, is_settled: false, created_at: today },
    { id: '2', person_name: 'Karim', amount: 1000, transaction_date: lastMonth, note: 'Borrowed', gave_money: false, took_money: true, owes_me: false, i_owe: true, is_settled: false, created_at: lastMonth },
    { id: '3', person_name: 'Nasir', amount: 2000, transaction_date: lastMonth, note: 'Lent', gave_money: true, took_money: false, owes_me: true, i_owe: false, is_settled: true, created_at: lastMonth },
  ];
  state.bills = [
    { id: '1', title: 'Mess Rent', amount: 3500, due_date: today, is_paid: false, note: '', created_at: today },
    { id: '2', title: 'WiFi', amount: 500, due_date: today, is_paid: true, note: '', created_at: today },
    { id: '3', title: 'Khala Salary', amount: 2000, due_date: lastMonth, is_paid: false, note: '', created_at: lastMonth },
  ];
  state.notes = [
    { id: '1', title: 'Remember', content: 'Collect Rahim\'s dues before end of month.', is_pinned: true, created_at: today, updated_at: today },
  ];
  refreshAll();
}

// ── Computed Summaries ────────────────────────────────────────
function getSummary() {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthIncome = state.incomes
    .filter(r => r.transaction_date?.startsWith(thisMonth))
    .reduce((s, r) => s + Number(r.amount), 0);

  const monthExpense = state.expenses
    .filter(r => r.transaction_date?.startsWith(thisMonth))
    .reduce((s, r) => s + Number(r.amount), 0);

  const totalIncome  = state.incomes.reduce((s, r) => s + Number(r.amount), 0);
  const totalExpense = state.expenses.reduce((s, r) => s + Number(r.amount), 0);
  const balance      = totalIncome - totalExpense;
  const savings      = balance > 0 ? balance : 0;

  const active = state.ledger.filter(r => !r.is_settled);
  const iOwe      = active.filter(r => r.i_owe).reduce((s, r) => s + Number(r.amount), 0);
  const owesMe    = active.filter(r => r.owes_me).reduce((s, r) => s + Number(r.amount), 0);
  const totalLent = state.ledger.filter(r => r.gave_money).reduce((s, r) => s + Number(r.amount), 0);
  const totalBorrowed = state.ledger.filter(r => r.took_money).reduce((s, r) => s + Number(r.amount), 0);

  return { monthIncome, monthExpense, balance, savings, iOwe, owesMe, totalLent, totalBorrowed };
}

// ── Refresh UI ────────────────────────────────────────────────
function refreshAll() {
  updateSummaryCards();
  renderSection(state.currentSection);
}

function updateSummaryCards() {
  const s = getSummary();
  setCard('card-balance',  fmt(s.balance),       '📊');
  setCard('card-income',   fmt(s.monthIncome),   '💰');
  setCard('card-expense',  fmt(s.monthExpense),  '💸');
  setCard('card-savings',  fmt(s.savings),       '🏦');
  setCard('card-iowe',     fmt(s.iOwe),          '↗️');
  setCard('card-oweme',    fmt(s.owesMe),        '↙️');
  setCard('card-lent',     fmt(s.totalLent),     '🤝');
  setCard('card-borrowed', fmt(s.totalBorrowed), '📤');
}

function setCard(id, value, icon) {
  const el = document.getElementById(id);
  if (!el) return;
  el.querySelector('.card-value').textContent = value;
  if (icon) el.querySelector('.card-icon').textContent = icon;
}

// ── Section Routing ───────────────────────────────────────────
function showSection(name) {
  state.currentSection = name;

  document.querySelectorAll('.section-view').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));

  const view = document.getElementById(`section-${name}`);
  if (view) view.classList.add('active');

  document.querySelectorAll(`[data-section="${name}"]`).forEach(el => el.classList.add('active'));

  const titles = {
    dashboard: t('dashboard'), income: t('income'), expenses: t('expenses'),
    ledger: t('ledger'), bills: t('bills'), reports: t('reports'),
    notes: t('notes'), settings: t('settings'),
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[name] || name;

  renderSection(name);

  // Close sidebar on mobile
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('open');
}

function renderSection(name) {
  switch (name) {
    case 'dashboard': renderDashboard(); break;
    case 'income':    renderIncomes();   break;
    case 'expenses':  renderExpenses();  break;
    case 'ledger':    renderLedger();    break;
    case 'bills':     renderBills();     break;
    case 'reports':   renderReports();   break;
    case 'notes':     renderNotes();     break;
    case 'settings':  renderSettings();  break;
  }
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  updateSummaryCards();
  // Recent transactions table
  const recents = [
    ...state.incomes.map(r => ({ ...r, _type: 'income' })),
    ...state.expenses.map(r => ({ ...r, _type: 'expense' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);

  const tbody = document.getElementById('recent-tbody');
  if (!tbody) return;
  if (recents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted)">${t('noData')}</td></tr>`;
    return;
  }
  tbody.innerHTML = recents.map(r => `
    <tr>
      <td>${fmtDate(r.transaction_date)}</td>
      <td>${r._type === 'income' ? (r.source || '—') : (r.category || '—')}</td>
      <td><span class="badge ${r._type === 'income' ? 'badge-teal' : 'badge-rose'}">${r._type === 'income' ? t('income') : t('expenses')}</span></td>
      <td class="${r._type === 'income' ? 'amount-positive' : 'amount-negative'}">${r._type === 'income' ? '+' : '-'}${fmt(r.amount)}</td>
      <td class="text-muted text-sm">${r.note || '—'}</td>
    </tr>`).join('');
}

// ── INCOME ────────────────────────────────────────────────────
function renderIncomes() {
  const search = document.getElementById('income-search')?.value?.toLowerCase() || '';
  const month  = document.getElementById('income-month')?.value || '';
  let data = state.incomes.filter(r => {
    if (search && !r.source?.toLowerCase().includes(search) && !r.note?.toLowerCase().includes(search)) return false;
    if (month && !r.transaction_date?.startsWith(month)) return false;
    return true;
  });
  const tbody = document.getElementById('income-tbody');
  if (!tbody) return;
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">💰</div><p>${t('noData')}</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${fmtDate(r.transaction_date)}</td>
      <td>${escHtml(r.source)}</td>
      <td class="amount-positive">${fmt(r.amount)}</td>
      <td class="text-muted text-sm">${escHtml(r.note || '—')}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditIncomeModal('${r.id}')" title="${t('edit')}">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteIncome('${r.id}')" title="${t('delete')}">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

async function saveIncome(data, id = null) {
  if (id) {
    const updated = await updateRow('incomes', id, data);
    state.incomes = state.incomes.map(r => r.id === id ? updated : r);
  } else {
    const row = await insertRow('incomes', data);
    state.incomes.unshift(row);
  }
  showToast(t('savedOk'), 'success');
  refreshAll();
}

async function deleteIncome(id) {
  if (!confirm(t('confirmDelete'))) return;
  await deleteRow('incomes', id);
  state.incomes = state.incomes.filter(r => r.id !== id);
  showToast(t('deletedOk'), 'info');
  refreshAll();
}

// ── EXPENSES ─────────────────────────────────────────────────
const EXPENSE_CATS = ['Mess Rent','Meal Charge','WiFi','Khala','Hand Cash','Transportation','Shopping','Medicine','Education','Entertainment','Other'];

function renderExpenses() {
  const search = document.getElementById('expense-search')?.value?.toLowerCase() || '';
  const month  = document.getElementById('expense-month')?.value || '';
  const cat    = document.getElementById('expense-cat-filter')?.value || '';
  let data = state.expenses.filter(r => {
    if (search && !r.category?.toLowerCase().includes(search) && !r.note?.toLowerCase().includes(search)) return false;
    if (month && !r.transaction_date?.startsWith(month)) return false;
    if (cat && r.category !== cat) return false;
    return true;
  });
  const tbody = document.getElementById('expense-tbody');
  if (!tbody) return;
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">💸</div><p>${t('noData')}</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${fmtDate(r.transaction_date)}</td>
      <td><span class="badge badge-amber">${escHtml(r.category)}</span></td>
      <td class="amount-negative">${fmt(r.amount)}</td>
      <td class="text-muted text-sm">${escHtml(r.note || '—')}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditExpenseModal('${r.id}')" title="${t('edit')}">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteExpense('${r.id}')" title="${t('delete')}">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

async function saveExpense(data, id = null) {
  if (id) {
    const updated = await updateRow('expenses', id, data);
    state.expenses = state.expenses.map(r => r.id === id ? updated : r);
  } else {
    const row = await insertRow('expenses', data);
    state.expenses.unshift(row);
  }
  showToast(t('savedOk'), 'success');
  refreshAll();
}

async function deleteExpense(id) {
  if (!confirm(t('confirmDelete'))) return;
  await deleteRow('expenses', id);
  state.expenses = state.expenses.filter(r => r.id !== id);
  showToast(t('deletedOk'), 'info');
  refreshAll();
}

// ── PEOPLE LEDGER ─────────────────────────────────────────────
function renderLedger() {
  const search  = document.getElementById('ledger-search')?.value?.toLowerCase() || '';
  const status  = document.getElementById('ledger-status')?.value || '';
  const type    = document.getElementById('ledger-type')?.value || '';
  let data = state.ledger.filter(r => {
    if (search && !r.person_name?.toLowerCase().includes(search)) return false;
    if (status === 'settled' && !r.is_settled) return false;
    if (status === 'unsettled' && r.is_settled) return false;
    if (type === 'gave' && !r.gave_money) return false;
    if (type === 'took' && !r.took_money) return false;
    if (type === 'owesMe' && !r.owes_me) return false;
    if (type === 'iOwe' && !r.i_owe) return false;
    return true;
  });
  const tbody = document.getElementById('ledger-tbody');
  if (!tbody) return;
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🤝</div><p>${t('noData')}</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(r => {
    const tags = [];
    if (r.gave_money) tags.push(`<span class="badge badge-violet">${t('gaveMoney')}</span>`);
    if (r.took_money) tags.push(`<span class="badge badge-amber">${t('tookMoney')}</span>`);
    if (r.owes_me && !r.is_settled) tags.push(`<span class="badge badge-teal">${t('owesMe2')}</span>`);
    if (r.i_owe && !r.is_settled) tags.push(`<span class="badge badge-rose">${t('iOwePerson')}</span>`);
    return `
    <tr>
      <td>${fmtDate(r.transaction_date)}</td>
      <td><strong>${escHtml(r.person_name)}</strong></td>
      <td class="amount-gold">${fmt(r.amount)}</td>
      <td>${tags.join(' ')}</td>
      <td><span class="badge ${r.is_settled ? 'badge-green' : 'badge-rose'}">${r.is_settled ? t('settled') : t('unsettled')}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditLedgerModal('${r.id}')" title="${t('edit')}">✏️</button>
          ${!r.is_settled ? `<button class="btn btn-success btn-sm btn-icon" onclick="settleLedger('${r.id}')" title="${t('settled')}">✅</button>` : ''}
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteLedger('${r.id}')" title="${t('delete')}">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function saveLedger(data, id = null) {
  if (id) {
    const updated = await updateRow('people_ledger', id, data);
    state.ledger = state.ledger.map(r => r.id === id ? updated : r);
  } else {
    const row = await insertRow('people_ledger', data);
    state.ledger.unshift(row);
  }
  showToast(t('savedOk'), 'success');
  refreshAll();
}

async function settleLedger(id) {
  await updateRow('people_ledger', id, { is_settled: true });
  state.ledger = state.ledger.map(r => r.id === id ? { ...r, is_settled: true } : r);
  showToast('Marked as settled ✅', 'success');
  refreshAll();
}

async function deleteLedger(id) {
  if (!confirm(t('confirmDelete'))) return;
  await deleteRow('people_ledger', id);
  state.ledger = state.ledger.filter(r => r.id !== id);
  showToast(t('deletedOk'), 'info');
  refreshAll();
}

// ── BILLS ─────────────────────────────────────────────────────
function renderBills() {
  const grid = document.getElementById('bills-grid');
  if (!grid) return;
  if (state.bills.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📋</div><p>${t('noData')}</p></div>`;
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  grid.innerHTML = state.bills.map(r => {
    const overdue = !r.is_paid && r.due_date && r.due_date < today;
    return `
    <div class="bill-card ${r.is_paid ? 'is-paid' : ''}">
      <div class="bill-top">
        <div>
          <div class="bill-title">${escHtml(r.title)}</div>
          <div class="bill-meta">${r.due_date ? `Due: ${fmtDate(r.due_date)}` : 'No due date'}
            ${overdue ? `<span class="bill-overdue"> · ${t('overdue')}</span>` : ''}</div>
        </div>
        <span class="badge ${r.is_paid ? 'badge-green' : overdue ? 'badge-rose' : 'badge-amber'}">${r.is_paid ? t('paid') : t('unpaid')}</span>
      </div>
      <div class="bill-amount">${fmt(r.amount)}</div>
      <div class="bill-footer">
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditBillModal('${r.id}')" title="${t('edit')}">✏️</button>
          ${!r.is_paid ? `<button class="btn btn-success btn-sm" onclick="payBill('${r.id}')">${t('markPaid')}</button>` : ''}
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteBill('${r.id}')" title="${t('delete')}">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function saveBill(data, id = null) {
  if (id) {
    const updated = await updateRow('bills', id, data);
    state.bills = state.bills.map(r => r.id === id ? updated : r);
  } else {
    const row = await insertRow('bills', data);
    state.bills.unshift(row);
  }
  showToast(t('savedOk'), 'success');
  refreshAll();
}

async function payBill(id) {
  await updateRow('bills', id, { is_paid: true });
  state.bills = state.bills.map(r => r.id === id ? { ...r, is_paid: true } : r);
  showToast(t('markPaid') + ' ✅', 'success');
  refreshAll();
}

async function deleteBill(id) {
  if (!confirm(t('confirmDelete'))) return;
  await deleteRow('bills', id);
  state.bills = state.bills.filter(r => r.id !== id);
  showToast(t('deletedOk'), 'info');
  refreshAll();
}

// ── NOTES ─────────────────────────────────────────────────────
function renderNotes() {
  const grid = document.getElementById('notes-grid');
  if (!grid) return;
  const sorted = [...state.notes].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
  if (sorted.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📝</div><p>${t('noData')}</p></div>`;
    return;
  }
  grid.innerHTML = sorted.map(r => `
    <div class="note-card ${r.is_pinned ? 'pinned' : ''}" onclick="openEditNoteModal('${r.id}')">
      <div class="note-title">${r.is_pinned ? '📌 ' : ''}${escHtml(r.title)}</div>
      <div class="note-content">${escHtml(r.content || '')}</div>
      <div class="note-footer">
        <span class="note-date">${fmtDate(r.updated_at?.split('T')[0])}</span>
        <div class="table-actions" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="toggleNotePin('${r.id}')" title="${r.is_pinned ? t('unpinNote') : t('pinNote')}">${r.is_pinned ? '📌' : '📍'}</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteNote('${r.id}')" title="${t('delete')}">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

async function saveNote(data, id = null) {
  if (id) {
    const updated = await updateRow('notes', id, data);
    state.notes = state.notes.map(r => r.id === id ? updated : r);
  } else {
    const row = await insertRow('notes', data);
    state.notes.unshift(row);
  }
  showToast(t('savedOk'), 'success');
  renderNotes();
}

async function toggleNotePin(id) {
  const note = state.notes.find(r => r.id === id);
  if (!note) return;
  await updateRow('notes', id, { is_pinned: !note.is_pinned });
  state.notes = state.notes.map(r => r.id === id ? { ...r, is_pinned: !r.is_pinned } : r);
  renderNotes();
}

async function deleteNote(id) {
  if (!confirm(t('confirmDelete'))) return;
  await deleteRow('notes', id);
  state.notes = state.notes.filter(r => r.id !== id);
  showToast(t('deletedOk'), 'info');
  renderNotes();
}

// ── REPORTS / CHARTS ─────────────────────────────────────────
function renderReports() {
  setTimeout(() => {
    renderIncomeExpenseChart();
    renderCategoryChart();
    renderDebtChart();
    renderMonthlySummaryChart();
  }, 100);
}

function destroyChart(id) {
  if (state.charts[id]) { state.charts[id].destroy(); delete state.charts[id]; }
}

function getChartColors() {
  return ['#d4af37','#2dd4bf','#fb7185','#a78bfa','#4ade80','#fbbf24','#38bdf8','#f472b6'];
}

function renderIncomeExpenseChart() {
  destroyChart('incomeExpense');
  const ctx = document.getElementById('chart-income-expense');
  if (!ctx) return;

  // Last 6 months
  const months = [];
  const incomeData = [], expenseData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    months.push(d.toLocaleString('default', { month: 'short' }));
    incomeData.push(state.incomes.filter(r => r.transaction_date?.startsWith(key)).reduce((s,r) => s+Number(r.amount),0));
    expenseData.push(state.expenses.filter(r => r.transaction_date?.startsWith(key)).reduce((s,r) => s+Number(r.amount),0));
  }

  state.charts.incomeExpense = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: t('income'),   data: incomeData,  backgroundColor: 'rgba(45,212,191,0.7)', borderRadius: 6 },
        { label: t('expenses'), data: expenseData, backgroundColor: 'rgba(251,113,133,0.7)', borderRadius: 6 },
      ]
    },
    options: chartOptions()
  });
}

function renderCategoryChart() {
  destroyChart('category');
  const ctx = document.getElementById('chart-category');
  if (!ctx) return;
  const cats = {};
  state.expenses.forEach(r => { cats[r.category] = (cats[r.category] || 0) + Number(r.amount); });
  const labels = Object.keys(cats);
  const data   = Object.values(cats);
  state.charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: getChartColors(), borderWidth: 0 }] },
    options: { ...chartOptions(), cutout: '65%' }
  });
}

function renderDebtChart() {
  destroyChart('debt');
  const ctx = document.getElementById('chart-debt');
  if (!ctx) return;
  const s = getSummary();
  state.charts.debt = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [t('iOwe'), t('owesMe'), t('totalLent'), t('totalBorrowed')],
      datasets: [{
        data: [s.iOwe, s.owesMe, s.totalLent, s.totalBorrowed],
        backgroundColor: ['rgba(251,113,133,0.7)','rgba(45,212,191,0.7)','rgba(167,139,250,0.7)','rgba(251,191,36,0.7)'],
        borderRadius: 6,
      }]
    },
    options: { ...chartOptions(), indexAxis: 'y' }
  });
}

function renderMonthlySummaryChart() {
  destroyChart('monthly');
  const ctx = document.getElementById('chart-monthly');
  if (!ctx) return;
  const months = [];
  const balances = [];
  let running = 0;
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    months.push(d.toLocaleString('default', { month: 'short' }));
    const inc = state.incomes.filter(r => r.transaction_date?.startsWith(key)).reduce((s,r) => s+Number(r.amount),0);
    const exp = state.expenses.filter(r => r.transaction_date?.startsWith(key)).reduce((s,r) => s+Number(r.amount),0);
    running += inc - exp;
    balances.push(running);
  }
  state.charts.monthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Running Balance',
        data: balances,
        borderColor: '#d4af37',
        backgroundColor: 'rgba(212,175,55,0.12)',
        tension: 0.4, fill: true, pointRadius: 5,
        pointBackgroundColor: '#d4af37',
      }]
    },
    options: chartOptions()
  });
}

function chartOptions() {
  const grid = { color: 'rgba(255,255,255,0.06)' };
  const ticks = { color: 'rgba(240,236,227,0.5)', font: { family: 'DM Sans' } };
  return {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: 'rgba(240,236,227,0.7)', font: { family: 'DM Sans' }, boxWidth: 12 } },
    },
    scales: {
      x: { grid, ticks },
      y: { grid, ticks, beginAtZero: true },
    }
  };
}

// ── SETTINGS ──────────────────────────────────────────────────
function renderSettings() {
  const themeToggle = document.getElementById('theme-toggle');
  const langSelect  = document.getElementById('lang-select');
  if (themeToggle) themeToggle.checked = state.settings.theme === 'light';
  if (langSelect)  langSelect.value    = state.settings.language;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.settings.theme = theme;
}

function applyLanguage(lang) {
  state.settings.language = lang;
  // Re-render sidebar labels
  document.querySelectorAll('[data-label]').forEach(el => {
    el.textContent = t(el.dataset.label);
  });
}

// ── MODALS ────────────────────────────────────────────────────
let _editingId = null;

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
  _editingId = null;
}
function closeAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  document.body.style.overflow = '';
  _editingId = null;
}

// Income modal
function openAddIncomeModal() {
  _editingId = null;
  resetForm('income-form');
  document.getElementById('income-modal-title').textContent = t('addIncome');
  document.getElementById('income-date').value = today();
  openModal('income-modal');
}
function openEditIncomeModal(id) {
  const r = state.incomes.find(i => i.id === id);
  if (!r) return;
  _editingId = id;
  document.getElementById('income-modal-title').textContent = t('edit') + ' ' + t('income');
  document.getElementById('income-amount').value = r.amount;
  document.getElementById('income-source').value = r.source;
  document.getElementById('income-date').value   = r.transaction_date;
  document.getElementById('income-note').value   = r.note || '';
  openModal('income-modal');
}
async function submitIncomeForm() {
  const data = {
    amount:           parseFloat(document.getElementById('income-amount').value),
    source:           document.getElementById('income-source').value.trim(),
    transaction_date: document.getElementById('income-date').value,
    note:             document.getElementById('income-note').value.trim(),
  };
  if (!data.amount || !data.source) { showToast('Amount and Source are required', 'error'); return; }
  try {
    await saveIncome(data, _editingId);
    closeModal('income-modal');
  } catch (e) { showToast(e.message, 'error'); }
}

// Expense modal
function openAddExpenseModal() {
  _editingId = null;
  resetForm('expense-form');
  document.getElementById('expense-modal-title').textContent = t('addExpense');
  document.getElementById('expense-date').value = today();
  openModal('expense-modal');
}
function openEditExpenseModal(id) {
  const r = state.expenses.find(i => i.id === id);
  if (!r) return;
  _editingId = id;
  document.getElementById('expense-modal-title').textContent = t('edit') + ' ' + t('expenses');
  document.getElementById('expense-amount').value   = r.amount;
  document.getElementById('expense-category').value = r.category;
  document.getElementById('expense-date').value     = r.transaction_date;
  document.getElementById('expense-note').value     = r.note || '';
  openModal('expense-modal');
}
async function submitExpenseForm() {
  const data = {
    amount:           parseFloat(document.getElementById('expense-amount').value),
    category:         document.getElementById('expense-category').value,
    transaction_date: document.getElementById('expense-date').value,
    note:             document.getElementById('expense-note').value.trim(),
  };
  if (!data.amount) { showToast('Amount is required', 'error'); return; }
  try {
    await saveExpense(data, _editingId);
    closeModal('expense-modal');
  } catch (e) { showToast(e.message, 'error'); }
}

// Ledger modal
function openAddLedgerModal() {
  _editingId = null;
  resetForm('ledger-form');
  document.getElementById('ledger-modal-title').textContent = t('addEntry');
  document.getElementById('ledger-date').value = today();
  // Reset all toggles
  ['gave-money','took-money','owes-me','i-owe','is-settled'].forEach(id => {
    const el = document.getElementById(`toggle-${id}`);
    if (el) el.checked = false;
  });
  openModal('ledger-modal');
}
function openEditLedgerModal(id) {
  const r = state.ledger.find(i => i.id === id);
  if (!r) return;
  _editingId = id;
  document.getElementById('ledger-modal-title').textContent = t('edit') + ' ' + t('ledger');
  document.getElementById('ledger-person').value  = r.person_name;
  document.getElementById('ledger-amount').value  = r.amount;
  document.getElementById('ledger-date').value    = r.transaction_date;
  document.getElementById('ledger-note').value    = r.note || '';
  document.getElementById('toggle-gave-money').checked = r.gave_money || false;
  document.getElementById('toggle-took-money').checked = r.took_money || false;
  document.getElementById('toggle-owes-me').checked    = r.owes_me   || false;
  document.getElementById('toggle-i-owe').checked      = r.i_owe     || false;
  document.getElementById('toggle-is-settled').checked = r.is_settled|| false;
  openModal('ledger-modal');
}
async function submitLedgerForm() {
  const data = {
    person_name:      document.getElementById('ledger-person').value.trim(),
    amount:           parseFloat(document.getElementById('ledger-amount').value),
    transaction_date: document.getElementById('ledger-date').value,
    note:             document.getElementById('ledger-note').value.trim(),
    gave_money:       document.getElementById('toggle-gave-money').checked,
    took_money:       document.getElementById('toggle-took-money').checked,
    owes_me:          document.getElementById('toggle-owes-me').checked,
    i_owe:            document.getElementById('toggle-i-owe').checked,
    is_settled:       document.getElementById('toggle-is-settled').checked,
  };
  if (!data.person_name || !data.amount) { showToast('Person name and amount are required', 'error'); return; }
  try {
    await saveLedger(data, _editingId);
    closeModal('ledger-modal');
  } catch (e) { showToast(e.message, 'error'); }
}

// Bill modal
function openAddBillModal() {
  _editingId = null;
  resetForm('bill-form');
  document.getElementById('bill-modal-title').textContent = t('addBill');
  openModal('bill-modal');
}
function openEditBillModal(id) {
  const r = state.bills.find(i => i.id === id);
  if (!r) return;
  _editingId = id;
  document.getElementById('bill-modal-title').textContent = t('edit') + ' ' + t('bills');
  document.getElementById('bill-title').value    = r.title;
  document.getElementById('bill-amount').value   = r.amount;
  document.getElementById('bill-duedate').value  = r.due_date || '';
  document.getElementById('bill-note').value     = r.note || '';
  document.getElementById('bill-paid').checked   = r.is_paid || false;
  openModal('bill-modal');
}
async function submitBillForm() {
  const data = {
    title:    document.getElementById('bill-title').value.trim(),
    amount:   parseFloat(document.getElementById('bill-amount').value),
    due_date: document.getElementById('bill-duedate').value || null,
    note:     document.getElementById('bill-note').value.trim(),
    is_paid:  document.getElementById('bill-paid').checked,
  };
  if (!data.title || !data.amount) { showToast('Title and amount are required', 'error'); return; }
  try {
    await saveBill(data, _editingId);
    closeModal('bill-modal');
  } catch (e) { showToast(e.message, 'error'); }
}

// Note modal
function openAddNoteModal() {
  _editingId = null;
  resetForm('note-form');
  document.getElementById('note-modal-title').textContent = t('addNote');
  openModal('note-modal');
}
function openEditNoteModal(id) {
  const r = state.notes.find(i => i.id === id);
  if (!r) return;
  _editingId = id;
  document.getElementById('note-modal-title').textContent = t('edit') + ' ' + t('notes');
  document.getElementById('note-title').value   = r.title;
  document.getElementById('note-content').value = r.content || '';
  document.getElementById('note-pinned').checked = r.is_pinned || false;
  openModal('note-modal');
}
async function submitNoteForm() {
  const data = {
    title:     document.getElementById('note-title').value.trim(),
    content:   document.getElementById('note-content').value.trim(),
    is_pinned: document.getElementById('note-pinned').checked,
  };
  if (!data.title) { showToast('Title is required', 'error'); return; }
  try {
    await saveNote(data, _editingId);
    closeModal('note-modal');
  } catch (e) { showToast(e.message, 'error'); }
}

// ── FAB handler ───────────────────────────────────────────────
function fabAction() {
  switch (state.currentSection) {
    case 'income':   openAddIncomeModal();  break;
    case 'expenses': openAddExpenseModal(); break;
    case 'ledger':   openAddLedgerModal();  break;
    case 'bills':    openAddBillModal();    break;
    case 'notes':    openAddNoteModal();    break;
    default:         openAddExpenseModal(); break;
  }
}

// ── EXPORT ────────────────────────────────────────────────────
function exportCSV() {
  const rows = [
    ['Type','Date','Amount','Category/Source/Person','Note','Status'],
    ...state.incomes.map(r => ['Income', r.transaction_date, r.amount, r.source, r.note, '']),
    ...state.expenses.map(r => ['Expense', r.transaction_date, r.amount, r.category, r.note, '']),
    ...state.ledger.map(r => ['Ledger', r.transaction_date, r.amount, r.person_name, r.note, r.is_settled ? 'Settled' : 'Unsettled']),
    ...state.bills.map(r => ['Bill', r.due_date, r.amount, r.title, r.note, r.is_paid ? 'Paid' : 'Unpaid']),
  ];
  const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadFile('pocketledger-export.csv', csv, 'text/csv');
}

function exportJSON() {
  const data = { incomes: state.incomes, expenses: state.expenses, ledger: state.ledger, bills: state.bills, notes: state.notes, exported: new Date().toISOString() };
  downloadFile('pocketledger-backup.json', JSON.stringify(data, null, 2), 'application/json');
}

function exportPDF() {
  window.print();
}

function downloadFile(name, content, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = name; a.click();
  URL.revokeObjectURL(a.href);
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: '💡' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||'💡'}</span><span class="toast-msg">${escHtml(message)}</span><span class="toast-close" onclick="this.parentElement.remove()">✕</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── HELPERS ───────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }
function resetForm(id) { document.getElementById(id)?.reset(); }
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── INIT (Dashboard) ──────────────────────────────────────────
async function initDashboard() {
  initSupabase();

  // Auth check
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = 'index.html'; return; }
    state.user = session.user;
    document.getElementById('user-email').textContent = state.user.email;
    document.getElementById('user-avatar-letter').textContent = state.user.email[0].toUpperCase();
  } else {
    // Demo mode
    state.user = { id: 'demo', email: 'demo@pocketledger.app' };
    const emailEl = document.getElementById('user-email');
    if (emailEl) emailEl.textContent = state.user.email;
    const avatarEl = document.getElementById('user-avatar-letter');
    if (avatarEl) avatarEl.textContent = 'D';
    showToast('Running in Demo Mode — configure Supabase credentials in app.js', 'info');
  }

  // Load settings from localStorage (quick load, no Supabase)
  const savedTheme = localStorage.getItem('pl_theme') || 'dark';
  const savedLang  = localStorage.getItem('pl_lang')  || 'en';
  state.settings.theme    = savedTheme;
  state.settings.language = savedLang;
  applyTheme(savedTheme);

  await loadAllData();
  showSection('dashboard');

  // Inactivity timer
  ['mousemove','keydown','click','scroll','touchstart'].forEach(ev => {
    document.addEventListener(ev, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();

  // Real-time subscriptions (if Supabase configured)
  if (supabase) {
    supabase.channel('realtime-pl')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => loadAllData())
      .subscribe();
  }
}

// ── INIT (Login) ──────────────────────────────────────────────
async function initLogin() {
  initSupabase();

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) { window.location.href = 'dashboard.html'; return; }
  }

  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('login-btn');
    const errEl    = document.getElementById('login-error');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in…';
    errEl.classList.remove('show');

    try {
      await login(email, password);
      window.location.href = 'dashboard.html';
    } catch (err) {
      errEl.textContent = err.message || 'Login failed. Check your credentials.';
      errEl.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
}
