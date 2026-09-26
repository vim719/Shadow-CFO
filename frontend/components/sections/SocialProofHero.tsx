import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
  "#2563EB", "#06B6D4", "#6366F1", "#8B5CF6", 
  "#FFCF00", "#F72585", "#10B981", "#FF6B6B"
];

const TESTIMONIALS = [
  {
    quote: "Shadow CFO turned my messy books into a truly plug-and-play experience; it just worked with our banking stack out of the box. We stopped burning time on one-off reconciliation.",
    author: "Sharon Yeh",
    role: "Staff Product Manager",
    company: "Deepgram",
    avatar: "https://i.pravatar.cc/150?u=sharon"
  },
  {
    quote: "Shadow CFO is the first AI that actually surfaces real money leaks. We found $4,200 in idle seats within the first 48 hours of connecting our accounts.",
    author: "Sarah Yeh",
    role: "Head of Operations",
    company: "Stealth Startup",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    quote: "The most powerful financial tool I've ever used. Shadow CFO handles the leaks while we focus on scaling the business.",
    author: "Michael B.",
    role: "Managing Partner",
    company: "Ventures Inc",
    avatar: "https://i.pravatar.cc/150?u=michael"
  }
];

interface BarProps {
  id: number;
  isTop: boolean;
}

const Bar = ({ isTop }: BarProps) => {
  const config = useMemo(() => {
    const width = Math.floor(Math.random() * (22 - 6 + 1)) + 6;
    const height = Math.floor(Math.random() * (280 - 120 + 1)) + 120;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const opacity = (Math.random() * (0.95 - 0.82) + 0.82).toFixed(2);
    const duration = Math.floor(Math.random() * (14 - 6 + 1)) + 6;
    const delay = -(Math.random() * duration); // Negative delay for mid-flight start
    const direction = Math.random() > 0.5 ? 1 : -1;
    const top = isTop 
      ? Math.floor(Math.random() * 50) - 20 // -20% to 30% of viewport
      : Math.floor(Math.random() * 55) + 55; // 55% to 110% of viewport
    const rotation = Math.floor(Math.random() * 16) - 8; // -8deg to 8deg skew/rotate
    
    return { width, height, color, opacity, duration, delay, direction, top, rotation };
  }, [isTop]);

  return (
    <div
      aria-hidden="true"
      className="absolute bar-animation"
      style={{
        width: config.width,
        height: config.height,
        background: config.color,
        opacity: config.opacity,
        top: `${config.top}%`,
        borderRadius: "4px",
        zIndex: Math.floor(Math.random() * 3) + 1,
        "--duration": `${config.duration}s`,
        "--delay": `${config.delay}s`,
        "--distance": config.direction === 1 ? "160vw" : "-160vw",
        "--start-x": config.direction === 1 ? "-60vw" : "160vw",
        "--rotation": `${config.rotation}deg`,
      } as any}
    />
  );
};

export default function SocialProofHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const topBars = useMemo(() => Array.from({ length: 18 }, (_, i) => i), []);
  const bottomBars = useMemo(() => Array.from({ length: 18 }, (_, i) => i), []);

  const fallback = TESTIMONIALS[0];
  if (!fallback) return null;
  const current = TESTIMONIALS[index] ?? fallback;
  const quoteParts = current.quote.split("SHADOW CFO");

  return (
    <section 
      id="social-proof"
      className="relative w-full h-screen min-h-[600px] overflow-hidden bg-bg-base noise-overlay snap-start border-b border-border-subtle"
    >
      {/* ── MASTERCLASS GEOMETRIC ELEMENTS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {topBars.map(id => <Bar key={`top-${id}`} id={id} isTop={true} />)}
        {bottomBars.map(id => <Bar key={`bottom-${id}`} id={id} isTop={false} />)}
      </div>

      {/* ── REFINED EDITORIAL CONTENT ── */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-[800px] px-8 text-center"
        aria-live="polite"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted mb-10">
                  Agentic Intelligence • Trusted Globally
                </div>

                <blockquote 
                  className="font-bold text-text-primary leading-[1.3] tracking-[-0.03em] mb-14 font-display italic"
                  style={{ fontSize: "clamp(1.6rem, 4.5vw, 2.6rem)" }}
                >
                  “{quoteParts.map((part, i) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < quoteParts.length - 1 && (
                        <span style={{ color: "var(--accent-gold-text)", fontWeight: 900 }}>SHADOW CFO</span>
                      )}
                    </React.Fragment>
                  ))}”
                </blockquote>

            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <img 
                  src={current.avatar} 
                  alt="" 
                  className="w-[52px] h-[52px] rounded-full object-cover border-2 border-bg-base shadow-lg ring-1 ring-border-subtle"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-emerald rounded-full border-2 border-bg-base" />
              </div>
              <div className="text-center">
                <div className="font-bold text-text-primary text-[16px] tracking-tight">
                  {current.author}
                </div>
                <div className="text-text-muted text-[13px] font-medium mt-1 tracking-wide uppercase opacity-80">
                  {current.role} <span className="mx-2 opacity-30">|</span> {current.company}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── INTERACTIVE SCROLL PROMPT ── */}
      <button
        onClick={() => document.getElementById("audit-hero")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 cursor-pointer z-20 group min-h-[44px] min-w-[44px] justify-center"
        aria-label="Scroll to Audit Section"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-px h-12 bg-gradient-to-b from-accent-cyan to-transparent group-hover:h-16 transition-all duration-300" />
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-text-primary group-hover:text-accent-cyan transition-colors">Enter Audit</span>
        </motion.div>
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drift {
          from { transform: translateX(var(--start-x)) rotate(var(--rotation)); }
          to { transform: translateX(var(--distance)) rotate(var(--rotation)); }
        }
        .bar-animation {
          animation: drift var(--duration) linear infinite;
          animation-delay: var(--delay);
          will-change: transform;
        }
        @media (max-width: 768px) {
          .bar-animation {
            opacity: 0.5 !important;
            transform: scale(0.6) rotate(var(--rotation)) !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bar-animation {
            animation: none !important;
          }
        }
      `}} />
    </section>
  );
}
