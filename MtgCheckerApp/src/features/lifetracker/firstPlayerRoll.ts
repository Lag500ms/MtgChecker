export type FirstPlayerRoll = {
  winnerIndex: number;
  values: number[];
};

/**
 * Uniformly choose one player, then present distinct D20 results
 * with that player at the unique highest value.
 *
 * This is a fair starting-player picker styled as a dice roll,
 * not a simulation of independent D20 rolls.
 */
export function pickFirstPlayerRoll(
  playerCount: 2 | 3 | 4,
  random: () => number = Math.random,
): FirstPlayerRoll {
  const winnerIndex = Math.min(playerCount - 1, Math.floor(random() * playerCount));
  const winnerValue = 16 + Math.floor(random() * 5);
  const candidates = Array.from({ length: winnerValue - 1 }, (_, i) => i + 1);

  // Shuffle using Fisher-Yates. All other players are guaranteed lower.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const values = Array.from({ length: playerCount }, (_, i) =>
    i === winnerIndex ? winnerValue : candidates[i < winnerIndex ? i : i - 1],
  );
  return { winnerIndex, values };
}
