# Chosen User Action: Connect Bank → First Leak Detected

## The Action

**Screen 1:** User connects their bank account via Plaid  
**Screen 2:** Shadow CFO's AI surfaces the first money leak with full agentic explanation

---

## Why This Action Over All Others

### The Shortlist We Evaluated

| Action | Time to Value | Agentic UX Showcase | Trust Moment | Cognitive Load |
|--------|--------------|-------------------|--------------|----------------|
| **Connect → First Leak** ✅ | < 60 seconds | Highest | Explicit | Minimal |
| Full onboarding tour | 4–6 minutes | Medium | Implicit | High |
| Fee audit review | 2–3 minutes | Medium | Medium | Medium |
| Auto-sweep setup | 3 minutes | Low | Low | High |
| Settings / profile | Indefinite | None | None | Low |

**Winner:** Connect → First Leak — by a significant margin on every dimension.

---

## The 5 Reasons We Chose This

### 1. Highest Perceived Value, Fastest
The user sees real ROI — their own money — in under 60 seconds. No configuration. No dashboard navigation. No learning curve. They connect one account and the AI speaks first.

The emotional arc: **confusion → curiosity → recognition → trust → action**. This is the arc that converts.

### 2. Explanation-First = Agentic UX Showcase
This is the single best place to demonstrate *why* Shadow CFO is a collaborator, not just a tool.

The `AgentInsightCard` surfaces:
- What the AI found
- Why it flagged it (the specific transaction evidence)
- Its confidence score (transparent, not hidden)
- What it recommends, and exactly what will happen if approved

The "Why did I flag this?" accordion is the signature Agentic UX moment — the AI explains its reasoning before any button is pressed. This is **explanations as primary UI**, not footnotes.

### 3. The Trust Economy Moment
The biggest constraint in fintech is not features — it's trust. Users are handing over their financial data. This flow addresses every trust concern directly, in order:

- **Before connection:** Read-only, consent logged, Plaid-powered, revoke anytime
- **After connection:** AI explains evidence before acting
- **After fix:** Consent ledger entry shown inline, idempotency confirmed

Trust is not a feature. It is the experience.

### 4. Minimal Cognitive Load — One Decision Per Screen
Screen 1: *Which bank?* → One decision.  
Screen 2: *Fix this leak?* → One decision per card.

Progressive commitment: each micro-decision is low-stakes, reversible, and explained. The user never feels overwhelmed. "Skip" is always visible. "Undo" is possible. This follows the **Minimal Viable Commitment** principle.

### 5. The Irreversibility Trigger
Once a user sees "$347/month is bleeding out of your accounts," they cannot unsee it. This is the psychological hook: **loss aversion applied to real numbers from their real accounts**. The act of surfacing the first leak creates urgency that no generic CTA can manufacture.

---

## Agentic UX Patterns Implemented

### Proactive Surfacing
The AI speaks first. Before the user navigates anywhere, before any button is pressed — Shadow CFO has already been watching. The hero counter (`$347/mo`) is the AI broadcasting its findings unprompted.

### Explanation as Primary UI
The `AgentInsightCard` is built around the explanation, not the action. The "Why did I flag this?" button expands to show specific transaction evidence, merchant fingerprints, and date patterns. Users see the work the AI did, not just the conclusion.

### Confidence Score (Transparent Trust Signal)
Every insight shows a confidence bar (94%, 88%, etc.). High confidence = more actionable. Lower confidence = worth a closer look. This teaches users to calibrate trust over time, building a trust relationship with the AI.

### Trust Receipts
Every fix action writes to a visible consent ledger (shown inline at bottom of Screen 2). The ledger shows: category, amount, consent status, idempotency confirmation. This is the fintech version of a paper receipt.

### Reversible by Default
"Skip" appears on every card. "Fix This Now" is pre-planned — the AI has already worked out the details. The user's only job is to confirm or decline. If they change their mind, the action can be revoked.

