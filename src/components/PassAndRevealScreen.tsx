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
    <div className="w-full max-w-md mx-auto min-h-[80vh] flex flex-col justify-between py-5 px-4">
      {/* Top Pass Breadcrumb */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="tracking-wider uppercase">PLAYER {currentIndex + 1} OF {players.length}</span>
          <span className="text-rose-400 font-semibold tracking-widest">CLASSIFIED</span>
        </div>
        <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
          <div
            className="bg-rose-500 h-full transition-all duration-300 rounded-full"
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
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0c101a] border border-white/[0.1] shadow-2xl">
                <Smartphone className="h-10 w-10 text-rose-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-white/[0.1] text-amber-400">
                <Lock className="h-3 w-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-mono">
                Hand the device to
              </p>
              <h2 className="font-display text-3xl font-bold text-slate-100 tracking-tight">
                {currentPlayer.name}
              </h2>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/[0.03] border border-white/[0.08] px-3 py-1 rounded-full mt-2">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span>Keep screen private from other players</span>
              </div>
            </div>

            {/* Hold to Reveal Touch Target */}
            <div className="w-full pt-2">
              <button
                id="hold-reveal-secret-btn"
                type="button"
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                onClick={handleManualToggle}
                className="relative w-full py-7 px-5 rounded-2xl bg-[#0c101a] border border-white/[0.1] hover:border-white/[0.2] text-white shadow-xl active:scale-[0.99] transition-all overflow-hidden flex flex-col items-center justify-center gap-2.5 group cursor-pointer"
              >
                {/* Hold Progress Bar Overlay */}
                {holdProgress > 0 && (
                  <div
                    className="absolute inset-0 bg-rose-600/20 transition-all pointer-events-none"
                    style={{ height: `${holdProgress}%` }}
                  />
                )}

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-rose-400 border border-white/[0.08] group-hover:scale-105 transition-transform">
                  <Eye className="h-5 w-5" />
                </div>
                <div className="z-10 text-center">
                  <span className="font-display font-bold text-sm tracking-wide text-slate-100 block">
                    TAP OR HOLD TO REVEAL
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Tilt away from others before revealing
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Secret Unlocked Reveal Card */
          <div className="flex flex-col items-center text-center space-y-4 animate-fadeIn">
            {/* Role Header Badge */}
            {currentPlayer.role === 'citizen' ? (
              <div className="w-full rounded-2xl bg-[#0a1410] border border-emerald-500/30 p-5 shadow-2xl space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Shield className="h-3 w-3" />
                  <span>CITIZEN</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-mono text-slate-400 block tracking-wider">
                    Category: {categoryName}
                  </span>
                  <span className="text-xs text-slate-400">Your Secret Word:</span>
                  <div className="font-display text-3xl font-bold text-white tracking-wide py-3 px-4 bg-slate-950/70 rounded-xl border border-emerald-500/20 my-2">
                    {currentPlayer.secretWord}
                  </div>
                </div>

                <p className="text-xs text-emerald-200/80 leading-relaxed bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/30 text-left">
                  All fellow Citizens hold this exact word. One or more imposters have a different word and will try to deceive you!
                </p>
              </div>
            ) : (
              /* Imposter Reveal */
              <div className="w-full rounded-2xl bg-[#160c10] border border-rose-500/30 p-5 shadow-2xl space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Flame className="h-3 w-3 text-rose-400" />
                  <span>IMPOSTER</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-mono text-slate-400 block tracking-wider">
                    Category: {categoryName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {mode === 'decoy' ? 'Your Decoy Word:' : 'Your Secret Status:'}
                  </span>

                  <div className="font-display text-3xl font-bold text-rose-200 tracking-wide py-3 px-4 bg-slate-950/70 rounded-xl border border-rose-500/20 my-2">
                    {mode === 'decoy' ? currentPlayer.secretWord : 'NO WORD (PHANTOM)'}
                  </div>
                </div>

                <div className="text-xs text-rose-200/80 leading-relaxed bg-rose-950/30 p-3 rounded-lg border border-rose-900/30 text-left space-y-1.5">
                  {mode === 'decoy' ? (
                    <>
                      <p>
                        <strong className="text-rose-200">Mission:</strong> You received a <em>DECOY</em> word. Citizens hold a closely related counterpart.
                      </p>
                      <p className="text-[11px] text-rose-300/80">
                        Give clues that sound natural, detect the real word, and avoid elimination.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong className="text-rose-200">Mission:</strong> You are the Phantom with NO word.
                      </p>
                      <p className="text-[11px] text-rose-300/80">
                        Listen carefully to other players, deduce the topic, and bluff your way through.
                      </p>
                    </>
                  )}

                  {accomplicesAware && fellowImposters.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-rose-900/40 text-amber-300/90 text-xs font-semibold">
                      Accomplice(s): {fellowImposters.map(f => f.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Hide Button to protect from wandering eyes */}
            <button
              type="button"
              onClick={() => setIsRevealed(false)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Conceal screen immediately</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action: Proceed to next player */}
      <div className="pt-4 border-t border-white/[0.08]">
        <button
          id="confirm-memorized-pass-btn"
          type="button"
          disabled={!hasViewed}
          onClick={handleProceed}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
            hasViewed
              ? 'bg-rose-600 hover:bg-rose-500 text-white active:scale-[0.98]'
              : 'bg-white/[0.04] text-slate-600 border border-white/[0.06] cursor-not-allowed'
          }`}
        >
          {isLastPlayer ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Memorized — Start Discussion Round</span>
            </>
          ) : (
            <>
              <span>Memorized — Pass to Next Player</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {!hasViewed && (
          <p className="text-[11px] text-center text-slate-500 mt-2">
            Reveal your word before passing the device.
          </p>
        )}
      </div>
    </div>
  );
};
