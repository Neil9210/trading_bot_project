import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, RotateCcw, TrendingUp, TrendingDown, Activity, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { z } from "zod";

const orderSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(20).regex(/^[A-Z]+$/, "Use uppercase letters only"),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["MARKET", "LIMIT"]),
  quantity: z.number().positive("Quantity must be positive").max(999999),
  price: z.number().positive("Price must be positive").max(999999999).optional(),
});

type OrderData = z.infer<typeof orderSchema>;

const mockLogs = [
  { time: "14:23:01", level: "INFO", msg: "Initializing BinanceClient for Futures Testnet..." },
  { time: "14:23:01", level: "INFO", msg: "Client connected successfully." },
  { time: "14:23:05", level: "INFO", msg: 'Placing MARKET BUY order: symbol=BTCUSDT, qty=0.01' },
  { time: "14:23:06", level: "INFO", msg: "Order placed successfully. ID: 283746512" },
  { time: "14:23:06", level: "INFO", msg: "Status: FILLED | Avg Price: 43250.50" },
  { time: "14:25:12", level: "WARN", msg: "Rate limit approaching. Slowing requests..." },
  { time: "14:25:30", level: "INFO", msg: 'Placing LIMIT SELL order: symbol=ETHUSDT, qty=0.5, price=2650.00' },
  { time: "14:25:31", level: "INFO", msg: "Order placed successfully. ID: 283746898" },
  { time: "14:25:31", level: "INFO", msg: "Status: NEW | Waiting for fill..." },
  { time: "14:28:00", level: "ERROR", msg: "Invalid quantity for DOGEUSDT. Min notional not met." },
];

const Dashboard = () => {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [quantity, setQuantity] = useState("0.01");
  const [price, setPrice] = useState("43250.00");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<Record<string, string> | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const data: Record<string, unknown> = {
      symbol,
      side,
      type: orderType,
      quantity: parseFloat(quantity),
    };
    if (orderType === "LIMIT") data.price = parseFloat(price);

    const result = orderSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitted(true);
    setResponse({
      orderId: String(Math.floor(Math.random() * 900000000) + 100000000),
      symbol,
      side,
      type: orderType,
      status: orderType === "MARKET" ? "FILLED" : "NEW",
      origQty: quantity,
      executedQty: orderType === "MARKET" ? quantity : "0.00",
      avgPrice: orderType === "MARKET" ? (parseFloat(price) * (0.998 + Math.random() * 0.004)).toFixed(2) : "0.00",
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setResponse(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Trading Dashboard</h1>
          </div>
          <Badge variant="outline" className="text-xs font-mono border-warning/40 text-warning">TESTNET</Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 grid lg:grid-cols-2 gap-6">
        {/* Left Column: Order Form + Summary */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Place Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Symbol */}
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">Symbol</Label>
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="BTCUSDT"
                  className="bg-secondary border-border font-mono"
                />
                {errors.symbol && <p className="text-xs text-destructive mt-1">{errors.symbol}</p>}
              </div>

              {/* Side Toggle */}
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">Side</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSide("BUY")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      side === "BUY"
                        ? "bg-success text-success-foreground glow-green"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" /> BUY
                  </button>
                  <button
                    onClick={() => setSide("SELL")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      side === "SELL"
                        ? "bg-destructive text-destructive-foreground glow-red"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" /> SELL
                  </button>
                </div>
              </div>

              {/* Order Type */}
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">Order Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["MARKET", "LIMIT"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrderType(t)}
                      className={`py-2.5 rounded-lg font-medium text-sm transition-all ${
                        orderType === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">Quantity</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-secondary border-border font-mono"
                />
                {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity}</p>}
              </div>

              {/* Price (LIMIT only) */}
              <AnimatePresence>
                {orderType === "LIMIT" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label className="text-sm text-muted-foreground mb-1.5 block">Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-secondary border-border font-mono"
                    />
                    {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Order Summary Preview */}
              <div className="rounded-lg bg-muted/50 border border-border p-4 font-mono text-sm space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Order Preview</p>
                <p><span className="text-muted-foreground">Symbol:</span> <span className="text-foreground">{symbol || "—"}</span></p>
                <p><span className="text-muted-foreground">Side:</span> <span className={side === "BUY" ? "text-success" : "text-destructive"}>{side}</span></p>
                <p><span className="text-muted-foreground">Type:</span> <span className="text-foreground">{orderType}</span></p>
                <p><span className="text-muted-foreground">Qty:</span> <span className="text-foreground">{quantity || "—"}</span></p>
                {orderType === "LIMIT" && (
                  <p><span className="text-muted-foreground">Price:</span> <span className="text-foreground">{price || "—"}</span></p>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSubmit} className={`flex-1 font-semibold ${side === "BUY" ? "bg-success hover:bg-success/90 text-success-foreground" : "bg-destructive hover:bg-destructive/90"}`}>
                  {side === "BUY" ? "Place Buy Order" : "Place Sell Order"}
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Response + Logs */}
        <div className="space-y-6">
          {/* Order Response */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Order Response</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {response ? (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="font-mono text-sm space-y-2"
                  >
                    {Object.entries(response).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1.5 border-b border-border last:border-0">
                        <span className="text-muted-foreground">{k}</span>
                        <span className={
                          k === "status" && v === "FILLED" ? "text-success font-semibold" :
                          k === "side" && v === "BUY" ? "text-success" :
                          k === "side" && v === "SELL" ? "text-destructive" :
                          "text-foreground"
                        }>{v}</span>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-muted-foreground text-sm text-center py-8"
                  >
                    Submit an order to see the response here.
                  </motion.p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Log Viewer */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" /> Log Viewer
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 rounded-lg bg-background border border-border">
                <div className="p-3 font-mono text-xs space-y-1">
                  {mockLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-2 py-0.5"
                    >
                      <span className="text-muted-foreground shrink-0">{log.time}</span>
                      <span className={`shrink-0 font-semibold ${
                        log.level === "ERROR" ? "text-destructive" :
                        log.level === "WARN" ? "text-warning" :
                        "text-success"
                      }`}>
                        [{log.level}]
                      </span>
                      <span className="text-foreground/80">{log.msg}</span>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
