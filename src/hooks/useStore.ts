import { useState, useCallback } from 'react';
import * as store from '@/lib/store';

export function useStore() {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(v => v + 1), []);

  const shops = store.getShopsWithDues();
  const totalDue = store.getTotalDue();
  const budgetWarnings = store.checkBudgetWarnings();

  const actions = {
    addShop: (name: string, tabId: string = 'shops', notes?: string, image?: string) => {
      const shop = store.addShop(name, tabId, notes, image);
      refresh();
      return shop;
    },
    updateShop: (id: string, updates: Parameters<typeof store.updateShop>[1]) => {
      store.updateShop(id, updates);
      refresh();
    },
    deleteShop: (id: string) => {
      store.deleteShop(id);
      refresh();
    },
    addTransaction: (shopId: string, type: 'credit' | 'payment', amount: number, itemName?: string, direction: 'i_owe' | 'they_owe' = 'i_owe') => {
      const txn = store.addTransaction(shopId, type, amount, itemName, direction);
      refresh();
      return txn;
    },
    deleteTransaction: (id: string) => {
      store.deleteTransaction(id);
      refresh();
    },
    updateTransaction: (id: string, updates: Parameters<typeof store.updateTransaction>[1]) => {
      store.updateTransaction(id, updates);
      refresh();
    },
    reorderShops: (tabId: string, newOrderIds: string[]) => {
      store.reorderShops(tabId, newOrderIds);
      refresh();
    },
    getShopTransactions: store.getShopTransactions,
    getShopDue: store.getShopDue,
    getShopDueByDirection: store.getShopDueByDirection,
    getBudget: store.getBudget,
    saveBudget: (config: store.BudgetConfig) => { store.saveBudget(config); refresh(); },
    exportData: store.exportData,
    importData: (json: string) => { store.importData(json); refresh(); },
    resetData: () => { store.resetData(); refresh(); },
  };

  return { shops, totalDue, budgetWarnings, version, ...actions };
}
