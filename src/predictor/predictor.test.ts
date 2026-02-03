import { describe, expect, test } from "vitest";
import { type GameOdds, predictGame } from "./predictor";
import { GameResult } from "../pages/tipping";

describe("predictGame", () => {
  test.each`
    odds                                        | expected
    ${{ home: 1.8, draw: 1.4, guest: 2.5 }}     | ${{ home: 0, guest: 0 }}
    ${{ home: 1.8, draw: 2.9, guest: 2.2 }}     | ${{ home: 1, guest: 1 }}
    ${{ home: 1.5, draw: 4.0, guest: 6.0 }}     | ${{ home: 2, guest: 1 }}
    ${{ home: 1.2, draw: 1.5, guest: 2.0 }}     | ${{ home: 1, guest: 0 }}
    ${{ home: 6.0, draw: 4.0, guest: 1.5 }}     | ${{ home: 1, guest: 2 }}
    ${{ home: 10.0, draw: 5.5, guest: 2.2 }}    | ${{ home: 1, guest: 3 }}
    ${{ home: 1.01, draw: 10.0, guest: 100.0 }} | ${{ home: 6, guest: 0 }}
    ${{ home: 100.0, draw: 10.0, guest: 1.01 }} | ${{ home: 0, guest: 6 }}
  `(
    "should predict $expected.home : $expected.guest for $odds.home / $odds.draw / $odds.guest odds using difference ratio strategy",
    ({ odds, expected }: { odds: GameOdds; expected: GameResult }) => {
      const goals = predictGame(odds, "difference-ratio");

      if (expected.home === expected.guest) {
        expect(goals.home).toBeOneOf([0, 1, 2]);
        expect(goals.guest).toBeOneOf([0, 1, 2]);

        expect(goals.home).toEqual(goals.guest);
      } else {
        expect(goals).toEqual(expected);
      }
    },
  );

  test.each`
    odds                                        | expected_diff
    ${{ home: 1.8, draw: 1.4, guest: 1.6 }}     | ${0}
    ${{ home: 1.8, draw: 2.9, guest: 2.2 }}     | ${0}
    ${{ home: 1.5, draw: 4.0, guest: 6.0 }}     | ${3}
    ${{ home: 1.2, draw: 1.5, guest: 2.0 }}     | ${1}
    ${{ home: 6.0, draw: 4.0, guest: 1.5 }}     | ${-3}
    ${{ home: 10.0, draw: 5.5, guest: 2.2 }}    | ${-2}
    ${{ home: 1.01, draw: 10.0, guest: 100.0 }} | ${6}
    ${{ home: 100.0, draw: 10.0, guest: 1.01 }} | ${-6}
  `(
    "should predict a goal difference of $expected_diff for $odds.home / $odds.draw / $odds.guest odds using coefficient strategy",
    ({ odds, expected_diff }: { odds: GameOdds; expected_diff: number }) => {
      const goals = predictGame(odds, "coefficient");
      expect(goals.home - goals.guest).toEqual(expected_diff);
    },
  );

  test.each`
    odds                                        | expected
    ${{ home: 1.8, draw: 1.4, guest: 2.5 }}     | ${{ home: 1, guest: 1 }}
    ${{ home: 1.8, draw: 2.9, guest: 2.2 }}     | ${{ home: 0, guest: 0 }}
    ${{ home: 1.5, draw: 4.0, guest: 6.0 }}     | ${{ home: 1, guest: 0 }}
    ${{ home: 1.2, draw: 1.5, guest: 2.0 }}     | ${{ home: 1, guest: 0 }}
    ${{ home: 6.0, draw: 4.0, guest: 1.5 }}     | ${{ home: 0, guest: 1 }}
    ${{ home: 10.0, draw: 5.5, guest: 2.2 }}    | ${{ home: 0, guest: 1 }}
    ${{ home: 1.01, draw: 10.0, guest: 100.0 }} | ${{ home: 1, guest: 0 }}
    ${{ home: 100.0, draw: 10.0, guest: 1.01 }} | ${{ home: 0, guest: 1 }}
  `(
    "should predict $expected.home : $expected.guest for $odds.home / $odds.draw / $odds.guest odds using one-to-win strategy",
    ({ odds, expected }: { odds: GameOdds; expected: GameResult }) => {
      const goals = predictGame(odds, "one-to-win");

      if (expected.home === expected.guest) {
        expect(goals.home).toBeOneOf([0, 1]);
        expect(goals.guest).toBeOneOf([0, 1]);

        expect(goals.home).toEqual(goals.guest);
      } else {
        expect(goals).toEqual(expected);
      }
    },
  );
});
