// The /c page: reads the tag from the URL fragment (or the query, which the
// app also accepts) in the browser. Nothing is sent anywhere.
import { parsePassportTag } from "./tag.js";
import { formatDate, openInAppUrl, specRows, tagTitle } from "./display.js";

const show = (id) => {
  document.getElementById(id).hidden = false;
};

const query = window.location.hash.slice(1) || window.location.search.slice(1);
const locale = navigator.language || "en";

if (query === "") {
  show("info");
} else {
  const tag = parsePassportTag(query);
  if (!tag.ok) {
    show("invalid");
  } else {
    const title = tagTitle(tag);
    document.getElementById("title").textContent = title;
    document.title = `${title} - Submersion`;
    document.getElementById("newer").hidden = !tag.newerFormat;

    const spec = document.getElementById("spec");
    const rows = specRows(tag, locale);
    for (const [label, value] of rows) {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      spec.append(dt, dd);
    }
    spec.hidden = rows.length === 0;

    if (tag.writtenOn) {
      document.getElementById("written").textContent =
        `This tag was written on ${formatDate(tag.writtenOn, locale)}. ` +
        "Everything above is how the cylinder was then. " +
        "The passport in Submersion has the current record.";
    }
    document.getElementById("open").href = openInAppUrl(query);
    show("tag");
  }
}
