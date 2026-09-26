export const VerificationBadge = ({ ogData }: { ogData: { status: string; rootHash: string | null; txHash: string | null } }) => (
  <div className="p-3 rounded-lg" style={{ background: "rgba(0,198,224,0.04)", border: "1px solid rgba(0,198,224,0.15)" }}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-bold" style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        0G Trust Proof
      </span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: ogData.status === "archived" ? "rgba(0,200,150,0.15)" : "rgba(240,165,0,0.15)", color: ogData.status === "archived" ? "var(--accent-emerald)" : "var(--accent-amber)", fontFamily: "var(--font-mono)" }}>
        {ogData.status}
      </span>
    </div>
    <ul className="text-[10px] leading-relaxed" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
      <li>Root: {ogData.rootHash?.slice(0, 16)}...{ogData.rootHash?.slice(-4)}</li>
      <li>Tx:   {ogData.txHash?.slice(0, 16)}...{ogData.txHash?.slice(-4)}</li>
    </ul>
    {ogData.txHash && (
      <a href={`https://chainscan-galileo.0g.ai/tx/${ogData.txHash}`} target="_blank" rel="noreferrer" className="text-[10px] underline mt-1 inline-block" style={{ color: "var(--accent-cyan)" }}>
        Verify on 0G Chain Explorer →
      </a>
    )}
  </div>
);
