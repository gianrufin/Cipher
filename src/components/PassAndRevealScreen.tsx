import React, { useState, useRef } from 'react';
import { 
  Smartphone, Eye, EyeOff, Shield, AlertTriangle, 
  Sparkles, CheckCircle, ArrowRight, Lock, Unlock, Flame
} from 'lucide-react';
import { Player, GameMode } from '../types';
import { playReveal, playWhoosh, triggerHaptic } from '../utils/soundEffects';

interface PassAndRevealScreenProps {
  players: Player[];
  currentIndex: number;
  mode: GameMode;
  categoryName: string;
  accomplicesAware: boolean;
  onNextPlayer: () => void;
  onFinishPass: () => void;
}

export const PassAndRevealScreen: React.FC<PassAndRevealScreenProps> = ({
  players,
  currentIndex,
  mode,
  categoryName,
  accomplicesAware,
  onNextPlayer,
  onFinishPass
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPlayer = players[currentIndex];
  const isLastPlayer = currentIndex === players.length - 1;

  // Find fellow imposters if accomplice awareness is enabled
  const fellowImposters = players.filter(
    p => p.role === 'imposter' && p.id !== currentPlayer.id
  );

  const startHold = () => {
    if (isRevealed) return;
    triggerHaptic(30);

    let progress = 0;
    const interval = 25;
    const step = 100 / (400 / interval); // 400ms hold

    holdTimerRef.current = setInterval(() => {
      progress += step;
      if (progress >= 100) {
        clearInterval(holdTimerRef.current!);
        setIsRevealed(true);
        setHasViewed(true);
        playReveal();
        triggerHaptic([40, 50, 60]);
      } else {
        setHoldProgress(progress);
      }
    }, interval);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const handleManualToggle = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      setHasViewed(true);
      playReveal();
      triggerHaptic([40, 50, 60]);
    } else {
      setIsRevealed(false);
      triggerHaptic(20);
    }
  };

  const handleProceed = () => {
    setIsRevealed(false);
    setHasViewed(false);
    setHoldProgress(0);
    playWhoosh();
    triggerHaptic(30);

    if (isLastPlayer) {
      onFinishPass();
    } else {
      onNextPlayer();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-[80vh] flex flex-col justify-between py-6 px-4">
      {/* Top Pass Breadcrumb */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>PLAYER {currentIndex + 1} OF {players.length}</span>
          <span className="text-rose-400 font-bold">CONFIDENTIAL</span>
        </div>
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / players.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Center Pass or Reveal Area */}
      <div className="my-auto py-6">
        {!isRevealed ? (
          /* Privacy Shield Screen */
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl shadow-rose-950/20">
                <Smartphone className="h-12 w-12 text-rose-400 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-md">
                <Lock className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">
                Hand the phone to
              </p>
              <h2 className="font-display text-3xl font-black text-white tracking-tight">
                {currentPlayer.name}
              </h2>
              <div className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2.5 py-1 rounded-full mt-2">
                <AlertTriangle className="h-3 w-3" />
                <span>Make sure nobody is looking at the screen!</span>
              </div>
            </div>

            {/* Hold to Reveal Touch Target */}
            <div className="w-full pt-4">
              <button
                id="hold-reveal-secret-btn"
                type="button"
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                onClick={handleManualToggle}
                className="relative w-full py-6 px-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-rose-600/40 hover:border-rose-500 text-white shadow-xl active:scale-[0.98] transition-all overflow-hidden flex flex-col items-center justify-center gap-2 group cursor-pointer"
              >
                {/* Hold Progress Bar Overlay */}
                {holdProgress > 0 && (
                  <div
                    className="absolute inset-0 bg-rose-600/30 transition-all pointer-events-none"
                    style={{ height: `${holdProgress}%` }}
                  />
                )}

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 group-hover:scale-110 transition-transform">
                  <Eye className="h-6 w-6" />
                </div>
                <div className="z-10 text-center">
                  <span className="font-display font-black text-base text-white block">
                    TAP OR HOLD TO REVEAL
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Hold privately against your chest or hand
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Secret Unlocked Reveal Card */
          <div className="flex flex-col items-center text-center space-y-5 animate-fadeIn">
            {/* Role Header Badge */}
            {currentPlayer.role === 'citizen' ? (
              <div className="w-full rounded-2xl bg-gradient-to-b from-emerald-950/80 to-slate-900 border-2 border-emerald-500/60 p-5 shadow-2xl shadow-emerald-950/30">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                  <Shield className="h-3.5 w-3.5" />
                  <span>CITIZEN</span>
                </div>

                <div className="space-y-1 mb-4">
                  <span className="text-xs uppercase font-mono text-slate-400 block">
                    Category: {categoryName}
                  </span>
                  <span className="text-xs text-slate-400">Your True Secret Word:</span>
                  <div className="font-display text-3xl sm:text-4xl font-black text-white tracking-wide py-2 bg-slate-950/60 rounded-xl border border-emerald-800/40">
                    "{currentPlayer.secretWord}"
                  </div>
                </div>

                <p className="text-xs text-emerald-200/90 leading-relaxed bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/40">
                  All fellow Citizens hold this exact word. There {players.filter(p => p.role === 'imposter').length > 1 ? 'are imposters' : 'is an imposter'} trying to blend in!
                </p>
              </div>
            ) : (
              /* Imposter Reveal */
              <div className="w-full rounded-2xl bg-gradient-to-b from-rose-950/90 to-slate-900 border-2 border-rose-500/80 p-5 shadow-2xl shadow-rose-950/40">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/60 text-xs font-mono font-bold uppercase tracking-wider mb-3 animate-pulse">
                  <Flame className="h-3.5 w-3.5 text-rose-400" />
                  <span>IMPOSTER</span>
                </div>

                <div className="space-y-1 mb-4">
                  <span className="text-xs uppercase font-mono text-slate-400 block">
                    Category: {categoryName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {mode === 'decoy' ? 'Your Decoy Word:' : 'Your Secret Status:'}
                  </span>

                  <div className="font-display text-3xl sm:text-4xl font-black text-rose-200 tracking-wide py-2 bg-slate-950/60 rounded-xl border border-rose-800/60">
                    {mode === 'decoy' ? `"${currentPlayer.secretWord}"` : 'NO WORD (BLIND)'}
                  </div>
                </div>

                <div className="text-xs text-rose-200/90 leading-relaxed bg-rose-950/50 p-2.5 rounded-lg border border-rose-900/50 text-left space-y-1">
                  {mode === 'decoy' ? (
                    <>
                      <p>
                        <strong>Mission:</strong> You have a <em>DECOY</em> word! Citizens have a subtly different word in the same category.
                      </p>
                      <p className="text-[11px] text-rose-300">
                        Blend in with confident clues, figure out what the Citizens have, and avoid getting voted out!
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Mission:</strong> You are the Phantom! You have NO word.
                      </p>
                      <p className="text-[11px] text-rose-300">
                        Listen carefully to other players' clues, sound convincing, and deflect suspicion!
                      </p>
                    </>
                  )}

                  {/* Fellow Imposters if known */}
                  {accomplicesAware && fellowImposters.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-rose-900/60 text-amber-300 text-xs font-semibold">
                      Your fellow accomplice(s): {fellowImposters.map(f => f.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Hide Button to protect from wandering eyes */}
            <button
              type="button"
              onClick={() => setIsRevealed(false)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Hide word immediately</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action: Proceed to next player */}
      <div className="pt-4 border-t border-slate-800/80">
        <button
          id="confirm-memorized-pass-btn"
          type="button"
          disabled={!hasViewed}
          onClick={handleProceed}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
            hasViewed
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:from-rose-500 hover:to-amber-500 active:scale-[0.98]'
              : 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
          }`}
        >
          {isLastPlayer ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>I've Memorized It — Begin Face-to-Face Round!</span>
            </>
          ) : (
            <>
              <span>I've Memorized It — Pass to Next Player</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {!hasViewed && (
          <p className="text-[11px] text-center text-slate-500 mt-2">
            You must reveal your word before passing the phone.
          </p>
        )}
      </div>
    </div>
  );
};
