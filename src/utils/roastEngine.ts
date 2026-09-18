import { MatchSummary, Player, RoleType } from '../types';

export interface RoastAward {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  spiciness: 1 | 2 | 3;
  accent: 'gold' | 'coral' | 'rose' | 'amber' | 'emerald' | 'purple';
  playerId: string;
  playerName: string;
  playerRole: RoleType;
  playerPhoto?: string;
  headline: string;
  commentary: string;
  statLabel: string;
}

export interface MatchRoastReel {
  matchVibe: string;
  vibeTag: string;
  topRoast: string;
  awards: RoastAward[];
  spiciestPlayerName: string;
}

const citizenRoles: RoleType[] = ['citizen', 'decoy', 'inspector', 'bodyguard'];

export function generateMatchRoastReel(
  players: Player[],
  summary: MatchSummary,
  trueCitizenWord: string,
  decoyWord: string
): MatchRoastReel {
  const awards: RoastAward[] = [];
  const scores = summary.playerScores || [];
  const topScorer = scores[0];
  const eliminatedPlayers = players.filter(p => p.isEliminated);
  const survivingPlayers = players.filter(p => !p.isEliminated);
  const imposters = players.filter(p => p.role === 'imposter' || p.role === 'sleeper');
  const citizens = players.filter(p => citizenRoles.includes(p.role));
  const anarchist = players.find(p => p.role === 'anarchist');

  // 1. Wild Card Award: Solo Heist or Redeemed Rogue
  if (anarchist) {
    if (summary.winner === 'anarchist') {
      awards.push({
        id: 'chaos_king',
        title: 'Master of Chaos',
        subtitle: 'Solo Heist Mastermind',
        badge: '💣 SOLO HEIST',
        spiciness: 3,
        accent: 'amber',
        playerId: anarchist.id,
        playerName: anarchist.name,
        playerRole: 'anarchist',
        playerPhoto: anarchist.avatarPhoto,
        headline: 'Baited the whole table into handing them the win',
        commentary: `${anarchist.name} pulled off the ultimate reverse psychology. Acting just suspicious enough to get voted out, they walked away with the solo victory while everyone else stood stunned.`,
        statLabel: 'Turn 1 Ejection · 5 PTS'
      });
    } else if (summary.winner === 'citizens') {
      awards.push({
        id: 'balimbing',
        title: 'Balimbing Prodigy',
        subtitle: 'The Strategic Turncoat',
        badge: '🔄 REDEEMED ROGUE',
        spiciness: 2,
        accent: 'purple',
        playerId: anarchist.id,
        playerName: anarchist.name,
        playerRole: 'anarchist',
        playerPhoto: anarchist.avatarPhoto,
        headline: 'Missed the first ejection, flipped allegiance, and still won',
        commentary: `Surviving turn one meant the Solo Heist was over, but ${anarchist.name} effortlessly pivoted into a model Citizen to bag team victory points. Loyalty is overrated anyway.`,
        statLabel: 'Rogue Pivot · Team Victory'
      });
    }
  }

  // 2. Detective / Sherlock Award
  const bestDetective = citizens
    .map(c => ({
      player: c,
      score: scores.find(s => s.playerId === c.id)?.points || 0
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (summary.winner === 'citizens' && bestDetective) {
    awards.push({
      id: 'sherlock',
      title: 'Sherlock ng Barkada',
      subtitle: 'Chief Inquisitor',
      badge: '🕵️‍♂️ DETECTIVE MVP',
      spiciness: 1,
      accent: 'emerald',
      playerId: bestDetective.player.id,
      playerName: bestDetective.player.name,
      playerRole: bestDetective.player.role,
      playerPhoto: bestDetective.player.avatarPhoto,
      headline: 'Sniffed out the imposters with zero hesitation',
      commentary: `${bestDetective.player.name} read the clues like an open book. While others second-guessed, their interrogation cracked the case wide open.`,
      statLabel: `${bestDetective.score} PTS · Target Acquired`
    });
  }

  // 3. Master of Palusot (Imposter Bluff Award)
  const survivingImposter = imposters.find(imp => !imp.isEliminated);
  const topImposter = imposters
    .map(imp => ({
      player: imp,
      score: scores.find(s => s.playerId === imp.id)?.points || 0
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (summary.winner === 'imposters') {
    const starImposter = survivingImposter || topImposter?.player;
    if (starImposter) {
      const isCounterWin = summary.winReason.toLowerCase().includes('last stand') || summary.bonusPlayerId === starImposter.id;
      awards.push({
        id: 'palusot_master',
        title: 'Master of Palusot',
        subtitle: 'Unshakable Poker Face',
        badge: isCounterWin ? '🎯 CLUTCH COUNTER' : '🔥 BLUFF GOD',
        spiciness: 3,
        accent: 'coral',
        playerId: starImposter.id,
        playerName: starImposter.name,
        playerRole: starImposter.role,
        playerPhoto: starImposter.avatarPhoto,
        headline: isCounterWin
          ? 'Guessed the Citizen secret word under maximum pressure'
          : 'Gaslit the entire room without breaking a sweat',
        commentary: `${starImposter.name} gave clues so ambiguously poetic that even the real Citizens nodded in agreement. Absolute masterclass in deception.`,
        statLabel: `${summary.roundsPlayed} Rounds · Infiltration Complete`
      });
    }
  }

  // 4. Friendly Fire / Marites Award
  const innocentVictim = eliminatedPlayers.find(p => citizenRoles.includes(p.role));
  if (innocentVictim) {
    awards.push({
      id: 'friendly_fire',
      title: 'Friendly Fire Casualty',
      subtitle: 'Guilty Until Proven Dead',
      badge: '🤦‍♂️ WRONGLY ACCUSED',
      spiciness: 2,
      accent: 'rose',
      playerId: innocentVictim.id,
      playerName: innocentVictim.name,
      playerRole: innocentVictim.role,
      playerPhoto: innocentVictim.avatarPhoto,
      headline: 'Looked so suspicious they got ejected by their own team',
      commentary: `Justice was not served today. ${innocentVictim.name}'s clue was either 200 IQ or completely unhinged because their own teammates threw them out of the airlock.`,
      statLabel: 'Ejected Innocent · RIP'
    });
  }

  // 5. Untouchable Ghost Award (Surviving with stealth)
  const silentSurvivor = survivingPlayers
    .filter(p => p.id !== topScorer?.playerId && p.id !== anarchist?.id)
    .sort((a, b) => (a.votesAgainst || 0) - (b.votesAgainst || 0))[0];

  if (silentSurvivor) {
    awards.push({
      id: 'untouchable',
      title: 'Untouchable Ghost',
      subtitle: 'Flew Under the Radar',
      badge: '👻 SILENT OPERATOR',
      spiciness: 1,
      accent: 'gold',
      playerId: silentSurvivor.id,
      playerName: silentSurvivor.name,
      playerRole: silentSurvivor.role,
      playerPhoto: silentSurvivor.avatarPhoto,
      headline: 'Smiled politely, gave vague clues, and never got questioned',
      commentary: `Did ${silentSurvivor.name} actually play, or were they just spectating from the inside? Zero suspicion, survived till the end. Work smart, not hard.`,
      statLabel: `${summary.roundsPlayed} Rounds · Clean Sheet`
    });
  }

  // 6. Bodyguard / Guardian or Decoy Award
  const bodyguard = players.find(p => p.role === 'bodyguard');
  if (bodyguard && (bodyguard.successfulActions || 0) > 0) {
    awards.push({
      id: 'guardian_angel',
      title: 'Taga-Ligtas Award',
      subtitle: 'Clutch Intervention',
      badge: '🛡️ VETO SAVIOR',
      spiciness: 1,
      accent: 'emerald',
      playerId: bodyguard.id,
      playerName: bodyguard.name,
      playerRole: 'bodyguard',
      playerPhoto: bodyguard.avatarPhoto,
      headline: 'Denied an innocent execution with the secret veto',
      commentary: `${bodyguard.name} stepped in right when the mob had the pitchforks out. A literal lifesaver for the Citizen squad.`,
      statLabel: `${bodyguard.successfulActions} Saved Lives`
    });
  }

  // 7. Decoy Confusion Award
  const decoy = players.find(p => p.role === 'decoy');
  if (decoy && decoyWord) {
    awards.push({
      id: 'decoy_chaos',
      title: 'Decoy Distraction',
      subtitle: 'Living Misdirection',
      badge: '🎭 BRAIN TWISTER',
      spiciness: 2,
      accent: 'purple',
      playerId: decoy.id,
      playerName: decoy.name,
      playerRole: 'decoy',
      playerPhoto: decoy.avatarPhoto,
      headline: 'Held the decoy word and scrambled the entire debate',
      commentary: `Cluing with "${decoyWord}" while citizens held "${trueCitizenWord}" kept everyone second-guessing their own ears. True psychological warfare.`,
      statLabel: 'Decoy Word Holder'
    });
  }

  // If few awards generated, add Top Scorer Crown
  if (awards.length < 3 && topScorer) {
    const p = players.find(pl => pl.id === topScorer.playerId);
    if (p && !awards.some(a => a.playerId === p.id)) {
      awards.push({
        id: 'top_scorer',
        title: 'Table Champion',
        subtitle: 'Points Heavyweight',
        badge: '👑 MVP',
        spiciness: 1,
        accent: 'gold',
        playerId: p.id,
        playerName: p.name,
        playerRole: p.role,
        playerPhoto: p.avatarPhoto,
        headline: 'Dominated the scoring sheet from start to finish',
        commentary: `${p.name} racked up ${topScorer.points} points through keen deduction and survival instincts. Bow down to the match carry.`,
        statLabel: `${topScorer.points} PTS · #1 Rank`
      });
    }
  }

  // Match Vibe
  let matchVibe = 'A battle of wits that ended in absolute fireworks.';
  let vibeTag = '⚡ HIGH DRAMA';
  if (summary.winner === 'anarchist') {
    matchVibe = 'Pure unadulterated anarchy. The Wild Card played the room like a fiddle.';
    vibeTag = '💣 ANARCHIST HIJACK';
  } else if (summary.winner === 'imposters') {
    matchVibe = 'Imposter supremacy. The infiltration was clean, patient, and ruthless.';
    vibeTag = '🔥 MASTERCLASS HEIST';
  } else {
    matchVibe = 'Citizen unity triumphed. The syndicate was unmasked and dismantled.';
    vibeTag = '🛡️ JUSTICE DELIVERED';
  }

  const spiciestAward = [...awards].sort((a, b) => b.spiciness - a.spiciness)[0];

  return {
    matchVibe,
    vibeTag,
    topRoast: spiciestAward?.commentary || matchVibe,
    awards: awards.slice(0, 5),
    spiciestPlayerName: spiciestAward?.playerName || topScorer?.name || 'Everyone'
  };
}

/**
 * Text generator for sharing Roast Reel directly into group chats
 */
export function formatRoastReelText(
  reel: MatchRoastReel,
  summary: MatchSummary,
  categoryName: string,
  citizenWord: string,
  decoyWord?: string
): string {
  const winnerTitle =
    summary.winner === 'citizens'
      ? '🛡️ CITIZENS WIN!'
      : summary.winner === 'anarchist'
      ? '💣 WILD CARD SOLO HEIST!'
      : '🔥 IMPOSTERS WIN!';

  const lines = [
    `🎭 *CIPHER GAME NIGHT: HALL OF FAME & ROAST REEL*`,
    `${winnerTitle} (${summary.roundsPlayed} rounds played)`,
    `📁 Category: ${categoryName} | Words: ${citizenWord}${decoyWord ? ` / ${decoyWord}` : ''}`,
    `Vibe: ${reel.vibeTag} — "${reel.matchVibe}"`,
    ``,
    `🏆 *THE ROAST REEL AWARDS:*`
  ];

  reel.awards.forEach((award, index) => {
    lines.push(
      `${index + 1}. ${award.badge} *${award.title}*: ${award.playerName} (${award.playerRole.toUpperCase()})`,
      `   "${award.headline}"`,
      `   👉 ${award.commentary}`,
      `   📊 ${award.statLabel}`,
      ``
    );
  });

  lines.push(`Play next round on Cipher! 🕵️`);
  return lines.join('\n');
}
