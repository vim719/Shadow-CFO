import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavBar from "@/components/layout/NavBar";
import HeroSection from "@/components/sections/HeroSection";
import RealWorldSection from "@/components/sections/RealWorldSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import TrustSection from "@/components/sections/TrustSection";
import SolvSection from "@/components/sections/SolvSection";
import FinalCTASection from "@/components/sections/FinalCTASection";
import ConnectBankScreen from "@/components/flow/ConnectBankScreen";
import FirstLeakScreen from "@/components/flow/FirstLeakScreen";
import SocialProofHero from "@/components/sections/SocialProofHero";

type View = "landing" | "connect" | "leak";

function App() {
  const [view, setView] = useState<View>("landing");

  const goTo = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (view === "connect") {
    return (
      <TooltipProvider>
        <ConnectBankScreen
          onContinue={() => goTo("leak")}
          onBack={() => goTo("landing")}
        />
      </TooltipProvider>
    );
  }

  if (view === "leak") {
    return (
      <TooltipProvider>
        <FirstLeakScreen
          onBack={() => goTo("connect")}
          onDone={() => goTo("landing")}
        />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="relative min-h-screen" style={{ background: "var(--bg-base)" }}>
        <NavBar onGetStarted={() => goTo("connect")} />
        <main>
          <SocialProofHero />
          <div id="audit-hero">
            <HeroSection onGetStarted={() => goTo("connect")} />
          </div>
          <RealWorldSection />
          <HowItWorksSection onGetStarted={() => goTo("connect")} />
          <TrustSection />
          <SolvSection />
          <FinalCTASection onGetStarted={() => goTo("connect")} />
        </main>
      </div>
    </TooltipProvider>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
