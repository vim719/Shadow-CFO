import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, Lock, FileText, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaidLink } from "react-plaid-link";

interface ConnectBankScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

const BANKS = [
  { id: "chase", name: "Chase", logo: "🏦", color: "#117ACA" },
  { id: "bofa", name: "Bank of America", logo: "🔴", color: "#E31837" },
  { id: "wells", name: "Wells Fargo", logo: "🔶", color: "#D71E28" },
  { id: "usaa", name: "USAA", logo: "🛡️", color: "#003087" },
  { id: "citi", name: "Citibank", logo: "🌐", color: "#056DAE" },
  { id: "cap1", name: "Capital One", logo: "💳", color: "#C40F0F" },
  { id: "amex", name: "Amex", logo: "⬡", color: "#007BC1" },
  { id: "td", name: "TD Bank", logo: "🟢", color: "#00B140" },
  { id: "pnc", name: "PNC", logo: "🔷", color: "#F15922" },
  { id: "more", name: "+ 11,000 more", logo: "✦", color: "var(--accent-cyan)", isMore: true },
];

const TRUST_SIGNALS = [
  { icon: Lock, label: "Read-only", sub: "We never write to your accounts" },
  { icon: FileText, label: "Consent logged", sub: "Every connection is signed + auditable" },
  { icon: Zap, label: "Revoke anytime", sub: "Instant disconnect, no holds" },
];

