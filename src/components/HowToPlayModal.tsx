import React from 'react';
import { X, Smartphone, EyeOff, MessageSquare, Vote, Sparkles, AlertTriangle } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#0c101a] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-rose-400" />
            <h2 className="font-display font-bold text-base text-slate-100">Rules & Mechanics</h2>
          </div>
          <button
            id="close-rules-btn"
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm leading-relaxed">
          {/* Step 1 */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wide">
              <Smartphone className="h-3.5 w-3.5" />
              <span>1. Single-Device Secret Pass</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Pass the device to each player in sequence. Each player holds down the touch shield to reveal their role and secret word in private.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wide">
              <EyeOff className="h-3.5 w-3.5" />
              <span>2. The Secret Roles & Words</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-2.5">
                <span className="font-bold text-emerald-300 block mb-0.5">Citizens:</span>
                All Citizens share the identical <strong>True Secret Word</strong> (e.g., "Espresso").
              </div>
              <div className="rounded-lg bg-rose-950/20 border border-rose-500/20 p-2.5">
                <span className="font-bold text-rose-300 block mb-0.5">Imposters:</span>
                In <strong>Decoy Mode</strong>, Imposters receive a subtly paired decoy word (e.g., "Latte"). In <strong>Blind Mode</strong>, they only know the category!
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wide">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>3. Face-to-Face Clues</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Players sit in a circle. In turn order, each person speaks ONE subtle clue about their word. Be clever: too obvious and the Imposter learns your word; too cryptic and you will look guilty.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wide">
              <Vote className="h-3.5 w-3.5" />
              <span>4. Voting & The Last Stand</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Debate openly and vote to eliminate a suspect. If an Imposter is eliminated, they get ONE final chance to guess the Citizens' true word and steal the game.
            </p>
          </div>

          {/* Unique Twist Highlights */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 flex gap-2.5 items-start">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <strong className="text-amber-300 block mb-0.5">The Decoy Word Advantage:</strong>
              With Decoy Words, imposters are active participants rather than silent observers, leading to hilarious misunderstandings and layered bluffing.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.08] p-4">
          <button
            id="got-it-rules-btn"
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98]"
          >
            Ready to Play
          </button>
        </div>
      </div>
    </div>
  );
};
