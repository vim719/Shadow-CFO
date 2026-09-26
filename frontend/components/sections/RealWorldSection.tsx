import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import MoneyFlowGraph from "@/components/shared/MoneyFlowGraph";

export default function RealWorldSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inView = useInView(contentRef, { once: true, margin: "-100px" });

  // Scroll-driven zoom-out: section enters from slightly zoomed-in state
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });
  const sectionScale = useTransform(scrollYProgress, [0, 1], [1.06, 1]);
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <motion.section
      ref={sectionRef}
      style={{ scale: sectionScale, opacity: sectionOpacity, background: "var(--bg-base)" }}
      className="relative py-24 sm:py-32 overflow-hidden"
    >


      {/* Subtle grid background - light mode */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--text-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--text-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Amber leak glow - softer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,112,243,0.02) 0%, transparent 70%)",
        }}
      />

      <div ref={contentRef} className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="text-label-upper mb-4">The Real World View</div>
            <h2 className="text-display-md mb-6" style={{ color: "var(--text-primary)" }}>
              Your financial life,
              <br />
              <span style={{ color: "var(--accent-amber)" }}>mapped in real time</span>
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
              Shadow CFO reads your transaction history across all connected accounts
              and builds a living model of where money comes in, where it goes, and
              — critically — where it silently leaks out.
            </p>
            <div className="space-y-3">
              {[
                { color: "var(--accent-cyan)", label: "Your accounts", desc: "Chase, BofA, USAA — all synced" },
                { color: "var(--accent-amber)", label: "Leak nodes", desc: "Duplicate, idle, and inflated charges" },
                { color: "var(--accent-emerald)", label: "Savings targets", desc: "HYSA, sweep destinations" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: item.color }}
                  />
                  <div>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                      {item.label}
                    </span>
                    <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ambient metric strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-8 flex items-center gap-6"
            >
              {[
                { value: "$89/mo", label: "avg leak found", color: "var(--accent-amber)" },
                { value: "< 60s", label: "to first insight", color: "var(--accent-cyan)" },
                { value: "11,000+", label: "banks supported", color: "var(--accent-emerald)" },
              ].map((m) => (
                <div key={m.label}>
                  <div
                    className="text-lg font-bold"
                    style={{ fontFamily: "var(--font-mono)", color: m.color, letterSpacing: "-0.02em" }}
                  >
                    {m.value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Graph */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white rounded-[2rem] border border-slate-100 p-8"
            style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.05)" }}
          >
            <div className="text-label-upper mb-4 text-center">Live Account Map</div>
            <MoneyFlowGraph />
            <div
              className="mt-4 flex items-center justify-center gap-1.5 text-xs"
              style={{ color: "var(--accent-amber)", fontFamily: "var(--font-mono)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-amber)" }} />
              $89/mo in active leaks detected
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
