import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { exportData } from '@/lib/store';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ExportDialog = ({ open, onClose }: Props) => {
  const [fileName, setFileName] = useState('duely-backup');

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const finalName = `${fileName.trim() || 'duely-backup'}_${timestamp}.json`;
    const a = document.createElement('a');
    a.href = url;
    a.download = finalName;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
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
              <h3 className="font-semibold text-card-foreground">Export Data</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              File Name
            </label>
            <input
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="Enter file name"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-2"
            />
            <p className="text-[11px] text-muted-foreground mb-4">
              Date & time will be appended automatically
            </p>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleExport}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExportDialog;
