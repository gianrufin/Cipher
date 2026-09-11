import React from 'react';
import { X, Smartphone, EyeOff, MessageSquare, Vote, Sparkles, AlertTriangle } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-400" />
            <h2 className="font-display font-bold text-lg text-white">How to Play Cipher</h2>
          </div>
          <button
            id="close-rules-btn"
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm leading-relaxed">
          {/* Step 1 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <Smartphone className="h-4 w-4" />
              <span>1. Single-Phone Secret Pass</span>
            </div>
            <p className="text-slate-300 text-xs">
              Hand the phone to each player in turn. Each player holds down the privacy shield on screen to secretly view their role and secret word. Nobody else can see!
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <EyeOff className="h-4 w-4" />
              <span>2. The Secret Roles & Words</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-2.5">
                <span className="font-bold text-emerald-400 block mb-0.5">Citizens:</span>
                All Citizens receive the exact same <strong>True Secret Word</strong> (e.g., "Espresso").
              </div>
              <div className="rounded-lg bg-rose-950/40 border border-rose-800/40 p-2.5">
                <span className="font-bold text-rose-400 block mb-0.5">Imposters (1, 2, or 3):</span>
                In <strong>Decoy Mode</strong>, Imposters receive a subtly paired decoy word (e.g., "Americano"). In <strong>Blind Mode</strong>, they only know the category!
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-400 font-semibold">
              <MessageSquare className="h-4 w-4" />
              <span>3. Face-to-Face Clue Round</span>
            </div>
            <p className="text-slate-300 text-xs">
              Players sit in a circle. In turn order, each player says ONE clue related to their word.
              <br />
              <em className="text-slate-400 mt-1 block">
                Pro tip: Don't be too obvious or the Imposter will figure out your word! Don't be too vague or others will suspect you!
              </em>
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-semibold">
              <Vote className="h-4 w-4" />
              <span>4. Discussion, Vote & The Last Stand</span>
            </div>
            <p className="text-slate-300 text-xs">
              Debate face-to-face and vote on who to eliminate.
              <br />
              <strong className="text-white mt-1 block">The Imposter's Revenge:</strong> If an Imposter is eliminated, they get ONE guess at the Citizens' true word! If they guess correctly, Imposters steal the win!
            </p>
          </div>

          {/* Unique Twist Highlights */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2.5 items-start">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <strong className="text-amber-300 block mb-0.5">Why this is different:</strong>
              With <strong>Decoy Words</strong>, even the Imposters believe their word might be real at first until they hear other clues! It creates hilarious misunderstandings and genuine social deduction.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4">
          <button
            id="got-it-rules-btn"
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-semibold text-sm shadow-md hover:from-rose-500 hover:to-amber-500 transition-all active:scale-[0.98]"
          >
            Got it, let's play!
          </button>
        </div>
      </div>
    </div>
  );
};
