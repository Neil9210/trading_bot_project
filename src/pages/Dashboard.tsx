import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowDownRight, ArrowUpRight, Bot, Brain, LineChart as LineIcon,
  LogOut, Loader2, Search, Sparkles, TrendingDown, TrendingUp, Wallet as WalletIcon,
} from "lucide-react";
import ProChart from "@/components/ProChart";
import TopUpDialog from "@/components/TopUpDialog";
import { rsi as calcRsi, macd as calcMacd, sma as calcSma } from "@/lib/indicators";

type Candle = { t: number; o: number | null; h: number | null; l: number | null; c: number | null; v: number | null };
type Quote = { symbol: string; price: number; change: number; changePct: number; currency: string; exchange: string; candles: Candle[] };
type Signal = { action: "buy" | "sell" | "hold"; confidence: number; rationale: string; trend: string; target_price?: number; stop_loss?: number; sma10?: number; sma30?: number };
type Holding = { id: string; symbol: string; quantity: number; avg_cost: number };
type Trade = { id: string; symbol: string; side: "buy" | "sell"; quantity: number; price: number; total: number; source: string; created_at: string };
type Bot = { id: string; symbol: string; strategy: string; active: boolean };

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const STOCK_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/stock-data`;

const POPULAR = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "AMD"];
const RANGES: { label: string; range: string; interval: string }[] = [
  { label: "1D", range: "1d", interval: "5m" },
  { label: "5D", range: "5d", interval: "30m" },
  { label: "1M", range: "1mo", interval: "1d" },
  { label: "3M", range: "3mo", interval: "1d" },
  { label: "1Y", range: "1y", interval: "1d" },
];

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [symbol, setSymbol] = useState("AAPL");
  const [search, setSearch] = useState("AAPL");
  const [rangeIdx, setRangeIdx] = useState(2);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [signalLoading, setSignalLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [qty, setQty] = useState(1);
  const [tradeBusy, setTradeBusy] = useState(false);

  const fetchQuote = useCallback(async (sym: string, idx: number) => {
    setLoadingQuote(true);
    setSignal(null);
    try {
      const r = RANGES[idx];
      const res = await fetch(`${STOCK_URL}?symbol=${encodeURIComponent(sym)}&range=${r.range}&interval=${r.interval}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setQuote(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Quote failed");
      // keep previous quote so UI doesn't blank
    } finally {
      setLoadingQuote(false);
    }
  }, []);

  const loadPortfolio = useCallback(async () => {
    if (!user) return;
    const [w, h, t, b] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("holdings").select("*").eq("user_id", user.id).order("symbol"),
      supabase.from("trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("bots").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (w.data) setBalance(Number(w.data.balance));
    if (h.data) setHoldings(h.data as Holding[]);
    if (t.data) setTrades(t.data as Trade[]);
    if (b.data) setBots(b.data as Bot[]);
  }, [user]);

  useEffect(() => { fetchQuote(symbol, rangeIdx); }, [symbol, rangeIdx, fetchQuote]);
  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  // Auto-refresh quote every 30s
  useEffect(() => {
    const i = setInterval(() => fetchQuote(symbol, rangeIdx), 30000);
    return () => clearInterval(i);
  }, [symbol, rangeIdx, fetchQuote]);

  const askAI = async () => {
    if (!quote) return;
    setSignalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-signal", {
        body: { symbol: quote.symbol, candles: quote.candles, price: quote.price },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSignal(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setSignalLoading(false);
    }
  };

  const placeTrade = async (side: "buy" | "sell", source: "manual" | "ai" = "manual") => {
    if (!user || !quote || qty <= 0) return;
    setTradeBusy(true);
    try {
      const price = quote.price;
      const total = price * qty;
      const existing = holdings.find((h) => h.symbol === quote.symbol);

      if (side === "buy") {
        if (total > balance) throw new Error("Insufficient simulated balance");
        const newBal = balance - total;
        const newQty = (existing?.quantity ?? 0) + qty;
        const newAvg = existing
          ? (existing.avg_cost * existing.quantity + price * qty) / newQty
          : price;
        const { error: e1 } = await supabase.from("wallets").update({ balance: newBal }).eq("user_id", user.id);
        if (e1) throw e1;
        if (existing) {
          const { error: e2 } = await supabase.from("holdings")
            .update({ quantity: newQty, avg_cost: newAvg })
            .eq("id", existing.id);
          if (e2) throw e2;
        } else {
          const { error: e2 } = await supabase.from("holdings")
            .insert({ user_id: user.id, symbol: quote.symbol, quantity: newQty, avg_cost: newAvg });
          if (e2) throw e2;
        }
      } else {
        if (!existing || existing.quantity < qty) throw new Error("Not enough shares to sell");
        const newBal = balance + total;
        const newQty = existing.quantity - qty;
        const { error: e1 } = await supabase.from("wallets").update({ balance: newBal }).eq("user_id", user.id);
        if (e1) throw e1;
        if (newQty === 0) {
          await supabase.from("holdings").delete().eq("id", existing.id);
        } else {
          await supabase.from("holdings").update({ quantity: newQty }).eq("id", existing.id);
        }
      }
      const { error: te } = await supabase.from("trades")
        .insert({ user_id: user.id, symbol: quote.symbol, side, quantity: qty, price, total, source });
      if (te) throw te;
      toast.success(`${side === "buy" ? "Bought" : "Sold"} ${qty} ${quote.symbol} @ $${fmt(price)}`);
      await loadPortfolio();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Trade failed");
    } finally {
      setTradeBusy(false);
    }
  };

  // Bot toggle for current symbol
  const currentBot = bots.find((b) => b.symbol === symbol);
  const toggleBot = async (active: boolean) => {
    if (!user) return;
    if (currentBot) {
      await supabase.from("bots").update({ active }).eq("id", currentBot.id);
    } else {
      await supabase.from("bots").insert({ user_id: user.id, symbol, strategy: "sma_crossover", active });
    }
    await loadPortfolio();
    toast.success(active ? `Bot started on ${symbol}` : `Bot stopped on ${symbol}`);
  };

  // Bot tick: every 20s. Strategy = SMA(10/30) crossover confirmed by RSI(14) and MACD histogram.
  // Adds cooldown to avoid rapid re-entries and respects available cash / holdings.
  const lastBotTradeRef = useRef<number>(0);
  useEffect(() => {
    if (!currentBot?.active || !quote) return;
    const tick = async () => {
      const now = Date.now();
      if (now - lastBotTradeRef.current < 60_000) return; // 1-min cooldown
      const closes = quote.candles.map((c) => c.c).filter((x): x is number => x != null);
      if (closes.length < 35) return;
      const s10 = calcSma(closes, 10);
      const s30 = calcSma(closes, 30);
      const rsiArr = calcRsi(closes, 14);
      const m = calcMacd(closes);
      const i = closes.length - 1;
      const cur10 = s10[i], cur30 = s30[i], prev10 = s10[i - 1], prev30 = s30[i - 1];
      const r = rsiArr[i] ?? 50;
      const histNow = m.histogram[i] ?? 0;
      const histPrev = m.histogram[i - 1] ?? 0;
      if (cur10 == null || cur30 == null || prev10 == null || prev30 == null) return;

      const crossUp = prev10 <= prev30 && cur10 > cur30;
      const crossDown = prev10 >= prev30 && cur10 < cur30;
      const macdBullFlip = histPrev <= 0 && histNow > 0;
      const macdBearFlip = histPrev >= 0 && histNow < 0;

      const owned = holdings.find((h) => h.symbol === quote.symbol);
      // BUY: SMA cross up + (RSI < 70) + (MACD hist positive or flipping bull)
      if (crossUp && r < 70 && (histNow > 0 || macdBullFlip) && quote.price * qty <= balance) {
        lastBotTradeRef.current = now;
        await placeTrade("buy", "ai");
        toast(`🤖 Bot BUY ${symbol} · RSI ${r.toFixed(0)} · MACD ${histNow.toFixed(3)}`);
      }
      // SELL: SMA cross down OR (RSI > 70 + MACD bear flip), and we own enough
      else if ((crossDown || (r > 70 && macdBearFlip)) && owned && owned.quantity >= qty) {
        lastBotTradeRef.current = now;
        await placeTrade("sell", "ai");
        toast(`🤖 Bot SELL ${symbol} · RSI ${r.toFixed(0)} · MACD ${histNow.toFixed(3)}`);
      }
    };
    const i = setInterval(tick, 20000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBot?.active, quote?.symbol, quote?.price]);

  const portfolioValue = useMemo(() => {
    const holdingsVal = holdings.reduce((sum, h) => {
      const px = h.symbol === quote?.symbol ? quote.price : h.avg_cost;
      return sum + h.quantity * px;
    }, 0);
    return balance + holdingsVal;
  }, [holdings, balance, quote]);

  const totalPL = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const px = h.symbol === quote?.symbol ? quote.price : h.avg_cost;
      return sum + (px - h.avg_cost) * h.quantity;
    }, 0);
  }, [holdings, quote]);


  const isUp = (quote?.changePct ?? 0) >= 0;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <LineIcon className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="hidden font-bold sm:inline">Quantum Trader</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <div className="text-xs text-muted-foreground">Portfolio value</div>
              <div className="font-mono text-sm font-semibold">${fmt(portfolioValue)}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <WalletIcon className="h-4 w-4" /> Cash balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2">
                <div className="font-mono text-2xl font-bold">${fmt(balance)}</div>
                <TopUpDialog balance={balance} onTopUp={loadPortfolio} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Simulated · QuantumPay test gateway</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-2xl font-bold">${fmt(portfolioValue)}</div>
              <p className="mt-1 text-xs text-muted-foreground">{holdings.length} positions</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${totalPL >= 0 ? "text-bull" : "text-bear"}`}>
                {totalPL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {totalPL >= 0 ? "+" : ""}${fmt(totalPL)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Chart + signal */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <form
                      onSubmit={(e) => { e.preventDefault(); setSymbol(search.toUpperCase().trim()); }}
                      className="flex items-center gap-2"
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)}
                          className="w-32 pl-9 font-mono uppercase" placeholder="AAPL" />
                      </div>
                      <Button type="submit" size="sm" variant="secondary">Load</Button>
                    </form>
                    {quote && (
                      <div>
                        <div className="font-mono text-2xl font-bold">${fmt(quote.price)}</div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-bull" : "text-bear"}`}>
                          {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {isUp ? "+" : ""}{fmt(quote.change)} ({isUp ? "+" : ""}{fmt(quote.changePct)}%)
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 p-1">
                    {RANGES.map((r, i) => (
                      <button key={r.label}
                        onClick={() => setRangeIdx(i)}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                          rangeIdx === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {POPULAR.map((s) => (
                    <Badge key={s} variant={s === symbol ? "default" : "outline"}
                      className="cursor-pointer font-mono"
                      onClick={() => { setSearch(s); setSymbol(s); }}>{s}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {loadingQuote && !quote ? (
                  <div className="flex h-[320px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : quote ? (
                  <ProChart
                    candles={quote.candles}
                    targetPrice={signal?.target_price}
                    stopLoss={signal?.stop_loss}
                  />
                ) : (
                  <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                    No data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Signal */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="h-4 w-4 text-primary" /> AI signal
                  </CardTitle>
                  <Button onClick={askAI} disabled={signalLoading || !quote} size="sm">
                    {signalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Analyze {quote?.symbol}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {signal ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge className={`text-sm uppercase ${
                        signal.action === "buy" ? "bg-bull text-primary-foreground" :
                        signal.action === "sell" ? "bg-bear text-destructive-foreground" :
                        "bg-muted text-foreground"
                      }`}>{signal.action}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Confidence: <span className="font-mono font-semibold text-foreground">{Math.round(signal.confidence * 100)}%</span>
                      </span>
                      <Badge variant="outline" className="capitalize">{signal.trend}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{signal.rationale}</p>
                    {(signal.target_price || signal.stop_loss) && (
                      <div className="flex gap-4 text-xs">
                        {signal.target_price && <div>Target: <span className="font-mono text-bull">${fmt(signal.target_price)}</span></div>}
                        {signal.stop_loss && <div>Stop-loss: <span className="font-mono text-bear">${fmt(signal.stop_loss)}</span></div>}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground/70">Educational signal · not financial advice.</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click <em>Analyze</em> for an AI buy/sell/hold signal with rationale.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side: trade + bot */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Place trade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Symbol</Label>
                  <div className="font-mono text-lg font-semibold">{quote?.symbol ?? symbol}</div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input id="qty" type="number" min={1} value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
                  {quote && <p className="text-xs text-muted-foreground">Total: ${fmt(quote.price * qty)}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => placeTrade("buy")} disabled={tradeBusy || !quote}
                    className="bg-bull text-primary-foreground hover:bg-bull/90">
                    Buy
                  </Button>
                  <Button onClick={() => placeTrade("sell")} disabled={tradeBusy || !quote}
                    className="bg-bear text-destructive-foreground hover:bg-bear/90">
                    Sell
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4 text-primary" /> Trading bot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">SMA crossover · {symbol}</div>
                    <p className="text-xs text-muted-foreground">SMA(10/30) crossover confirmed by RSI(14) &amp; MACD. 1-min cooldown. Trades {qty} share(s).</p>
                  </div>
                  <Switch checked={!!currentBot?.active} onCheckedChange={toggleBot} />
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Bot evaluates every 20s while this tab is open. For 24/7 execution, schedule a server-side job (coming soon).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Holdings */}
        <Card className="glass-card mt-6">
          <CardHeader>
            <CardTitle className="text-base">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {holdings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No positions yet. Place your first trade above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="pb-3">Symbol</th>
                      <th className="pb-3">Qty</th>
                      <th className="pb-3">Avg cost</th>
                      <th className="pb-3">Last</th>
                      <th className="pb-3">Value</th>
                      <th className="pb-3">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {holdings.map((h) => {
                      const px = h.symbol === quote?.symbol ? quote.price : h.avg_cost;
                      const pl = (px - h.avg_cost) * h.quantity;
                      return (
                        <tr key={h.id} className="border-t border-border/60">
                          <td className="py-3 font-semibold">
                            <button className="hover:text-primary" onClick={() => { setSearch(h.symbol); setSymbol(h.symbol); }}>{h.symbol}</button>
                          </td>
                          <td>{fmt(h.quantity, 4)}</td>
                          <td>${fmt(h.avg_cost)}</td>
                          <td>${fmt(px)}</td>
                          <td>${fmt(h.quantity * px)}</td>
                          <td className={pl >= 0 ? "text-bull" : "text-bear"}>{pl >= 0 ? "+" : ""}${fmt(pl)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trades */}
        <Card className="glass-card mt-6">
          <CardHeader>
            <CardTitle className="text-base">Recent trades</CardTitle>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trades yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="pb-3">When</th>
                      <th className="pb-3">Symbol</th>
                      <th className="pb-3">Side</th>
                      <th className="pb-3">Qty</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {trades.map((t) => (
                      <tr key={t.id} className="border-t border-border/60">
                        <td className="py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                        <td className="font-semibold">{t.symbol}</td>
                        <td className={t.side === "buy" ? "text-bull" : "text-bear"}>{t.side.toUpperCase()}</td>
                        <td>{fmt(t.quantity, 4)}</td>
                        <td>${fmt(t.price)}</td>
                        <td>${fmt(t.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
