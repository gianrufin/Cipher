import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, Users, Smartphone, Eye, EyeOff, Sparkles, 
  Flame, CheckCircle2, ArrowRight, ArrowLeft, RotateCcw, 
  HelpCircle, Lightbulb, Play, Target, Clock, MessageSquare,
  Lock, Unlock, Zap
} from 'lucide-react';
import { playWhoosh, playTick, triggerHaptic } from '../utils/soundEffects';

interface GameOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const GameOnboarding: React.FC<GameOnboardingProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Interactive demo state for Step 1 (Hold to Reveal simulator)
  const [demoRevealed, setDemoRevealed] = useState(false);
  const [demoHoldProgress, setDemoHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);

  // Interactive demo state for Step 2 (Decoy vs Citizen comparison)
  const [selectedRoleTab, setSelectedRoleTab] = useState<'citizen' | 'imposter'>('citizen');

  const totalSteps = 5;

  const handleNext = () => {
    playWhoosh();
    triggerHaptic(20);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const handlePrev = () => {
    playWhoosh();
    triggerHaptic(15);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const finishOnboarding = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('cipher_has_completed_onboarding', 'true');
      } catch {
        // ignore
      }
    }
    onComplete();
  };

  // Interactive Hold Demo Handlers
  const startHoldDemo = () => {
    if (demoRevealed) return;
    setDemoHoldProgress(0);
    triggerHaptic(20);

    const startTime = Date.now();
    const duration = 600; // ms to unlock

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setDemoHoldProgress(progress);

      if (progress >= 100) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setDemoRevealed(true);
        triggerHaptic([40, 30, 80]);
      }
    }, 16);
  };

  const cancelHoldDemo = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setDemoHoldProgress(0);
    setDemoRevealed(false);
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const stepsData = [
    {
      title: 'Welcome to Cipher',
      tagline: '1 Phone • 0 App Installs • Total Social Deduction',
      icon: Users
    },
    {
      title: 'Anti-Peeking Privacy Shield',
      tagline: 'Secret Role Distribution on One Device',
      icon: Lock
    },
    {
      title: 'The Decoy Word Twist',
      tagline: 'Why Cipher is Unlike Other Games',
      icon: Sparkles
    },
    {
      title: 'The Clue Round & Bluffing',
      tagline: 'Give Just Enough Away — But Not Too Much',
      icon: MessageSquare
    },
    {
      title: 'Voting & The Last Stand',
      tagline: 'Unmask the Imposter or Lose Everything',
      icon: Target
    }
  ];

  return (
    <div className="w-full max-w-lg mx-auto min-h-[calc(100vh-65px)] flex flex-col justify-between p-4 pb-8 animate-fadeIn">
      {/* Top Bar: Progress & Skip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 font-mono text-xs font-bold border border-rose-500/30">
              {currentStep + 1}
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Tutorial {currentStep + 1} of {totalSteps}
            </span>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-900 transition-colors font-medium"
          >
            Skip to Game
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5 w-full">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                playTick();
                setCurrentStep(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                  : idx < currentStep
                  ? 'bg-emerald-500/80'
                  : 'bg-slate-800'
              }`}
              aria-label={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="my-auto py-4">
        {/* STEP 0: Welcome & The 1-Phone Circle */}
        {currentStep === 0 && (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 shadow-2xl shadow-rose-950/60 p-1">
              <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-slate-950/40 backdrop-blur-xs">
                <Users className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-md">
                <Smartphone className="h-4 w-4" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-rose-400">
                Face-to-Face Social Deduction
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-white mt-1">
                How to Play Cipher
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                Gather 3 to 16 players in a circle. You only need this <strong className="text-white">one phone</strong>. No apps to install and no accounts needed!
              </p>
            </div>

            {/* Quick 3-Pillar Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-left pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                <span className="font-mono text-[10px] text-rose-400 font-bold uppercase block mb-1">
                  01. Pass Phone
                </span>
                <p className="text-xs text-slate-300 leading-snug">
                  Players secretly view their identity one-by-one.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                <span className="font-mono text-[10px] text-amber-400 font-bold uppercase block mb-1">
                  02. Drop Clues
                </span>
                <p className="text-xs text-slate-300 leading-snug">
                  Go around the circle giving subtle 1-word or phrase clues.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase block mb-1">
                  03. Unmask
                </span>
                <p className="text-xs text-slate-300 leading-snug">
                  Vote out the imposters before they infiltrate!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Privacy Shield & Interactive Demo */}
        {currentStep === 1 && (
          <div className="space-y-5 text-center animate-fadeIn">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Lock className="h-7 w-7" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-rose-400">
                Interactive Demo
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
                The Hold-to-Reveal Shield
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                To prevent friends from peeking over your shoulder, your secret role is shielded until you press and hold. Try it right now!
              </p>
            </div>

            {/* Interactive Hold Practice Card */}
            <div className="p-4 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span className="font-mono">PLAYER: YOU</span>
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full">
                    PRACTICE DRILL
                  </span>
                </div>

                {!demoRevealed ? (
                  <div className="py-6 space-y-3">
                    <div className="flex justify-center">
                      <div className="h-12 w-12 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-slate-400">
                        <EyeOff className="h-6 w-6" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Role Hidden Behind Privacy Shield
                    </p>
                  </div>
                ) : (
                  <div className="py-5 space-y-2 animate-fadeIn bg-emerald-950/30 rounded-2xl border border-emerald-800/60 p-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      ROLE UNLOCKED
                    </span>
                    <h3 className="font-display text-2xl font-black text-white">
                      CITIZEN
                    </h3>
                    <div className="inline-block px-3 py-1 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 font-display font-bold text-base">
                      Secret Word: "Coffee"
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Release to lock it back down.
                    </p>
                  </div>
                )}

                {/* The Interactive Hold Button */}
                <button
                  type="button"
                  id="onboarding-hold-demo-btn"
                  onMouseDown={startHoldDemo}
                  onMouseUp={cancelHoldDemo}
                  onMouseLeave={cancelHoldDemo}
                  onTouchStart={startHoldDemo}
                  onTouchEnd={cancelHoldDemo}
                  className={`w-full py-3.5 px-4 rounded-2xl font-display font-black text-xs uppercase tracking-wider relative overflow-hidden transition-all select-none ${
                    demoRevealed
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
                  }`}
                >
                  {/* Progress Fill Indicator */}
                  {!demoRevealed && demoHoldProgress > 0 && (
                    <div
                      className="absolute inset-0 bg-white/20 transition-all duration-75 pointer-events-none"
                      style={{ width: `${demoHoldProgress}%` }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {demoRevealed ? (
                      <>
                        <Unlock className="h-4 w-4" />
                        <span>Shield Active (Release to Hide)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Press & Hold to Reveal (Practice)</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-900/60 p-2.5 rounded-xl">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Pro-tip: Always hold the phone close to your chest before revealing!</span>
            </div>
          </div>
        )}

        {/* STEP 2: The Decoy Word Twist */}
        {currentStep === 2 && (
          <div className="space-y-5 text-center animate-fadeIn">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="h-7 w-7" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-amber-400">
                The Core Innovation
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
                The Decoy Word System
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                In classic games, imposters know nothing and stay quiet. In Cipher, imposters receive a <strong className="text-white">subtly different decoy word</strong>!
              </p>
            </div>

            {/* Interactive Role Switcher Example */}
            <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    playTick();
                    setSelectedRoleTab('citizen');
                  }}
                  className={`flex-1 py-2 rounded-lg font-display text-xs font-bold uppercase transition-all ${
                    selectedRoleTab === 'citizen'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  What Citizens See
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTick();
                    setSelectedRoleTab('imposter');
                  }}
                  className={`flex-1 py-2 rounded-lg font-display text-xs font-bold uppercase transition-all ${
                    selectedRoleTab === 'imposter'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  What Imposters See
                </button>
              </div>

              {/* Card Preview */}
              {selectedRoleTab === 'citizen' ? (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/40 text-left space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                      Citizen Identity
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Majority</span>
                  </div>
                  <div className="font-display text-2xl font-black text-white">
                    "Espresso"
                  </div>
                  <p className="text-xs text-emerald-200/80 leading-relaxed">
                    You know the genuine secret word. Your goal is to give a clue that proves to other Citizens you belong, without revealing "Espresso" to the imposter!
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-950/30 border-2 border-rose-500/40 text-left space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
                      Imposter Identity (Decoy)
                    </span>
                    <span className="text-[10px] font-mono text-rose-300 font-bold">Infiltrator</span>
                  </div>
                  <div className="font-display text-2xl font-black text-white">
                    "Latte"
                  </div>
                  <p className="text-xs text-rose-200/80 leading-relaxed">
                    You think your word is the true one! You might say "milky" or "foamy" — and instantly realize everyone else is giving clues about strong black shots!
                  </p>
                </div>
              )}

              <p className="text-[11px] text-slate-400 italic">
                *Prefer total mystery? You can also toggle "Blind Phantom" mode in setup so imposters receive no word at all!
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Clue Round & Bluffing Strategy */}
        {currentStep === 3 && (
          <div className="space-y-5 text-center animate-fadeIn">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <MessageSquare className="h-7 w-7" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-sky-400">
                Face-to-Face Gameplay
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
                Giving Verbal Clues
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                Place the phone in the center of the table. The app shows the speaking turn order and built-in timer.
              </p>
            </div>

            {/* The Golden Rule Breakdown */}
            <div className="space-y-3 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Don't be too obvious</span>
                </div>
                <p className="text-xs text-slate-300 pl-4 leading-relaxed">
                  Saying <em>"It's brewed from roasted beans"</em> makes it way too easy for the Imposter to figure out your word!
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Don't be too obscure</span>
                </div>
                <p className="text-xs text-slate-300 pl-4 leading-relaxed">
                  Saying <em>"My cousin once touched this in 2014"</em> sounds suspicious and will get you voted out by innocent Citizens!
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-800/60 bg-emerald-950/20 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>The Sweet Spot</span>
                </div>
                <p className="text-xs text-emerald-200/90 pl-4 leading-relaxed">
                  Clever, associative clues that only someone with your word will nod along with!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: The Accusation & Last Stand */}
        {currentStep === 4 && (
          <div className="space-y-5 text-center animate-fadeIn">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Target className="h-7 w-7" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-rose-400">
                Endgame Drama
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
                The Imposter's Last Stand
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                When voting time arrives, everyone debates and points at a suspect. But catching the imposter isn't the end!
              </p>
            </div>

            {/* Last Stand Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-b from-amber-950/50 to-slate-900 border-2 border-amber-500/50 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Zap className="h-4 w-4" />
                  The Steal Mechanic
                </span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md">
                  High Stakes
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Even if the room successfully unmasks an Imposter, that Imposter gets <strong className="text-white">ONE FINAL GUESS</strong> at the Citizen secret word.
              </p>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-amber-200">
                🎯 <strong>If the Imposter guesses correctly:</strong> The Imposters immediately STEAL the victory! Keep your true word guarded until the very end.
              </div>
            </div>

            {/* Don't show again toggle */}
            <label className="flex items-center justify-center gap-2 text-xs text-slate-400 cursor-pointer pt-1 hover:text-slate-300">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500"
              />
              <span>Don't show tutorial automatically again</span>
            </label>
          </div>
        )}
      </div>

      {/* Bottom Controls: Back / Next / Finish */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              type="button"
              id="onboarding-prev-btn"
              onClick={handlePrev}
              className="flex items-center justify-center gap-1 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-display font-bold text-xs uppercase tracking-wider transition-colors active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          )}

          <button
            type="button"
            id="onboarding-next-btn"
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 hover:opacity-95 active:scale-[0.98] transition-all"
          >
            {currentStep === totalSteps - 1 ? (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Let's Play Cipher!</span>
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
