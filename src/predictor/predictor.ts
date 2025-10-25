import { GameResult } from "../pages/tipping";

export interface GameOdds {
  home: number;
  draw: number;
  guest: number;
}

export type PredictionStrategy = "difference-ratio" | "coefficient" | "one-to-win";

export const predictGame = (odds: GameOdds, strategy: PredictionStrategy = "difference-ratio"): GameResult => {
  switch (strategy) {
    case "difference-ratio": {
      return predictWithDifferenceRatioStrategy(odds);
    }
    case "coefficient": {
      return predictWithCoefficientStrategy(odds);
    }
    case "one-to-win": {
      return predictWithOneToWinStrategy(odds);
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = strategy;
      throw new Error(`Strategy ${strategy} not supported.`);
    }
  }
};

// Inspired by https://github.com/fpoppinga/kicktipp-bot
const predictWithDifferenceRatioStrategy = (odds: GameOdds): GameResult => {
  const difference = Math.abs(odds.guest - odds.home);

  if (difference < 0.75) {
    const goals = Math.floor(Math.random() * 3);
    return { home: goals, guest: goals };
  }

  const totalGoals = Math.min(difference / 10, 1) * 6;

  const ratio = ((odds.home > odds.guest ? odds.home / odds.guest : odds.guest / odds.home) / (odds.home + odds.guest)) ** 0.33;

  const winnerGoals = Math.round(totalGoals * ratio);
  const looserGoals = Math.round(totalGoals * (1 - ratio));

  return odds.home > odds.guest
    ? { home: looserGoals, guest: winnerGoals === looserGoals ? winnerGoals + 1 : winnerGoals }
    : { home: winnerGoals === looserGoals ? winnerGoals + 1 : winnerGoals, guest: looserGoals };
};

const predictWithCoefficientStrategy = (odds: GameOdds): GameResult => {
  const difference = odds.home - odds.guest;
  const coefficient = Math.abs(difference) > 7 ? 0.3 : 0.75;

  if (Math.abs(difference) < 0.25) {
    const goals = Math.floor(Math.random() * 3);
    return { home: goals, guest: goals };
  }

  const goals_looser = Math.round(Math.random() * 2);
  return {
    home: difference < 0 ? Math.min(Math.round(-difference * coefficient), 6) + goals_looser : goals_looser,
    guest: difference < 0 ? goals_looser : Math.min(Math.round(difference * coefficient), 6) + goals_looser,
  };
};

const predictWithOneToWinStrategy = (odds: GameOdds): GameResult => {
  // Lower odds means higher probability and most games are 1-1 or 1-0
  if (Math.abs(odds.home - odds.guest) < 0.75) {
    return Math.random() <= 0.6 ? { home: 1, guest: 1 } : { home: 0, guest: 0 };
  }
  return { home: odds.home <= odds.guest ? 1 : 0, guest: odds.home <= odds.guest ? 0 : 1 };
};
