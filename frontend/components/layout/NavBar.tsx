import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavBarProps {
  onGetStarted: () => void;
}

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Trust", href: "#trust" },
  { label: "$SOLV", href: "#solv" },
];

export default function NavBar({ onGetStarted }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(8,11,24,0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-2"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          <span
            className="flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <span
              aria-hidden="true"
              className="inline-flex flex-col justify-center gap-1"
              style={{ width: 14, marginTop: 1 }}
            >
              <span style={{ height: 2, borderRadius: 999, background: "var(--text-primary)", opacity: 0.9 }} />
              <span style={{ height: 2, borderRadius: 999, background: "var(--text-primary)", opacity: 0.65, width: 10 }} />
            </span>
            <span
              className="font-bold tracking-tight uppercase"
              style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem", fontStyle: "normal" }}
            >
              Shadow CFO
            </span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm transition-colors hover:opacity-100"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
              onClick={(e) => {
                e.preventDefault();
                const el = document.querySelector(link.href);
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="inline-flex flex-col items-center">
                <span>{link.label}</span>
                {link.label === "How it works" && (
                  <span
                    aria-hidden="true"
                    style={{
                      marginTop: 3,
                      height: 1,
                      width: "100%",
                      background: "rgb(255, 111, 0)",
                      opacity: 0.9,
                      borderRadius: 999,
                    }}
                  />
                )}
              </span>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="hidden md:flex text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Sign in
          </Button>
          <Button
            onClick={onGetStarted}
            className="font-semibold text-sm h-11 px-6"
            style={{
              background: "var(--accent-cyan)",
              color: "var(--bg-base)",
              fontFamily: "var(--font-display)",
            }}
          >
            Start beta
          </Button>
          {/* Mobile menu */}
          <button
            className="md:hidden p-1.5"
            style={{ color: "var(--text-muted)" }}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden px-4 pb-4 pt-2"
          style={{
            background: "rgba(8,11,24,0.95)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-2.5 text-sm"
              style={{ color: "var(--text-muted)" }}
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                const el = document.querySelector(link.href);
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {link.label}
            </a>
          ))}
        </motion.div>
      )}
    </motion.nav>
  );
}
