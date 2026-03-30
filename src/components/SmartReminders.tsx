import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { getShopsWithDues, getShopTransactions } from '@/lib/store';

interface Reminder {
  shopId: string;
  shopName: string;
  due: number;
  daysSince: number;
}

const SmartReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const shops = getShopsWithDues();
    const now = Date.now();
    const tenDays = 10 * 24 * 60 * 60 * 1000;

    const overdue = shops
      .filter(shop => shop.due > 0)
      .map(shop => {
        const txns = getShopTransactions(shop.id);
        const lastPayment = txns.find(t => t.type === 'payment');
        const lastActivity = lastPayment ? new Date(lastPayment.timestamp).getTime() : new Date(shop.createdAt).getTime();
        const daysSince = Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000));
        return { shopId: shop.id, shopName: shop.name, due: shop.due, daysSince };
      })
      .filter(r => r.daysSince >= 10);

    setReminders(overdue);
  }, []);

  const visible = reminders.filter(r => !dismissed.has(r.shopId));

  if (visible.length === 0) return null;

  return (
    <div className="px-4 space-y-2 mb-3">
      <AnimatePresence>
        {visible.map(r => (
          <motion.div
            key={r.shopId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-warning/10 border border-warning/30 rounded-xl p-3 flex items-start gap-3"
          >
            <Bell className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {r.shopName} — ₹{r.due} pending
              </p>
              <p className="text-[11px] text-muted-foreground">
                No payment in {r.daysSince} days
              </p>
            </div>
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(r.shopId))}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SmartReminders;
