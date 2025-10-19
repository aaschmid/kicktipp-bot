import { Page } from "playwright";

export const handleCookieBanner = async (page: Page): Promise<void> => {
  await page.addLocatorHandler(page.getByRole("dialog"), async () => {
    try {
      await page
        .getByRole("dialog")
        .locator("iframe")
        .contentFrame()
        .locator("#notice")
        .getByRole("button", { name: "Akzeptieren und weiter" })
        .click();
    } catch (error) {
      console.log(`Unexpected dialog appears: ${error}`);
    }
  });
};
