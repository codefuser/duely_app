import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Transaction } from '@/lib/store';

interface ShopWithDues {
  id: string;
  name: string;
  due: number;
  iOweDue: number;
  theyOweDue: number;
  tabId: string;
}

interface Props {
  shops: ShopWithDues[];
  getShopTransactions: (id: string) => Transaction[];
}

const COLORS = [
  'hsl(var(--credit))',
  'hsl(var(--payment))',
  'hsl(var(--warning))',
  'hsl(var(--primary))',
  'hsl(var(--accent-foreground))',
  'hsl(var(--muted-foreground))',
];

const DashboardSummary = ({ shops, getShopTransactions }: Props) => {
  const topDebtors = useMemo(() => {
    return [...shops]
      .filter(s => s.iOweDue > 0)
      .sort((a, b) => b.iOweDue - a.iOweDue)
      .slice(0, 3);
  }, [shops]);

  const pieData = useMemo(() => {
    const byTab: Record<string, number> = {};
    shops.forEach(s => {
      const txns = getShopTransactions(s.id);
      const credit = txns.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
      if (credit > 0) {
        const label = s.tabId === 'shops' ? 'Shops' : s.tabId === 'persons' ? 'Persons' : s.tabId;
        byTab[label] = (byTab[label] || 0) + credit;
      }
    });
    return Object.entries(byTab).map(([name, value]) => ({ name, value }));
  }, [shops, getShopTransactions]);

  if (shops.length === 0) return null;

  return (
    <div className="space-y-4 mb-5">
      {/* Top Debtors */}
      {topDebtors.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="text-sm font-semibold mb-3 text-card-foreground">Top 3 — You Owe Most</h3>
          <div className="space-y-2">
            {topDebtors.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium truncate">{s.name}</span>
                <span className="text-sm font-bold text-credit">₹{s.iOweDue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="text-sm font-semibold mb-3 text-card-foreground">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`₹${value}`, 'Total Credit']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DashboardSummary;
