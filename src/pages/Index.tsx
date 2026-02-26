import { motion } from "framer-motion";
import { ArrowRight, Github, Terminal, TrendingUp, Shield, BarChart3, Layers, Code2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: TrendingUp, title: "Market & Limit Orders", desc: "Place both market and limit orders on Binance Futures Testnet with full parameter control." },
  { icon: Terminal, title: "CLI Interface", desc: "Clean command-line interface using argparse for intuitive order placement and management." },
  { icon: Shield, title: "Error Handling", desc: "Robust error handling with informative messages for API failures and invalid inputs." },
  { icon: BarChart3, title: "Structured Logging", desc: "Comprehensive logging system tracking every order, response, and error for debugging." },
];

const techStack = [
  "Python 3", "Binance API", "python-binance", "argparse", "logging", "dotenv", "REST API", "Testnet",
];

const archLayers = [
  { label: "CLI Layer", desc: "argparse interface", icon: Terminal, color: "primary" },
  { label: "Client Layer", desc: "BinanceClient wrapper", icon: Code2, color: "primary" },
  { label: "Order Execution", desc: "Market & Limit logic", icon: Zap, color: "primary" },
  { label: "Binance API", desc: "Futures Testnet", icon: Layers, color: "primary" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 px-4 py-1.5 text-sm">
              Binance Futures Testnet
            </Badge>
          </motion.div>
          
          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Trading Bot
            <span className="block text-gradient mt-2">Simplified</span>
          </motion.h1>
          
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            A Python-powered trading bot for Binance Futures Testnet — featuring market & limit orders, 
            structured logging, and a clean CLI interface.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Button asChild size="lg" className="glow-blue text-base px-8">
              <Link to="/dashboard">
                Try the UI <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 border-border hover:bg-secondary">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" /> View on GitHub
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built with clean architecture and production-ready patterns.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Architecture</h2>
            <p className="text-muted-foreground text-lg">Clean, layered design for maintainability.</p>
          </motion.div>

          <div className="space-y-4">
            {archLayers.map((layer, i) => (
              <motion.div
                key={layer.label}
                className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <layer.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{layer.label}</h4>
                  <p className="text-sm text-muted-foreground">{layer.desc}</p>
                </div>
                {i < archLayers.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90 md:rotate-0 shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tech Stack</h2>
            <p className="text-muted-foreground text-lg mb-10">Technologies powering the trading bot.</p>
          </motion.div>
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {techStack.map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className="px-4 py-2 text-sm font-mono border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                {tech}
              </Badge>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See It in Action</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Explore the trading dashboard UI — a bonus lightweight interface for the bot.
            </p>
            <Button asChild size="lg" className="glow-blue text-base px-10">
              <Link to="/dashboard">
                Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border text-center text-sm text-muted-foreground">
        Built as a fresher project showcase • Trading Bot for Binance Futures Testnet
      </footer>
    </div>
  );
};

export default Index;
