import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowParticles from "@/components/shared/GlowParticles";
import CounterAnimation from "@/components/shared/CounterAnimation";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.65], [1, 0.88]);
  const y = useTransform(scrollYProgress, [0, 0.65], [0, 80]);
  const ringScale = useTransform(scrollYProgress, [0, 0.65], [1, 1.4]);
  const ringOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Particle mesh - subtler for light mode */}
      <GlowParticles count={40} color="var(--accent-cyan)" />

      {/* ── PORTAL: soft light blue glows ── */}
      <motion.div
        style={{ scale: ringScale, opacity: ringOpacity }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        {/* Outer ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: "min(1000px, 140vw)",
            height: "min(1000px, 140vw)",
            border: "1px solid rgba(0,112,243,0.05)",
            background: "radial-gradient(circle, rgba(0,112,243,0.02) 0%, transparent 70%)",
          }}
        />
        {/* Mid ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: "min(700px, 100vw)",
            height: "min(700px, 100vw)",
            border: "1px solid rgba(0,112,243,0.08)",
          }}
        />
        {/* Core glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: "min(400px, 80vw)",
            height: "min(400px, 80vw)",
            background:
              "radial-gradient(ellipse at center, rgba(0,112,243,0.06) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* Perspective grid floor - light theme variant */}
      <div
        className="absolute bottom-0 left-0 right-0 h-96 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, var(--bg-base) 100%)",
          zIndex: 1,
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden"
        style={{ height: "300px", zIndex: 0 }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "-20%",
            right: "-20%",
            height: "300px",
            backgroundImage:
              "linear-gradient(rgba(0,112,243,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,112,243,0.03) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            transform: "perspective(400px) rotateX(60deg)",
            transformOrigin: "bottom center",
            opacity: 0.8,
          }}
        />
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--bg-base))",
          zIndex: 2,
        }}
      />

      <motion.div
        style={{ opacity, scale, y, zIndex: 10 }}
        className="relative flex flex-col items-center text-center px-4 sm:px-6 max-w-4xl mx-auto"
      >
        {/* Label chip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 mb-8"
          style={{ position: "relative", zIndex: 10 }}
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(0,198,224,0.08)",
              border: "1px solid rgba(0,198,224,0.28)",
              color: "var(--accent-cyan)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.1em",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "var(--accent-cyan)" }}
              />
              YOUR SHADOW CFO IS WATCHING
              <span
                className="inline-flex items-center gap-1.5 font-bold tracking-[0.16em]"
                style={{ fontSize: 10, color: "#DC2626", marginLeft: 4 }}
              >
                <span
                  className="inline-block rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: "#DC2626",
                    boxShadow: "0 0 0 0 rgba(220,38,38,0.35)",
                    animation: "shadowcfoLivePulse 1.35s ease-in-out infinite",
                  }}
                />
                LIVE
              </span>
            </span>
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-display-xl mb-6"
          style={{ color: "var(--text-primary)", position: "relative", zIndex: 10 }}
        >
          <span
            className="block"
            style={{
              color: "rgb(0, 0, 0)",
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
            }}
          >
            Your accounts
          </span>
          <span
            className="block"
            style={{
              color: "rgb(0, 0, 0)",
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              marginTop: "0.18em",
            }}
          >
            are bleeding
          </span>
          <span
            className="block"
            style={{
              color: "rgb(255, 0, 0)",
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              marginTop: "0.22em",
              fontSize: "1.2em",
            }}
          >
            <CounterAnimation target={347} prefix="$" suffix="/month" duration={2400} />
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-base sm:text-lg max-w-xl mb-10 leading-relaxed"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", position: "relative", zIndex: 10 }}
        >
          Shadow CFO scans your statements, surfaces the highest-confidence money
          leaks, and turns them into guided fixes — explaining every move before
          you make it.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center gap-3"
          style={{ position: "relative", zIndex: 10 }}
        >
          <Button
            size="lg"
            onClick={onGetStarted}
            className="font-bold text-base h-14 px-10 rounded-full transition-transform active:scale-[0.98]"
            style={{
              background: "rgb(0, 17, 255)",
              color: "#FFFFFF",
              fontFamily: "var(--font-display)",
              boxShadow: "0 14px 36px rgba(0,17,255,0.22)",
              height: "3.75rem",
              fontSize: "1.05rem",
            }}
            aria-label="Get started and see leaks"
          >
            <span
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,1) 45%, rgba(255,255,255,0.55) 100%)",
                backgroundSize: "220% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                animation: "shadowcfoWhiteSweep 2.2s ease-in-out infinite",
                display: "inline-block",
                letterSpacing: "-0.01em",
              }}
            >
              See it in Action
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", animation: "shadowcfoArrowSweep 2.2s ease-in-out infinite" }}>
              <ArrowRight size={20} />
            </span>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-14 px-8 text-base rounded-full"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              height: "3.75rem",
            }}
            onClick={() => {
              const el = document.querySelector("#how-it-works");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            How it works
          </Button>
        </motion.div>

        <style>{`
          @keyframes shadowcfoLivePulse {
            0% { transform: scale(1); opacity: 0.75; box-shadow: 0 0 0 0 rgba(220,38,38,0.35); }
            50% { transform: scale(1.06); opacity: 1; box-shadow: 0 0 0 8px rgba(220,38,38,0); }
            100% { transform: scale(1); opacity: 0.75; box-shadow: 0 0 0 0 rgba(220,38,38,0); }
          }
          @keyframes shadowcfoWhiteSweep {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes shadowcfoArrowSweep {
            0% { opacity: 0.65; filter: drop-shadow(0 0 0 rgba(255,255,255,0)); transform: translateX(0); }
            50% { opacity: 1; filter: drop-shadow(0 10px 22px rgba(255,255,255,0.18)); transform: translateX(1px); }
            100% { opacity: 0.65; filter: drop-shadow(0 0 0 rgba(255,255,255,0)); transform: translateX(0); }
          }
        `}</style>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="flex flex-wrap items-center justify-center gap-5 mt-12"
          style={{ position: "relative", zIndex: 10 }}
        >
          {[
            "🔒 Read-only access",
            "⚡ ACH-grade rails",
            "📋 Consent logged",
          ].map((item) => (
            <span
              key={item}
              className="text-sm font-medium"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
            >
              {item}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer p-4"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        style={{ color: "var(--text-muted)", zIndex: 10 }}
        onClick={() => {
          const el = document.querySelector("#how-it-works");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
        aria-label="Scroll down"
      >
        <ChevronDown size={24} />
      </motion.div>
    </section>
  );
}
