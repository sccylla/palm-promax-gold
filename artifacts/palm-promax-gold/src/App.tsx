import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoldLogo } from "@/components/ui/gold-logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

type Stage = "splash" | "hero";

// ─── Background ───────────────────────────────────────────────────────────────
// 19 individual column tiles in a flex row.
// Piano animation: each column brightens in sequence left→right→left via
// CSS filter:brightness keyframes, one per column.

const BASE  = import.meta.env.BASE_URL;
const N_COL = 19;
const TILES = Array.from({ length: N_COL }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `${BASE}col-${n}.png`;
});

function PianoStyles() {
  // Narrow bright beam sweeps top → bottom → top inside each column.
  // Uses `top` (not translateY%) so positions are relative to the parent,
  // making the math exact regardless of beam height.
  // Each column is staggered by a tiny delay to create a gentle ripple.
  // Each column gets its own speed and a fully scattered start offset so they
  // all run independently — no wave, no waiting, pure organic motion.
  const keyframes = `
@keyframes pianoBeam {
  0%   { top: -95%; opacity: 0;    }
  10%  { top: -80%; opacity: 0.28; }
  90%  { top: 100%; opacity: 0.18; }
  100% { top: 100%; opacity: 0;    }
}`;

  // Golden-ratio scatter gives maximally spread, non-repeating delays.
  const PHI = 1.6180339887;
  const perCol = Array.from({ length: N_COL }, (_, i) => {
    const speed = (6.0 + ((i * 1.3) % 4.5)).toFixed(1);   // 6.0 – 10.5 s
    const delay = -((i * PHI * 3.7) % 12).toFixed(2);     // negative = start mid-cycle
    return `.beam-${i}{animation:pianoBeam ${speed}s ease-in-out ${delay}s infinite alternate;}`;
  }).join("\n");

  return <style dangerouslySetInnerHTML={{ __html: keyframes + "\n" + perCol }} />;
}

function Background() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        zIndex: 0,
        background: "#000000",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
      }}
    >
      <PianoStyles />

      {/* 19 column tiles — each gets its own vertical beam */}
      {TILES.map((src, i) => (
        <div
          key={i}
          style={{
            flex: "1 1 0",
            height: "100%",
            position: "relative",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <img
            src={src}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              display: "block",
            }}
          />
          {/* Gold drip — bright head at top, fading golden tail below */}
          <div
            className={`beam-${i}`}
            style={{
              position: "absolute",
              top: "-95%",
              left: 0,
              right: 0,
              height: "95%",
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(237,167,40,0.18) 20%, rgba(237,167,40,0.55) 50%, rgba(237,167,40,0.18) 80%, transparent 100%)",
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        </div>
      ))}

      {/* Bottom-left gold ellipse glow — subtle corner accent */}
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-8%",
          width: "38%",
          paddingBottom: "38%",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 5,
          background: "radial-gradient(circle, rgba(237,167,40,0.28) 0%, rgba(237,167,40,0.12) 45%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      {/* Top-right gold ellipse glow — subtle corner accent */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-8%",
          width: "38%",
          paddingBottom: "38%",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 5,
          background: "radial-gradient(circle, rgba(237,167,40,0.22) 0%, rgba(237,167,40,0.08) 45%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />
    </div>
  );
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      key="splash"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "#000000" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: "easeInOut" }}
    >
      {/* Gold glow behind logo */}
      <motion.div
        className="absolute"
        style={{
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.4, ease: "easeOut", delay: 0.4 }}
      />
      {/* Logo fades + scales in */}
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
      >
        <GoldLogo className="w-48 h-48 relative z-10" />
      </motion.div>
    </motion.div>
  );
}

