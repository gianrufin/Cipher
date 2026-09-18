import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Download, Share2, X } from 'lucide-react';
import { MatchSummary, Player, PlayerCareerStats } from '../types';
import { generateMatchRoastReel } from '../utils/roastEngine';

type Layout = 'victory' | 'leaderboard' | 'roast';
type Background = 'cipher' | 'transparent';
type Size = 'story' | 'feed' | 'square';

interface Props {
  isOpen: boolean; onClose: () => void; players: Player[]; matchSummary: MatchSummary;
  careerStats: Record<string, PlayerCareerStats>; trueCitizenWord: string; decoyWord: string; categoryName: string;
}

const WINNER = { citizens: 'Citizens win', imposters: 'Imposters win', anarchist: 'Wild Card wins' };
const ROLE_LABEL: Record<string, string> = { anarchist: 'Wild Card', citizen: 'Citizen', imposter: 'Imposter', decoy: 'Decoy', inspector: 'Inspector', sleeper: 'Sleeper', bodyguard: 'Bodyguard' };

export const ShareResultModal: React.FC<Props> = ({ isOpen, onClose, players, matchSummary, trueCitizenWord, decoyWord, categoryName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<Layout>('victory');
  const [background, setBackground] = useState<Background>('cipher');
  const [size, setSize] = useState<Size>('feed');
  const [showNames, setShowNames] = useState(true);
  const [showRoles, setShowRoles] = useState(false);
  const [showWords, setShowWords] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const draw = async () => {
      await document.fonts?.ready;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = 1080;
      canvas.height = size === 'story' ? 1920 : size === 'feed' ? 1350 : 1080;
      const context = canvas.getContext('2d');
      if (context) drawCard(context, canvas.width, canvas.height, { layout, background, players, matchSummary, trueCitizenWord, decoyWord, categoryName, showNames, showRoles, showWords });
    };
    void draw();
  }, [isOpen, layout, background, size, players, matchSummary, trueCitizenWord, decoyWord, categoryName, showNames, showRoles, showWords]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const makeFile = () => new Promise<File | null>(resolve => canvasRef.current?.toBlob(blob => resolve(blob ? new File([blob], `cipher-${layout}-${background}-${Date.now()}.png`, { type: 'image/png' }) : null), 'image/png'));
  const download = async () => { const file = await makeFile(); if (!file) return; const url = URL.createObjectURL(file); const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.name; anchor.click(); URL.revokeObjectURL(url); };
  const share = async () => { setSharing(true); try { const file = await makeFile(); if (!file) return; if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: 'Cipher match result', text: WINNER[matchSummary.winner], files: [file] }); else await download(); } catch (error) { if ((error as Error).name !== 'AbortError') await download(); } finally { setSharing(false); } };

  return createPortal(<div className="share-overlay" role="dialog" aria-modal="true" aria-label="Share match result"><div className="share-studio">
    <header className="share-studio-header"><div><p className="cipher-kicker">Match result</p><h2>Share your game</h2></div><button onClick={onClose} className="share-close" aria-label="Close share screen"><X className="h-5 w-5" /></button></header>
    <div className="share-studio-body"><div className={`share-preview ${background === 'transparent' ? 'transparent' : ''}`}><canvas ref={canvasRef} /></div><div className="share-controls">
      <div className="share-control-grid"><Tabs label="Card" value={layout} onChange={value => setLayout(value as Layout)} options={[["victory", "Summary"], ["roast", "Roast Reel"], ["leaderboard", "Board"]]} /><Tabs label="Format" value={size} onChange={value => setSize(value as Size)} options={[["feed", "Feed"], ["story", "Story"], ["square", "Square"]]} /></div>
      <Tabs label="Background" value={background} onChange={value => setBackground(value as Background)} options={[["cipher", "Cipher"], ["transparent", "Transparent"]]} />
      <div><p className="cipher-kicker mb-2">Include</p><div className="share-options"><Toggle label="Names" checked={showNames} onChange={setShowNames} /><Toggle label="Roles" checked={showRoles} onChange={setShowRoles} /><Toggle label="Words" checked={showWords} onChange={setShowWords} /></div></div>
    </div></div>
    <footer className="share-actions"><button type="button" onClick={download} className="cipher-button-secondary inline-flex items-center justify-center gap-2 whitespace-nowrap"><Download className="h-4 w-4 shrink-0" /><span className="truncate">Save Image</span></button><button type="button" disabled={sharing} onClick={() => void share()} className="cipher-button-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"><Share2 className="h-4 w-4 shrink-0" /><span className="truncate">{sharing ? 'Preparing...' : 'Share'}</span></button></footer>
  </div></div>, document.body);
};

