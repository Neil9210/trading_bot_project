import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Yahoo Finance public chart endpoint (no key required)
// Returns: { symbol, price, change, changePct, currency, candles: [{t, o, h, l, c, v}] }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const symbol = (url.searchParams.get("symbol") || "AAPL").toUpperCase();
    const range = url.searchParams.get("range") || "1mo"; // 1d,5d,1mo,3mo,6mo,1y
    const interval = url.searchParams.get("interval") || "1d"; // 1m,5m,15m,1h,1d

    const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const r = await fetch(yfUrl, {
      headers: { "User-Agent": "Mozilla/5.0 QuantumTrader/1.0" },
    });
    if (r.status === 404) {
      return new Response(JSON.stringify({ error: `Symbol "${symbol}" not found. Try AAPL, TSLA, BTC-USD, etc.` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `Market data unavailable (${r.status})` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      return new Response(JSON.stringify({ error: "Symbol not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const meta = result.meta;
    const ts: number[] = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};
    const candles = ts.map((t, i) => ({
      t: t * 1000,
      o: q.open?.[i] ?? null,
      h: q.high?.[i] ?? null,
      l: q.low?.[i] ?? null,
      c: q.close?.[i] ?? null,
      v: q.volume?.[i] ?? null,
    })).filter(c => c.c != null);

    const price = meta.regularMarketPrice ?? candles.at(-1)?.c ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;

    return new Response(JSON.stringify({
      symbol: meta.symbol || symbol,
      price,
      change,
      changePct,
      currency: meta.currency || "USD",
      exchange: meta.exchangeName || "",
      candles,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
