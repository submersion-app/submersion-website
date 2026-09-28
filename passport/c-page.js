// The /c page: reads the tag in the browser. The written form keeps the tag
// in the URL fragment, which a browser never sends to the server. The query
// form, which the app also accepts, was already in the request by the time
// this runs, so reading it here sends nothing more; dropping it would only
// break the display of such a link.
import { renderTagPage } from "./render.js";

renderTagPage({
  doc: document,
  query: window.location.hash.slice(1) || window.location.search.slice(1),
  locale: navigator.language || "en",
  schedule: (fn, ms) => window.setTimeout(fn, ms),
  // Still showing: on a phone the app did not take over. Focus is not
  // checked, since a browser's own "cannot open" alert can take it.
  isPageVisible: () => document.visibilityState === "visible",
});
