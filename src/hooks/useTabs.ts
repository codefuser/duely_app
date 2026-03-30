import { useState, useCallback } from 'react';
import * as tabsLib from '@/lib/tabs';
import { moveShopsFromDeletedTab } from '@/lib/store';

export function useTabs() {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(v => v + 1), []);

  const tabs = tabsLib.getTabs();

  return {
    tabs,
    version,
    addTab: (name: string) => {
      const r = tabsLib.addTab(name);
      if (r) refresh();
      return !!r;
    },
    updateTab: (id: string, name: string) => {
      const r = tabsLib.updateTab(id, name);
      if (r) refresh();
      return r;
    },
    deleteTab: (id: string) => {
      moveShopsFromDeletedTab(id);
      const r = tabsLib.deleteTab(id);
      if (r) refresh();
      return r;
    },
    reorderTabs: (ids: string[]) => {
      tabsLib.reorderTabs(ids);
      refresh();
    },
  };
}
