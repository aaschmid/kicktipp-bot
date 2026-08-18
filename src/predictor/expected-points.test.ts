import { describe, expect, test } from "vitest";
import { type GameOdds } from "./predictor";
import { kicktippPayoff, predictWithExpectedPointsStrategy } from "./expected-points";
import { GameQuota } from "../pages/tipping";

describe("predictWithExpectedPointsStrategy", () => {
  test("should predict a draw for a game where the draw is the clear favorite", () => {
    const odds: GameOdds = { home: 3.5, draw: 3.2, guest: 3.5 };
    const goals = predictWithExpectedPointsStrategy(odds);
    expect(goals.home).toEqual(goals.guest);
    expect(goals.home).toBeOneOf([0, 1, 2]);
  });

  test("should predict a home win for a clear home favorite", () => {
    const odds: GameOdds = { home: 1.5, draw: 4.0, guest: 6.0 };
    const goals = predictWithExpectedPointsStrategy(odds);
    expect(goals.home).toBeGreaterThan(goals.guest);
  });

  test("should predict a guest win for a clear guest favorite", () => {
    const odds: GameOdds = { home: 6.0, draw: 4.0, guest: 1.5 };
    const goals = predictWithExpectedPointsStrategy(odds);
    expect(goals.guest).toBeGreaterThan(goals.home);
  });

  test("should predict a decisive home win for an extreme home favorite", () => {
    const odds: GameOdds = { home: 1.01, draw: 10.0, guest: 100.0 };
    const goals = predictWithExpectedPointsStrategy(odds);
    expect(goals.home).toBeGreaterThan(goals.guest);
    expect(goals.home).toBeGreaterThanOrEqual(2);
    expect(goals.guest).toBeLessThanOrEqual(1);
  });

  test("should predict a decisive guest win for an extreme guest favorite", () => {
    const odds: GameOdds = { home: 100.0, draw: 10.0, guest: 1.01 };
    const goals = predictWithExpectedPointsStrategy(odds);
    expect(goals.guest).toBeGreaterThan(goals.home);
    expect(goals.guest).toBeGreaterThanOrEqual(2);
    expect(goals.home).toBeLessThanOrEqual(1);
  });

  test("should be deterministic", () => {
    const odds: GameOdds = { home: 1.8, draw: 3.5, guest: 4.2 };
    const first = predictWithExpectedPointsStrategy(odds);
    for (let i = 0; i < 20; i++) {
      expect(predictWithExpectedPointsStrategy(odds)).toEqual(first);
    }
  });

  test("should produce non-negative goals within the tip range", () => {
    const odds: GameOdds = { home: 2.0, draw: 3.5, guest: 3.5 };
    const goals = predictWithExpectedPointsStrategy(odds);
    expect(goals.home).toBeGreaterThanOrEqual(0);
    expect(goals.guest).toBeGreaterThanOrEqual(0);
    expect(goals.home).toBeLessThanOrEqual(6);
    expect(goals.guest).toBeLessThanOrEqual(6);
  });
});

describe("predictWithExpectedPointsStrategy under the Quotenregel", () => {
  // Bayern (home) vs Stuttgart, bookmaker odds 1.32 / 6.50 / 7.25, community quota 3-9-9.
  // Home is the heavy bookmaker favorite but only pays 3 pts (everyone tips home);
  // the outsider tendencies pay 9. The argmax should not blindly pick the home win.
  const bayernOdds: GameOdds = { home: 1.32, draw: 6.5, guest: 7.25 };
  const bayernQuota: GameQuota = { home: 3, draw: 9, guest: 9 };

  test("should still predict a home win for a heavy favorite despite low home quota", () => {
    const goals = predictWithExpectedPointsStrategy(bayernOdds, bayernQuota);
    expect(goals.home).toBeGreaterThan(goals.guest);
  });

  test("should exploit an outsider edge when the outsider is plausible and pays much more", () => {
    // Same odds, but now the crowd is so heavily on home that the outsider pays max.
    // For a near-coin-flip game this must push the tip away from the favorite.
    const coinFlip: GameOdds = { home: 2.0, draw: 3.5, guest: 2.1 };
    const outsiderQuota: GameQuota = { home: 3, draw: 5, guest: 9 };
    const goals = predictWithExpectedPointsStrategy(coinFlip, outsiderQuota);
    expect(goals.guest).toBeGreaterThanOrEqual(goals.home);
  });

  test("should fall back to a neutral quota when none is provided", () => {
    const withQuota = predictWithExpectedPointsStrategy(bayernOdds, bayernQuota);
    const withoutQuota = predictWithExpectedPointsStrategy(bayernOdds);
    // Without a quota the argmax reduces to the pure-probability tip; both must
    // still be valid scorelines and home wins given the heavy home favorite.
    expect(withQuota.home).toBeGreaterThan(withQuota.guest);
    expect(withoutQuota.home).toBeGreaterThan(withoutQuota.guest);
  });

  test("should be deterministic with a quota", () => {
    const first = predictWithExpectedPointsStrategy(bayernOdds, bayernQuota);
    for (let i = 0; i < 20; i++) {
      expect(predictWithExpectedPointsStrategy(bayernOdds, bayernQuota)).toEqual(first);
    }
  });
});

describe("kicktippPayoff (Quotenregel, tiered)", () => {
  const quota: GameQuota = { home: 3, draw: 9, guest: 9 };

  test("wrong tendency scores 0", () => {
    expect(kicktippPayoff({ home: 2, guest: 0 }, { home: 0, guest: 1 }, quota)).toBe(0);
    expect(kicktippPayoff({ home: 0, guest: 0 }, { home: 1, guest: 0 }, quota)).toBe(0);
  });

  test("correct home tendency only scores the home quota", () => {
    expect(kicktippPayoff({ home: 2, guest: 0 }, { home: 1, guest: 0 }, quota)).toBe(3);
  });

  test("correct home margin (not exact) scores quota + 1", () => {
    expect(kicktippPayoff({ home: 2, guest: 0 }, { home: 3, guest: 1 }, quota)).toBe(4);
  });

  test("exact home result scores quota + 2", () => {
    expect(kicktippPayoff({ home: 2, guest: 0 }, { home: 2, guest: 0 }, quota)).toBe(5);
  });

  test("correct draw tendency only scores the draw quota (no margin tier)", () => {
    expect(kicktippPayoff({ home: 1, guest: 1 }, { home: 2, guest: 2 }, quota)).toBe(9);
  });

  test("exact draw scores quota + 2 (no margin bonus)", () => {
    expect(kicktippPayoff({ home: 1, guest: 1 }, { home: 1, guest: 1 }, quota)).toBe(11);
  });

  test("correct guest margin (not exact) scores quota + 1", () => {
    // tip 0:2 (margin -2) vs actual 1:3 (margin -2): same margin, not exact
    expect(kicktippPayoff({ home: 0, guest: 2 }, { home: 1, guest: 3 }, quota)).toBe(10);
  });
});
