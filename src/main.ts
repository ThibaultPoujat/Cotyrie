import { Gw2Client } from "./api/client";
import { fr, frGameNames } from "./i18n/fr";
import { browserStorage } from "./storage/store";
import { App } from "./ui/app";

const root = document.querySelector<HTMLElement>("#app");

if (root) {
  new App(root, { client: new Gw2Client(), storage: browserStorage(), texts: fr, names: frGameNames });
}
