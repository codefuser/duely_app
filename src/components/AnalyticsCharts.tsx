import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getTransactions, getShops } from '@/lib/store';
import { format, subDays, subMonths, subYears, startOfDay, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval, endOfWeek } from 'date-fns';
import { CalendarDays } from 'lucide-react';

type RangeKey = '7d' | '1m' | '1y' | 'custom';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '1m', label: 'Last month' },
  { key: '1y', label: 'Last year' },
  { key: 'custom', label: 'Custom' },
];

interface Props {
  filterTabId?: string;
}

const AnalyticsCharts = ({ filterTabId = 'all' }: Props) => {
  const [range, setRange] = useState<RangeKey>('1m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const { data: chartData, hasData } = useMemo(() => {
    const allTxns = getTransactions();
    const shops = getShops();
    const now = new Date();

    // Filter by tab
    let shopIds: Set<string>;
    if (filterTabId === 'all') {
      shopIds = new Set(shops.map(s => s.id));
    } else {
      shopIds = new Set(shops.filter(s => s.tabId === filterTabId).map(s => s.id));
    }

    const txns = allTxns.filter(t => shopIds.has(t.shopId));

    let start: Date;
    let end: Date = now;

    switch (range) {
      case '7d': start = subDays(now, 6); break;
      case '1m': start = subMonths(now, 1); break;
      case '1y': start = subYears(now, 1); break;
      case 'custom':
        if (!customFrom || !customTo) return { data: [], hasData: false };
        start = new Date(customFrom);
        end = new Date(customTo);
        break;
      default: start = subMonths(now, 1);
    }

    const filtered = txns.filter(t =>
      isWithinInterval(new Date(t.timestamp), { start: startOfDay(start), end })
    );

    let buckets: { name: string; credit: number; payment: number }[];
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 14) {
      const days = eachDayOfInterval({ start, end });
      buckets = days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);
        const dayTxns = filtered.filter(t => isWithinInterval(new Date(t.timestamp), { start: dayStart, end: dayEnd }));
        return {
          name: format(day, 'dd MMM'),
          credit: dayTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
          payment: dayTxns.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0),
        };
      });
    } else if (diffDays <= 90) {
      const weeks = eachWeekOfInterval({ start, end });
      buckets = weeks.map(weekStart => {
        const wEnd = endOfWeek(weekStart);
        const wTxns = filtered.filter(t => isWithinInterval(new Date(t.timestamp), { start: weekStart, end: wEnd }));
        return {
          name: format(weekStart, 'dd MMM'),
          credit: wTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
          payment: wTxns.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0),
        };
      });
    } else {
      const months = eachMonthOfInterval({ start, end });
      buckets = months.map(month => {
        const mStart = startOfMonth(month);
        const mEnd = endOfMonth(month);
        const mTxns = filtered.filter(t => isWithinInterval(new Date(t.timestamp), { start: mStart, end: mEnd }));
        return {
          name: format(month, 'MMM yy'),
          credit: mTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
          payment: mTxns.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0),
        };
      });
    }

    return { data: buckets, hasData: buckets.some(m => m.credit > 0 || m.payment > 0) };
  }, [range, customFrom, customTo, filterTabId]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {RANGE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setRange(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === opt.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="w-full pl-8 pr-2 py-2 rounded-lg bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <span className="text-muted-foreground text-xs">to</span>
          <div className="flex-1 relative">
            <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="w-full pl-8 pr-2 py-2 rounded-lg bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
      )}

      {!hasData ? (
        <div className="text-center text-muted-foreground text-sm py-6">No transactions in this period</div>
      ) : (
        <>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <h3 className="text-sm font-semibold mb-3 text-card-foreground">Credit vs Payment</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [`₹${value}`, name === 'credit' ? 'Credit' : 'Payment']} />
                <Bar dataKey="credit" fill="hsl(var(--credit))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payment" fill="hsl(var(--payment))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl p-4 border border-border">
            <h3 className="text-sm font-semibold mb-3 text-card-foreground">Spending Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [`₹${value}`, name === 'credit' ? 'Credit' : 'Payment']} />
                <Line type="monotone" dataKey="credit" stroke="hsl(var(--credit))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="payment" stroke="hsl(var(--payment))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsCharts;