const Tabs = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) => <div><p className="cipher-kicker mb-2">{label}</p><div className="cipher-segmented">{options.map(([id, title]) => <button key={id} aria-pressed={value === id} onClick={() => onChange(id)}>{title}</button>)}</div></div>;
const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) => <button onClick={() => onChange(!checked)} className="share-option" aria-pressed={checked}><span className={`check-dot ${checked ? 'active' : ''}`}>{checked && <Check className="h-3 w-3" />}</span>{label}</button>;

interface DrawOptions { layout: Layout; background: Background; players: Player[]; matchSummary: MatchSummary; trueCitizenWord: string; decoyWord: string; categoryName: string; showNames: boolean; showRoles: boolean; showWords: boolean; }

function drawMark(context: CanvasRenderingContext2D, x: number, y: number, size: number, ink: string) {
  context.fillStyle = '#f25f4b'; context.strokeStyle = ink; context.lineWidth = size * .055;
  context.beginPath(); context.arc(x, y, size * .46, 0, Math.PI * 2); context.fill(); context.stroke();
  context.beginPath(); context.arc(x, y, size * .27, 0, Math.PI * 2); context.stroke();
  context.fillStyle = ink; context.beginPath(); context.arc(x, y, size * .08, 0, Math.PI * 2); context.fill();
}

