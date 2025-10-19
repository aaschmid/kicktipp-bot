import { Page } from "playwright";

export const login = async (page: Page, username: string, password: string): Promise<void> => {
  await page.goto("/info/profil/login");

  await page.getByLabel("E-Mail").fill(username);
  await page.getByLabel("Passwort").fill(password);
  await page.getByText("Anmelden").click();

  await page.getByText("Sie wurden erfolgreich eingeloggt.").waitFor({ state: "visible" });
};
