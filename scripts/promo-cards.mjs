/**
 * Promotional cards for the launch campaign, 1600x900 (16:9, what X crops to).
 *
 *     pnpm promo:cards [outDir]
 *
 * Same construction as the Open Graph card and for the same reason: built from
 * the shipped fonts, the real palette and, where a card shows the product, the
 * real capture. A promo image drawn from a second set of values is how a launch
 * ends up advertising something that does not look like what you ship.
 *
 * Each card is one claim. Nothing here says anything the README does not.
 */
import { strict as assert } from "node:assert";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = resolve(process.argv[2] ?? join(ROOT, ".promo"));
const WIDTH = 1600;
const HEIGHT = 900;

const FONT = (weight, file) => `
  @font-face {
    font-family: "${file.startsWith("inter") ? "Inter" : "JetBrains Mono"}";
    font-weight: ${weight};
    src: url("${pathToFileURL(join(ROOT, "node_modules/@autostand/ui/fonts", file)).href}") format("woff2");
  }`;

const SHELL = (body, extraCss = "") => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
${FONT(400, "inter-400.woff2")}
${FONT(500, "inter-500.woff2")}
${FONT(600, "inter-600.woff2")}
${FONT(700, "inter-700.woff2")}
${FONT(400, "jetbrains-mono-400.woff2")}
${FONT(500, "jetbrains-mono-500.woff2")}
${FONT(700, "jetbrains-mono-700.woff2")}
:root{
  --slate-50:#f8fafc; --slate-300:#cbd5e1; --slate-400:#94a3b8; --slate-500:#64748b;
  --slate-700:#334155; --slate-800:#1e293b; --slate-900:#0f172a; --slate-950:#020617;
  --blue-400:#60a5fa; --blue-600:#2563eb; --green-400:#4ade80; --amber-400:#fbbf24;
  --red-400:#f87171; --violet-400:#a78bfa;
}
*{margin:0;padding:0;box-sizing:border-box}
body{
  width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;position:relative;
  font-family:"Inter",system-ui,sans-serif;color:var(--slate-50);
  background:
    radial-gradient(1100px 760px at 6% -12%, rgba(37,99,235,.30), transparent 62%),
    linear-gradient(135deg, var(--slate-950), var(--slate-900));
  padding:76px 84px;display:flex;flex-direction:column;
}
body::before{
  content:"";position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(148,163,184,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,163,184,.05) 1px, transparent 1px);
  background-size:28px 28px;
  mask-image:linear-gradient(110deg,#000 0%,transparent 70%);
}
/* Centred, not top-aligned: X crops a 16:9 preview towards the middle in the
   feed, so a card that hangs its content off the top loses it there. */
.body{position:relative;display:flex;flex-direction:column;justify-content:center;height:100%}
.eyebrow{
  font-family:"JetBrains Mono",monospace;font-weight:500;font-size:19px;
  letter-spacing:.09em;text-transform:uppercase;color:var(--blue-400);
}
h1{font-size:62px;font-weight:700;letter-spacing:-.028em;line-height:1.08;margin-top:18px;max-width:1180px}
h1 em{font-style:normal;color:var(--blue-400)}
.lede{font-size:27px;line-height:1.42;color:var(--slate-400);margin-top:22px;max-width:1080px}
.foot{
  margin-top:58px;display:flex;align-items:center;gap:14px;
  font-family:"JetBrains Mono",monospace;font-weight:500;font-size:20px;color:var(--slate-500);
}
.foot .mark{width:34px;height:34px;border-radius:9px;background:var(--blue-600);display:grid;place-items:center}
.foot b{color:var(--slate-300);font-weight:500}
.mono{font-family:"JetBrains Mono",monospace}
${extraCss}
</style></head><body><div class="body">${body}
<div class="foot">
  <span class="mark"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4.5 12.6 9.4 17.5 19.5 6.5" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  <b>autostand</b> · autostand.maecly.com · MIT
</div></div></body></html>`;

/**
 * A window frame around a real capture, cropped to the interesting part.
 *
 * The capture is inlined as a data URI rather than linked: `setContent` gives
 * the page an `about:blank` origin, which is not allowed to load `file://`
 * subresources, and the frame renders empty with no error anywhere.
 */