export default function ConnectBankScreen({ onContinue, onBack }: ConnectBankScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [plaidError, setPlaidError] = useState<string | null>(null);

  const createLinkToken = async () => {
    setIsLinkLoading(true);
    setPlaidError(null);
    try {
      const existingUserId = sessionStorage.getItem("shadowcfo:userId");
      const res = await fetch("/api/plaid/link-token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(existingUserId ? { userId: existingUserId } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create link token");
      setLinkToken(data.link_token);
      return data.link_token as string;
    } catch (e) {
      setPlaidError(e instanceof Error ? e.message : "Failed to initialize Plaid");
      return null;
    } finally {
      setIsLinkLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const token = await createLinkToken();
        if (cancelled) return;
        if (token) setLinkToken(token);
      } catch {
        // errors are handled inside createLinkToken
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const onPlaidSuccess = useMemo(() => {
    return async (publicToken: string, metadata: any) => {
      try {
        setPlaidError(null);
        const existingUserId = sessionStorage.getItem("shadowcfo:userId");
        const institutionName = metadata?.institution?.name;
        const institutionId = metadata?.institution?.institution_id;
        const accountId = metadata?.accounts?.[0]?.id;
        const exchangeRes = await fetch("/api/plaid/exchange", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ publicToken, institutionName, institutionId, accountId, userId: existingUserId || undefined }),
        });
        const exchangeData = await exchangeRes.json();
        if (!exchangeRes.ok) throw new Error(exchangeData?.error || "Token exchange failed");

        if (typeof exchangeData?.userId === "string") {
          sessionStorage.setItem("shadowcfo:userId", exchangeData.userId);
        }

        const txRes = await fetch("/api/plaid/transactions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ bankConnectionId: exchangeData.bankConnectionId, userId: exchangeData.userId }),
        });
        const txData = await txRes.json();
        if (!txRes.ok) throw new Error(txData?.error || "Transaction sync failed");

        setConnected(true);
        onContinue();
      } catch (e) {
        setPlaidError(e instanceof Error ? e.message : "Plaid connection failed");
      }
    };
  }, [onContinue]);

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      const msg =
        err?.display_message ||
        err?.error_message ||
        err?.error_code ||
        (err ? JSON.stringify(err) : null);
      if (msg) setPlaidError(msg);
    },
  });

  const handleConnect = () => {
    if (connected) return;
    if (!selected) {
      setPlaidError("Select a bank first.");
      return;
    }
    if (!linkToken || !plaidReady) {
      // Plaid might not be ready yet (missing env vars, cold start, etc).
      // Keep the CTA enabled; trigger token creation and prompt the user to click again.
      void createLinkToken();
      setPlaidError((prev) => prev || "Preparing Plaid connection… click Connect Bank again in a moment.");
      return;
    }
    openPlaid();
  };

  const handleUpload = async () => {
    if (!statementFile || isUploading) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", statementFile, statementFile.name);
      const res = await fetch("/api/documents/upload-analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      sessionStorage.setItem(
        "shadowcfo:lastScan",
        JSON.stringify({
          documentId: data.documentId,
          filename: data.filename,
          storage: data.storage,
          findings: data.findings,
          meta: data.meta,
          ogProof: data.ogProof,
        })
      );
      onContinue();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Background glow - soft blue */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 10%, rgba(0,112,243,0.04) 0%, transparent 80%)",
        }}
      />

      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute top-6 left-6 gap-1.5 text-sm h-11 px-5 rounded-full border border-slate-100 bg-white/50 backdrop-blur-sm"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
        aria-label="Go back to previous screen"
      >
        <ChevronLeft size={18} />
        Back
      </Button>

      {/* Step indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: "var(--accent-cyan)",
              color: "var(--bg-base)",
              fontFamily: "var(--font-mono)",
            }}
          >
            1
          </div>
          <div className="w-16 h-px" style={{ background: "var(--border-subtle)" }} />
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            2
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-5"
            style={{
              background: "rgba(0,198,224,0.08)",
              border: "1px solid rgba(0,198,224,0.2)",
              color: "var(--accent-cyan)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.06em",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--accent-cyan)" }}
            />
            YOUR SHADOW CFO IS READY
          </div>
          <h1
            className="text-3xl font-bold mb-3"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Connect your bank
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Shadow CFO uses read-only access to scan your statements. No writes.
            No surprises. Your data never leaves our encrypted rails.
          </p>
        </motion.div>

        {/* Bank grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="rounded-[2rem] p-6 mb-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
          }}
        >
          <div
            className="text-xs font-medium mb-4"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Select your bank
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {BANKS.map((bank) => {
              const isSelected = selected === bank.id;
              return (
                <motion.button
                  key={bank.id}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => !bank.isMore && setSelected(bank.id)}
                  aria-label={`Select ${bank.name}`}
                  aria-pressed={isSelected}
                  className="flex flex-col items-center justify-center gap-2 p-3 min-h-[72px] rounded-2xl transition-all duration-200"
                  style={{
                    background: isSelected
                      ? "rgba(0,112,243,0.06)"
                      : "#FFFFFF",
                    border: isSelected
                      ? "2px solid var(--accent-cyan)"
                      : "1px solid var(--border-subtle)",
                    cursor: bank.isMore ? "default" : "pointer",
                    boxShadow: isSelected ? "0 4px 12px rgba(0,112,243,0.1)" : "none",
                  }}
                >
                  <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{bank.logo}</span>
                  <span
                    className="text-center leading-tight"
                    style={{
                      fontSize: "0.75rem",
                      color: isSelected ? "var(--accent-cyan)" : "var(--text-primary)",
                      fontFamily: "var(--font-body)",
                      fontWeight: isSelected ? 600 : 500,
                    }}
                  >
                    {bank.isMore ? bank.name : bank.name.split(" ")[0]}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl p-4 mb-5"
          style={{
            background: "rgba(0,198,224,0.03)",
            border: "1px solid rgba(0,198,224,0.1)",
          }}
        >
          <div className="space-y-3">
            {TRUST_SIGNALS.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(0,198,224,0.1)" }}
                >
                  <Icon size={13} style={{ color: "var(--accent-cyan)" }} />
                </div>
                <div>
                  <div
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                  >
                    {label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {connected ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{
                  background: "rgba(0,200,150,0.12)",
                  border: "1px solid rgba(0,200,150,0.3)",
                  color: "var(--accent-emerald)",
                  fontFamily: "var(--font-display)",
                }}
              >
                <CheckCircle size={16} />
                Connected — scanning your accounts...
              </motion.div>
            ) : (
              <motion.button
                key="connect-btn"
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleConnect}
                disabled={false}
                className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200"
                style={{
                  background: selected ? "var(--accent-cyan)" : "var(--bg-elevated)",
                  color: selected ? "#FFFFFF" : "var(--text-subtle)",
                  fontFamily: "var(--font-display)",
                  boxShadow: selected ? "0 10px 25px rgba(0,112,243,0.2)" : "none",
                  cursor: "pointer",
                  border: selected ? "none" : "1px solid var(--border-subtle)",
                }}
              >
                {isLinkLoading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                      className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Preparing secure connection...
                  </>
                ) : (
                  <>
                    {selected ? "Connect Bank" : "Select a bank to continue"}
                    {selected && <ArrowRight size={16} />}
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Plaid badge */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="1" fill="#00B0F0" />
              <rect x="13" y="2" width="9" height="9" rx="1" fill="#00B0F0" opacity="0.7" />
              <rect x="2" y="13" width="9" height="9" rx="1" fill="#00B0F0" opacity="0.7" />
              <rect x="13" y="13" width="9" height="9" rx="1" fill="#00B0F0" opacity="0.5" />
            </svg>
            <span
              className="text-xs"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
            >
              Powered by Plaid · 256-bit encrypted
            </span>
          </div>

          {plaidError && (
            <div className="mt-3 text-xs text-center" style={{ color: "var(--accent-amber)", fontFamily: "var(--font-body)" }}>
              {plaidError}
            </div>
          )}

          {/* Statement upload (MVP) */}
          <div
            className="mt-6 rounded-3xl px-5 py-4"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 14px 34px rgba(0,0,0,0.035)",
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
              <div
                className="text-[11px] font-bold tracking-[0.22em]"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
              >
                OR
              </div>
              <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
            </div>

            <div className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
              <div style={{ paddingLeft: 2 }}>Upload a PDF statement from your computer</div>
              <div style={{ paddingLeft: 2 }}>
                ShadowCFO will scan it and surface potential “Ghost Money”.
              </div>
            </div>

            <input
              id="shadowcfo-statement-upload"
              type="file"
              accept="application/pdf"
              onChange={(e) => setStatementFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />

            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="shadowcfo-statement-upload"
                className="select-none"
                style={{ cursor: "pointer" }}
              >
                <span
                  className="text-sm font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.01em",
                    background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald), var(--accent-cyan))",
                    backgroundSize: "220% 100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    display: "inline-block",
                    animation: "shadowcfoTextGlow 2.6s ease-in-out infinite",
                  }}
                >
                  Click to Upload
                </span>
                <div className="text-[11px] mt-1" style={{ color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
                  {statementFile ? statementFile.name : "PDF only"}
                </div>
              </label>

              <Button
                onClick={handleUpload}
                disabled={!statementFile || isUploading}
                className="h-11 px-5 rounded-full text-xs font-bold"
                style={{
                  background: statementFile ? "var(--accent-cyan)" : "var(--bg-elevated)",
                  color: statementFile ? "#FFFFFF" : "var(--text-subtle)",
                  fontFamily: "var(--font-display)",
                  boxShadow: statementFile ? "0 10px 25px rgba(0,112,243,0.18)" : "none",
                }}
              >
                {isUploading ? "Uploading..." : "Upload & scan"}
              </Button>
            </div>

            {uploadError && (
              <div className="mt-3 text-xs text-center" style={{ color: "var(--accent-amber)", fontFamily: "var(--font-body)" }}>
                {uploadError}
              </div>
            )}

            <style>{`
              @keyframes shadowcfoTextGlow {
                0% { background-position: 0% 50%; filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
                50% { background-position: 100% 50%; filter: drop-shadow(0 8px 18px rgba(0,112,243,0.12)); }
                100% { background-position: 0% 50%; filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
              }
            `}</style>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
