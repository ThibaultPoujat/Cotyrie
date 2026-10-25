import { fr } from "./i18n/fr";

const app = document.querySelector<HTMLElement>("#app");

if (app) {
  const title = document.createElement("h1");
  title.textContent = fr.appTitle;
  const status = document.createElement("p");
  status.textContent = fr.underConstruction;
  app.replaceChildren(title, status);
}