async function shot(file, top = 0, height = 470) {
  const png = await readFile(join(ROOT, "public/screenshots", file));
  return `
  <div class="shot">
    <div class="bar"><span></span><span></span><span></span></div>
    <div class="clip" style="height:${height}px">
      <img src="data:image/png;base64,${png.toString("base64")}" style="margin-top:-${top}px">
    </div>
  </div>`;
}

const SHOT_CSS = `
.shot{margin-top:38px;border:1px solid var(--slate-700);border-radius:14px 14px 0 0;overflow:hidden;
      box-shadow:0 40px 90px -34px rgba(2,6,23,.95)}
.bar{height:32px;display:flex;align-items:center;gap:7px;padding:0 14px;background:var(--slate-800);
     border-bottom:1px solid var(--slate-700)}
.bar span{width:9px;height:9px;border-radius:999px;background:var(--slate-700)}
.clip{overflow:hidden}
.clip img{display:block;width:100%}`;

const CARDS = [
  {
    name: "01-what-it-is",
    css: SHOT_CSS,
    html: `
      <div class="eyebrow">v1.0.0 · macOS · Windows · Linux</div>
      <h1>Your standup, written from <em>what you actually did</em>.</h1>
      <div class="lede">Reads your commits, pull requests and notes, then files a structured standup every working day.</div>
      ${await shot("06-dashboard-dark.png", 60, 420)}`,
  },
  {
    name: "02-provenance",
    css: `
      table{margin-top:40px;width:100%;border-collapse:collapse;font-size:22px}
      th{text-align:left;padding:14px 18px;background:rgba(30,41,59,.7);color:var(--slate-400);
         font-weight:500;font-size:19px;letter-spacing:.04em;text-transform:uppercase}
      td{padding:17px 18px;border-top:1px solid var(--slate-800);color:var(--slate-300);vertical-align:middle}
      td.src{font-family:"JetBrains Mono",monospace;font-size:19px}
      .tag{display:inline-flex;align-items:center;gap:8px;padding:5px 13px;border-radius:999px;
           font-family:"JetBrains Mono",monospace;font-size:17px;border:1px solid}
      .tag i{width:8px;height:8px;border-radius:999px;background:currentColor;font-style:normal}
      .commit{color:var(--green-400);border-color:rgba(74,222,128,.35)}
      .github{color:var(--blue-400);border-color:rgba(96,165,250,.35)}
      .note{color:var(--amber-400);border-color:rgba(251,191,36,.35)}
      .phantom{color:var(--red-400);border-color:rgba(248,113,113,.4)}`,
    html: `
      <div class="eyebrow">Anti-backdating</div>
      <h1>Every bullet traced back to the thing that proves it.</h1>
      <table>
        <tr><th>Standup bullet</th><th>Evidence</th><th></th></tr>
        <tr><td>Implemented the LlmAdapter trait for six providers</td>
            <td class="src">a3f19c2 feat(adapters/llm)</td>
            <td><span class="tag commit"><i></i>commit</span></td></tr>
        <tr><td>Opened autostand #41 — deterministic renderer fallback</td>
            <td class="src">PR #41, opened Aug 01</td>
            <td><span class="tag github"><i></i>github</span></td></tr>
        <tr><td>Paired on the cron parser with the platform team</td>
            <td class="src">Github_Context/FIF-136.md</td>
            <td><span class="tag note"><i></i>note</span></td></tr>
        <tr><td>Shipped the billing migration</td>
            <td class="src">No matching source</td>
            <td><span class="tag phantom"><i></i>phantom</span></td></tr>
      </table>`,
  },
  {
    name: "03-no-account",
    css: SHOT_CSS,
    html: `
      <div class="eyebrow">Built-in local AI</div>
      <h1>Usable with <em>no account at all</em>.</h1>
      <div class="lede">A curated GGUF runs through a process-isolated llama.cpp sidecar that ships inside every bundle. No sign-in, no key, no Ollama, no Homebrew.</div>
      ${await shot("05-local-ai.png", 150, 380)}`,
  },
  {
    name: "04-failover",
    css: `
      .chain{margin-top:46px;display:flex;flex-direction:column;gap:14px}
      .row{display:flex;align-items:center;gap:20px;padding:18px 24px;border-radius:14px;
           border:1px solid var(--slate-800);background:rgba(15,23,42,.66)}
      .row .n{font-family:"JetBrains Mono",monospace;font-size:19px;color:var(--slate-500);width:28px}
      .row .who{font-size:26px;font-weight:600;width:210px}
      .row .why{font-family:"JetBrains Mono",monospace;font-size:20px;color:var(--slate-400);flex:1}
      .row .st{font-family:"JetBrains Mono",monospace;font-size:18px;padding:5px 13px;border-radius:999px;border:1px solid}
      .skip{color:var(--amber-400);border-color:rgba(251,191,36,.35)}
      .fail{color:var(--red-400);border-color:rgba(248,113,113,.35)}
      .ok{color:var(--green-400);border-color:rgba(74,222,128,.35)}
      .row.live{border-color:rgba(96,165,250,.5);background:rgba(37,99,235,.12)}`,
    html: `
      <div class="eyebrow">Quota-aware failover</div>
      <h1>It skips the provider that <em>measurably</em> cannot answer.</h1>
      <div class="chain">
        <div class="row"><span class="n">01</span><span class="who">Claude</span>
          <span class="why">weekly window exhausted · read from your own login</span>
          <span class="st skip">skipped</span></div>
        <div class="row"><span class="n">02</span><span class="who">Codex</span>
          <span class="why">CLI not on PATH</span>
          <span class="st fail">unavailable</span></div>
        <div class="row live"><span class="n">03</span><span class="who">Gemini</span>
          <span class="why">rendered in 2.4 s · gemini-2.5-pro</span>
          <span class="st ok">used</span></div>
        <div class="row"><span class="n">04</span><span class="who">Local GGUF</span>
          <span class="why">never reached — and never needed a key</span>
          <span class="st ok">ready</span></div>
      </div>
      <div class="lede" style="font-size:23px">Usage nobody reported is never treated as exhausted.</div>`,
  },
  {
    name: "05-recursion",
    css: `
      .split{margin-top:42px;display:grid;grid-template-columns:1fr 1fr;gap:26px}
      .pane{border:1px solid var(--slate-800);border-radius:14px;overflow:hidden;background:rgba(15,23,42,.7)}
      .pane h2{font-size:20px;font-weight:500;font-family:"JetBrains Mono",monospace;padding:14px 20px;
               border-bottom:1px solid var(--slate-800);color:var(--slate-400)}
      .pane.bad h2{color:var(--red-400)} .pane.good h2{color:var(--green-400)}
      .pane pre{padding:20px;font-family:"JetBrains Mono",monospace;font-size:19px;line-height:1.62;
                color:var(--slate-300);white-space:pre-wrap}
      .dim{color:var(--slate-500)}`,
    html: `
      <div class="eyebrow">The bug worth knowing about</div>
      <h1>Your own prompt came back as <em>work you did</em>.</h1>
      <div class="split">
        <div class="pane bad"><h2>before</h2><pre>- Standup render request
- Context: commits since Aug 01
- Output format: Yesterday /
  Today / Blockers
<span class="dim">- FIF-136 wired the compile pipeline</span></pre></div>
        <div class="pane good"><h2>after</h2><pre><span class="dim">



</span>- FIF-136 wired the compile pipeline</pre></div>
      </div>
      <div class="lede" style="font-size:23px">The CLIs it drives log their own invocation, and the data sources read those logs. Filtered at the message and at the line, before gather ends.</div>`,
  },
  {
    name: "06-weekend",
    css: `
      .cal{margin-top:46px;display:flex;gap:14px;align-items:stretch}
      .day{flex:1;border:1px solid var(--slate-800);border-radius:14px;padding:22px 20px;background:rgba(15,23,42,.66)}
      .day .d{font-family:"JetBrains Mono",monospace;font-size:20px;color:var(--slate-500)}
      .day .w{margin-top:12px;font-size:22px;color:var(--slate-300)}
      .day.lost{border-color:rgba(248,113,113,.4);background:rgba(248,113,113,.07)}
      .day.lost .w{color:var(--red-400)}
      .day.file{border-color:rgba(96,165,250,.5);background:rgba(37,99,235,.13)}
      .day.file .w{color:var(--blue-400);font-family:"JetBrains Mono",monospace;font-size:20px}
      .arrow{align-self:center;color:var(--slate-600);font-size:34px}`,
    html: `
      <div class="eyebrow">Fixed in 1.0.0</div>
      <h1>Weekend work used to land in <em>no standup at all</em>.</h1>
      <div class="cal">
        <div class="day lost"><div class="d">Fri</div><div class="w">4 commits</div></div>
        <div class="day lost"><div class="d">Sat</div><div class="w">1 commit</div></div>
        <div class="day lost"><div class="d">Sun</div><div class="w">2 commits</div></div>
        <div class="arrow">→</div>
        <div class="day file"><div class="d">Mon</div><div class="w">2026-08-04.md</div></div>
      </div>
      <div class="lede" style="font-size:23px">The window was computed two business days back and shifted a day into the past, so no file's range ever contained a Saturday. A test now replays real headers from the original repository, byte for byte.</div>`,
  },
  {
    name: "07-numbers",
    css: `
      .grid{margin-top:52px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
      .stat{border:1px solid var(--slate-800);border-radius:16px;padding:30px 26px;background:rgba(15,23,42,.66)}
      .stat b{display:block;font-size:58px;font-weight:700;letter-spacing:-.03em;color:var(--blue-400)}
      .stat span{display:block;margin-top:10px;font-size:21px;color:var(--slate-400);line-height:1.35}`,
    html: `
      <div class="eyebrow">v1.0.0</div>
      <h1>What is actually in the box.</h1>
      <div class="grid">
        <div class="stat"><b>8</b><span>read-only activity sources</span></div>
        <div class="stat"><b>6</b><span>render providers, CLI first</span></div>
        <div class="stat"><b>13</b><span>standup format presets</span></div>
        <div class="stat"><b>1,100+</b><span>Rust tests, all hermetic</span></div>
      </div>
      <div class="lede" style="font-size:23px">Rust workspace + Tauri v2. Three installers, one per platform. Nothing leaves your machine unless you point it at a provider yourself.</div>`,
  },
  {
    name: "08-install",
    css: `
      .plats{margin-top:52px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
      .p{border:1px solid var(--slate-800);border-radius:16px;padding:32px 28px;background:rgba(15,23,42,.66)}
      .p h3{font-size:30px;font-weight:600}
      .p .f{margin-top:14px;font-family:"JetBrains Mono",monospace;font-size:22px;color:var(--blue-400)}
      .p .n{margin-top:14px;font-size:20px;color:var(--slate-400);line-height:1.4}`,
    html: `
      <div class="eyebrow">Download</div>
      <h1>One installer per platform. <em>No build required.</em></h1>
      <div class="plats">
        <div class="p"><h3>macOS</h3><div class="f">.dmg</div>
          <div class="n">Apple Silicon only. The build is arm64, not Intel.</div></div>
        <div class="p"><h3>Windows</h3><div class="f">-setup.exe</div>
          <div class="n">64-bit. An NSIS installer, not a portable exe.</div></div>
        <div class="p"><h3>Linux</h3><div class="f">.AppImage</div>
          <div class="n">x86_64, glibc ≥ 2.35. chmod +x and run.</div></div>
      </div>
      <div class="lede" style="font-size:23px">Every bundle carries its own inference sidecar, so local AI works with nothing else installed.</div>`,
  },
  {
    name: "09-from-memory",
    css: `
      .split{margin-top:44px;display:grid;grid-template-columns:1fr 1fr;gap:26px}
      .pane{border:1px solid var(--slate-800);border-radius:14px;overflow:hidden;background:rgba(15,23,42,.7)}
      .pane h2{font-size:20px;font-weight:500;font-family:"JetBrains Mono",monospace;padding:14px 20px;
               border-bottom:1px solid var(--slate-800);color:var(--slate-400)}
      .pane.bad h2{color:var(--amber-400)} .pane.good h2{color:var(--green-400)}
      .pane ul{padding:22px 24px;list-style:none;display:flex;flex-direction:column;gap:14px}
      .pane li{font-size:21px;line-height:1.4;color:var(--slate-300);padding-left:22px;position:relative}
      .pane li::before{content:"–";position:absolute;left:0;color:var(--slate-600)}
      .vague{color:var(--slate-500)}`,
    html: `
      <div class="eyebrow">The difference</div>
      <h1>Written from memory vs. written from <em>evidence</em>.</h1>
      <div class="split">
        <div class="pane bad"><h2>from memory</h2><ul>
          <li class="vague">Worked on the API</li>
          <li class="vague">Some bug fixes</li>
          <li class="vague">Meetings</li>
          <li class="vague">Continuing yesterday's task</li>
        </ul></div>
        <div class="pane good"><h2>from what you did</h2><ul>
          <li>Implemented the LlmAdapter trait for six providers</li>
          <li>Opened #41 — deterministic renderer fallback</li>
          <li>Reviewed #38 — IPC contracts</li>
          <li>Paired on the cron parser</li>
        </ul></div>
      </div>`,
  },
  {
    name: "10-origin",
    css: `
      .steps{margin-top:46px;display:flex;align-items:stretch;gap:18px}
      .step{flex:1;border:1px solid var(--slate-800);border-radius:16px;padding:26px 24px;background:rgba(15,23,42,.66)}
      .step .k{font-family:"JetBrains Mono",monospace;font-size:18px;color:var(--slate-500);letter-spacing:.06em}
      .step h3{margin-top:12px;font-size:27px;font-weight:600}
      .step p{margin-top:12px;font-size:19px;line-height:1.4;color:var(--slate-400)}
      .step.now{border-color:rgba(96,165,250,.5);background:rgba(37,99,235,.13)}
      .step.now h3{color:var(--blue-400)}`,
    html: `
      <div class="eyebrow">Where it came from</div>
      <h1>An Apps Script that grew into <em>a desktop app</em>.</h1>
      <div class="steps">
        <div class="step"><div class="k">BEFORE</div><h3>Google Apps Script</h3>
          <p>One file, one machine, one provider. Wrote the standup so I would stop forgetting what I did.</p></div>
        <div class="step"><div class="k">KEPT</div><h3>Every invariant</h3>
          <p>Same AUTO/MANUAL format, same business-day math, same accumulate-never-delete rule.</p></div>
        <div class="step now"><div class="k">NOW</div><h3>autostand 1.0</h3>
          <p>Rust + Tauri v2, eight sources, six providers, a scheduler and an audit trail.</p></div>
      </div>`,
  },
  {
    name: "11-open-source",
    css: `
      .pills{margin-top:44px;display:flex;flex-wrap:wrap;gap:14px}
      .pill{font-family:"JetBrains Mono",monospace;font-size:23px;padding:13px 24px;border-radius:999px;
            border:1px solid var(--slate-700);background:rgba(15,23,42,.72);color:var(--slate-300)}
      .pill.on{color:var(--green-400);border-color:rgba(74,222,128,.4)}
      .repo{margin-top:44px;font-family:"JetBrains Mono",monospace;font-size:31px;color:var(--blue-400)}`,
    html: `
      <div class="eyebrow">MIT licensed</div>
      <h1>Open source, and <em>local-first</em> in the boring literal sense.</h1>
      <div class="pills">
        <span class="pill on">no account required</span>
        <span class="pill on">no telemetry</span>
        <span class="pill on">no server</span>
        <span class="pill">your files, your folder</span>
        <span class="pill">read-only sources</span>
      </div>
      <div class="repo">github.com/MAECLY/autostand</div>`,
  },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  for (const card of CARDS) {
    const path = join(OUT, `${card.name}.png`);
    await page.setContent(SHELL(card.html, card.css ?? ""));
    await page.evaluate(() => document.fonts.ready);
    // A capture that has not decoded yet photographs as an empty frame.
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((image) =>
          image.complete ? null : new Promise((done) => image.addEventListener("load", done)),
        ),
      ),
    );
    await page.screenshot({ path });

    const png = await readFile(path);
    assert.equal(png.readUInt32BE(16), WIDTH, `${card.name} width`);
    assert.equal(png.readUInt32BE(20), HEIGHT, `${card.name} height`);
    // X will not attach a file over 5MB.
    assert.ok(png.length < 5 * 1024 * 1024, `${card.name} is ${png.length} bytes`);
    await writeFile(path, png);
    console.log(`${card.name}.png  ${(png.length / 1024).toFixed(0)} KiB`);
  }
} finally {
  await browser.close();
}
console.log(`\n${CARDS.length} cards -> ${OUT}`);
