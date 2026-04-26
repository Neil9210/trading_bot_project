import { useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, Cell, CartesianGrid,
} from "recharts";
import { sma, rsi, macd } from "@/lib/indicators";

export type Candle = { t: number; o: number | null; h: number | null; l: number | null; c: number | null; v: number | null };

type Props = { candles: Candle[]; targetPrice?: number; stopLoss?: number };

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

// Custom candlestick shape
const Candlestick = (props: any) => {
  const { x, width, payload, yAxis } = props;
  if (!payload || payload.o == null || payload.c == null || payload.h == null || payload.l == null) return null;
  const isUp = payload.c >= payload.o;
  const color = isUp ? "hsl(var(--bull))" : "hsl(var(--bear))";
  const scale = yAxis?.scale;
  if (!scale) return null;
  const yHigh = scale(payload.h);
  const yLow = scale(payload.l);
  const yOpen = scale(payload.o);
  const yClose = scale(payload.c);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyH = Math.max(1, Math.abs(yClose - yOpen));
  const cx = x + width / 2;
  const bw = Math.max(2, width * 0.7);
  return (
    <g>
      <line x1={cx} x2={cx} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1} />
      <rect x={cx - bw / 2} y={bodyTop} width={bw} height={bodyH} fill={color} />
    </g>
  );
};

const ProChart = ({ candles, targetPrice, stopLoss }: Props) => {
  const data = useMemo(() => {
    const closes = candles.map((c) => (c.c ?? 0));
    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const rsi14 = rsi(closes, 14);
    const m = macd(closes);
    return candles.map((c, i) => ({
      t: c.t, o: c.o, h: c.h, l: c.l, c: c.c, v: c.v ?? 0,
      isUp: (c.c ?? 0) >= (c.o ?? 0),
      sma20: sma20[i], sma50: sma50[i],
      rsi: rsi14[i],
      macd: m.macd[i], macdSignal: m.signal[i], macdHist: m.histogram[i],
      // pad range so candle bodies sit nicely
      range: c.h != null && c.l != null ? [c.l, c.h] : [0, 0],
    }));
  }, [candles]);

  const xFmt = (t: number) => {
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8, fontSize: 12,
  };

  return (
    <div className="space-y-2">
      {/* Price + candles + SMAs */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="t" tickFormatter={xFmt} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false} tickLine={false} minTickGap={30} />
            <YAxis domain={["auto", "auto"]} orientation="right"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false} tickLine={false} width={50}
              tickFormatter={(v) => fmt(v as number)} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(t) => new Date(t as number).toLocaleString()}
              formatter={(value: any, name: string) => {
                if (["o", "h", "l", "c"].includes(name)) return [`$${fmt(Number(value))}`, name.toUpperCase()];
                if (name === "sma20") return [`$${fmt(Number(value))}`, "SMA 20"];
                if (name === "sma50") return [`$${fmt(Number(value))}`, "SMA 50"];
                return [value, name];
              }}
            />
            {targetPrice && <ReferenceLine y={targetPrice} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: "Target", fill: "hsl(var(--primary))", fontSize: 10, position: "right" }} />}
            {stopLoss && <ReferenceLine y={stopLoss} stroke="hsl(var(--bear))" strokeDasharray="3 3" label={{ value: "Stop", fill: "hsl(var(--bear))", fontSize: 10, position: "right" }} />}
            <Bar dataKey="range" shape={<Candlestick />} isAnimationActive={false} />
            <Line type="monotone" dataKey="sma20" stroke="hsl(var(--accent))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            <Line type="monotone" dataKey="sma50" stroke="hsl(var(--primary-glow))" dot={false} strokeWidth={1.5} strokeDasharray="4 2" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-3 px-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-3 bg-bull" /> Bullish</span>
        <span className="flex items-center gap-1"><span className="h-2 w-3 bg-bear" /> Bearish</span>
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-accent" /> SMA 20</span>
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-primary-glow" /> SMA 50</span>
      </div>

      {/* Volume */}
      <div className="h-[80px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="t" hide />
            <YAxis orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              axisLine={false} tickLine={false} width={50}
              tickFormatter={(v) => {
                const n = Number(v);
                if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
                if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
                if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
                return String(n);
              }} />
            <Tooltip contentStyle={tooltipStyle}
              labelFormatter={(t) => new Date(t as number).toLocaleString()}
              formatter={(v: any) => [Number(v).toLocaleString(), "Volume"]} />
            <Bar dataKey="v" isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.isUp ? "hsl(var(--bull) / 0.5)" : "hsl(var(--bear) / 0.5)"} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        <div className="px-2 text-[10px] text-muted-foreground">Volume</div>
      </div>

      {/* RSI */}
      <div className="h-[90px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="t" hide />
            <YAxis domain={[0, 100]} orientation="right" ticks={[30, 50, 70]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              axisLine={false} tickLine={false} width={50} />
            <Tooltip contentStyle={tooltipStyle}
              labelFormatter={(t) => new Date(t as number).toLocaleString()}
              formatter={(v: any) => [fmt(Number(v)), "RSI"]} />
            <ReferenceLine y={70} stroke="hsl(var(--bear))" strokeDasharray="2 2" />
            <ReferenceLine y={30} stroke="hsl(var(--bull))" strokeDasharray="2 2" />
            <Line type="monotone" dataKey="rsi" stroke="hsl(var(--accent))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="px-2 text-[10px] text-muted-foreground">RSI (14) · &gt;70 overbought · &lt;30 oversold</div>
      </div>

      {/* MACD */}
      <div className="h-[90px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="t" hide />
            <YAxis orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              axisLine={false} tickLine={false} width={50} />
            <Tooltip contentStyle={tooltipStyle}
              labelFormatter={(t) => new Date(t as number).toLocaleString()}
              formatter={(v: any, n: string) => [fmt(Number(v), 4), n]} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="macdHist" isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={i} fill={(d.macdHist ?? 0) >= 0 ? "hsl(var(--bull) / 0.6)" : "hsl(var(--bear) / 0.6)"} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="macd" stroke="hsl(var(--accent))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            <Line type="monotone" dataKey="macdSignal" stroke="hsl(var(--primary-glow))" dot={false} strokeWidth={1.5} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="px-2 text-[10px] text-muted-foreground">MACD (12,26,9)</div>
      </div>
    </div>
  );
};

export default ProChart;
