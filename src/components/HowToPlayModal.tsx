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
              Add a name and take a fresh in-app selfie for every player, then pass the device in sequence. Selfies stay in memory only and are erased at the result screen. Each player holds down the touch shield to reveal their role and secret word in private.
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
                All Citizens share the identical <strong>True Secret Word</strong> (e.g., "Mango").
              </div>
              <div className="rounded-lg bg-rose-950/20 border border-rose-500/20 p-2.5">
                <span className="font-bold text-rose-300 block mb-0.5">Imposters:</span>
                In <strong>Decoy Mode</strong>, Imposters receive a familiar paired word (e.g., "Banana"). In <strong>Blind Mode</strong>, they only know the category!
              </div>
              <div className="rounded-lg bg-amber-950/20 border border-amber-500/20 p-2.5">
                <span className="font-bold text-amber-300 block mb-0.5">Decoy Citizen (Optional Twist):</span>
                A Decoy Citizen appears to be a normal Citizen and unknowingly receives the alternate word. They still win with Citizens, but their honest clues may distract the table. Choose up to two when the lobby allows it.
              </div>
              <div className="rounded-lg bg-sky-950/20 border border-sky-500/20 p-2.5">
                <span className="font-bold text-sky-300 block mb-0.5">Large Lobby Roles (7+):</span>
                The Inspector receives private radar intel. The Bodyguard can protect another player once. The Sleeper Agent knows the Citizen word but wins with the Imposters. The neutral Anarchist wins alone by ranking first in an elimination vote.
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wide">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>3. Face-to-Face Clues & Speaker Countdown</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Speaking turns are strategically shuffled to separate imposters. Each turn auto-begins with an audio <strong>3-second pre-countdown</strong> to prime the speaker before their turn timer ticks down. Give ONE subtle clue!
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wide">
              <Vote className="h-3.5 w-3.5" />
              <span>4. Open Accusation or Blind Ballot</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Use <strong>Open Accusation</strong> for live table debate with an audio 3-2-1 simultaneous finger point countdown, or <strong>Blind Ballot</strong> to pass the phone around for confidential voting. Large lobbies may queue two different suspects. Ties at the cutoff return to an open decision. The Bodyguard may protect another player before their reveal. After the final Imposter is caught, they must identify a living Inspector before unlocking the Last Stand word guess.
            </p>
          </div>

          {/* Unique Twist Highlights */}
          <div className="rounded-xl border border-lime-300/20 bg-lime-300/[0.06] p-3.5 text-xs leading-relaxed text-lime-100/80">
            <strong className="block text-lime-200 mb-1">Words, points, and sharing</strong>
            Choose Family, Barkada, or Mixed words, then set Easy, Standard, or Tricky relationships. After the match, role objectives generate Match Points and update local player standings. The debrief can export branded Victory and Leaderboard cards or a transparent photo overlay.
          </div>

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
