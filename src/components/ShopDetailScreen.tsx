import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Banknote, Trash2, Check, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction } from '@/lib/store';
import VoiceInput from '@/components/VoiceInput';
import EditDialog from '@/components/EditDialog';

interface Props {
  shopName: string;
  shopId: string;
  transactions: Transaction[];
  due: number;
  iOweDue?: number;
  theyOweDue?: number;
  onAddCredit: (amount: number, itemName?: string, direction?: 'i_owe' | 'they_owe') => void;
  onAddPayment: (amount: number, direction?: 'i_owe' | 'they_owe') => void;
  onDeleteTransaction: (id: string) => void;
  onEditShopName?: (name: string) => void;
  onEditTransaction?: (id: string, updates: { amount?: number; itemName?: string }) => void;
  onBack: () => void;
  onVoiceResult?: (itemName: string, amount: number) => void;
}

type DirectionTab = 'i_owe' | 'they_owe';

const ShopDetailScreen = ({ shopName, transactions, due, iOweDue = 0, theyOweDue = 0, onAddCredit, onAddPayment, onDeleteTransaction, onEditShopName, onEditTransaction, onBack, onVoiceResult }: Props) => {
  const [mode, setMode] = useState<null | 'credit' | 'payment'>(null);
  const [amount, setAmount] = useState('');
  const [itemName, setItemName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingShopName, setEditingShopName] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [directionTab, setDirectionTab] = useState<DirectionTab>('i_owe');

  const filteredTransactions = transactions.filter(t => t.direction === directionTab || (!t.direction && directionTab === 'i_owe'));
  const currentDue = directionTab === 'i_owe' ? iOweDue : theyOweDue;

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    if (mode === 'credit') {
      onAddCredit(val, itemName.trim() || undefined, directionTab);
    } else {
      if (val > currentDue) return;
      onAddPayment(val, directionTab);
    }
    setAmount('');
    setItemName('');
    setMode(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1200);
  };

  const numPad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const handleNumPad = (key: string) => {
    if (key === '⌫') setAmount(a => a.slice(0, -1));
    else if (key === '.') { if (!amount.includes('.')) setAmount(a => a + '.'); }
    else setAmount(a => a + key);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-30 bg-background flex flex-col"
    >
      <EditDialog
        open={editingShopName}
        title="Edit Shop Name"
        label="Shop Name"
        value={shopName}
        onSave={(v) => onEditShopName?.(v)}
        onClose={() => setEditingShopName(false)}
      />
      {editingTxn && (
        <EditDialog
          open={!!editingTxn}
          title="Edit Transaction"
          label={editingTxn.type === 'credit' ? 'Item Name' : 'Amount'}
          value={editingTxn.type === 'credit' ? (editingTxn.itemName || '') : String(editingTxn.amount)}
          onSave={(v) => {
            if (editingTxn.type === 'credit') {
              onEditTransaction?.(editingTxn.id, { itemName: v });
            } else {
              const num = parseFloat(v);
              if (num > 0) onEditTransaction?.(editingTxn.id, { amount: num });
            }
          }}
          onClose={() => setEditingTxn(null)}
        />
      )}

      {/* Header */}
      <div className="bg-primary p-4 pb-4 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-primary-foreground flex-1">{shopName}</h2>
          {onEditShopName && (
            <button onClick={() => setEditingShopName(true)} className="p-2 rounded-xl text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <p className="text-primary-foreground/70 text-[10px] font-medium uppercase tracking-wider">I Owe</p>
            <p className="text-xl font-extrabold text-primary-foreground">₹{iOweDue}</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <p className="text-primary-foreground/70 text-[10px] font-medium uppercase tracking-wider">They Owe</p>
            <p className="text-xl font-extrabold text-primary-foreground">₹{theyOweDue}</p>
          </div>
        </div>
      </div>

      {/* Direction Tabs */}
      <div className="flex gap-2 px-4 pt-3 pb-1">
        {(['i_owe', 'they_owe'] as DirectionTab[]).map(d => (
          <button
            key={d}
            onClick={() => setDirectionTab(d)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              directionTab === d
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {d === 'i_owe' ? 'I Owe Them' : 'They Owe Me'}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-4">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">
              {directionTab === 'i_owe' ? 'Track what you owe' : 'Track what they owe you'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((txn, i) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${txn.type === 'credit' ? 'bg-credit-light' : 'bg-payment-light'}`}>
                  {txn.type === 'credit' ? <Plus className="w-4 h-4 text-credit" /> : <Banknote className="w-4 h-4 text-payment" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {txn.itemName || (txn.type === 'credit' ? 'Credit' : 'Payment')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(txn.timestamp), 'dd MMM, hh:mm a')}
                  </p>
                </div>
                <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-credit' : 'text-payment'}`}>
                  {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                </p>
                {onEditTransaction && (
                  <button onClick={() => setEditingTxn(txn)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => onDeleteTransaction(txn.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Buttons / Input Mode */}
      <AnimatePresence mode="wait">
        {mode ? (
          <motion.div key="input" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-card border-t border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">
                {mode === 'credit' ? 'Add Credit' : 'Add Payment'} ({directionTab === 'i_owe' ? 'I Owe' : 'They Owe'})
              </h3>
              <button onClick={() => { setMode(null); setAmount(''); setItemName(''); }} className="text-xs text-muted-foreground">Cancel</button>
            </div>
            <div className="text-center mb-3">
              <span className={`text-3xl font-extrabold ${mode === 'credit' ? 'text-credit' : 'text-payment'}`}>₹{amount || '0'}</span>
              {mode === 'payment' && currentDue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Max: ₹{currentDue}</p>
              )}
            </div>
            {mode === 'credit' && (
              <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Item name (optional)"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ring" />
            )}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {numPad.map(key => (
                <motion.button key={key} whileTap={{ scale: 0.9 }} onClick={() => handleNumPad(key)}
                  className="py-3 rounded-xl bg-muted text-foreground font-semibold text-lg hover:bg-accent transition-colors">
                  {key}
                </motion.button>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
              disabled={!amount || parseFloat(amount) <= 0 || (mode === 'payment' && parseFloat(amount) > currentDue)}
              className={`w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40 transition-opacity ${mode === 'credit' ? 'bg-credit text-credit-foreground' : 'bg-payment text-payment-foreground'}`}>
              Save {mode === 'credit' ? 'Credit' : 'Payment'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="buttons" className="p-4 flex gap-3 items-center">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMode('credit')}
              className="flex-1 py-3 rounded-xl bg-credit text-credit-foreground font-semibold text-sm flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Credit
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMode('payment')}
              className="flex-1 py-3 rounded-xl bg-payment text-payment-foreground font-semibold text-sm flex items-center justify-center gap-2">
              <Banknote className="w-4 h-4" /> Add Payment
            </motion.button>
            {onVoiceResult && (
              <VoiceInput onResult={(item, amount) => {
                onVoiceResult(item, amount);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 1200);
              }} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-payment flex items-center justify-center">
              <Check className="w-10 h-10 text-payment-foreground" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ShopDetailScreen;