function drawCard(context: CanvasRenderingContext2D, width: number, height: number, options: DrawOptions) {
  context.clearRect(0, 0, width, height);
  const transparent = options.background === 'transparent'; const ink = transparent ? '#ffffff' : '#152238'; const muted = transparent ? 'rgba(255,255,255,.72)' : '#657083'; const coral = '#f25f4b';
  const scores = options.matchSummary.playerScores || []; const safeName = (name: string) => options.showNames ? name : name.split(/\s+/).map(part => part[0]).join('').toUpperCase();
  if (!transparent) { context.fillStyle = '#f4eedc'; context.fillRect(0, 0, width, height); }
  context.shadowColor = 'transparent'; context.shadowBlur = 0; context.textBaseline = 'top'; context.fillStyle = coral; context.fillRect(0, 0, width, 22);
  drawMark(context, 92, 104, 58, ink); context.fillStyle = ink; context.font = '900 30px Bricolage Grotesque'; context.fillText('CIPHER', 140, 76); context.fillStyle = muted; context.font = '800 18px JetBrains Mono'; context.fillText('GAME NIGHT', 140, 116);
  context.fillStyle = ink; context.font = '900 92px Bricolage Grotesque'; wrap(context, WINNER[options.matchSummary.winner].toUpperCase(), 64, 230, width - 128, 88); context.fillStyle = muted; context.font = '800 18px JetBrains Mono'; context.fillText('MATCH COMPLETE', 68, 420);
  const statsTop = 476; context.strokeStyle = ink; context.lineWidth = 3; line(context, 64, statsTop, width - 64, statsTop);
  const stats: Array<[string | number, string]> = [[options.players.length, 'PLAYERS'], [options.matchSummary.roundsPlayed, 'ROUNDS'], [`${options.matchSummary.impostersCaughtThisMatch}/${options.matchSummary.totalImposters}`, 'CAUGHT']];
  stats.forEach(([value, label], index) => { const x = 68 + index * ((width - 136) / 3); context.fillStyle = ink; context.font = '900 54px Bricolage Grotesque'; context.fillText(String(value), x, statsTop + 34); context.fillStyle = muted; context.font = '800 16px JetBrains Mono'; context.fillText(label, x, statsTop + 98); }); line(context, 64, statsTop + 142, width - 64, statsTop + 142);
  if (options.layout === 'victory') {
    const mvp = scores[0]; context.fillStyle = coral; context.font = '800 17px JetBrains Mono'; context.fillText('TOP PLAYER', 68, statsTop + 205); context.fillStyle = ink; context.font = '900 70px Bricolage Grotesque'; context.fillText(mvp ? safeName(mvp.name) : 'THE TABLE', 68, statsTop + 244);
    if (mvp) { context.fillStyle = muted; context.font = '800 25px JetBrains Mono'; context.fillText(`${mvp.points} POINTS`, 70, statsTop + 330); } scores.slice(1, 4).forEach((score, index) => drawRank(context, 68, statsTop + 410 + index * 78, width - 136, index + 2, safeName(score.name), score.points, ink, muted, false));
  } else if (options.layout === 'roast') {
    const reel = generateMatchRoastReel(options.players, options.matchSummary, options.trueCitizenWord, options.decoyWord);
    context.fillStyle = coral; context.font = '800 18px JetBrains Mono'; context.fillText(`ROAST REEL · ${reel.vibeTag}`, 68, statsTop + 180);
    reel.awards.slice(0, 3).forEach((award, index) => {
      const y = statsTop + 220 + index * 140;
      context.strokeStyle = 'rgba(101,112,131,.25)'; context.lineWidth = 2; line(context, 68, y + 120, width - 68, y + 120);
      context.fillStyle = coral; context.font = '800 15px JetBrains Mono'; context.fillText(award.badge, 68, y);
      context.fillStyle = ink; context.font = '900 32px Bricolage Grotesque'; context.fillText(`${award.title} · ${safeName(award.playerName)}`, 68, y + 26);
      context.fillStyle = muted; context.font = '700 16px JetBrains Mono'; context.fillText(`"${award.headline}"`, 68, y + 68);
    });
  } else scores.slice(0, 6).forEach((score, index) => drawRank(context, 68, statsTop + 192 + index * 94, width - 136, index + 1, safeName(score.name), score.points, ink, muted, options.showRoles, ROLE_LABEL[score.role] || score.role));
  const footerTop = height - 176; context.strokeStyle = ink; context.lineWidth = 3; line(context, 64, footerTop, width - 64, footerTop); context.fillStyle = muted; context.font = '800 16px JetBrains Mono'; context.fillText(options.showWords ? 'THE WORDS' : 'CATEGORY', 68, footerTop + 30); context.fillStyle = ink; context.font = '900 34px Bricolage Grotesque'; context.fillText(options.showWords ? `${options.trueCitizenWord} / ${options.decoyWord || options.categoryName}` : options.categoryName, 68, footerTop + 66);
}

function drawRank(context: CanvasRenderingContext2D, x: number, y: number, width: number, rank: number, name: string, points: number, ink: string, muted: string, showRole: boolean, role = '') {
  context.strokeStyle = 'rgba(101,112,131,.35)'; context.lineWidth = 2; line(context, x, y + 68, x + width, y + 68); context.fillStyle = muted; context.font = '800 17px JetBrains Mono'; context.fillText(String(rank).padStart(2, '0'), x, y + 17); context.fillStyle = ink; context.font = '900 32px Bricolage Grotesque'; context.fillText(name, x + 62, y + 6);
  if (showRole) { context.fillStyle = muted; context.font = '700 14px JetBrains Mono'; context.fillText(role.toUpperCase(), x + 62, y + 42); } context.textAlign = 'right'; context.fillStyle = ink; context.font = '900 28px Bricolage Grotesque'; context.fillText(`${points} PTS`, x + width, y + 14); context.textAlign = 'left';
}
function line(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) { context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke(); }
function wrap(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) { let current = ''; let top = y; text.split(' ').forEach(word => { const test = current ? `${current} ${word}` : word; if (context.measureText(test).width > maxWidth && current) { context.fillText(current, x, top); current = word; top += lineHeight; } else current = test; }); context.fillText(current, x, top); }
