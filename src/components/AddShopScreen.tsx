import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onSave: (name: string, notes?: string) => void;
  onBack: () => void;
  tabLabel?: string;
}

const AddShopScreen = ({ onSave, onBack, tabLabel = 'Shop' }: Props) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), notes.trim() || undefined);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-30 bg-background flex flex-col safe-top"
    >
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">Add {tabLabel}</h2>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-5">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{tabLabel} Name *</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={tabLabel === 'Person' ? 'e.g. Ramesh' : 'e.g. Ramesh Tea Stall'}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Near bus stand..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
          />
        </div>
      </div>

      <div className="p-5 pt-0 safe-bottom">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40 transition-opacity"
        >
          Create {tabLabel}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AddShopScreen;
