import { useState, useCallback, useMemo, useRef, TouchEvent } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { Plus, Home, BarChart3, Settings, Upload, RotateCcw, Download, Moon, Sun, Search, X, Palette, Layers, Wallet, Shield, FileText, HelpCircle, Info, Mail, AlertTriangle, Filter, ChevronDown, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useTheme, THEME_PRESETS } from '@/hooks/useTheme';
import { useTabs } from '@/hooks/useTabs';
import SplashScreen from '@/components/SplashScreen';
import ShopCard from '@/components/ShopCard';
import AddShopScreen from '@/components/AddShopScreen';
import ShopDetailScreen from '@/components/ShopDetailScreen';
import AnimatedCounter from '@/components/AnimatedCounter';
import SmartReminders from '@/components/SmartReminders';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import ExportDialog from '@/components/ExportDialog';
import TabManager from '@/components/TabManager';
import LegalPages from '@/components/LegalPages';
import BudgetSettings from '@/components/BudgetSettings';
import DashboardSummary from '@/components/DashboardSummary';

type NavTab = 'home' | 'analytics' | 'settings';
type LegalPage = 'privacy' | 'terms' | 'about' | 'help' | 'contact';
type SortOrder = 'none' | 'low_high' | 'high_low';
type DueFilter = 'all' | 'i_owe' | 'they_owe';

const NAV_TABS: NavTab[] = ['home', 'analytics', 'settings'];

