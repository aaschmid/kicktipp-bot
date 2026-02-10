import { chromium } from "playwright";
import { login } from "./pages/login";
import { config } from "./config";
import { fillInPredictions, gotoTipping, retrieveOdds } from "./pages/tipping";
import { predictGame } from "./predictor/predictor";
import { handleCookieBanner } from "./pages/util";

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: "https://www.kicktipp.de" });
  try {
    const page = await context.newPage();
    await handleCookieBanner(page);

    await login(page, config.username, config.password);

    await gotoTipping(page, config.groupId);
    const odds = await retrieveOdds(page);

    const predictions = odds.map((q) => predictGame(q, config.predictionStrategy));

    await fillInPredictions(page, predictions);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await context.close();
    await browser.close();
  }
})();
