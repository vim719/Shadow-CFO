import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ShieldCheck, FileText, RefreshCcw, Eye, Lock, Zap } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Eye,
    title: "Read-only access",
    description:
      "Shadow CFO never writes to your accounts. We read transaction history through encrypted, scoped API connections — nothing more.",
    color: "var(--accent-cyan)",
  },
  {
    icon: FileText,
    title: "Consent logged",
    description:
      "Every action you approve is logged as a signed consent record in our double-entry ledger. You can audit your full history any time.",
    color: "var(--accent-solv)",
  },
  {
    icon: RefreshCcw,
    title: "Idempotent rails",
    description:
      "Duplicate requests never create duplicate transactions. Our ledger enforces idempotency by design — built on the same principles as banking infrastructure.",
    color: "var(--accent-emerald)",
  },
  {
    icon: ShieldCheck,
    title: "Instant revoke",
    description:
      "Disconnect any bank connection in one tap. Revocation is immediate and permanent — no waiting period, no hidden holds.",
    color: "var(--accent-amber)",
  },
  {
    icon: Lock,
    title: "ACH-grade encryption",
    description:
      "All data in transit and at rest is encrypted to the same standard required for ACH financial transfers.",
    color: "var(--accent-cyan)",
  },
  {
    icon: Zap,
    title: "Explain before act",
    description:
      "Shadow CFO surfaces the rationale for every suggestion before any button is clicked. Explanations are first-class UI, not footnotes.",
    color: "var(--accent-solv)",
  },
];

export default function TrustSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="trust"
      ref={ref}
      className="relative py-24 sm:py-32"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,112,243,0.02) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <div className="text-label-upper mb-4">Built on trust</div>
          <h2 className="text-display-md" style={{ color: "var(--text-primary)" }}>
            We explain every move
            <br />
            <span style={{ color: "var(--accent-cyan)" }}>before you make it</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TRUST_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="card-surface p-5 group hover:border-white/10 transition-all duration-300"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}
                >
                  <Icon size={16} style={{ color: item.color }} />
                </div>
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Ledger callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 rounded-2xl p-6 sm:p-8 text-center"
          style={{
            background: "rgba(0,198,224,0.04)",
            border: "1px solid rgba(0,198,224,0.12)",
          }}
        >
          <div className="text-label-upper mb-3 text-center" style={{ color: "var(--accent-cyan)" }}>
            Ledger entry preview
          </div>
          <div
            className="inline-block text-left text-sm rounded-lg px-5 py-4"
            style={{
              fontFamily: "var(--font-mono)",
              background: "rgba(0,0,0,0.3)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              width: "100%",
              maxWidth: "600px",
            }}
          >
            <div className="mb-1"><span style={{ color: "var(--accent-cyan)" }}>DEBIT</span>  USD_PROXY:chase-4521   <span style={{ color: "var(--accent-amber)" }}>-$34.99</span>  PENDING</div>
            <div className="mb-2"><span style={{ color: "var(--accent-emerald)" }}>CREDIT</span> USD_PROXY:cancelled    <span style={{ color: "var(--accent-emerald)" }}>+$34.99</span>  PENDING</div>
            <div className="text-xs border-t border-white/5 pt-2 mt-2" style={{ color: "var(--text-subtle)" }}>xShadowRequestId: req-abc123 · <span className="text-accent-emerald">consent: signed</span> · idempotent: ✓</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
