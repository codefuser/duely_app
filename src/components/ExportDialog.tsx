import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, FileJson, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { exportData, getShopsWithDues, getShopTransactions } from '@/lib/store';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ExportDialog = ({ open, onClose }: Props) => {
  const [fileName, setFileName] = useState('duely-backup');
  const [exportType, setExportType] = useState<'json' | 'pdf'>('json');

  const handleExportJSON = () => {
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

  const handleExportPDF = () => {
    const shops = getShopsWithDues();
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const finalName = `${fileName.trim() || 'duely-backup'}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}`;

    // Build HTML for PDF
    let html = `
      <html><head><title>${finalName}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #222; }
        h1 { color: #14B8A6; font-size: 22px; }
        h2 { font-size: 16px; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .meta { color: #888; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
        th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f5f5f5; font-weight: 600; }
        .credit { color: #e53e3e; }
        .payment { color: #38a169; }
        .summary { display: flex; gap: 20px; margin: 10px 0; }
        .summary-box { padding: 10px 16px; border-radius: 8px; background: #f7f7f7; }
      </style></head><body>
      <h1>Duely — Statement of Dues</h1>
      <p class="meta">Generated on ${timestamp}</p>
    `;

    const totalIOwe = shops.reduce((s, sh) => s + sh.iOweDue, 0);
    const totalTheyOwe = shops.reduce((s, sh) => s + sh.theyOweDue, 0);

    html += `<div class="summary">
      <div class="summary-box"><strong>You Owe:</strong> ₹${totalIOwe}</div>
      <div class="summary-box"><strong>You'll Receive:</strong> ₹${totalTheyOwe}</div>
    </div>`;

    shops.forEach(shop => {
      const txns = getShopTransactions(shop.id);
      html += `<h2>${shop.name}</h2>`;
      html += `<p style="font-size:12px;color:#666;">I Owe: ₹${shop.iOweDue} | They Owe: ₹${shop.theyOweDue}</p>`;
      if (txns.length > 0) {
        html += `<table><tr><th>Date</th><th>Type</th><th>Item</th><th>Amount</th><th>Direction</th></tr>`;
        txns.forEach(t => {
          html += `<tr>
            <td>${format(new Date(t.timestamp), 'dd MMM yyyy, hh:mm a')}</td>
            <td class="${t.type}">${t.type === 'credit' ? 'Credit' : 'Payment'}</td>
            <td>${t.itemName || '-'}</td>
            <td>₹${t.amount}</td>
            <td>${t.direction === 'they_owe' ? 'They Owe' : 'I Owe'}</td>
          </tr>`;
        });
        html += `</table>`;
      } else {
        html += `<p style="color:#999;font-size:12px;">No transactions</p>`;
      }
    });

    html += `</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    onClose();
  };

  const handleExport = () => {
    if (exportType === 'pdf') {
      handleExportPDF();
    } else {
      handleExportJSON();
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
              <h3 className="font-semibold text-card-foreground">Export Data</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Export type toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setExportType('json')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  exportType === 'json'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <FileJson className="w-4 h-4" /> JSON
              </button>
              <button
                onClick={() => setExportType('pdf')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  exportType === 'pdf'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <FileText className="w-4 h-4" /> PDF
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
              <Download className="w-4 h-4" /> Export as {exportType.toUpperCase()}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExportDialog;
