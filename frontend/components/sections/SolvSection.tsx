import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const TIERS = [
  { name: "Scout", min: 0, max: 250, description: "Starter — scanning begins" },
  { name: "Analyst", min: 250, max: 500, description: "Priority fix queue" },
  { name: "Strategist", min: 500, max: 750, description: "Auto-sweep unlocked" },
  { name: "Architect", min: 750, max: 1000, description: "Full CFO dashboard" },
];

const CURRENT_SOLV = 847;

export default function SolvSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const currentTier = TIERS.findLast((t) => CURRENT_SOLV >= t.min) ?? TIERS[0]!;
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const tierProgress = nextTier
    ? ((CURRENT_SOLV - currentTier.min) / (currentTier.max - currentTier.min)) * 100
    : 100;

  return (
    <section
      id="solv"
      ref={ref}
      className="relative py-24 sm:py-32 overflow-hidden"
      style={{ background: "var(--bg-surface)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 50%, rgba(121, 40, 202, 0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="text-label-upper mb-4" style={{ color: "var(--accent-solv)" }}>
              $SOLV Token
            </div>
            <h2 className="text-display-md mb-6" style={{ color: "var(--text-primary)" }}>
              Earn rewards for
              <br />
              <span style={{ color: "var(--accent-solv)" }}>fixing your finances</span>
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
              Every fix you approve earns $SOLV — our beta reward token. Accumulate
              enough to unlock the Architect tier and access the full CFO dashboard,
              automated sweeps, and priority AI processing.
            </p>
            <div className="space-y-3">
              {[
                "Cancel a duplicate subscription → +10 $SOLV",
                "Redirect cash to HYSA → +15 $SOLV",
                "Reduce a fee → +8 $SOLV",
                "Streak bonus (7 days active) → +25 $SOLV",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: "var(--accent-solv)" }}
                  />
                  <span style={{ color: "var(--text-muted)" }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Progress card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 p-8"
            style={{ boxShadow: "0 20px 50px rgba(121, 40, 202, 0.05)" }}
          >
            {/* Current tier */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-label-upper mb-1" style={{ color: "var(--accent-solv)" }}>
                  Current Tier
                </div>
                <div
                  className="text-3xl font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  {currentTier.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-label-upper mb-1">Balance</div>
                <div
                  className="text-mono-data text-2xl font-bold"
                  style={{ color: "var(--accent-solv)" }}
                >
                  {CURRENT_SOLV}
                  <span className="text-sm font-normal ml-1" style={{ color: "var(--text-muted)" }}>
                    $SOLV
                  </span>
                </div>
              </div>
            </div>

            {/* Tier progress */}
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                <span>{currentTier.name} ({currentTier.min})</span>
                {nextTier && <span>{nextTier.name} ({nextTier.min})</span>}
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${tierProgress}%` } : { width: 0 }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  style={{ background: "linear-gradient(90deg, var(--accent-solv), var(--accent-cyan))" }}
                />
              </div>
              {nextTier && (
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  {nextTier.min - CURRENT_SOLV} $SOLV to{" "}
                  <span style={{ color: "var(--accent-solv)" }}>{nextTier.name}</span>
                </p>
              )}
            </div>

            {/* Tier ladder */}
            <div className="space-y-2">
              {TIERS.map((tier) => {
                const isActive = tier.name === currentTier.name;
                const isUnlocked = CURRENT_SOLV >= tier.min;
                return (
                  <div
                    key={tier.name}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-all"
                    style={{
                      background: isActive ? "rgba(155,109,255,0.12)" : "transparent",
                      border: isActive ? "1px solid rgba(155,109,255,0.25)" : "1px solid transparent",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: isUnlocked ? "var(--accent-solv)" : "var(--text-subtle)",
                          opacity: isUnlocked ? 1 : 0.4,
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: isActive ? "var(--accent-solv)" : isUnlocked ? "var(--text-primary)" : "var(--text-subtle)",
                        }}
                      >
                        {tier.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: "var(--text-subtle)" }}>
                        {tier.description}
                      </span>
                      {isActive && (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: "rgba(155,109,255,0.4)",
                            color: "var(--accent-solv)",
                            fontSize: "0.7rem",
                          }}
                        >
                          current
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
