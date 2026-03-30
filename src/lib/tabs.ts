export interface UserTab {
  id: string;
  name: string;
  isDefault: boolean;
}

const TABS_KEY = 'duely_tabs';

const DEFAULT_TABS: UserTab[] = [
  { id: 'all', name: 'All', isDefault: true },
  { id: 'shops', name: 'Shops', isDefault: true },
  { id: 'persons', name: 'Persons', isDefault: true },
];

export function getTabs(): UserTab[] {
  const data = localStorage.getItem(TABS_KEY);
  if (!data) {
    localStorage.setItem(TABS_KEY, JSON.stringify(DEFAULT_TABS));
    return [...DEFAULT_TABS];
  }
  return JSON.parse(data);
}

function saveTabs(tabs: UserTab[]) {
  localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
}

export function addTab(name: string): UserTab | null {
  const tabs = getTabs();
  if (tabs.some(t => t.name.toLowerCase() === name.toLowerCase())) return null;
  const tab: UserTab = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name,
    isDefault: false,
  };
  tabs.push(tab);
  saveTabs(tabs);
  return tab;
}

export function updateTab(id: string, name: string): boolean {
  const tabs = getTabs();
  const tab = tabs.find(t => t.id === id);
  if (!tab || tab.isDefault) return false;
  if (tabs.some(t => t.id !== id && t.name.toLowerCase() === name.toLowerCase())) return false;
  tab.name = name;
  saveTabs(tabs);
  return true;
}

export function deleteTab(id: string): boolean {
  const tabs = getTabs();
  const tab = tabs.find(t => t.id === id);
  if (!tab || tab.isDefault) return false;
  saveTabs(tabs.filter(t => t.id !== id));
  return true;
}

export function reorderTabs(orderedIds: string[]) {
  const tabs = getTabs();
  const reordered = orderedIds.map(id => tabs.find(t => t.id === id)!).filter(Boolean);
  saveTabs(reordered);
}
