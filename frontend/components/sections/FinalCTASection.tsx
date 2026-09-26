import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinalCTASectionProps {
  onGetStarted: () => void;
}

export default function FinalCTASection({ onGetStarted }: FinalCTASectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section
      ref={ref}
      className="relative py-32 sm:py-40 overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,198,224,0.07) 0%, transparent 65%)",
        }}
      />

      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-3"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.04,
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-8"
            style={{
              background: "rgba(0,198,224,0.08)",
              border: "1px solid rgba(0,198,224,0.2)",
              color: "var(--accent-cyan)",
            }}
          >
            <Sparkles size={12} />
            Beta access — limited spots
          </div>

          <h2 className="text-display-lg mb-6" style={{ color: "var(--text-primary)" }}>
            Start finding
            <br />
            <span style={{ color: "var(--accent-cyan)" }}>your leaks today</span>
          </h2>

          <p className="text-base leading-relaxed mb-10" style={{ color: "var(--text-muted)" }}>
            Connect your first account in under 60 seconds. Shadow CFO runs a full
            scan and shows you exactly what it found — with full explanations —
            before you do anything.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 max-w-xs h-12 px-4 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,198,224,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
              />
              <Button
                type="submit"
                size="lg"
                className="h-12 px-7 font-bold"
                style={{
                  background: "var(--accent-cyan)",
                  color: "var(--bg-base)",
                  fontFamily: "var(--font-display)",
                  boxShadow: "0 0 30px rgba(0,198,224,0.25)",
                  borderRadius: "0.75rem",
                }}
              >
                Join waitlist
                <ArrowRight size={16} />
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(0,200,150,0.1)",
                border: "1px solid rgba(0,200,150,0.3)",
                color: "var(--accent-emerald)",
                fontFamily: "var(--font-display)",
              }}
            >
              ✓ You're on the list — we'll reach out soon
            </motion.div>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={onGetStarted}
            className="font-semibold"
            style={{
              color: "var(--accent-cyan)",
              fontFamily: "var(--font-display)",
            }}
          >
            Or try the demo now →
          </Button>

          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            {[
              { value: "< 60s", label: "to first scan" },
              { value: "$89/mo", label: "avg leak found" },
              { value: "0 writes", label: "to your accounts" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-mono-data text-xl font-bold"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer strip */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "var(--border-subtle)" }}
      />
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <span className="text-xs" style={{ color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
          © 2025 Shadow CFO · Built on double-entry ledger rails · Consent-first by design
        </span>
      </div>
    </section>
  );
}
