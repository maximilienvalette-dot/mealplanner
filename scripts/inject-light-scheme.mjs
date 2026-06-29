// Post-export : ajuste le <head> du HTML généré par Expo pour le web.
//   1) <meta name="color-scheme" content="only light"> -> désactive le thème
//      sombre automatique de Chrome dès le premier rendu.
//   2) viewport-fit=cover dans le <meta viewport> -> active les valeurs
//      env(safe-area-inset-*), nécessaires pour que la barre d'onglets ne soit
//      pas rognée par la barre de gestes en PWA plein écran.

import fs from "fs";

const file = "dist/index.html";

if (!fs.existsSync(file)) {
  console.error(`inject-web-fixes: ${file} introuvable`);
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");

// 1) color-scheme only light
if (html.includes('name="color-scheme"')) {
  console.log("inject-web-fixes: color-scheme déjà présent");
} else {
  html = html.replace(
    "</head>",
    '  <meta name="color-scheme" content="only light" />\n  </head>'
  );
  console.log("inject-web-fixes: color-scheme only light injecté");
}

// 2) viewport-fit=cover
if (html.includes("viewport-fit=cover")) {
  console.log("inject-web-fixes: viewport-fit déjà présent");
} else {
  const before = html;
  // Ajoute viewport-fit=cover au contenu du meta viewport existant.
  html = html.replace(
    /(<meta\s+name=["']viewport["']\s+content=["'])([^"']*)(["'])/i,
    (m, p1, content, p3) => `${p1}${content}, viewport-fit=cover${p3}`
  );
  if (html === before) {
    // Pas de meta viewport trouvé : on en ajoute un.
    html = html.replace(
      "</head>",
      '  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />\n  </head>'
    );
  }
  console.log("inject-web-fixes: viewport-fit=cover ajouté");
}

// 3) Marge de sécurité basse en CSS pur (ne dépend pas de la lib safe-area,
// qui ne renvoie pas l'inset en web). On réserve la hauteur de la barre de
// gestes sous le conteneur racine -> la barre d'onglets n'est plus rognée.
if (html.includes("id=\"safe-area-fix\"")) {
  console.log("inject-web-fixes: style safe-area déjà présent");
} else {
  html = html.replace(
    "</head>",
    `  <style id="safe-area-fix">
    html, body, #root { background-color: #FFFFFF; }
    /* 100svh = hauteur de viewport "sûre" (exclut l'UI navigateur) : évite que
       le bas de l'app (barre d'onglets) passe sous le bord visible sur mobile. */
    #root {
      box-sizing: border-box;
      height: 100vh;
      height: 100svh;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    @media (display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui) {
      #root { padding-bottom: max(env(safe-area-inset-bottom, 0px), 28px); }
    }
  </style>\n  </head>`
  );
  console.log("inject-web-fixes: hauteur 100svh + padding safe-area injectés sur #root");
}

fs.writeFileSync(file, html);
