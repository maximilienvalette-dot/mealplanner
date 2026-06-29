// Post-export : insère <meta name="color-scheme" content="only light"> dans le
// HTML généré par Expo, pour désactiver le thème sombre automatique de Chrome
// dès le premier rendu (avant l'exécution du JS).

import fs from "fs";

const file = "dist/index.html";

if (!fs.existsSync(file)) {
  console.error(`inject-light-scheme: ${file} introuvable`);
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");

if (html.includes('name="color-scheme"')) {
  console.log("inject-light-scheme: balise déjà présente");
} else {
  html = html.replace(
    "</head>",
    '  <meta name="color-scheme" content="only light" />\n  </head>'
  );
  fs.writeFileSync(file, html);
  console.log("inject-light-scheme: color-scheme only light injecté");
}
