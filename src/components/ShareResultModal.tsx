import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, Share2, X } from 'lucide-react';
import { MatchSummary, Player, PlayerCareerStats } from '../types';

type CardLayout = 'victory' | 'leaderboard' | 'overlay';
type CardSize = 'story' | 'feed';

interface ShareResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  matchSummary: MatchSummary;
  careerStats: Record<string, PlayerCareerStats>;
  trueCitizenWord: string;
  decoyWord: string;
  categoryName: string;
}

const WINNER_LABEL = {
  citizens: 'Citizens win',
  imposters: 'Imposters win',
  anarchist: 'Anarchist wins'
};

export const ShareResultModal: React.FC<ShareResultModalProps> = ({
  isOpen, onClose, players, matchSummary, careerStats, trueCitizenWord, decoyWord, categoryName
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<CardLayout>('victory');
  const [size, setSize] = useState<CardSize>('story');
  const [showNames, setShowNames] = useState(true);
  const [showRoles, setShowRoles] = useState(false);
  const [showWords, setShowWords] = useState(true);
  const [sharing, setSharing] = useState(false);
  const scores = matchSummary.playerScores || [];
  const mvp = scores[0];

  useEffect(() => {
    if (!isOpen) return;
    const draw = async () => {
      await document.fonts?.ready;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = 1080;
      canvas.height = size === 'story' ? 1920 : 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawShareCard(ctx, canvas.width, canvas.height, {
        layout, players, matchSummary, careerStats, trueCitizenWord, decoyWord,
        categoryName, showNames, showRoles, showWords
      });
    };
    draw();
  }, [isOpen, layout, size, players, matchSummary, careerStats, trueCitizenWord, decoyWord, categoryName, showNames, showRoles, showWords]);

  if (!isOpen) return null;

  const makeFile = () => new Promise<File | null>(resolve => {
    canvasRef.current?.toBlob(blob => resolve(blob ? new File([blob], `cipher-${layout}-${Date.now()}.png`, { type: 'image/png' }) : null), 'image/png');
  });

  const download = async () => {
    const file = await makeFile();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    setSharing(true);
    try {
      const file = await makeFile();
      if (!file) return;
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Cipher match result', text: WINNER_LABEL[matchSummary.winner], files: [file] });
      } else {
        await download();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') await download();
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div className="flex max-h-[96svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#11110f] sm:rounded-[28px]">
        <header className="flex items-center justify-between border-b border-white/[0.08] p-4 sm:px-6">
          <div>
            <p className="cipher-kicker">Match studio</p>
            <h2 className="mt-1 font-display text-xl font-black text-stone-50">Share the result</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close share studio" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-stone-400"><X className="h-4 w-4" /></button>
        </header>

        <div className="grid flex-1 overflow-y-auto lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex items-center justify-center bg-black/30 p-4 sm:p-6">
            <canvas ref={canvasRef} className="max-h-[52svh] w-auto max-w-full rounded-xl shadow-2xl" />
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            <OptionTabs label="Layout" value={layout} onChange={value => setLayout(value as CardLayout)} options={[
              ['victory', 'Victory'], ['leaderboard', 'Leaderboard'], ['overlay', 'Overlay']
            ]} />
            <OptionTabs label="Format" value={size} onChange={value => setSize(value as CardSize)} options={[
              ['story', 'Story 9:16'], ['feed', 'Feed 4:5']
            ]} />

            <div className="space-y-2">
              <p className="cipher-kicker">Privacy and detail</p>
              <CardToggle label="Player names" checked={showNames} onChange={setShowNames} />
              <CardToggle label="Assigned roles" checked={showRoles} onChange={setShowRoles} />
              <CardToggle label="Secret words" checked={showWords} onChange={setShowWords} />
            </div>

            {layout === 'overlay' && (
              <div className="rounded-xl border border-sky-400/20 bg-sky-400/[0.06] p-3 text-[11px] leading-5 text-sky-100/80">
                Transparent PNG with white type, a dark outer stroke, and a soft shadow. Place it over your own group photo.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={download} className="cipher-button-secondary"><Download className="h-4 w-4" /> Download</button>
              <button type="button" disabled={sharing} onClick={share} className="cipher-button-primary disabled:opacity-50"><Share2 className="h-4 w-4" /> {sharing ? 'Preparing' : 'Share'}</button>
            </div>
            {mvp && <p className="text-center text-[10px] text-stone-600">Current MVP: {showNames ? mvp.name : 'Hidden'} · {mvp.points} points</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const OptionTabs = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) => (
  <div>
    <p className="cipher-kicker mb-2">{label}</p>
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1">
      {options.map(([id, title]) => (
        <button key={id} type="button" onClick={() => onChange(id)} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${value === id ? 'bg-stone-100 text-stone-950' : 'text-stone-500'}`}>{title}</button>
      ))}
    </div>
  </div>
);

const CardToggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] px-3 py-2.5 text-xs text-stone-300">
    {label}
    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${checked ? 'border-lime-300 bg-lime-300 text-stone-950' : 'border-white/15 text-transparent'}`}><Check className="h-3 w-3" /></span>
  </button>
);

interface DrawOptions {
  layout: CardLayout;
  players: Player[];
  matchSummary: MatchSummary;
  careerStats: Record<string, PlayerCareerStats>;
  trueCitizenWord: string;
  decoyWord: string;
  categoryName: string;
  showNames: boolean;
  showRoles: boolean;
  showWords: boolean;
}

function drawShareCard(ctx: CanvasRenderingContext2D, width: number, height: number, options: DrawOptions) {
  const { layout, matchSummary, showNames, showRoles, showWords } = options;
  ctx.clearRect(0, 0, width, height);
  if (layout !== 'overlay') {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#171713');
    gradient.addColorStop(0.55, '#0b0b09');
    gradient.addColorStop(1, matchSummary.winner === 'citizens' ? '#0c2119' : matchSummary.winner === 'anarchist' ? '#281b08' : '#29100c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255,255,255,.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  }

  const accent = matchSummary.winner === 'citizens' ? '#58dda5' : matchSummary.winner === 'anarchist' ? '#ffbd52' : '#ff6846';
  const white = '#f5f4ed';
  const muted = '#96948b';
  const scores = matchSummary.playerScores || [];
  const safeName = (name: string) => showNames ? name : name.split(/\s+/).map(part => part[0]).join('').toUpperCase();

  if (layout === 'overlay') {
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,.82)';
    ctx.shadowColor = 'rgba(0,0,0,.7)';
    ctx.shadowBlur = 18;
    const startY = height - 430;
    outlinedText(ctx, 'CIPHER.', 70, startY, '900 32px Outfit', white, 7);
    outlinedText(ctx, WINNER_LABEL[matchSummary.winner].toUpperCase(), 70, startY + 62, '900 74px Outfit', white, 9);
    const mvp = scores[0];
    if (mvp) outlinedText(ctx, `MVP  ${safeName(mvp.name)}  ·  ${mvp.points} PTS`, 70, startY + 165, '700 28px JetBrains Mono', white, 6);
    outlinedText(ctx, `${options.players.length} PLAYERS   ${matchSummary.roundsPlayed} ROUNDS   ${matchSummary.impostersCaughtThisMatch}/${matchSummary.totalImposters} CAUGHT`, 70, startY + 230, '700 24px JetBrains Mono', white, 6);
    if (showWords) outlinedText(ctx, `${options.trueCitizenWord}  /  ${options.decoyWord || options.categoryName}`, 70, startY + 292, '800 34px Outfit', white, 7);
    ctx.shadowBlur = 0;
    return;
  }

  ctx.textBaseline = 'top';
  ctx.fillStyle = accent;
  ctx.font = '700 25px JetBrains Mono';
  ctx.fillText('CIPHER / MATCH DEBRIEF', 72, 72);
  ctx.fillStyle = white;
  ctx.font = '900 96px Outfit';
  wrapText(ctx, WINNER_LABEL[matchSummary.winner].toUpperCase(), 72, 150, width - 144, 96);

  if (layout === 'victory') {
    const mvp = scores[0];
    const panelY = height * 0.48;
    ctx.fillStyle = 'rgba(255,255,255,.055)';
    roundRect(ctx, 60, panelY, width - 120, 250, 34); ctx.fill();
    ctx.fillStyle = muted; ctx.font = '700 23px JetBrains Mono'; ctx.fillText('MATCH MVP', 96, panelY + 48);
    ctx.fillStyle = white; ctx.font = '900 64px Outfit'; ctx.fillText(mvp ? safeName(mvp.name) : 'THE TABLE', 96, panelY + 92);
    ctx.fillStyle = accent; ctx.font = '800 30px Outfit'; ctx.fillText(mvp ? `${mvp.points} MATCH POINTS` : '', 96, panelY + 176);
    drawStats(ctx, 72, panelY + 320, width - 144, matchSummary, options.players.length, white, muted);
    if (showWords) {
      ctx.fillStyle = muted; ctx.font = '700 22px JetBrains Mono'; ctx.fillText('THE WORDS', 72, height - 270);
      ctx.fillStyle = white; ctx.font = '900 48px Outfit'; ctx.fillText(`${options.trueCitizenWord}  /  ${options.decoyWord || options.categoryName}`, 72, height - 218);
    }
  } else {
    let y = 390;
    scores.slice(0, Math.min(scores.length, 6)).forEach((score, index) => {
      ctx.fillStyle = index === 0 ? 'rgba(255,104,70,.12)' : 'rgba(255,255,255,.04)';
      roundRect(ctx, 60, y, width - 120, 116, 24); ctx.fill();
      ctx.fillStyle = index === 0 ? accent : muted; ctx.font = '800 26px JetBrains Mono'; ctx.fillText(String(index + 1).padStart(2, '0'), 92, y + 41);
      ctx.fillStyle = white; ctx.font = '800 38px Outfit'; ctx.fillText(safeName(score.name), 158, y + 26);
      if (showRoles) { ctx.fillStyle = muted; ctx.font = '700 18px JetBrains Mono'; ctx.fillText(score.role.toUpperCase(), 158, y + 75); }
      ctx.fillStyle = index === 0 ? accent : white; ctx.font = '900 42px Outfit'; ctx.textAlign = 'right'; ctx.fillText(`${score.points} PTS`, width - 92, y + 36); ctx.textAlign = 'left';
      y += 132;
    });
    drawStats(ctx, 72, height - 235, width - 144, matchSummary, options.players.length, white, muted);
  }

  ctx.fillStyle = muted; ctx.font = '700 20px JetBrains Mono'; ctx.fillText('PLAYED OFFLINE · ONE PHONE · ZERO ALIBIS', 72, height - 70);
}

function drawStats(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, summary: MatchSummary, players: number, white: string, muted: string) {
  const stats = [[String(players), 'PLAYERS'], [String(summary.roundsPlayed), 'ROUNDS'], [`${summary.impostersCaughtThisMatch}/${summary.totalImposters}`, 'CAUGHT']];
  const cellWidth = width / 3;
  stats.forEach(([value, label], index) => {
    ctx.fillStyle = white; ctx.font = '900 54px Outfit'; ctx.fillText(value, x + index * cellWidth, y);
    ctx.fillStyle = muted; ctx.font = '700 19px JetBrains Mono'; ctx.fillText(label, x + index * cellWidth, y + 66);
  });
}

function outlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, fill: string, strokeWidth: number) {
  ctx.font = font; ctx.lineWidth = strokeWidth; ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' '); let line = ''; let lineY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, lineY); line = word; lineY += lineHeight; } else line = test;
  }
  ctx.fillText(line, x, lineY);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
}
