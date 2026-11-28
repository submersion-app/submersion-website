// The /e page: reads the emergency tag in the browser. The tag keeps its
// details in the URL fragment, which a browser never sends to the server,
// and this page only reads it: no request, no storage, no other URL.
import { renderEmergencyTagPage } from "./emergency-render.js";

renderEmergencyTagPage({
  doc: document,
  query: window.location.hash.slice(1),
  locale: navigator.language || "en",
});
