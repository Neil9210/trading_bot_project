import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CreditCard, Smartphone, Building2, Loader2, ShieldCheck, CheckCircle2, Plus } from "lucide-react";

type Props = {
  balance: number;
  onTopUp: () => void;
};

const PRESETS = [500, 1000, 5000, 10000];

const TopUpDialog = ({ balance, onTopUp }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(1000);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Card
  const [cardNum, setCardNum] = useState("4242 4242 4242 4242");
  const [cardExp, setCardExp] = useState("12/29");
  const [cardCvv, setCardCvv] = useState("123");
  const [cardName, setCardName] = useState("");

  // UPI
  const [upi, setUpi] = useState("yourname@okhdfc");

  // Netbanking
  const [bank, setBank] = useState("HDFC");

  const reset = () => {
    setProcessing(false); setSuccess(false);
  };

  const handlePay = async () => {
    if (!user || amount <= 0) return;
    setProcessing(true);
    // Simulate gateway latency
    await new Promise((r) => setTimeout(r, 1400));
    const newBal = balance + amount;
    const { error } = await supabase.from("wallets").update({ balance: newBal }).eq("user_id", user.id);
    if (error) {
      toast.error("Top-up failed: " + error.message);
      setProcessing(false);
      return;
    }
    setSuccess(true);
    setProcessing(false);
    toast.success(`Wallet credited with $${amount.toLocaleString()}`);
    onTopUp();
    setTimeout(() => { setOpen(false); reset(); }, 1500);
  };

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Top up
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Razorpay-style header */}
        <div className="bg-gradient-to-br from-[hsl(220_85%_25%)] to-[hsl(220_85%_15%)] p-5 text-white">
          <DialogHeader className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">QuantumPay</DialogTitle>
              <Badge variant="outline" className="border-white/30 bg-white/10 text-[10px] text-white">TEST MODE</Badge>
            </div>
            <DialogDescription className="text-xs text-white/70">
              Quantum Trader · Wallet top-up
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold">${amount.toLocaleString()}</span>
            <span className="text-xs text-white/60">to be added</span>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8">
            <CheckCircle2 className="h-14 w-14 text-bull" />
            <div className="text-lg font-semibold">Payment successful</div>
            <div className="text-sm text-muted-foreground">${amount.toLocaleString()} credited to your wallet</div>
          </div>
        ) : (
          <div className="p-5">
            {/* Amount presets */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Amount</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((p) => (
                  <button key={p}
                    onClick={() => setAmount(p)}
                    className={`rounded-md border px-2 py-2 text-sm font-medium transition ${
                      amount === p ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                    }`}>
                    ${p.toLocaleString()}
                  </button>
                ))}
              </div>
              <Input type="number" min={1} value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
                className="font-mono" />
            </div>

            <Tabs defaultValue="card" className="mt-5">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="card" className="gap-1 text-xs"><CreditCard className="h-3.5 w-3.5" />Card</TabsTrigger>
                <TabsTrigger value="upi" className="gap-1 text-xs"><Smartphone className="h-3.5 w-3.5" />UPI</TabsTrigger>
                <TabsTrigger value="bank" className="gap-1 text-xs"><Building2 className="h-3.5 w-3.5" />Bank</TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Card number</Label>
                  <Input value={cardNum} onChange={(e) => setCardNum(formatCard(e.target.value))}
                    className="font-mono tracking-wider" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expiry</Label>
                    <Input value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/YY" className="font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CVV</Label>
                    <Input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" type="password" className="font-mono" maxLength={4} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Name on card</Label>
                  <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Full name" />
                </div>
              </TabsContent>

              <TabsContent value="upi" className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">UPI ID</Label>
                  <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" className="font-mono" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {["GPay", "PhonePe", "Paytm", "BHIM"].map((a) => (
                    <Badge key={a} variant="outline" className="cursor-pointer">{a}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">A payment request will be sent to your UPI app.</p>
              </TabsContent>

              <TabsContent value="bank" className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Select bank</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["HDFC", "ICICI", "SBI", "Axis", "Kotak", "Yes Bank"].map((b) => (
                      <button key={b}
                        onClick={() => setBank(b)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                          bank === b ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                        }`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={handlePay} disabled={processing || amount <= 0}
              className="mt-5 w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
              {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</> : `Pay $${amount.toLocaleString()}`}
            </Button>

            <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> Secured · simulation only · no real charge
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TopUpDialog;
