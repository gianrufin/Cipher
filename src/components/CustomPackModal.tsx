import React, { useState } from 'react';
import { X, Plus, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { WordPair } from '../types';

interface CustomPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  customPairs: WordPair[];
  onSaveCustomPairs: (pairs: WordPair[]) => void;
}

export const CustomPackModal: React.FC<CustomPackModalProps> = ({
  isOpen,
  onClose,
  customPairs,
  onSaveCustomPairs
}) => {
  const [pairs, setPairs] = useState<WordPair[]>(customPairs);
  const [wordA, setWordA] = useState('');
  const [wordB, setWordB] = useState('');
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddPair = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanA = wordA.trim();
    const cleanB = wordB.trim();
    const cleanHint = hint.trim();

    if (!cleanA || !cleanB) {
      setError('Please provide both Citizen Word and Imposter Decoy Word.');
      return;
    }

    if (cleanA.toLowerCase() === cleanB.toLowerCase()) {
      setError('Word A and Word B must be different words!');
      return;
    }

    const updated = [...pairs, { wordA: cleanA, wordB: cleanB, hint: cleanHint || 'Custom Category' }];
    setPairs(updated);
    onSaveCustomPairs(updated);
    setWordA('');
    setWordB('');
    setHint('');
    setError('');
  };

  const handleRemovePair = (index: number) => {
    const updated = pairs.filter((_, i) => i !== index);
    setPairs(updated);
    onSaveCustomPairs(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <h2 className="font-display font-bold text-lg text-white">Custom Word Pairs</h2>
          </div>
          <button
            id="close-custom-pack-btn"
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
          <p className="text-xs text-slate-400">
            Create your own paired words for party inside jokes, custom events, or specific hobbies! In Decoy Mode, Citizens get Word A and Imposters get Word B.
          </p>

          {/* Form */}
          <form onSubmit={handleAddPair} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  Citizen Word (Word A)
                </label>
                <input
                  id="custom-word-a-input"
                  type="text"
                  placeholder="e.g., Star Wars"
                  value={wordA}
                  onChange={(e) => setWordA(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-rose-400 mb-1">
                  Imposter Decoy (Word B)
                </label>
                <input
                  id="custom-word-b-input"
                  type="text"
                  placeholder="e.g., Star Trek"
                  value={wordB}
                  onChange={(e) => setWordB(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Category / Hint (Optional)
              </label>
              <input
                id="custom-hint-input"
                type="text"
                placeholder="e.g., Sci-Fi Franchises"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-900/50">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              id="add-custom-pair-btn"
              type="submit"
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Word Pair</span>
            </button>
          </form>

          {/* List of Custom Pairs */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Saved Custom Pairs ({pairs.length})
            </h3>
            {pairs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                No custom pairs added yet. Fill in the form above to add your first pair!
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {pairs.map((pair, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 text-xs"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-emerald-300">{pair.wordA}</span>
                        <span className="text-slate-600">vs</span>
                        <span className="text-rose-300">{pair.wordB}</span>
                      </div>
                      {pair.hint && (
                        <span className="text-[10px] text-slate-500">{pair.hint}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePair(index)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete pair"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
