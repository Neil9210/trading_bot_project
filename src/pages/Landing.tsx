import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Brain, LineChart, ShieldCheck, Sparkles, Wallet } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <LineChart className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">Quantum Trader</span>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
          <a href="#disclaimer" className="text-sm text-muted-foreground hover:text-foreground">Disclaimer</a>
        </nav>
        <Link to="/auth">
          <Button variant="outline" size="sm">Sign in</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered paper trading · No real money
          </div>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Trade markets with <span className="text-gradient">AI signals</span>,
            <br /> risk nothing.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Practice trading with $10,000 paper money. Get AI buy/sell suggestions,
            run an automated strategy bot, and track your P&L on live market data.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth">
              <Button size="lg" className="glow group">
                Start trading free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="ghost">See how it works</Button>
            </a>
          </div>
        </div>

        {/* Feature grid */}
        <div id="features" className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            { icon: Brain, title: "AI signals", desc: "Each chart gets a buy/sell/hold recommendation with confidence and rationale, powered by trading companion AI." },
            { icon: Bot, title: "Auto-trading bot", desc: "Toggle a strategy bot per symbol. SMA crossover or AI-driven, running on live quotes." },
            { icon: Wallet, title: "Simulated wallet", desc: "Start with $10,000 paper cash. Buy and sell at live market prices and watch your P&L." },
            { icon: LineChart, title: "Live charts", desc: "Real market data from Yahoo Finance with multiple timeframes." },
            { icon: ShieldCheck, title: "Zero risk", desc: "100% simulated. No bank, no broker, no losses. Learn the ropes safely." },
            { icon: Sparkles, title: "Beautiful UI", desc: "Designed for traders who care about clarity and speed." },
          ].map((f) => (
            <div key={f.title} className="glass-card p-6 transition-all hover:border-primary/40 hover:-translate-y-0.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Three steps to your first trade</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            ["01", "Create an account", "Sign up in seconds. We hand you $10,000 in simulated cash."],
            ["02", "Pick a symbol", "Search any stock, view live charts, ask the AI for a signal."],
            ["03", "Trade or automate", "Place buy/sell orders manually, or let the bot run a strategy."],
          ].map(([n, t, d]) => (
            <div key={n} className="glass-card p-6">
              <div className="font-mono text-sm text-primary">{n}</div>
              <h3 className="mt-3 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section id="disclaimer" className="container pb-24 pt-8">
        <div className="glass-card mx-auto max-w-3xl p-6 text-sm text-muted-foreground">
          <strong className="text-foreground">Disclaimer.</strong> Quantum Trader is a paper-trading
          simulator for education only. AI signals are not financial advice. No real money is
          spent or earned. Market data is delayed and provided by third parties.
        </div>
      </section>
    </div>
  );
};

export default Landing;
