import { GameResult } from "../pages/tipping";

export interface GameOdds {
  home: number;
  draw: number;
  guest: number;
}

export const predictGame = (odds: GameOdds): GameResult => {
  const difference = Math.abs(odds.guest - odds.home);

  // draw if odds difference is below 0.75 and draw above 2
  if (difference < 0.75 && odds.draw <= 3) {
    const goals = Math.floor(Math.random() * 3);
    return { home: goals, guest: goals };
  }

  // the more goals, the greater the difference but maximum six
  const totalGoals = Math.min(difference / 10, 1) * 6;

  const ratio = ((odds.home > odds.guest ? odds.home / odds.guest : odds.guest / odds.home) / (odds.home + odds.guest)) ** 0.33;

  const winnerGoals = Math.round(totalGoals * ratio);
  const looserGoals = Math.round(totalGoals * (1 - ratio));

  return odds.home > odds.guest
    ? { home: looserGoals, guest: winnerGoals === looserGoals ? winnerGoals + 1 : winnerGoals }
    : { home: winnerGoals === looserGoals ? winnerGoals + 1 : winnerGoals, guest: looserGoals };
};
