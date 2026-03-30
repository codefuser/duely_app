import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet } from 'lucide-react';
import type { BudgetConfig } from '@/lib/store';
import type { UserTab } from '@/lib/tabs';

interface Props {
  budget: BudgetConfig;
  tabs: UserTab[];
  onSave: (config: BudgetConfig) => void;
  onBack: () => void;
}

const BudgetSettings = ({ budget, tabs, onSave, onBack }: Props) => {
  const [config, setConfig] = useState<BudgetConfig>({ ...budget });

  const contentTabs = tabs.filter(t => t.id !== 'all');

  const handleSave = () => {
    onSave(config);
    onBack();
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-40 bg-background flex flex-col"
    >
      <div className="flex items-center gap-3 p-4 border-b border-border safe-top">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">Budget Limits</h2>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Enable Budget Limits</p>
              <p className="text-xs text-muted-foreground">Get warned when spending exceeds limits</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
            className={`w-11 h-6 rounded-full transition-colors relative ${config.enabled ? 'bg-primary' : 'bg-muted'}`}
          >
            <motion.div animate={{ x: config.enabled ? 20 : 2 }} className="absolute top-1 w-4 h-4 rounded-full bg-primary-foreground shadow" />
          </button>
        </div>

        {config.enabled && (
          <>
            {/* Global Limit */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm font-medium mb-2">Monthly Global Limit</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">₹</span>
                <input
                  type="number"
                  value={config.globalLimit || ''}
                  onChange={e => setConfig(c => ({ ...c, globalLimit: Number(e.target.value) }))}
                  placeholder="5000"
                  className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">Alert when monthly credit reaches 80% of this limit</p>
            </div>

            {/* Per-Tab Limits */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm font-medium mb-3">Per-Tab Limits</p>
              <div className="space-y-3">
                {contentTabs.map(tab => (
                  <div key={tab.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-20 truncate">{tab.name}</span>
                    <span className="text-sm font-bold text-primary">₹</span>
                    <input
                      type="number"
                      value={config.perTabLimits[tab.id] || ''}
                      onChange={e => setConfig(c => ({
                        ...c,
                        perTabLimits: { ...c.perTabLimits, [tab.id]: Number(e.target.value) }
                      }))}
                      placeholder="0"
                      className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-5 pt-0 safe-bottom">
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base">
          Save Budget Settings
        </motion.button>
      </div>
    </motion.div>
  );
};

export default BudgetSettings;
