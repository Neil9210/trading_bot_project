import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// AI buy/sell signal using Trading Bot AI Gateway with tool-calling for structured output.
// Body: { symbol, candles: [{t,o,h,l,c,v}], price }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { symbol, candles, price } = await req.json();
    if (!symbol || !Array.isArray(candles) || candles.length === 0) {
      return new Response(JSON.stringify({ error: "symbol and candles required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const TRADING_BOT_API_KEY = Deno.env.get("TRADING_BOT_API_KEY");
    if (!TRADING_BOT_API_KEY) throw new Error("TRADING_BOT_API_KEY not configured");

    // Compress candles to last 60 closes for the prompt
    const closes = candles.slice(-60).map((c: any) => Number(c.c).toFixed(2));
    const sma = (arr: number[], n: number) => {
      if (arr.length < n) return null;
      const s = arr.slice(-n).reduce((a, b) => a + b, 0);
      return s / n;
    };
    const numCloses = closes.map(Number);
    const sma10 = sma(numCloses, 10);
    const sma30 = sma(numCloses, 30);

    const userPrompt = `Symbol: ${symbol}
Current price: ${price}
SMA10: ${sma10?.toFixed(2)} | SMA30: ${sma30?.toFixed(2)}
Last 60 closes: ${closes.join(", ")}

Analyze short-term momentum, trend, and volatility. Give a paper-trading signal.`;

    const aiRes = await fetch("https://ai.gateway.trading-bot.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${TRADING_BOT_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a quantitative trading analyst for a SIMULATED paper-trading app. You never give real financial advice. Output ONE concise signal via the provided tool." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_signal",
            description: "Emit a trading signal for the symbol",
            parameters: {
              type: "object",
              properties: {
                action: { type: "string", enum: ["buy", "sell", "hold"] },
                confidence: { type: "number", description: "0 to 1" },
                target_price: { type: "number" },
                stop_loss: { type: "number" },
                rationale: { type: "string", description: "2-3 short sentences" },
                trend: { type: "string", enum: ["bullish", "bearish", "neutral"] },
              },
              required: ["action", "confidence", "rationale", "trend"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_signal" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      throw new Error(`AI gateway ${aiRes.status}`);
    }
    const data = await aiRes.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = tc?.function?.arguments ? JSON.parse(tc.function.arguments) : null;
    if (!args) throw new Error("No structured signal");

    return new Response(JSON.stringify({ symbol, ...args, sma10, sma30 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
