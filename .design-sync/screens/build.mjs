import * as esbuild from "esbuild";
import { mkdirSync, cpSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "src");
const OUT = path.join(__dirname, "dist"); // mirrors the project root after upload
const SCREENS_OUT = path.join(OUT, "screens");
const DS_BUNDLE = path.join(__dirname, "..", "..", "ds-bundle");

mkdirSync(SCREENS_OUT, { recursive: true });

// Mirror the already-uploaded root assets locally so these screens can be
// smoke-tested exactly as they'll resolve once uploaded alongside them.
for (const f of ["styles.css", "_ds_bundle.css", "_ds_bundle.js"]) {
  cpSync(path.join(DS_BUNDLE, f), path.join(OUT, f));
}
cpSync(path.join(DS_BUNDLE, "_vendor"), path.join(OUT, "_vendor"), { recursive: true });

const SCREENS = ["dashboard", "users", "branding", "documents", "analytics"];

const TITLES = {
  dashboard: "Dashboard",
  users: "Users",
  branding: "Branding",
  documents: "Knowledge base",
  analytics: "Analytics",
};
const EXPORTS = {
  dashboard: "Dashboard",
  users: "Users",
  branding: "Branding",
  documents: "Documents",
  analytics: "Analytics",
};

for (const name of SCREENS) {
  await esbuild.build({
    entryPoints: [path.join(SRC, `${name}.tsx`)],
    outfile: path.join(SCREENS_OUT, `${name}.js`),
    bundle: true,
    format: "iife",
    globalName: "Screen",
    target: "es2019",
    loader: { ".tsx": "tsx" },
    jsxFactory: "h",
    jsxFragment: "Fragment",
    logLevel: "info",
  });
  console.log("built", name);

  const html = `<!-- @dsCard group="Screens" -->
<!doctype html>
<html><head><meta charset="utf-8">
  <title>${TITLES[name]}</title>
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="../_ds_bundle.css">
  <style>
    html,body{margin:0;min-height:100%}
    body{background:#fff}
    #root{padding:24px}
    @media (prefers-color-scheme: dark){ body{background:#000} }
  </style>
</head><body>
  <div id="root"></div>
  <script src="../_vendor/react.js"></script>
  <script src="../_vendor/react-dom.js"></script>
  <script src="../_ds_bundle.js"></script>
  <script src="./${name}.js"></script>
  <script>
    ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Screen.${EXPORTS[name]}));
  </script>
</body></html>
`;
  writeFileSync(path.join(SCREENS_OUT, `${name}.html`), html);
}

console.log("done -- local mirror at", OUT);
