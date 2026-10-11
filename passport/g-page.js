// The /g page: reads the gear tag in the browser. As on /c, the written form
// keeps the tag in the URL fragment, which a browser never sends to the
// server, and the query form the app also accepts is read too.
import { renderGearTagPage } from "./gear-render.js";

renderGearTagPage({
  doc: document,
  query: window.location.hash.slice(1) || window.location.search.slice(1),
  locale: navigator.language || "en",
  schedule: (fn, ms) => window.setTimeout(fn, ms),
  isPageVisible: () => document.visibilityState === "visible",
});