const Index = () => {
  const [splashDone, setSplashDone] = useState(false);
  const [navTab, setNavTab] = useState<NavTab>('home');
  const [activeTabId, setActiveTabId] = useState('all');
  const [analyticsTabId, setAnalyticsTabId] = useState('all');
  const [addingShop, setAddingShop] = useState(false);
  const [addingToTabId, setAddingToTabId] = useState<string | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [showTabManager, setShowTabManager] = useState(false);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [legalPage, setLegalPage] = useState<LegalPage | null>(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  const store = useStore();
  const theme = useTheme();
  const tabsHook = useTabs();

  // Swipe for category tabs
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  // Swipe for bottom nav
  const navTouchStart = useRef<{ x: number; y: number } | null>(null);

  // Dual balance calculation
  const totalIOwe = useMemo(() =>
    store.shops.reduce((sum, s) => sum + s.iOweDue, 0), [store.shops]);
  const totalTheyOwe = useMemo(() =>
    store.shops.reduce((sum, s) => sum + s.theyOweDue, 0), [store.shops]);

  const filteredShops = useMemo(() => {
    let shops = store.shops;
    if (activeTabId !== 'all') {
      shops = shops.filter(s => s.tabId === activeTabId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      shops = shops.filter(s => s.name.toLowerCase().includes(q));
    }
    // Due direction filter
    if (dueFilter === 'i_owe') {
      shops = shops.filter(s => s.iOweDue > 0);
    } else if (dueFilter === 'they_owe') {
      shops = shops.filter(s => s.theyOweDue > 0);
    }
    // Sort
    if (sortOrder === 'low_high') {
      shops = [...shops].sort((a, b) => Math.abs(a.due) - Math.abs(b.due));
    } else if (sortOrder === 'high_low') {
      shops = [...shops].sort((a, b) => Math.abs(b.due) - Math.abs(a.due));
    }
    return shops;
  }, [store.shops, activeTabId, searchQuery, dueFilter, sortOrder]);

  const reorderIds = useMemo(() => filteredShops.map(s => s.id), [filteredShops]);

  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  const selectedShop = selectedShopId ? store.shops.find(s => s.id === selectedShopId) : null;
  const selectedTransactions = selectedShopId ? store.getShopTransactions(selectedShopId) : [];
  const selectedDue = selectedShopId ? store.getShopDue(selectedShopId) : 0;
  const selectedIOweDue = selectedShop?.iOweDue ?? 0;
  const selectedTheyOweDue = selectedShop?.theyOweDue ?? 0;

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            store.importData(reader.result as string);
            alert('Data imported successfully!');
          } catch {
            alert('Invalid backup file. Please select a valid Duely backup.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleVoiceResult = useCallback((itemName: string, amount: number) => {
    if (selectedShopId) {
      store.addTransaction(selectedShopId, 'credit', amount, itemName || undefined);
    }
  }, [selectedShopId, store]);

  const handleFabClick = () => {
    if (activeTabId === 'all') {
      setShowFabMenu(prev => !prev);
    } else {
      setAddingToTabId(activeTabId);
      setAddingShop(true);
    }
  };

  const handleFabMenuSelect = (tabId: string) => {
    setShowFabMenu(false);
    setAddingToTabId(tabId);
    setAddingShop(true);
  };

  const getTabLabel = (tabId: string): string => {
    if (tabId === 'persons') return 'Person';
    if (tabId === 'shops') return 'Shop';
    const tab = tabsHook.tabs.find(t => t.id === tabId);
    return tab?.name || 'Item';
  };

  const contentTabs = tabsHook.tabs.filter(t => t.id !== 'all');

  // Swipe handler for category tabs
  const handleTouchStart = (e: TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: TouchEvent, tabs: typeof tabsHook.tabs, currentId: string, onChange: (id: string) => void) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    if (Math.abs(dx) < 50 || dy > Math.abs(dx)) return;
    const idx = tabs.findIndex(t => t.id === currentId);
    if (dx < 0 && idx < tabs.length - 1) onChange(tabs[idx + 1].id);
    if (dx > 0 && idx > 0) onChange(tabs[idx - 1].id);
    touchStart.current = null;
  };

  // Swipe handler for bottom nav tabs
  const handleNavTouchStart = (e: TouchEvent) => {
    navTouchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleNavTouchEnd = (e: TouchEvent) => {
    if (!navTouchStart.current) return;
    const dx = e.changedTouches[0].clientX - navTouchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - navTouchStart.current.y);
    if (Math.abs(dx) < 60 || dy > Math.abs(dx)) return;
    const idx = NAV_TABS.indexOf(navTab);
    if (dx < 0 && idx < NAV_TABS.length - 1) setNavTab(NAV_TABS[idx + 1]);
    if (dx > 0 && idx > 0) setNavTab(NAV_TABS[idx - 1]);
    navTouchStart.current = null;
  };

  // Analytics totals
  const analyticsShops = useMemo(() => {
    if (analyticsTabId === 'all') return store.shops;
    return store.shops.filter(s => s.tabId === analyticsTabId);
  }, [store.shops, analyticsTabId]);

  const totalCredit = useMemo(() =>
    analyticsShops.reduce((s, sh) => {
      const txns = store.getShopTransactions(sh.id);
      return s + txns.filter(t => t.type === 'credit').reduce((a, t) => a + t.amount, 0);
    }, 0), [analyticsShops]);

  const totalPaid = useMemo(() =>
    analyticsShops.reduce((s, sh) => {
      const txns = store.getShopTransactions(sh.id);
      return s + txns.filter(t => t.type === 'payment').reduce((a, t) => a + t.amount, 0);
    }, 0), [analyticsShops]);

  if (!splashDone) return <SplashScreen onFinish={handleSplashFinish} />;

  const renderCategoryTabs = (selected: string, onChange: (id: string) => void) => (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
      {tabsHook.tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            selected === tab.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );

  const budgetAlerts = store.budgetWarnings;
  const hasBudgetWarning = budgetAlerts.global || budgetAlerts.tabs.length > 0;

  const activeFiltersCount = (dueFilter !== 'all' ? 1 : 0) + (sortOrder !== 'none' ? 1 : 0);

  return (
    <div
      className="min-h-[100dvh] bg-background flex flex-col max-w-md mx-auto relative"
      onTouchStart={handleNavTouchStart}
      onTouchEnd={handleNavTouchEnd}
    >
      {/* Overlays */}
      <AnimatePresence>
        {addingShop && (
          <AddShopScreen
            tabLabel={getTabLabel(addingToTabId || 'shops')}
            onSave={(name, notes) => {
              store.addShop(name, addingToTabId || 'shops', notes);
              setAddingShop(false);
              setAddingToTabId(null);
            }}
            onBack={() => { setAddingShop(false); setAddingToTabId(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedShop && (
          <ShopDetailScreen
            shopId={selectedShop.id}
            shopName={selectedShop.name}
            transactions={selectedTransactions}
            due={selectedDue}
            iOweDue={selectedIOweDue}
            theyOweDue={selectedTheyOweDue}
            onAddCredit={(amount, item, direction) => store.addTransaction(selectedShop.id, 'credit', amount, item, direction)}
            onAddPayment={(amount, direction) => store.addTransaction(selectedShop.id, 'payment', amount, undefined, direction)}
            onDeleteTransaction={(id) => store.deleteTransaction(id)}
            onEditShopName={(name) => store.updateShop(selectedShop.id, { name })}
            onEditTransaction={(id, updates) => store.updateTransaction(id, updates)}
            onBack={() => setSelectedShopId(null)}
            onVoiceResult={handleVoiceResult}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTabManager && (
          <TabManager
            tabs={tabsHook.tabs}
            onAdd={tabsHook.addTab}
            onEdit={tabsHook.updateTab}
            onDelete={tabsHook.deleteTab}
            onReorder={tabsHook.reorderTabs}
            onBack={() => setShowTabManager(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBudgetSettings && (
          <BudgetSettings
            budget={store.getBudget()}
            tabs={tabsHook.tabs}
            onSave={store.saveBudget}
            onBack={() => setShowBudgetSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {legalPage && (
          <LegalPages page={legalPage} onBack={() => setLegalPage(null)} />
        )}
      </AnimatePresence>

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-[calc(60px+env(safe-area-inset-bottom,0px))]">
        {navTab === 'home' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, tabsHook.tabs, activeTabId, setActiveTabId)}
          >
            {/* Header with dual balance */}
            <div className="bg-primary rounded-b-3xl p-5 pb-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))]">
              <h1 className="text-primary-foreground/70 text-sm font-medium">Your Balance</h1>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-primary-foreground/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingDown className="w-3.5 h-3.5 text-primary-foreground/70" />
                    <p className="text-primary-foreground/70 text-[10px] font-medium uppercase tracking-wider">You Owe</p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary-foreground">
                    <AnimatedCounter value={totalIOwe} />
                  </p>
                </div>
                <div className="bg-primary-foreground/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-primary-foreground/70" />
                    <p className="text-primary-foreground/70 text-[10px] font-medium uppercase tracking-wider">You'll Receive</p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary-foreground">
                    <AnimatedCounter value={totalTheyOwe} />
                  </p>
                </div>
              </div>
              <p className="text-primary-foreground/60 text-xs mt-2.5">
                Across {store.shops.length} {store.shops.length !== 1 ? 'entries' : 'entry'}
              </p>
            </div>

            {/* Budget Warnings */}
            {hasBudgetWarning && (
              <div className="px-4 pt-3 space-y-2">
                {budgetAlerts.global && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Budget Warning</p>
                      <p className="text-[11px] text-muted-foreground">
                        Monthly credit ₹{budgetAlerts.global.current} / ₹{budgetAlerts.global.limit} ({Math.round(budgetAlerts.global.current / budgetAlerts.global.limit * 100)}%)
                      </p>
                    </div>
                  </div>
                )}
                {budgetAlerts.tabs.map(tw => (
                  <div key={tw.tabId} className="bg-warning/10 border border-warning/30 rounded-xl p-3 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{tw.tabName} limit</p>
                      <p className="text-[11px] text-muted-foreground">₹{tw.current} / ₹{tw.limit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3">
              <SmartReminders />
            </div>

            {renderCategoryTabs(activeTabId, setActiveTabId)}

            {/* Search + Filter bar */}
            {store.shops.length > 0 && (
              <div className="px-4 pt-1 pb-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 rounded-xl border transition-colors flex items-center gap-1.5 shrink-0 ${
                      activeFiltersCount > 0
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    {activeFiltersCount > 0 && (
                      <span className="text-xs font-bold">{activeFiltersCount}</span>
                    )}
                  </button>
                </div>

                {/* Filter dropdown */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-card border border-border rounded-xl p-3 mt-2 space-y-3">
                        {/* Due type filter */}
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Due Type</p>
                          <div className="flex gap-2">
                            {([
                              { key: 'all' as DueFilter, label: 'All' },
                              { key: 'i_owe' as DueFilter, label: 'I Owe' },
                              { key: 'they_owe' as DueFilter, label: 'They Owe Me' },
                            ]).map(f => (
                              <button
                                key={f.key}
                                onClick={() => setDueFilter(f.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  dueFilter === f.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sort by amount */}
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Sort by Amount</p>
                          <div className="flex gap-2">
                            {([
                              { key: 'none' as SortOrder, label: 'Default' },
                              { key: 'low_high' as SortOrder, label: 'Low → High' },
                              { key: 'high_low' as SortOrder, label: 'High → Low' },
                            ]).map(s => (
                              <button
                                key={s.key}
                                onClick={() => setSortOrder(s.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  sortOrder === s.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {activeFiltersCount > 0 && (
                          <button
                            onClick={() => { setDueFilter('all'); setSortOrder('none'); }}
                            className="text-xs text-destructive font-medium"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Shop List - normal scroll, drag only via handle */}
            <div className="p-4 space-y-3">
              {filteredShops.length === 0 && !searchQuery && dueFilter === 'all' ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">{activeTabId === 'persons' ? '👤' : '🏪'}</p>
                  <p className="text-muted-foreground font-medium">
                    {activeTabId === 'all' ? 'No entries yet' : `No ${getTabLabel(activeTabId).toLowerCase()}s yet`}
                  </p>
                  <p className="text-muted-foreground/70 text-sm mt-1">Tap + to add</p>
                </div>
              ) : filteredShops.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">No results found</p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={reorderIds}
                  onReorder={(newOrder) => {
                    store.reorderShops(activeTabId, newOrder);
                  }}
                  className="space-y-3"
                >
                  {filteredShops.map(shop => (
                    <Reorder.Item
                      key={shop.id}
                      value={shop.id}
                      dragListener={false}
                      id={`drag-${shop.id}`}
                    >
                      <ShopCard
                        id={shop.id}
                        name={shop.name}
                        due={shop.due}
                        iOweDue={shop.iOweDue}
                        theyOweDue={shop.theyOweDue}
                        lastActivity={shop.lastActivity}
                        tabId={shop.tabId}
                        onClick={() => setSelectedShopId(shop.id)}
                        onDelete={() => store.deleteShop(shop.id)}
                        dragControls
                      />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>
          </motion.div>
        )}

        {navTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))]"
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, tabsHook.tabs, analyticsTabId, setAnalyticsTabId)}
          >
            <h2 className="text-xl font-bold mb-3">Analytics</h2>

            <div className="mb-4 -mx-5">
              {renderCategoryTabs(analyticsTabId, setAnalyticsTabId)}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-xs text-muted-foreground font-medium">Total Credit</p>
                <p className="text-2xl font-bold text-credit mt-1">₹{totalCredit}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-xs text-muted-foreground font-medium">Total Paid</p>
                <p className="text-2xl font-bold text-payment mt-1">₹{totalPaid}</p>
              </div>
            </div>

            {/* Dashboard Summary - Top debtors + Pie chart */}
            <DashboardSummary shops={analyticsShops} getShopTransactions={store.getShopTransactions} />

            <AnalyticsCharts filterTabId={analyticsTabId} />

            <h3 className="text-sm font-semibold text-muted-foreground mb-3 mt-5">Breakdown</h3>
            <div className="space-y-2">
              {analyticsShops.map(shop => {
                const txns = store.getShopTransactions(shop.id);
                const tc = txns.filter(t => t.type === 'credit').reduce((a, t) => a + t.amount, 0);
                const tp = txns.filter(t => t.type === 'payment').reduce((a, t) => a + t.amount, 0);
                const ratio = tc > 0 ? (tp / tc) * 100 : 0;
                return (
                  <div key={shop.id} className="bg-card rounded-xl p-3 border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{shop.name}</span>
                      <span className="text-xs text-muted-foreground">₹{shop.due} due</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(ratio, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-payment rounded-full" />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">Paid: ₹{tp}</span>
                      <span className="text-[10px] text-muted-foreground">Credit: ₹{tc}</span>
                    </div>
                  </div>
                );
              })}
              {analyticsShops.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No data yet</p>
              )}
            </div>
          </motion.div>
        )}

        {navTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))]">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <div className="space-y-3">
              {/* Dark Mode */}
              <button onClick={theme.toggleDark} className="w-full flex items-center gap-3 bg-card rounded-xl p-4 border border-border text-left hover:bg-accent transition-colors">
                {theme.dark ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">{theme.dark ? 'Switch to light' : 'Switch to dark'}</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${theme.dark ? 'bg-primary' : 'bg-muted'}`}>
                  <motion.div animate={{ x: theme.dark ? 20 : 2 }} className="absolute top-1 w-4 h-4 rounded-full bg-primary-foreground shadow" />
                </div>
              </button>

              {/* Theme */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Palette className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Theme</p>
                    <p className="text-xs text-muted-foreground">Choose your color theme</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {THEME_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => theme.setTheme(preset.id)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                        theme.themeId === preset.id ? 'bg-accent ring-2 ring-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `hsl(${preset.primary})` }} />
                      <span className="text-[10px] font-medium text-foreground">{preset.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => theme.setTheme('custom')}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                      theme.themeId === 'custom' ? 'bg-accent ring-2 ring-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                      <Plus className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-medium text-foreground">Custom</span>
                  </button>
                </div>
                {theme.themeId === 'custom' && (
                  <div className="mt-3 flex items-center gap-3">
                    <input type="color" value={theme.customColor} onChange={e => theme.setCustom(e.target.value)}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent" />
                    <span className="text-xs text-muted-foreground">Pick a custom primary color</span>
                  </div>
                )}
              </div>

              {/* Manage Tabs */}
              <button onClick={() => setShowTabManager(true)} className="w-full flex items-center gap-3 bg-card rounded-xl p-4 border border-border text-left hover:bg-accent transition-colors">
                <Layers className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Manage Tabs</p>
                  <p className="text-xs text-muted-foreground">Add, edit, reorder, or delete tabs</p>
                </div>
              </button>

              {/* Budget */}
              <button onClick={() => setShowBudgetSettings(true)} className="w-full flex items-center gap-3 bg-card rounded-xl p-4 border border-border text-left hover:bg-accent transition-colors">
                <Wallet className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Budget Limits</p>
                  <p className="text-xs text-muted-foreground">Set monthly spending thresholds</p>
                </div>
              </button>

              {/* Export / Import / Reset */}
              <button onClick={() => setExportOpen(true)} className="w-full flex items-center gap-3 bg-card rounded-xl p-4 border border-border text-left hover:bg-accent transition-colors">
                <Download className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Export Data</p>
                  <p className="text-xs text-muted-foreground">Download backup as JSON or PDF</p>
                </div>
              </button>
              <button onClick={handleImport} className="w-full flex items-center gap-3 bg-card rounded-xl p-4 border border-border text-left hover:bg-accent transition-colors">
                <Upload className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Import Data</p>
                  <p className="text-xs text-muted-foreground">Restore from backup file</p>
                </div>
              </button>

              {/* Legal / Info Section */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">About & Legal</p>
              </div>
              {([
                { key: 'about' as LegalPage, icon: Info, label: 'About Duely', desc: 'Version, features, and mission' },
                { key: 'help' as LegalPage, icon: HelpCircle, label: 'Help & Support', desc: 'How to use, FAQs, troubleshooting' },
                { key: 'contact' as LegalPage, icon: Mail, label: 'Contact Us', desc: 'Feedback and support' },
                { key: 'privacy' as LegalPage, icon: Shield, label: 'Privacy Policy', desc: 'How your data is handled' },
                { key: 'terms' as LegalPage, icon: FileText, label: 'Terms & Conditions', desc: 'Usage terms and disclaimers' },
              ]).map(item => (
                <button
                  key={item.key}
                  onClick={() => setLegalPage(item.key)}
                  className="w-full flex items-center gap-3 bg-card rounded-xl p-4 border border-border text-left hover:bg-accent transition-colors mb-3"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </button>
              ))}

              <button onClick={() => { if (confirm('Reset all data? This cannot be undone.')) store.resetData(); }} className="w-full flex items-center gap-3 bg-card rounded-xl p-4 border border-border text-left hover:bg-destructive/5 transition-colors">
                <RotateCcw className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Reset App</p>
                  <p className="text-xs text-muted-foreground">Delete all data</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* FAB with menu */}
      {navTab === 'home' && !addingShop && !selectedShopId && (
        <div className="fixed z-20" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', right: 'max(20px, calc((100vw - 448px)/2 + 20px))' }}>
          <AnimatePresence>
            {showFabMenu && activeTabId === 'all' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-16 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[160px]"
              >
                {contentTabs.map(tab => (
                  <button key={tab.id} onClick={() => handleFabMenuSelect(tab.id)}
                    className="w-full px-4 py-3 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2">
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={handleFabClick}
            className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center">
            <Plus className={`w-6 h-6 transition-transform ${showFabMenu ? 'rotate-45' : ''}`} />
          </motion.button>
        </div>
      )}

      {showFabMenu && <div className="fixed inset-0 z-10" onClick={() => setShowFabMenu(false)} />}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <div className="max-w-md mx-auto bg-card border-t border-border px-6 flex justify-around pb-[env(safe-area-inset-bottom,0px)] pt-1">
          {([
            { key: 'home' as NavTab, icon: Home, label: 'Home' },
            { key: 'analytics' as NavTab, icon: BarChart3, label: 'Analytics' },
            { key: 'settings' as NavTab, icon: Settings, label: 'Settings' },
          ]).map(item => (
            <button
              key={item.key}
              onClick={() => setNavTab(item.key)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${navTab === item.key ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
