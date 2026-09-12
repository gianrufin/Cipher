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
      tagline: 'Give Just Enough Away, But Not Too Much',
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
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] text-rose-400 font-mono text-xs font-bold border border-white/[0.08]">
              {currentStep + 1}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Tutorial {currentStep + 1} of {totalSteps}
            </span>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/[0.04] transition-colors font-medium border border-transparent hover:border-white/[0.06]"
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
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'bg-rose-500'
                  : idx < currentStep
                  ? 'bg-emerald-500/70'
                  : 'bg-white/[0.08]'
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
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.1] shadow-xl p-1">
              <Users className="h-10 w-10 text-rose-400" />
              <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 shadow-md">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-rose-400">
                Face-to-Face Social Deduction
              </span>
              <h2 className="font-display text-3xl font-bold text-slate-100 mt-1">
                How to Play Cipher
              </h2>
              <p className="text-xs text-slate-300/90 mt-2 max-w-sm mx-auto leading-relaxed">
                Gather 4 to 16 players in a circle. You only need this <strong className="text-white">one phone</strong>. No accounts needed.
              </p>
            </div>

            {/* Quick 3-Pillar Cards */}
            <div className="grid grid-cols-3 gap-2 text-left pt-2">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="font-mono text-[9px] text-rose-400 font-bold uppercase block mb-1">
                  01. Pass
                </span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Players secretly view their identity one-by-one.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="font-mono text-[9px] text-amber-400 font-bold uppercase block mb-1">
                  02. Clues
                </span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Go around giving subtle 1-word or phrase clues.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="font-mono text-[9px] text-emerald-400 font-bold uppercase block mb-1">
                  03. Unmask
                </span>
                <p className="text-[11px] text-slate-300 leading-snug">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-rose-400 border border-white/[0.08]">
                <Lock className="h-6 w-6" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-rose-400">
                Interactive Practice
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-100 mt-0.5">
                The Touch Privacy Shield
              </h2>
              <p className="text-xs text-slate-300/90 mt-1 max-w-sm mx-auto leading-relaxed">
                To prevent friends from peeking over your shoulder, your secret role is shielded until you press and hold. Try it right now!
              </p>
            </div>

            {/* Interactive Hold Practice Card */}
            <div className="p-4 rounded-2xl bg-[#0c101a] border border-white/[0.08] shadow-xl relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/[0.08]">
                  <span className="font-mono text-[10px]">RECIPIENT: YOU</span>
                  <span className="text-[9px] uppercase font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    SIMULATION
                  </span>
                </div>

                {!demoRevealed ? (
                  <div className="py-6 space-y-2">
                    <div className="flex justify-center">
                      <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400">
                        <EyeOff className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Role Encrypted Under Touch Shield
                    </p>
                  </div>
                ) : (
                  <div className="py-4 space-y-2 animate-fadeIn bg-emerald-950/20 rounded-xl border border-emerald-500/20 p-3">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      ROLE DECRYPTED
                    </span>
                    <h3 className="font-display text-xl font-bold text-white">
                      CITIZEN
                    </h3>
                    <div className="inline-block px-3 py-1 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-300 font-display font-bold text-sm">
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
                  className={`w-full py-3.5 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider relative overflow-hidden transition-all select-none ${
                    demoRevealed
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
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
                        <Unlock className="h-3.5 w-3.5" />
                        <span>Shield Active (Release to Hide)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Press & Hold to Reveal (Practice)</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
              <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>Pro-tip: Hold the phone close to your chest before revealing!</span>
            </div>
          </div>
        )}

        {/* STEP 2: The Decoy Word Twist */}
        {currentStep === 2 && (
          <div className="space-y-5 text-center animate-fadeIn">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-amber-400 border border-white/[0.08]">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-amber-400">
                Core Innovation
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-100 mt-0.5">
                The Decoy Word System
              </h2>
              <p className="text-xs text-slate-300/90 mt-1 max-w-sm mx-auto leading-relaxed">
                In classic games, imposters know nothing and stay quiet. In Cipher, imposters receive a <strong className="text-white">subtly different decoy word</strong>!
              </p>
            </div>

            {/* Interactive Role Switcher Example */}
            <div className="p-4 rounded-2xl bg-[#0c101a] border border-white/[0.08] shadow-xl space-y-3">
              <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    playTick();
                    setSelectedRoleTab('citizen');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-display text-xs font-semibold transition-all ${
                    selectedRoleTab === 'citizen'
                      ? 'bg-emerald-600 text-white shadow-sm'
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
                  className={`flex-1 py-1.5 rounded-lg font-display text-xs font-semibold transition-all ${
                    selectedRoleTab === 'imposter'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  What Imposters See
                </button>
              </div>

              {/* Card Preview */}
              {selectedRoleTab === 'citizen' ? (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-left space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">
                      Citizen Secret
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">Majority</span>
                  </div>
                  <div className="font-display text-2xl font-bold text-white">
                    "Mango"
                  </div>
                  <p className="text-xs text-emerald-200/80 leading-relaxed">
                    You know the genuine secret word. Your goal is to give a clue that proves you belong, without revealing "Mango" to the imposter!
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-left space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono font-bold text-rose-400 uppercase">
                      Imposter Decoy
                    </span>
                    <span className="text-[9px] font-mono text-rose-300 font-bold">Infiltrator</span>
                  </div>
                  <div className="font-display text-2xl font-bold text-white">
                    "Banana"
                  </div>
                  <p className="text-xs text-rose-200/80 leading-relaxed">
                    You think your word is the true one! You might say "yellow" or "long", then realize everyone else is giving clues about a sweet fruit with one large seed.
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-sky-400 border border-white/[0.08]">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-sky-400">
                Gameplay Etiquette
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-100 mt-0.5">
                Giving Verbal Clues
              </h2>
              <p className="text-xs text-slate-300/90 mt-1 max-w-sm mx-auto leading-relaxed">
                Place the phone in the center of the table. The app guides the turn order and timer.
              </p>
            </div>

            {/* The Golden Rule Breakdown */}
            <div className="space-y-2.5 text-left">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <span>Don't be too obvious</span>
                </div>
                <p className="text-xs text-slate-300 pl-3.5 leading-relaxed">
                  Saying <em>"It's brewed from roasted beans"</em> makes it way too easy for the Imposter to deduce your word!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>Don't be too cryptic</span>
                </div>
                <p className="text-xs text-slate-300 pl-3.5 leading-relaxed">
                  Saying <em>"My cousin once touched this in 2014"</em> sounds suspicious and will get you voted out by innocent Citizens!
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>The Sweet Spot</span>
                </div>
                <p className="text-xs text-emerald-200/90 pl-3.5 leading-relaxed">
                  Clever, associative clues that only someone with your word will understand.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: The Accusation & Last Stand */}
        {currentStep === 4 && (
          <div className="space-y-5 text-center animate-fadeIn">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-rose-400 border border-white/[0.08]">
                <Target className="h-6 w-6" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-rose-400">
                Final Climax
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-100 mt-0.5">
                The Imposter's Last Stand
              </h2>
              <p className="text-xs text-slate-300/90 mt-1 max-w-sm mx-auto leading-relaxed">
                Large groups can eliminate two ranked suspects, but catching the final Imposter is not always the end.
              </p>
            </div>

            {/* Last Stand Card */}
            <div className="p-4 rounded-2xl bg-[#160c10] border border-amber-500/30 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span>The Steal Mechanic</span>
                </span>
                <span className="text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  High Stakes
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                After the final Imposter is caught, they must first identify any living Inspector. A correct read unlocks <strong className="text-white">ONE FINAL GUESS</strong> at the Citizen secret word.
              </p>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.08] text-xs text-amber-200">
                🎯 <strong>If the Imposter guesses correctly:</strong> The Imposters immediately STEAL the victory! Keep your true word guarded until the very end.
              </div>
            </div>

            {/* Don't show again toggle */}
            <label className="flex items-center justify-center gap-2 text-xs text-slate-400 cursor-pointer pt-1 hover:text-slate-300">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-white/[0.1] bg-slate-950 text-rose-600 focus:ring-rose-500"
              />
              <span>Don't show tutorial automatically again</span>
            </label>
          </div>
        )}
      </div>

      {/* Bottom Controls: Back / Next / Finish */}
      <div className="pt-4 border-t border-white/[0.08] space-y-2">
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              type="button"
              id="onboarding-prev-btn"
              onClick={handlePrev}
              className="flex items-center justify-center gap-1 py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-semibold text-xs transition-colors active:scale-[0.98]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            type="button"
            id="onboarding-next-btn"
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs uppercase tracking-wider shadow-md active:scale-[0.98] transition-all"
          >
            {currentStep === totalSteps - 1 ? (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Let's Play Cipher</span>
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