### One-Click Accept
The full fix plan is already prepared. The AI has identified: what to cancel, what to keep, what saves money, what won't break anything. "Fix This Now" is a single approval, not a multi-step wizard.

---

## Accessibility Features

### Screen 1 — ConnectBankScreen
- All bank buttons are keyboard-accessible (`<button>` elements with focus states)
- Progress indicator uses aria context (step 1 of 2)
- Trust signals use icon + text (not icon-only)
- CTA disabled state has clear visual + semantic feedback
- Plaid badge uses semantic `<svg>` with accessible sizing

### Screen 2 — FirstLeakScreen
- AgentInsightCard "Why I flagged this" uses a `<button>` (not `<div>`) with keyboard toggle
- Confidence bar uses visible percentage text (not color-only signal)
- Skip always visible alongside Fix (never hidden)
- Ledger preview uses monospace font for data readability
- All interactive elements have 44px+ touch targets (mobile)
- AnimatePresence removes exited elements from DOM (not just opacity: 0)

---

## Color Theory Applied

| Moment | Color | Reasoning |
|--------|-------|-----------|
| Hero counter "$347/mo" | `--accent-cyan` + glow | Draws immediate eye focus; cyan = technology, intelligence |
| Leak card severity strip | `--accent-amber` | Amber = warning, urgency — not red (red = crisis, panic) |
| Confidence bar: 94% | `--accent-emerald` | Green = safe, validated, confirmed |
| Confidence bar: 78% | `--accent-amber` | Lower confidence = wariness |
| Fixed state | `--accent-emerald` | Positive completion, calming resolution |
| $SOLV rewards | `--accent-solv` (purple) | Premium, distinct from action colors |

---

## Visual Hierarchy — Screen 2

```
TITLE: "I found $54/mo leaking"       ← Display font, 30px, text-primary
  ↓
SUMMARY BAR: Leaks / Savings / Annual ← Mono font, accented values
  ↓
INSIGHT CARD: Title + Amount          ← Display font, amber amount stands out
  Category badge → Title → Amount     ← Scan order follows F-pattern
  AI Confidence bar                   ← Data after identity
  Agent reasoning quote               ← Italic, muted — context, not command
  "Why did I flag this?" toggle       ← Cyan — action affordance
  Evidence list (collapsible)         ← Mono font, data-dense but toggleable
  [Fix This Now →]  [Skip]            ← Primary CTA left, escape right
  ↓
LEDGER PREVIEW (after fix)            ← Mono font, muted — reassurance signal
```

---

## Typography Decisions

- **Headline ("I found $54/mo leaking"):** Space Grotesk 700 — authority + intelligence
- **Amount values ($34, $11, $9):** JetBrains Mono — data precision, financial context
- **Agent reasoning:** Inter 400 italic — conversational, not robotic
- **Category badge:** Inter 600 uppercase, 0.65rem — scannable label, not dominant
- **Confidence %:** JetBrains Mono 600 — data point, should feel precise
- **Trust signals / metadata:** Inter 400, `--text-muted` — present but not demanding attention

---

## Mobile Responsiveness

- Bank grid: `grid-cols-5` collapses naturally on small screens with 2.5rem cells
- AgentInsightCard: Single column, full width, no horizontal scroll
- CTA buttons: `flex-1` fills container, min `44px` touch target
- Trust signal row: `flex-wrap` with column stack on small viewports
- Progress step indicator: Absolute positioned, centered, always visible
- Ledger preview: Horizontal scroll on very small screens (mono data)

---

## Reference Design Influences

**Plaid.com:**
- Single-focus screens with one primary action
- Trust signals placed immediately before CTA
- No navigation during connection flow
- Clean dark/light contrast for bank logos

**Twelve Labs (twelvelabs.io):**
- Monospace + display font pairing for technical credibility
- Dark backgrounds with precise accent glow effects
- Explanation-first content blocks before action CTAs
- Confident copy that doesn't over-explain

---

*Document generated as part of the Shadow CFO frontend design system.*  
*Author: Shadow CFO Design System v1*  
*Date: April 2026*
