import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const svg = readFileSync("public/favicon.svg");
const svgText = new TextDecoder().decode(svg);

for (const size of [16, 32]) {
  const resvg = new Resvg(svgText, { fitTo: { mode: "width", value: size } });
  const pngData = resvg.render();
  writeFileSync(`public/favicon-${size}.png`, pngData.asPng());
  console.log(`Generated favicon-${size}.png`);
} 