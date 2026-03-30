import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  label: string;
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

const EditDialog = ({ open, title, label, value, onSave, onClose }: Props) => {
  const [input, setInput] = useState(value);

  const handleSave = () => {
    if (input.trim()) {
      onSave(input.trim());
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-card-foreground">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!input.trim()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Check className="w-4 h-4" /> Save
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditDialog;