// Smooth cursor-tracking spring values shared across hero/main
function useCursor() {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 48, damping: 18, restDelta: 0.001 });
  const y = useSpring(rawY, { stiffness: 48, damping: 18, restDelta: 0.001 });
  useEffect(() => {
    const move = (e: MouseEvent) => {
      rawX.set((e.clientX / window.innerWidth  - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return { x, y };
}

function HeroSection() {
  const { x, y } = useCursor();
  // Background drifts with cursor; content drifts the opposite way (depth illusion)
  const bgX = useTransform(x, [-1, 1], [-22, 22]);
  const bgY = useTransform(y, [-1, 1], [-12, 12]);
  const fgX = useTransform(x, [-1, 1],  [9, -9]);
  const fgY = useTransform(y, [-1, 1],  [5, -5]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Background layer — oversized so parallax shift never clips */}
      <motion.div style={{ position: "absolute", inset: "-5%", x: bgX, y: bgY, willChange: "transform" }}>
        <Background />
      </motion.div>

      {/* Nav — stays anchored */}
      <nav className="relative z-10 w-full px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoldLogo className="w-12 h-12 logo-pulse" />
          <span className="text-sm font-semibold tracking-[0.18em] text-white/90 uppercase" style={{ fontFamily: "'PT Serif', serif" }}>
            Palm Promax <span className="gold-text-nav">GOLD</span>
          </span>
        </div>
        <a href="#access"
          className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 text-white/70 text-sm tracking-widest uppercase hover:border-[#EDA728]/50 hover:text-[#EDA728] transition-all duration-300"
          style={{ fontFamily: "'Afacad Flux', sans-serif" }}
          onClick={(e) => { e.preventDefault(); document.dispatchEvent(new WheelEvent("wheel", { deltaY: 50 })); window.dispatchEvent(new WheelEvent("wheel", { deltaY: 50 })); }}>
          Request Access
        </a>
      </nav>

      {/* Hero content floats counter to background */}
      <motion.div
        style={{ x: fgX, y: fgY, willChange: "transform" }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6"
      >
        <GoldLogo className="w-20 h-20 md:w-28 md:h-28 mx-auto opacity-90 mb-6 md:mb-10" />
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-[-0.01em] leading-[1.05]" style={{ fontFamily: "'PT Serif', serif" }}>
          <span className="gold-text">The New</span>
          <br />
          <span className="gold-text">Gold Standard</span>
        </h1>
      </motion.div>

    </div>
  );
}

function MainSection({ entered }: { entered: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (email) setSubmitted(true); };

  // Subtle cursor parallax on background only (not content — form shouldn't jitter)
  const { x, y } = useCursor();
  const bgX = useTransform(x, [-1, 1], [-14, 14]);
  const bgY = useTransform(y, [-1, 1], [-8,   8]);

  // Shared spring for every element slamming in
  const spring = { type: "spring" as const, stiffness: 380, damping: 28 };
  const a = (delay: number) => ({
    initial: { opacity: 0 } as const,
    animate: entered ? { opacity: 1 } : { opacity: 0 },
    transition: { duration: 0.5, delay },
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
      className="w-full text-foreground font-sans">
      {/* Background drifts with cursor, oversized to prevent clip */}
      <motion.div style={{ position: "absolute", inset: "-4%", x: bgX, y: bgY, willChange: "transform" }}>
        <Background />
      </motion.div>

      {/* Nav drops from above */}
      <motion.nav
        className="relative z-10 w-full px-8 py-6 flex items-center justify-between"
        initial={{ y: -80, opacity: 0 }}
        animate={entered ? { y: 0, opacity: 1 } : {}}
        transition={{ ...spring, delay: 0.05 }}
      >
        <div className="flex items-center gap-3">
          <GoldLogo className="w-12 h-12 logo-pulse" />
          <span className="text-sm font-semibold tracking-[0.18em] text-white/90 uppercase" style={{ fontFamily: "'PT Serif', serif" }}>
            Palm Promax <span className="gold-text-nav">GOLD</span>
          </span>
        </div>
      </motion.nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-6 pb-4 md:pb-6 w-full overflow-y-auto">
        {!submitted ? (
          <div className="w-full max-w-lg flex flex-col items-center text-center">
            {/* Logo spins + scales in */}
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={entered ? { scale: 1, rotate: 0, opacity: 1 } : {}}
              transition={{ ...spring, delay: 0.12 }}
            >
              <GoldLogo className="w-20 h-20 md:w-28 md:h-28 mb-6 md:mb-8" />
            </motion.div>

            {/* "Get" flies from left, "Early Access" from right */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-[-0.01em] leading-[1.08] mb-4 overflow-hidden" style={{ fontFamily: "'PT Serif', serif" }}>
              <motion.span
                className="inline-block gold-text"
                initial={{ x: -120, opacity: 0 }}
                animate={entered ? { x: 0, opacity: 1 } : {}}
                transition={{ ...spring, delay: 0.22 }}
              >Get</motion.span>
              {" "}
              <motion.span
                className="inline-block gold-text"
                initial={{ x: 120, opacity: 0 }}
                animate={entered ? { x: 0, opacity: 1 } : {}}
                transition={{ ...spring, delay: 0.28 }}
              >Early Access</motion.span>
            </h1>

            {/* Thin gold divider */}
            <motion.div className="w-12 h-px bg-gradient-to-r from-transparent via-[#EDA728]/40 to-transparent mb-8" {...a(0.35)} />

            {/* Form blasts up from below */}
            <motion.form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-3"
              initial={{ y: 80, opacity: 0, scale: 0.94 }}
              animate={entered ? { y: 0, opacity: 1, scale: 1 } : {}}
              transition={{ ...spring, delay: 0.38 }}
            >
              <Input type="email" placeholder="Your Email Address" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/4 border-white/10 h-14 rounded-xl focus-visible:ring-[#EDA728]/40 focus-visible:border-[#EDA728]/50 text-white placeholder:text-white/50 text-base px-5 tracking-wide" required />
              <Button type="submit"
                style={{ background: "linear-gradient(135deg, #C8860A 0%, #EDA728 45%, #FEE4B3 75%, #EDA728 100%)", backgroundSize: "200% 100%", fontFamily: "'PT Serif', serif" }}
                className="h-14 text-[#0d0c0b] font-semibold text-base rounded-xl border-none tracking-widest uppercase shadow-[0_4px_32px_rgba(237,167,40,0.22)] hover:shadow-[0_4px_48px_rgba(237,167,40,0.40)] transition-all duration-300">
                Join The Gold Letter
              </Button>
            </motion.form>

            {/* Subtext fades in last */}
            <motion.p className="text-[19px] font-medium text-white/70 mt-6 leading-relaxed max-w-md tracking-wide" style={{ fontFamily: "'Afacad Flux', sans-serif" }} {...a(0.62)}>
              By joining the founders list, you gain early access to Palm Promax Gold's institutional channel. Members receive launch briefings and direct contact with our investor relations team.
            </motion.p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
            {/* Verified ring animation */}
            <div className="relative mb-8">
              <motion.div
                className="absolute inset-0 rounded-full border border-[#EDA728]/30"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
              <GoldLogo className="w-20 h-20 md:w-28 md:h-28 relative z-10" />
            </div>
            <h1 className="text-5xl md:text-6xl font-normal mb-5 gold-text" style={{ fontFamily: "'PT Serif', serif" }}>You're In</h1>
            <p className="text-[18px] font-medium text-white/85 max-w-md mx-auto leading-relaxed mb-8 tracking-wide" style={{ fontFamily: "'Afacad Flux', sans-serif" }}>
              Welcome to the founders list. You'll be the first to receive our launch access, white paper, AMA invitations, and listing alerts. Watch your inbox.
            </p>
            <Button variant="outline" onClick={() => setSubmitted(false)}
              className="h-11 px-7 rounded-full border-white/12 text-white/55 hover:bg-white/5 hover:text-white/80 text-[15px] tracking-widest uppercase transition-all">
              Back to Home
            </Button>
            <div className="mt-auto pt-12 w-full">
              <p className="text-[15px] font-medium uppercase tracking-[0.2em] text-white/75 mb-4" style={{ fontFamily: "'Afacad Flux', sans-serif" }}>Backed &amp; Integrated By</p>
              {/* Marquee: overflow hidden mask + doubled track that oscillates */}
              <div className="w-full overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)" }}>
                <div className="logo-marquee-track flex gap-3 w-max">
                  {[...Array(4)].flatMap((_, pass) =>
                    [
                      { src: "/partner-un.svg",          alt: "United Nations" },
                      { src: "/partner-deloitte-transparent.png", alt: "Deloitte"  },
                      { src: "/partner-palmglobal.png",  alt: "Palm Global"    },
                      { src: "/partner-sumsub.png",      alt: "Sumsub"         },
                      { src: "/partner-morpho-final.png", alt: "Morpho"        },
                      { src: "/partner-b.png",           alt: "Binance"        },
                      { src: "/partner-metamask.svg",    alt: "MetaMask"       },
                      { src: "/partner-uniswap.svg",     alt: "Uniswap"        },
                    ].map(({ src, alt }) => (
                      <div
                        key={`${pass}-${alt}`}
                        className="flex-shrink-0 w-[90px] h-[64px] md:w-[110px] md:h-[76px] rounded-xl flex items-center justify-center overflow-hidden"
                        style={{ background: "#111111", padding: alt === "Deloitte" ? "2px" : "10px" }}
                      >
                        <img src={src} alt={alt} className="max-w-full max-h-full object-contain" style={alt === "Deloitte" ? { transform: "scale(1.7)" } : {}} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer slides up */}
      {!submitted && (
        <motion.footer className="relative z-10 w-full px-8 pb-6 text-center" {...a(0.75)}>
          <p className="text-[14px] font-light text-white/45 leading-relaxed w-full max-w-xl mx-auto px-2" style={{ fontFamily: "'Afacad Flux', sans-serif" }}>
            Palm Promax Gold ($PPG) is FCA registered, 1:1 gold backed token built for the way value should move in the digital era. Each token is backed by physical gold held under ADGM/FSRA regulations, with independent transaction oversight from Digital RFQ Limited. No team allocations. No speculative supply. Just gold, on-chain, on your terms.
          </p>
        </motion.footer>
      )}
    </div>
  );
}

// ─── Smooth + Dramatic transition — GPU-only (transform + opacity only) ────────
// Phase "hero"  → hero visible, cursor parallax active
// Phase "flash" → gold radial blast covers screen; hero unmounts invisibly beneath
// Phase "main"  → flash fades out; main slams up with spring; content staggers in
// Shockwave ring runs as a pure scale transform — always GPU-composited.
// NO filter animations anywhere — they are CPU-rendered and cause jank.

type Phase = "hero" | "main";

function ScrollPages() {
  const [phase,    setPhaseState] = useState<Phase>("hero");
  const [mainIn,   setMainIn]     = useState(false);
  const phaseRef   = useRef<Phase>("hero");
  const cooldown   = useRef(false);

  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p); };

  const goToMain = () => {
    if (cooldown.current || phaseRef.current === "main") return;
    cooldown.current = true;
    setPhase("main");
    setTimeout(() => setMainIn(true),          160);
    setTimeout(() => { cooldown.current = false; }, 900);
  };

  const goToHero = () => {
    if (cooldown.current || phaseRef.current === "hero") return;
    cooldown.current = true;
    setMainIn(false);
    setPhase("hero");
    setTimeout(() => { cooldown.current = false; }, 900);
  };

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 10)  goToMain();
      if (e.deltaY < -10) goToHero();
    };
    let ty = 0;
    const onTS = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    const onTE = (e: TouchEvent) => {
      const d = ty - e.changedTouches[0].clientY;
      if (d >  30) goToMain();
      if (d < -30) goToHero();
    };
    window.addEventListener("wheel",      onWheel, { passive: true });
    window.addEventListener("touchstart", onTS,    { passive: true });
    window.addEventListener("touchend",   onTE,    { passive: true });
    return () => {
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchend",   onTE);
    };
  }, []);

  const spring = { type: "spring" as const, stiffness: 300, damping: 32 };

  return (
    <motion.div
      key="pages"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.0 }}
      style={{ position: "fixed", inset: 0, overflow: "hidden" }}
    >
      {/* ── Hero always lives underneath ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <HeroSection />
      </div>

      {/* ── Main slides up over hero; exits back down ── */}
      <AnimatePresence>
        {phase === "main" && (
          <motion.div
            key="main"
            style={{ position: "absolute", inset: 0, zIndex: 20, willChange: "transform" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring}
          >
            <MainSection entered={mainIn} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AppContent() {
  const [stage, setStage] = useState<Stage>("splash");

  return (
    <AnimatePresence mode="wait">
      {stage === "splash" && (
        <SplashScreen key="splash" onDone={() => setStage("hero")} />
      )}
      {stage === "hero" && <ScrollPages key="pages" />}
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
