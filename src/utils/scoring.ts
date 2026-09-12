import { MatchSummary, Player, PlayerCareerStats, PlayerMatchScore, RoleType } from '../types';

const citizenRoles: RoleType[] = ['citizen', 'inspector', 'bodyguard'];

export function didPlayerWin(player: Player, winner: MatchSummary['winner']): boolean {
  if (winner === 'citizens') return citizenRoles.includes(player.role);
  if (winner === 'imposters') return player.role === 'imposter' || player.role === 'sleeper';
  return player.role === 'anarchist';
}

export function calculateMatchScores(players: Player[], summary: MatchSummary): PlayerMatchScore[] {
  return players
    .map(player => {
      let points = 0;
      const reasons: string[] = [];
      const won = didPlayerWin(player, summary.winner);

      if (player.role === 'anarchist' && summary.winner === 'anarchist') {
        points += 5;
        reasons.push('+5 completed the Anarchist objective');
      } else if (won) {
        points += 3;
        reasons.push('+3 won with the team');
      }

      if (!player.isEliminated && player.role !== 'anarchist') {
        points += 1;
        reasons.push('+1 survived the match');
      }

      if (citizenRoles.includes(player.role) && summary.impostersCaughtThisMatch > 0) {
        points += summary.impostersCaughtThisMatch;
        reasons.push(`+${summary.impostersCaughtThisMatch} Citizen team capture`);
      }

      const survivedRounds = player.isEliminated ? (player.roundsSurvived || 0) : summary.roundsPlayed;
      if (player.role === 'imposter' && survivedRounds > 0) {
        points += survivedRounds;
        reasons.push(`+${survivedRounds} rounds survived`);
      }

      if (summary.bonusPlayerId === player.id) {
        points += 2;
        reasons.push('+2 successful counter-play');
      }

      if (player.role === 'inspector' && won && !player.isEliminated) {
        points += 2;
        reasons.push('+2 Inspector stayed hidden');
      }

      if (player.role === 'bodyguard' && (player.successfulActions || 0) > 0) {
        const bonus = (player.successfulActions || 0) * 2;
        points += bonus;
        reasons.push(`+${bonus} successful protection`);
      }

      return { playerId: player.id, name: player.name, role: player.role, points, reasons };
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

export function updateCareerStats(
  current: Record<string, PlayerCareerStats>,
  players: Player[],
  summary: MatchSummary,
  scores: PlayerMatchScore[]
): Record<string, PlayerCareerStats> {
  const next = { ...current };
  for (const player of players) {
    const key = player.name.trim().toLocaleLowerCase();
    const previous = next[key] || {
      name: player.name,
      gamesPlayed: 0,
      wins: 0,
      totalPoints: 0,
      currentStreak: 0,
      bestStreak: 0,
      roleWins: {}
    };
    const won = didPlayerWin(player, summary.winner);
    const currentStreak = won ? previous.currentStreak + 1 : 0;
    next[key] = {
      ...previous,
      name: player.name,
      gamesPlayed: previous.gamesPlayed + 1,
      wins: previous.wins + (won ? 1 : 0),
      totalPoints: previous.totalPoints + (scores.find(score => score.playerId === player.id)?.points || 0),
      currentStreak,
      bestStreak: Math.max(previous.bestStreak, currentStreak),
      roleWins: won
        ? { ...previous.roleWins, [player.role]: (previous.roleWins[player.role] || 0) + 1 }
        : previous.roleWins
    };
  }
  return next;
}
