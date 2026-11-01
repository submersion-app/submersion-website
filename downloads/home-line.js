// The download count under the home page's download button. Kept apart from
// script.js so that neither the count nor the release lookup can break the other.
import { formatCount, loadSummary } from "./data.js";

loadSummary().then((summary) => {
  if (!summary) return;
  document.getElementById("download-count-number").textContent = formatCount(summary.total);
  document.getElementById("download-count").hidden = false;
});
