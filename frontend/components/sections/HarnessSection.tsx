import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, ShieldAlert, History, ListChecks } from "lucide-react";

interface EvolutionEvent {
  version: number;
  triggeredAt: string;
  triggerReason: string;
  addedRule: string;
  previousVersion: number;
}

interface HarnessConfig {
  key: string;
  version: number;
  rules: string[];
  guardrails: { max_unsupported_assumptions: number };
  active_tools: string[];
  evolution_history: EvolutionEvent[];
}

interface AnalysisResult {
  runwayMonths: number;
  accountedForRenewal: boolean;
  note: string;
}

interface AnalyzeResponse {
  result: AnalysisResult;
  harness: HarnessConfig;
  evolved: boolean;
}

interface HarnessSectionProps {
  onBack: () => void;
}

export default function HarnessSection({ onBack }: HarnessSectionProps) {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json: AnalyzeResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen px-4 py-24"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-80"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={16} />
          Back to Shadow CFO
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h1
              className="text-3xl md:text-4xl font-bold mb-3"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
            >
              Recursive Harness
            </h1>
            <p style={{ color: "var(--text-muted)" }}>
              The agent evaluates its own output. If it misses a known rule, it
              patches itself before the next run.
            </p>
          </div>

          <Card
            className="mb-6"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "var(--border-subtle)" }}
          >
            <CardHeader>
              <CardTitle
                className="text-lg flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <Zap size={18} style={{ color: "var(--accent-cyan)" }} />
                Scenario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <li>Cash balance: <strong style={{ color: "var(--text-primary)" }}>$120,000</strong></li>
                <li>Monthly burn: <strong style={{ color: "var(--text-primary)" }}>$15,000</strong></li>
                <li>Known upcoming renewal: <strong style={{ color: "var(--text-primary)" }}>$5,000/mo</strong></li>
              </ul>
              <Button
                onClick={runAnalysis}
                disabled={loading}
                className="mt-6 font-semibold"
                style={{ background: "var(--accent-cyan)", color: "var(--bg-base)" }}
              >
                {loading ? "Running…" : "Run Analysis"}
              </Button>
              {error && (
                <p className="mt-4 text-sm" style={{ color: "#ff6b6b" }}>
                  {error}
                </p>
              )}
            </CardContent>
          </Card>

          {data && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card style={{ background: "rgba(255,255,255,0.03)", borderColor: "var(--border-subtle)" }}>
                <CardHeader>
                  <CardTitle
                    className="text-lg flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <ListChecks size={18} style={{ color: "var(--accent-cyan)" }} />
                    Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span
                      className="text-4xl font-bold"
                      style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                    >
                      {data.result.runwayMonths}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>months runway</span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                    {data.result.note}
                  </p>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: data.result.accountedForRenewal
                        ? "rgba(34,197,94,0.4)"
                        : "rgba(249,115,22,0.4)",
                      color: data.result.accountedForRenewal ? "#22c55e" : "#f97316",
                    }}
                  >
                    {data.result.accountedForRenewal
                      ? "Renewal accounted for"
                      : "Renewal ignored"}
                  </Badge>
                  {data.evolved && (
                    <div
                      className="mt-4 flex items-start gap-2 text-sm p-3 rounded-lg"
                      style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}
                    >
                      <ShieldAlert size={16} className="mt-0.5" />
                      <span>
                        Guardrail violated — harness evolved to v{data.harness.version}.
                        Run again to see the corrected answer.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card style={{ background: "rgba(255,255,255,0.03)", borderColor: "var(--border-subtle)" }}>
                <CardHeader>
                  <CardTitle
                    className="text-lg flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <History size={18} style={{ color: "var(--accent-cyan)" }} />
                    Harness — v{data.harness.version}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                      Rules
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                      {data.harness.rules.map((rule, i) => (
                        <li key={i}>{rule}</li>
                      ))}
                    </ul>
                  </div>

                  {data.harness.evolution_history.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                        Evolution history
                      </h4>
                      <ul className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                        {data.harness.evolution_history.map((h, i) => (
                          <li
                            key={i}
                            className="p-3 rounded-lg"
                            style={{ background: "rgba(255,255,255,0.03)" }}
                          >
                            <span style={{ color: "var(--text-primary)" }}>
                              v{h.version}
                            </span>{" "}
                            — {h.addedRule}
                            <br />
                            <span className="text-xs opacity-70">{h.triggerReason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
