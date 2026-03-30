export interface Shop {
  id: string;
  name: string;
  image?: string;
  notes?: string;
  tabId: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  shopId: string;
  type: 'credit' | 'payment';
  direction: 'i_owe' | 'they_owe';
  amount: number;
  itemName?: string;
  timestamp: string;
}

export interface BudgetConfig {
  enabled: boolean;
  globalLimit: number;
  perTabLimits: Record<string, number>;
}

const SHOPS_KEY = 'duely_shops';
const TRANSACTIONS_KEY = 'duely_transactions';
const BUDGET_KEY = 'duely_budget';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getShops(): Shop[] {
  const data = localStorage.getItem(SHOPS_KEY);
  if (!data) return [];
  const shops: Shop[] = JSON.parse(data);
  return shops.map(s => ({ ...s, tabId: s.tabId || 'shops' }));
}

function saveShops(shops: Shop[]) {
  localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
}

export function getTransactions(): Transaction[] {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  if (!data) return [];
  const txns: Transaction[] = JSON.parse(data);
  // Migration: ensure direction exists
  return txns.map(t => ({ ...t, direction: t.direction || 'i_owe' }));
}

function saveTransactions(txns: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txns));
}

export function addShop(name: string, tabId: string = 'shops', notes?: string, image?: string): Shop {
  const shop: Shop = { id: generateId(), name, tabId, notes, image, createdAt: new Date().toISOString() };
  const shops = getShops();
  shops.push(shop);
  saveShops(shops);
  return shop;
}

export function updateShop(id: string, updates: Partial<Pick<Shop, 'name' | 'notes' | 'image' | 'tabId'>>) {
  const shops = getShops().map(s => s.id === id ? { ...s, ...updates } : s);
  saveShops(shops);
}

export function deleteShop(id: string) {
  saveShops(getShops().filter(s => s.id !== id));
  saveTransactions(getTransactions().filter(t => t.shopId !== id));
}

export function addTransaction(shopId: string, type: 'credit' | 'payment', amount: number, itemName?: string, direction: 'i_owe' | 'they_owe' = 'i_owe'): Transaction {
  const txn: Transaction = { id: generateId(), shopId, type, amount, itemName, direction, timestamp: new Date().toISOString() };
  const txns = getTransactions();
  txns.push(txn);
  saveTransactions(txns);
  return txn;
}

export function deleteTransaction(id: string) {
  saveTransactions(getTransactions().filter(t => t.id !== id));
}

export function updateTransaction(id: string, updates: Partial<Pick<Transaction, 'amount' | 'itemName'>>) {
  const txns = getTransactions().map(t => t.id === id ? { ...t, ...updates } : t);
  saveTransactions(txns);
}

export function getShopTransactions(shopId: string): Transaction[] {
  return getTransactions().filter(t => t.shopId === shopId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getShopDue(shopId: string): number {
  const txns = getTransactions().filter(t => t.shopId === shopId);
  return txns.reduce((sum, t) => t.type === 'credit' ? sum + t.amount : sum - t.amount, 0);
}

export function getShopDueByDirection(shopId: string, direction: 'i_owe' | 'they_owe'): number {
  const txns = getTransactions().filter(t => t.shopId === shopId && t.direction === direction);
  return txns.reduce((sum, t) => t.type === 'credit' ? sum + t.amount : sum - t.amount, 0);
}

export function getTotalDue(): number {
  const txns = getTransactions();
  return txns.reduce((sum, t) => {
    const mult = t.direction === 'they_owe' ? -1 : 1;
    return t.type === 'credit' ? sum + t.amount * mult : sum - t.amount * mult;
  }, 0);
}

export function getShopsWithDues(): (Shop & { due: number; iOweDue: number; theyOweDue: number; lastActivity?: string })[] {
  const shops = getShops();
  const txns = getTransactions();
  return shops.map(shop => {
    const shopTxns = txns.filter(t => t.shopId === shop.id);
    const iOweTxns = shopTxns.filter(t => t.direction === 'i_owe');
    const theyOweTxns = shopTxns.filter(t => t.direction === 'they_owe');
    const iOweDue = iOweTxns.reduce((sum, t) => t.type === 'credit' ? sum + t.amount : sum - t.amount, 0);
    const theyOweDue = theyOweTxns.reduce((sum, t) => t.type === 'credit' ? sum + t.amount : sum - t.amount, 0);
    const due = iOweDue - theyOweDue; // net: positive = I owe overall
    const lastTxn = shopTxns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return { ...shop, due, iOweDue: Math.max(0, iOweDue), theyOweDue: Math.max(0, theyOweDue), lastActivity: lastTxn?.timestamp };
  });
}

export function reorderShops(tabId: string, newOrderIds: string[]) {
  const shops = getShops();
  if (tabId === 'all') {
    const reordered = newOrderIds.map(id => shops.find(s => s.id === id)!).filter(Boolean);
    saveShops(reordered);
  } else {
    const result: Shop[] = [];
    let orderIdx = 0;
    for (const shop of shops) {
      if (shop.tabId === tabId) {
        const next = shops.find(s => s.id === newOrderIds[orderIdx]);
        if (next) result.push(next);
        orderIdx++;
      } else {
        result.push(shop);
      }
    }
    saveShops(result);
  }
}

export function moveShopsFromDeletedTab(tabId: string) {
  const shops = getShops().map(s => s.tabId === tabId ? { ...s, tabId: 'shops' } : s);
  saveShops(shops);
}

// Budget
export function getBudget(): BudgetConfig {
  const data = localStorage.getItem(BUDGET_KEY);
  if (!data) return { enabled: false, globalLimit: 5000, perTabLimits: {} };
  return JSON.parse(data);
}

export function saveBudget(config: BudgetConfig) {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(config));
}

export function checkBudgetWarnings(): { global?: { current: number; limit: number }; tabs: { tabId: string; tabName: string; current: number; limit: number }[] } {
  const budget = getBudget();
  if (!budget.enabled) return { tabs: [] };
  
  const txns = getTransactions().filter(t => t.direction === 'i_owe');
  const shops = getShops();
  const warnings: { tabId: string; tabName: string; current: number; limit: number }[] = [];
  
  // Check current month only
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTxns = txns.filter(t => t.type === 'credit' && new Date(t.timestamp) >= monthStart);
  
  const totalCredit = monthTxns.reduce((s, t) => s + t.amount, 0);
  const globalWarning = budget.globalLimit > 0 && totalCredit >= budget.globalLimit * 0.8
    ? { current: totalCredit, limit: budget.globalLimit } : undefined;
  
  for (const [tabId, limit] of Object.entries(budget.perTabLimits)) {
    if (limit <= 0) continue;
    const tabShopIds = new Set(shops.filter(s => s.tabId === tabId).map(s => s.id));
    const tabCredit = monthTxns.filter(t => tabShopIds.has(t.shopId)).reduce((s, t) => s + t.amount, 0);
    if (tabCredit >= limit * 0.8) {
      warnings.push({ tabId, tabName: tabId, current: tabCredit, limit });
    }
  }
  
  return { global: globalWarning, tabs: warnings };
}

export function exportData(): string {
  return JSON.stringify({ shops: getShops(), transactions: getTransactions() }, null, 2);
}

export function importData(json: string) {
  const data = JSON.parse(json);
  if (data.shops) localStorage.setItem(SHOPS_KEY, JSON.stringify(data.shops));
  if (data.transactions) localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(data.transactions));
}

export function resetData() {
  localStorage.removeItem(SHOPS_KEY);
  localStorage.removeItem(TRANSACTIONS_KEY);
}
