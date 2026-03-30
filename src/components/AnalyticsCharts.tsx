import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { getTransactions, getShops } from "@/lib/store";
import {
  format,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { CalendarDays } from "lucide-react";

type RangeKey = "7d" | "1m" | "1y" | "custom";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "1m", label: "Last month" },
  { key: "1y", label: "Last year" },
  { key: "custom", label: "Custom" },
];

interface Props {
  filterTabId?: string;
}

const AnalyticsCharts = ({ filterTabId = "all" }: Props) => {
  const [range, setRange] = useState<RangeKey>("1m");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { data: chartData, hasData } = useMemo(() => {
    const allTxns = getTransactions();
    const shops = getShops();
    const now = new Date();

    // 👉 Filter shops
    const shopIds = new Set(
      filterTabId === "all"
        ? shops.map((s) => s.id)
        : shops.filter((s) => s.tabId === filterTabId).map((s) => s.id),
    );

    // 👉 Filter transactions once
    const txns = allTxns.filter((t) => shopIds.has(t.shopId));

    let start: Date;
    let end: Date = endOfDay(now);

    switch (range) {
      case "7d":
        start = startOfDay(subDays(now, 6));
        break;
      case "1m":
        start = startOfDay(subMonths(now, 1));
        break;
      case "1y":
        start = startOfDay(subYears(now, 1));
        break;
      case "custom":
        if (!customFrom || !customTo) return { data: [], hasData: false };

        start = startOfDay(new Date(customFrom));
        end = endOfDay(new Date(customTo));

        // ❗ Fix invalid range
        if (start > end) return { data: [], hasData: false };
        break;
      default:
        start = startOfDay(subMonths(now, 1));
    }

    // 👉 Filter once
    const filtered = txns.filter((t) =>
      isWithinInterval(new Date(t.timestamp), { start, end }),
    );

    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    let buckets: { name: string; credit: number; payment: number }[] = [];

    // 👉 Helper function (performance boost)
    const sumByType = (list: typeof filtered, type: "credit" | "payment") =>
      list.reduce((sum, t) => (t.type === type ? sum + t.amount : sum), 0);

    // ✅ DAILY VIEW
    if (diffDays <= 14) {
      const days = eachDayOfInterval({ start, end });

      buckets = days.map((day) => {
        const dStart = startOfDay(day);
        const dEnd = endOfDay(day);

        const dayTxns = filtered.filter((t) =>
          isWithinInterval(new Date(t.timestamp), { start: dStart, end: dEnd }),
        );

        return {
          name: format(day, "dd MMM"),
          credit: sumByType(dayTxns, "credit"),
          payment: sumByType(dayTxns, "payment"),
        };
      });
    }

    // ✅ WEEKLY VIEW
    else if (diffDays <= 90) {
      const weeks = eachWeekOfInterval({ start, end });

      buckets = weeks.map((week) => {
        const wStart = startOfWeek(week);
        const wEnd = endOfWeek(week);

        const weekTxns = filtered.filter((t) =>
          isWithinInterval(new Date(t.timestamp), { start: wStart, end: wEnd }),
        );

        return {
          name: format(wStart, "dd MMM"),
          credit: sumByType(weekTxns, "credit"),
          payment: sumByType(weekTxns, "payment"),
        };
      });
    }

    // ✅ MONTHLY VIEW
    else {
      const months = eachMonthOfInterval({ start, end });

      buckets = months.map((month) => {
        const mStart = startOfMonth(month);
        const mEnd = endOfMonth(month);

        const monthTxns = filtered.filter((t) =>
          isWithinInterval(new Date(t.timestamp), { start: mStart, end: mEnd }),
        );

        return {
          name: format(month, "MMM yy"),
          credit: sumByType(monthTxns, "credit"),
          payment: sumByType(monthTxns, "payment"),
        };
      });
    }

    return {
      data: buckets,
      hasData: buckets.some((b) => b.credit > 0 || b.payment > 0),
    };
  }, [range, customFrom, customTo, filterTabId]);

  return (
    <div className="space-y-4">
      {/* RANGE BUTTONS */}
      <div className="flex gap-2 flex-wrap">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setRange(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              range === opt.key
                ? "bg-gradient-to-r from-primary to-primary/70 text-white shadow-md scale-105"
                : "bg-muted text-muted-foreground hover:bg-accent hover:scale-105"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* CUSTOM DATE */}
      {range === "custom" && (
        <div className="flex gap-2 items-center">
          {[customFrom, customTo].map((value, i) => (
            <div key={i} className="flex-1 relative">
              <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="date"
                value={value}
                onChange={(e) =>
                  i === 0
                    ? setCustomFrom(e.target.value)
                    : setCustomTo(e.target.value)
                }
                className="w-full pl-8 pr-2 py-2 rounded-lg bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!hasData ? (
        <div className="text-center text-muted-foreground text-sm py-6">
          No transactions in this period
        </div>
      ) : (
        <>
          {/* BAR CHART */}
          <div className="bg-gradient-to-br from-card to-muted/30 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <h3 className="text-sm font-semibold mb-3 text-card-foreground">
              Credit vs Payment
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient
                    id="creditGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="hsl(var(--credit-soft))" />
                    <stop offset="100%" stopColor="hsl(var(--credit))" />
                  </linearGradient>

                  <linearGradient
                    id="paymentGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="hsl(var(--payment-soft))" />
                    <stop offset="100%" stopColor="hsl(var(--payment))" />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="hsl(var(--grid))"
                  strokeDasharray="2 4"
                  opacity={0.3}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />

                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />

                <Tooltip
                  contentStyle={{
                    background: "rgba(20,20,20,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff", // 🔥 FIX
                    fontSize: "12px",
                  }}
                  labelStyle={{
                    color: "#fff",
                    fontWeight: 600,
                  }}
                  itemStyle={{
                    color: "#fff",
                  }}
                />

                <Bar
                  dataKey="credit"
                  fill="url(#creditGradient)"
                  radius={[6, 6, 0, 0]}
                  animationDuration={800}
                />

                <Bar
                  dataKey="payment"
                  fill="url(#paymentGradient)"
                  radius={[6, 6, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* LINE CHART */}
          <div className="bg-gradient-to-br from-card to-muted/30 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <h3 className="text-sm font-semibold mb-3 text-card-foreground">
              Spending Trend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
  <LineChart data={chartData}>
    
    <CartesianGrid
      stroke="hsl(var(--border))"
      strokeDasharray="2 4"
      opacity={0.3}
    />

    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
    <YAxis tick={{ fontSize: 11 }} />

    <Tooltip
      contentStyle={{
        background: 'rgba(20,20,20,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: '#fff'
      }}
      labelStyle={{ color: '#fff', fontWeight: 600 }}
      itemStyle={{ color: '#fff' }}
    />

    {/* ✅ CREDIT LINE (GREEN - CLEAN) */}
    <Line
      type="monotone"
      dataKey="credit"
      stroke="hsl(var(--credit))"
      strokeWidth={2.5}
      dot={{
        r: 4,
        fill: 'white',
        stroke: 'hsl(var(--credit))',
        strokeWidth: 2
      }}
      activeDot={{
        r: 6,
        fill: 'hsl(var(--credit))'
      }}
      animationDuration={800}
    />

    {/* ✅ PAYMENT LINE (RED - CLEAN) */}
    <Line
      type="monotone"
      dataKey="payment"
      stroke="hsl(var(--payment))"
      strokeWidth={2.5}
      dot={{
        r: 4,
        fill: 'white',
        stroke: 'hsl(var(--payment))',
        strokeWidth: 2
      }}
      activeDot={{
        r: 6,
        fill: 'hsl(var(--payment))'
      }}
      animationDuration={800}
    />

  </LineChart>
</ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsCharts;
