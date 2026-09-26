import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, Lightbulb, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HowItWorksSectionProps {
  onGetStarted: () => void;
}

const STEPS = [
  {
    icon: Search,
    number: "01",
    title: "Shadow scans",
    subtitle: "Silent intelligence",
    description:
      "Shadow CFO connects read-only to your accounts and runs a continuous scan — looking for duplicate charges, idle subscriptions, mis-routed cash, and fee patterns.",
    agentSays:
      '"I found 3 transactions that match the signature of a duplicate subscription. Confidence: 94%. Here\'s the evidence before I show you anything."',
    color: "var(--accent-cyan)",
  },
  {
    icon: Lightbulb,
    number: "02",
    title: "Surfaces findings",
    subtitle: "Agentic explanation",
    description:
      "Every insight is paired with the AI's reasoning — not just a number, but the specific evidence, the confidence score, and the exact logic that triggered the flag.",
    agentSays:
      '"I\'m surfacing this because your Chase card shows $34.99 on March 3rd and your Apple Pay shows $34.99 on March 5th — both tagged Netflix. One is redundant."',
    color: "var(--accent-solv)",
  },
  {
    icon: Zap,
    number: "03",
    title: "One-click fix",
    subtitle: "You approve, I act",
    description:
      "When you confirm, Shadow executes the cancellation, sweep, or redirect — logging a consent receipt and ledger entry for every single action taken.",
    agentSays:
      '"Before I cancel: this will remove Netflix from your Apple Pay billing. The Chase subscription stays active. You save $34/mo. Approve?"',
    color: "var(--accent-emerald)",
  },
];

export default function HowItWorksSection({ onGetStarted }: HowItWorksSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative py-24 sm:py-32"
      style={{ background: "var(--bg-surface)" }}
    >
      {/* Top edge fade */}
      <div
        className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, var(--bg-base), var(--bg-surface))" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="text-label-upper mb-4">How it works</div>
          <h2 className="text-display-md" style={{ color: "var(--text-primary)" }}>
            Agentic UX in action
          </h2>
          <p className="mt-4 max-w-lg mx-auto text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Every step comes with a full explanation from your AI CFO — before,
            during, and after each action.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="card-surface p-6 relative overflow-hidden group hover:border-accent-cyan/20 transition-all duration-300"
              >
                {/* Step number bg */}
                <div
                  className="absolute top-4 right-4 font-bold opacity-6"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "4rem",
                    color: step.color,
                    lineHeight: 1,
                    opacity: 0.06,
                  }}
                >
                  {step.number}
                </div>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${step.color}18`, border: `1px solid ${step.color}30` }}
                >
                  <Icon size={18} style={{ color: step.color }} />
                </div>

                <div className="text-label-upper mb-1" style={{ color: step.color }}>
                  {step.subtitle}
                </div>
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>
                  {step.description}
                </p>

                {/* Agent quote */}
                <div
                  className="rounded-lg p-3.5 text-sm leading-relaxed"
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${step.color}20`,
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <div
                    className="text-label-upper mb-1.5 not-italic"
                    style={{ color: step.color, fontSize: "0.6rem" }}
                  >
                    Agent says
                  </div>
                  {step.agentSays}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            onClick={onGetStarted}
            className="font-bold h-12 px-10"
            style={{
              background: "var(--accent-cyan)",
              color: "var(--bg-base)",
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 24px rgba(0,198,224,0.2)",
            }}
          >
            Try it — it's free
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
