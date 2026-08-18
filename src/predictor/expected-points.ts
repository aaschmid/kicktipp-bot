import { GameQuota, GameResult } from "../pages/tipping";
import { GameOdds } from "./predictor";

// --- Expected-points maximization strategy (Quotenregel) ----------------
//
// Kicktipp's Quotenregel payoff per tipped game (tiered, highest applicable only):
//   wrong tendency            -> 0
//   tendency right            -> q_X        (the community quota for tendency X)
//   margin right (wins only)  -> q_X + 1
//   exact result              -> q_X + 2
// Draws have no margin tier (tendency + exact only). The community quota q_X is
// inverse to how many tippers chose that tendency, so unpopular tendencies pay
// more. Rather than guessing the most likely scoreline, this strategy picks the
// tip that maximizes expected kicktipp points against the full result distribution
// implied by the bookmaker odds.
//
// 1. Convert 1X2 odds to implied probabilities, normalizing out the overround.
// 2. Fit independent Poisson goal rates (lambda_home, lambda_guest) so the
//    model's 1X2 probabilities best match the implied probabilities.
// 3. Build the scoreline probability matrix from the two Poissons.
// 4. Return the candidate tip (0..6 goals each) with the highest expected points.
//
// The algorithm is deterministic and, unlike the other strategies, makes use of
// the draw odds to distinguish likely draws from narrow wins.

const MAX_GOALS = 10;
const MAX_TIP_GOALS = 6;

const poissonPmf = (k: number, lambda: number): number => {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
};

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

const impliedProbabilities = (odds: GameOdds): { home: number; draw: number; guest: number } => {
  const raw = { home: 1 / odds.home, draw: 1 / odds.draw, guest: 1 / odds.guest };
  const total = raw.home + raw.draw + raw.guest;
  return { home: raw.home / total, draw: raw.draw / total, guest: raw.guest / total };
};

const scorelineProbabilities = (lambdaHome: number, lambdaGuest: number): number[][] => {
  const homePmf = Array.from({ length: MAX_GOALS + 1 }, (_, k) => poissonPmf(k, lambdaHome));
  const guestPmf = Array.from({ length: MAX_GOALS + 1 }, (_, k) => poissonPmf(k, lambdaGuest));

  const matrix: number[][] = [];
  for (let i = 0; i <= MAX_GOALS; i++) {
    const row: number[] = [];
    for (let j = 0; j <= MAX_GOALS; j++) {
      row.push(homePmf[i] * guestPmf[j]);
    }
    matrix.push(row);
  }
  return matrix;
};

const oneXTwoFromMatrix = (matrix: number[][]): { home: number; draw: number; guest: number } => {
  let home = 0;
  let draw = 0;
  let guest = 0;
  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      if (i > j) home += matrix[i][j];
      else if (i === j) draw += matrix[i][j];
      else guest += matrix[i][j];
    }
  }
  return { home, draw, guest };
};

const fitPoissonLambdas = (target: { home: number; draw: number; guest: number }): [number, number] => {
  let bestLh = 1;
  let bestLg = 1;
  let bestErr = Infinity;

  for (let lh = 0.05; lh <= 5.0; lh += 0.05) {
    for (let lg = 0.05; lg <= 5.0; lg += 0.05) {
      const matrix = scorelineProbabilities(lh, lg);
      const actual = oneXTwoFromMatrix(matrix);
      const err =
        Math.pow(actual.home - target.home, 2) + Math.pow(actual.draw - target.draw, 2) + Math.pow(actual.guest - target.guest, 2);
      if (err < bestErr) {
        bestErr = err;
        bestLh = lh;
        bestLg = lg;
      }
    }
  }
  return [Math.round(bestLh * 100) / 100, Math.round(bestLg * 100) / 100];
};

export const kicktippPayoff = (tip: GameResult, actual: GameResult, quota: GameQuota): number => {
  const tipMargin = tip.home - tip.guest;
  const actualMargin = actual.home - actual.guest;
  if (Math.sign(tipMargin) !== Math.sign(actualMargin)) return 0;

  const base = actualMargin === 0 ? quota.draw : actualMargin > 0 ? quota.home : quota.guest;
  if (tip.home === actual.home && tip.guest === actual.guest) return base + 2;
  if (actualMargin !== 0 && tipMargin === actualMargin) return base + 1;
  return base;
};

const argmaxExpectedPoints = (matrix: number[][], quota: GameQuota): GameResult => {
  let bestHome = 0;
  let bestGuest = 0;
  let bestExpected = -1;

  for (let a = 0; a <= MAX_TIP_GOALS; a++) {
    for (let b = 0; b <= MAX_TIP_GOALS; b++) {
      let expected = 0;
      for (let i = 0; i <= MAX_GOALS; i++) {
        for (let j = 0; j <= MAX_GOALS; j++) {
          expected += matrix[i][j] * kicktippPayoff({ home: a, guest: b }, { home: i, guest: j }, quota);
        }
      }
      if (expected > bestExpected) {
        bestExpected = expected;
        bestHome = a;
        bestGuest = b;
      }
    }
  }
  return { home: bestHome, guest: bestGuest };
};

// Neutral default quota (midpoint of the 3-9 interval) used when the community
// quota is unavailable: equal for all tendencies, so the argmax reduces to the
// pure-probability tip without exploiting any outsider edge.
const DEFAULT_QUOTA: GameQuota = { home: 6, draw: 6, guest: 6 };

export const predictWithExpectedPointsStrategy = (odds: GameOdds, quota?: GameQuota): GameResult => {
  const probabilities = impliedProbabilities(odds);
  const [lambdaHome, lambdaGuest] = fitPoissonLambdas(probabilities);
  const matrix = scorelineProbabilities(lambdaHome, lambdaGuest);
  return argmaxExpectedPoints(matrix, quota ?? DEFAULT_QUOTA);
};
