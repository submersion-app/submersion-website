// The /b page: reads the buddy card in the browser. The card is in the URL
// fragment, which a browser never sends to the server, and nothing here
// sends it anywhere.
import { renderBuddyCardPage } from "./buddy-render.js";

renderBuddyCardPage({
  doc: document,
  fragment: window.location.hash.slice(1),
  locale: navigator.language || "en",
  now: new Date(),
});
