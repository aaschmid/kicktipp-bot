import { Locator, Page } from "playwright";
import { GameOdds } from "../predictor/predictor";

export interface GameResult {
  home: number;
  guest: number;
}

export interface GameQuota {
  home: number;
  draw: number;
  guest: number;
}

export const gotoTipping = async (page: Page, groupId: string): Promise<void> => {
  await page.goto(`${groupId}/tippabgabe`);
  await page.locator("#tippabgabeForm").waitFor({ state: "visible" });
  await getSubmitButton(page).waitFor({ state: "visible" });
};

export const retrieveOdds = async (page: Page): Promise<GameOdds[]> => {
  const rows = await findRows(page);

  return await Promise.all(
    rows.map(async (row) => {
      const odds = await row.locator(".quoten .tippabgabe-quoten .quote").all();

      const result: GameOdds = { home: 0, draw: 0, guest: 0 };
      for (const oddEntry of odds) {
        const key = mapOddsKey(await oddEntry.locator(".quote-label").textContent());
        result[key] = parseFloat((await oddEntry.locator(".quote-text").textContent()) || "0");
      }
      return result;
    }),
  );
};

// Community quota, displayed on the tippabgabe page as "H - R - G" (e.g. "3 - 9 - 9"). It sits in a text cell that is before tipping and
// quota cells, so we locate it by its "d - d - d" text pattern rather than by a column index (the column shifts depending on whether the
// quota is shown at all).
export const retrieveQuota = async (page: Page): Promise<(GameQuota | undefined)[]> => {
  const rows = await findRows(page);

  return await Promise.all(
    rows.map(async (row) => {
      const cells = await row.locator("td.nw").all();
      for (const cell of cells) {
        const text = (await cell.textContent())?.trim() ?? "";
        const match = text.match(/^(\d+)\s*-\s*(\d+)\s*-\s*(\d+)$/);
        if (match) {
          return { home: parseInt(match[1], 10), draw: parseInt(match[2], 10), guest: parseInt(match[3], 10) };
        }
      }
      console.warn("No community quota found for a row; falling back to no quota.");
      return undefined;
    }),
  );
};

export const fillInPredictions = async (page: Page, predictions: GameResult[]): Promise<void> => {
  console.log("Submitting predictions...");
  const rows = await findRows(page);

  if (rows.length != predictions.length) {
    throw new Error(`Expect ${predictions.length} games but found ${rows.length}.`);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const prediction = predictions[i];

    const boxTip = row.locator("td.kicktipp-tippabgabe");
    if ((await boxTip.count()) != 1) {
      console.warn(`No more tipping allowed for game ${i} (predicted result -> ${prediction.home} : ${prediction.guest}).`);
      continue;
    }

    await row.locator('css=[name$=".heimTipp"]').fill(prediction.home.toString());
    await row.locator('css=[name$=".gastTipp"]').fill(prediction.guest.toString());
    console.log(`- Tip for game ${i} (${prediction.home} : ${prediction.guest}) entered.`);
  }

  await getSubmitButton(page).click();
  console.log("Predictions submitted successfully.");
};

const getSubmitButton = (page: Page) => page.getByRole("button", { name: "Tipps speichern" });

const mapOddsKey = (text: string | null): keyof GameOdds => {
  switch (text) {
    case "1":
      return "home";
    case "X":
      return "draw";
    case "2":
      return "guest";
    default:
      throw new Error(`Unknown quote key: ${text}.`);
  }
};

const findRows = async (page: Page): Promise<Locator[]> => {
  return await page.locator("#tippabgabeSpiele tbody .datarow").all();
};
