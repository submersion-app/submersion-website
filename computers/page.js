// Browser glue for the support matrix: loads the data, keeps the address bar
// in step with the controls, opens a cell's reports, and follows #model deep
// links. The rules live in status.js, rows.js and render.js.
import { buildRows, filterRows, parseState, revealTarget, urlFor, vendorsOf } from "./rows.js";
import { renderBrandOptions, renderDetail, renderProvenance, renderRows, renderUnsupported } from "./render.js";

const CONTROLS = ["q", "brand", "platform", "status", "transport"];
const $ = (id) => document.getElementById(id);

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

const readControls = () => Object.fromEntries(CONTROLS.map((id) => [id, $(id).value.trim()]));

function writeControls(state) {
  for (const id of CONTROLS) $(id).value = state[id] ?? "";
}

function start(catalog, reports) {
  const allRows = buildRows(catalog, reports.reports);
  const byKey = new Map(allRows.map((row) => [`${row.id}|${row.family}`, row]));

  $("brand").insertAdjacentHTML("beforeend", renderBrandOptions(vendorsOf(allRows)));
  $("updated").textContent = `Last updated ${catalog.generatedFrom.generatedAt.slice(0, 10)}.`;
  $("provenance").innerHTML = renderProvenance(catalog.generatedFrom);
  $("unsupported").innerHTML = renderUnsupported(catalog.unsupported);

  function show() {
    const rows = filterRows(allRows, readControls());
    $("rows").innerHTML = renderRows(rows);
    $("count").textContent = `Showing ${rows.length} of ${allRows.length} rows.`;
  }

  function followHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const state = id ? revealTarget(allRows, readControls(), id) : null;
    if (!state) return;
    writeControls(state);
    history.replaceState(null, "", urlFor(location.pathname, state, location.hash));
    show();
    const targets = document.querySelectorAll(`tr[data-model="${CSS.escape(id)}"]`);
    targets.forEach((tr) => tr.classList.add("is-target"));
    targets[0]?.scrollIntoView({ block: "center" });
  }

  for (const id of CONTROLS) {
    $(id).addEventListener("input", () => {
      history.replaceState(null, "", urlFor(location.pathname, readControls(), location.hash));
      show();
    });
  }

  $("rows").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-cell]");
    if (!button) return;
    const row = button.closest("tr");
    const open = row.nextElementSibling?.classList.contains("detail") ? row.nextElementSibling : null;
    const reopening = open?.dataset.cell === button.dataset.cell;
    if (open) {
      open.remove();
      row.querySelectorAll('button[aria-expanded="true"]').forEach((b) => b.setAttribute("aria-expanded", "false"));
    }
    if (reopening) return;
    const [id, family, platform] = button.dataset.cell.split("|");
    row.insertAdjacentHTML("afterend", renderDetail(byKey.get(`${id}|${family}`), platform));
    button.setAttribute("aria-expanded", "true");
  });

  window.addEventListener("hashchange", followHash);
  writeControls(parseState(location.search));
  show();
  followHash();
}

Promise.all([fetchJson("/computers/data/catalog.json"), fetchJson("/computers/data/reports.json")])
  .then(([catalog, reports]) => start(catalog, reports))
  .catch((error) => {
    console.error(error);
    $("error").hidden = false;
  });
