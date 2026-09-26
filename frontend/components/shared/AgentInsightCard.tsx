import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, Brain, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface LeakInsight {
  id: string;
  title: string;
  amount: number;
  frequency: "monthly" | "yearly";
  confidence: number;
  category: string;
  agentReasoning: string;
  agentEvidence: string[];
  fixDescription: string;
  fixDestination?: string;
}

interface AgentInsightCardProps {
  insight: LeakInsight;
  onFix?: (id: string) => void;
  onSkip?: (id: string) => void;
  isFixing?: boolean;
  isFixed?: boolean;
  className?: string;
}

export default function AgentInsightCard({
  insight,
  onFix,
  onSkip,
  isFixing = false,
  isFixed = false,
  className,
}: AgentInsightCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  const confidenceColor =
    insight.confidence >= 90
      ? "var(--accent-emerald)"
      : insight.confidence >= 75
      ? "var(--accent-amber)"
      : "var(--text-muted)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border transition-all duration-300",
        isFixed
          ? "border-accent-emerald/30 bg-accent-emerald/5"
          : "bg-white hover:border-accent-cyan/30",
        className
      )}
      style={
        !isFixed
          ? { boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }
          : {}
      }
    >
      {/* Leak severity indicator */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{ background: isFixed ? "var(--accent-emerald)" : "var(--accent-amber)" }}
      />

      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 p-1.5 rounded-lg"
              style={{ background: "rgba(240,165,0,0.1)" }}
            >
              {isFixed ? (
                <CheckCircle size={16} style={{ color: "var(--accent-emerald)" }} />
              ) : (
                <AlertTriangle size={16} style={{ color: "var(--accent-amber)" }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Badge
                  variant="outline"
                  className="text-xs py-0.5"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontSize: "0.75rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {insight.category}
                </Badge>
              </div>
              <h3
                className="font-semibold text-sm leading-snug"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                {insight.title}
              </h3>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div
              className="text-mono-data text-lg font-bold"
              style={{ color: isFixed ? "var(--accent-emerald)" : "var(--accent-amber)" }}
            >
              ${insight.amount}
              <span className="text-xs font-normal text-text-muted">
                /{insight.frequency === "monthly" ? "mo" : "yr"}
              </span>
            </div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-label-upper" style={{ fontSize: "0.6rem" }}>
              AI Confidence
            </span>
            <span
              className="text-mono-data text-xs font-semibold"
              style={{ color: confidenceColor }}
            >
              {insight.confidence}%
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${insight.confidence}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              style={{ background: confidenceColor }}
            />
          </div>
        </div>

        {/* Agent reasoning teaser */}
        <p
          className="text-sm leading-relaxed mb-4"
          style={{ color: "var(--text-muted)", fontStyle: "italic" }}
        >
          "{insight.agentReasoning}"
        </p>

        {/* Why I flagged this — expandable */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowReasoning((s) => !s)}
          className="flex items-center gap-2 text-xs mb-4 h-10 px-3 -ml-3" /* Increased target size */
          style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-body)" }}
          aria-expanded={showReasoning}
        >
          <Brain size={14} />
          Why did I flag this?
          <motion.span animate={{ rotate: showReasoning ? 180 : 0 }}>
            <ChevronDown size={14} />
          </motion.span>
        </Button>

        <AnimatePresence>
          {showReasoning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-lg p-4 mb-4 text-sm"
                style={{
                  background: "rgba(0,198,224,0.05)",
                  border: "1px solid rgba(0,198,224,0.15)",
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                }}
              >
                <div className="text-label-upper mb-2" style={{ color: "var(--accent-cyan)" }}>
                  Evidence found
                </div>
                <ul className="space-y-1.5">
                  {insight.agentEvidence.map((e, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span style={{ color: "var(--accent-cyan)", marginTop: 2 }}>›</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        {!isFixed && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onFix?.(insight.id)}
              disabled={isFixing}
              className="flex-1 font-semibold text-sm transition-all"
              style={{
                background: "var(--accent-cyan)",
                color: "var(--bg-base)",
                fontFamily: "var(--font-display)",
              }}
            >
              {isFixing ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                  />
                  Fixing...
                </span>
              ) : (
                `Fix This Now →`
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onSkip?.(insight.id)}
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Skip
            </Button>
          </div>
        )}

        {isFixed && (
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: "var(--accent-emerald)" }}
          >
            <CheckCircle size={14} />
            <span>Fixed — saving ${insight.amount}/mo</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
