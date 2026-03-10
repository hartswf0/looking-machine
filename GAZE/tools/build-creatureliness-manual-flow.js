#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DATASET_FILE = path.join(ROOT, "creatureliness-cold-delivery.md");
const PACKAGE_FILE = path.join(ROOT, "creatureliness-10-agent-package.json");

const OUT_DIR = path.join(ROOT, "creatureliness-manual-flow");
const PAGES_DIR = path.join(OUT_DIR, "pages");
const PROMPTS_DIR = path.join(OUT_DIR, "prompts");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function splitLines(text) {
  return String(text || "").replace(/\r\n/g, "\n").split("\n");
}

function escapeHtml(input) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slug(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseActs(markdown) {
  const lines = splitLines(markdown);
  const sections = [];
  let current = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    const match = line.match(/^(\d+\.0)\s+(.+)$/);
    if (match) {
      if (current) sections.push(current);
      current = {
        marker: match[1],
        major: match[2].trim(),
        text: ""
      };
      continue;
    }

    if (current) {
      current.text += `${current.text ? "\n" : ""}${lines[i]}`;
    }
  }

  if (current) sections.push(current);

  return sections.map((section, idx) => ({
    index: idx + 1,
    marker: section.marker,
    major: section.major,
    text: String(section.text || "").trim()
  }));
}

function extractTaggedSection(sectionText, sectionName) {
  const rx = new RegExp(`<section\\s+name=\"${sectionName}\">([\\s\\S]*?)<\\/section>`, "i");
  const match = String(sectionText || "").match(rx);
  return match ? match[1].trim() : "";
}

function extractField(discoveryText, fieldName) {
  const rx = new RegExp(`<field\\s+name=\"${fieldName}\">([\\s\\S]*?)<\\/field>`, "i");
  const match = String(discoveryText || "").match(rx);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function compactLine(text, fallback) {
  const out = String(text || "").replace(/\s+/g, " ").trim();
  return out || fallback;
}

function styleLens(agent) {
  const key = `${agent.id} ${agent.label}`.toLowerCase();
  if (key.includes("westworld")) return "Biomechanical austerity, porcelain mechanics, monochrome precision";
  if (key.includes("true detective")) return "Industrial noir decay, sulfuric mood, ritual dread";
  if (key.includes("alien")) return "Near-dark emergence, void tension, slow typographic reveal";
  if (key.includes("andromeda")) return "Clinical telemetry, containment interfaces, procedural escalation";
  if (key.includes("high castle")) return "Archival propaganda collisions, ideological dissonance";
  if (key.includes("ghost")) return "Cybernetic metamorphosis, liquid body/machine transitions";
  if (key.includes("bass")) return "Geometric reduction, cut-paper silhouettes, percussive rhythm";
  if (key.includes("deconstruction")) return "Motif disassembly/reassembly with explicit transition logic";
  if (key.includes("dna")) return "Forensic motif extraction and strict title-sequence grammar";
  if (key.includes("optical")) return "Apparatus-aware gaze, surveillance overlays, optical pressure";
  return "Hard-edged editorial mechanics and high-contrast typographic timing";
}

function accentColor(agent) {
  const map = {
    AG01: "#c21807",
    AG02: "#8d1e1e",
    AG03: "#f04e23",
    AG04: "#7f2035",
    AG05: "#b5122d",
    AG06: "#a42516",
    AG07: "#8d3f2b",
    AG08: "#9d1626",
    AG09: "#7c2d48",
    AG10: "#6f1f42"
  };
  return map[agent.id] || "#c21807";
}

function buildBeatMap(seed, outlineCut, resonance, lead) {
  return [
    `0.0-1.2s  Black field. Mechanical ignition from the seed motif: ${seed}`,
    "1.2-2.4s  Split-screen expansion (2x1 to 3x2), percussive jump-cuts on each hit.",
    `2.4-3.6s  Constraint rupture: ${outlineCut}`,
    "3.6-4.8s  Contact event between body and apparatus under stress.",
    "4.8-6.0s  Instrument escalation: tachometer, gearshift, speedometer, exhaust pulse.",
    `6.0-7.2s  Emergent resonance enters frame: ${resonance}`,
    "7.2-8.4s  Typography snaps in via negative space, not fade transitions.",
    "8.4-9.6s  Grid collapses toward singular focal intensity (eye, wheel, or gauge).",
    `9.6-10.8s Lock image pre-resolution: ${lead}`,
    "10.8-12.0s Hard cut to black. Final red line pulse. Immediate reset for loop."
  ];
}

function buildVideoPrompt(section, agent, insight, beatMap) {
  const lens = styleLens(agent);
  const lines = [
    `Create a 12-second title sequence for \"${section.marker} ${section.major}\" using a Saul Bass Grand Prix split-screen discipline.`,
    `Agent lens: ${agent.label}.`,
    `Stylistic lens: ${lens}.`,
    "Aesthetic constraints: industrial palette (engine black, steel gray, racing red, optic white), hard cuts only, no smooth pans.",
    `Core seed motif: ${insight.seed}`,
    `Straightjacket cut: ${insight.outlineCut}`,
    `Emergent resonance: ${insight.resonance}`,
    "Mechanical motifs: macro close-ups of gauges, gear shifts, steering wheel torque, exhaust pulses, and driver-eye intensity.",
    "Typography: bold wide-set sans-serif, uppercase, snapped into frame on percussive beats with mix-blend overlay.",
    "Beat map:",
    ...beatMap.map((beat) => `- ${beat}`),
    "Output must provide both: (1) Master AI Video Prompt and (2) complete single-file HTML/CSS/JS animation implementation."
  ];
  return lines.join("\n");
}

function pickWords(section, insight, agent) {
  const tokens = `${section.major} ${insight.seed} ${agent.label}`
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length > 2);

  const unique = [...new Set(tokens.map((t) => t.toUpperCase()))];
  const a = unique[0] || "THE";
  const b = unique[1] || "FAST";
  const c = unique[2] || "AND";
  const d = unique[3] || "FURIOUS";

  return { a, b, c, d };
}

function buildPromptMarkdown(section, agent, insight, beatMap, videoPrompt, pageRelPath) {
  const lines = [
    `# ${section.marker} ${section.major} :: ${agent.id} ${agent.label}`,
    "",
    "## 1. Concept Breakdown",
    `- seed: ${insight.seed}`,
    `- straightjackets cut: ${insight.outlineCut}`,
    `- emergent resonance: ${insight.resonance}`,
    `- style lens: ${styleLens(agent)}`,
    "",
    "## 2. The Beat Map",
    ...beatMap.map((beat, idx) => `${idx + 1}. ${beat}`),
    "",
    "## 3. The Final Output",
    "### Master AI Video Prompt",
    "```text",
    videoPrompt,
    "```",
    "",
    "### Single-File HTML/CSS/JS Animation",
    `- artifact page: ${pageRelPath}`,
    "",
    "### Source Prompt Files",
    ...(agent.sourcePaths || []).map((p) => `- ${p}`)
  ];

  return lines.join("\n");
}

function buildPageHtml(params) {
  const {
    section,
    agent,
    insight,
    beatMap,
    videoPrompt,
    words,
    accent,
    promptRelPath
  } = params;

  const conceptItems = [
    `Seed: ${insight.seed}`,
    `Straightjackets Cut: ${insight.outlineCut}`,
    `Emergent Resonance: ${insight.resonance}`,
    `Style Lens: ${styleLens(agent)}`
  ];

  const conceptHtml = conceptItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const beatHtml = beatMap.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const promptEscaped = escapeHtml(videoPrompt);
  const promptLines = splitLines(videoPrompt).length;
  const sectionLabel = `${section.marker} ${section.major}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(sectionLabel)} :: ${escapeHtml(agent.label)}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg: #eeebe4;
      --panel: #f8f5ef;
      --ink: #14171e;
      --muted: #5f6570;
      --line: #b8b1a4;
      --primary: #0f1522;
      --accent: ${accent};
      --black: #0d0d0d;
      --oil: #1a1a1a;
      --steel: #707070;
      --white: #f5f5f0;
      --radius: 12px;
    }

    html, body {
      width: 100%;
      min-height: 100%;
      background: var(--bg);
      color: var(--ink);
      font-family: "Avenir Next", "Segoe UI", system-ui, sans-serif;
    }

    .shell {
      max-width: 1280px;
      margin: 0 auto;
      padding: 10px;
      display: grid;
      gap: 8px;
    }

    .pane {
      border: 2px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      overflow: hidden;
    }

    .head {
      padding: 8px;
      border-bottom: 2px solid var(--line);
      background: #fff;
      display: grid;
      gap: 6px;
    }

    .kicker {
      font: 900 0.66rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: var(--muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.25;
    }

    .meta {
      color: var(--muted);
      font-size: 0.74rem;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .btn {
      min-height: 30px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 10px;
      background: #fff;
      color: var(--ink);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      font: 800 0.62rem/1.1 inherit;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
    }

    .btn.primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
    }

    .flow {
      display: grid;
      gap: 8px;
      padding: 8px;
      grid-template-columns: minmax(0, 1fr);
    }

    .step {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #fff;
      overflow: hidden;
    }

    .step-head {
      padding: 7px 8px;
      border-bottom: 1px solid var(--line);
      font-size: 0.76rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-weight: 900;
      color: var(--muted);
      background: #faf9f5;
    }

    .step-body {
      padding: 8px;
      display: grid;
      gap: 8px;
    }

    .compact-list {
      list-style: none;
      display: grid;
      gap: 6px;
      font-size: 0.78rem;
      line-height: 1.35;
    }

    .compact-list li {
      border: 1px solid #ece6da;
      border-radius: 8px;
      padding: 6px 8px;
      background: #fcfbf8;
    }

    .prompt-box {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0f131a;
      color: #dfe5ef;
      font: 0.72rem/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      max-height: 210px;
      overflow: auto;
      white-space: pre-wrap;
      padding: 8px;
    }

    .source-box {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #f9f7f2;
      font: 0.68rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
      max-height: 220px;
      overflow: auto;
      white-space: pre;
      padding: 8px;
      color: #283043;
    }

    .anim {
      padding: 8px;
    }

    #stage {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      min-height: 260px;
      background: var(--black);
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 10px;
      isolation: isolate;
    }

    #grid {
      position: absolute;
      inset: 0;
      display: grid;
      gap: 3px;
      background: #070707;
      opacity: 0;
      transition: opacity 0s;
      z-index: 1;
    }

    #grid.cfg-single { grid-template-columns: 1fr; grid-template-rows: 1fr; }
    #grid.cfg-2x1 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; }
    #grid.cfg-2x2 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
    #grid.cfg-3x2 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr; }
    #grid.cfg-3x1 { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr 1fr; }

    .panel {
      position: relative;
      overflow: hidden;
      background: var(--oil);
    }

    .panel svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .panel::after {
      content: "";
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px);
      pointer-events: none;
      z-index: 8;
    }

    .panel.blur-x { animation: blurX 0.32s linear infinite; }
    .panel.pulse { animation: pulse 0.4s ease-in-out infinite alternate; }

    @keyframes blurX {
      0% { filter: blur(0px) brightness(1); }
      50% { filter: blur(2px) brightness(1.35); }
      100% { filter: blur(0px) brightness(1); }
    }

    @keyframes pulse {
      from { filter: brightness(0.82); }
      to { filter: brightness(1.28); }
    }

    #text-layer {
      position: absolute;
      inset: 0;
      z-index: 20;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding: 6vw;
      mix-blend-mode: screen;
    }

    .word {
      display: block;
      line-height: 0.85;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 900;
      transform: translateX(-60px);
      opacity: 0;
      transition: none;
      text-shadow: 0 0 1px rgba(0,0,0,0.8);
    }

    .word.visible { transform: translateX(0); opacity: 1; }
    .word.large { font-size: clamp(2.8rem, 10vw, 8rem); color: var(--white); }
    .word.small { font-size: clamp(0.9rem, 3.2vw, 1.6rem); letter-spacing: 0.18em; color: var(--steel); }
    .word.xl { font-size: clamp(3.2rem, 14vw, 10rem); color: var(--accent); mix-blend-mode: normal; }

    #red-line {
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 4px;
      background: var(--accent);
      transform: scaleX(0);
      transform-origin: left;
      opacity: 0;
      z-index: 24;
    }

    #red-line.pulse-line { animation: redLine 0.6s ease-out forwards; }

    @keyframes redLine {
      0% { transform: scaleX(0); opacity: 1; }
      60% { transform: scaleX(1); opacity: 1; }
      100% { transform: scaleX(1); opacity: 0; }
    }

    #grain {
      position: absolute;
      inset: 0;
      z-index: 30;
      pointer-events: none;
      opacity: 0.06;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
      background-size: 170px 170px;
    }

    .mini-meta {
      margin-top: 8px;
      font-size: 0.7rem;
      color: var(--muted);
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    @media (min-width: 1020px) {
      .flow {
        grid-template-columns: 1fr 1fr;
      }

      .flow .step:nth-child(3) {
        grid-column: 1 / -1;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="pane">
      <header class="head">
        <div class="kicker">Manual Completion Artifact</div>
        <h1>${escapeHtml(sectionLabel)} :: ${escapeHtml(agent.id)} ${escapeHtml(agent.label)}</h1>
        <div class="meta">Output flow strictly mapped to: Concept Breakdown -> Beat Map -> Final Output.</div>
        <div class="actions">
          <a class="btn" href="../index.html">Manual Index</a>
          <a class="btn" href="../../graph-operator-creatureliness.html">Graph Operator</a>
          <a class="btn" href="../${escapeHtml(promptRelPath)}">Prompt Markdown</a>
          <button id="copyPrompt" class="btn primary" type="button">Copy Video Prompt</button>
          <button id="copySource" class="btn" type="button">Copy HTML Source</button>
        </div>
      </header>
    </section>

    <section class="flow pane">
      <article class="step">
        <div class="step-head">1. Concept Breakdown</div>
        <div class="step-body">
          <ul class="compact-list">${conceptHtml}</ul>
        </div>
      </article>

      <article class="step">
        <div class="step-head">2. The Beat Map</div>
        <div class="step-body">
          <ol class="compact-list">${beatHtml}</ol>
        </div>
      </article>

      <article class="step">
        <div class="step-head">3. The Final Output</div>
        <div class="step-body">
          <div>
            <strong style="font-size:0.74rem; letter-spacing:0.04em; text-transform:uppercase; color:var(--muted);">Master AI Video Prompt (${promptLines} lines)</strong>
            <pre id="videoPromptText" class="prompt-box">${promptEscaped}</pre>
          </div>
          <div>
            <strong style="font-size:0.74rem; letter-spacing:0.04em; text-transform:uppercase; color:var(--muted);">Single-File HTML/CSS/JS Source</strong>
            <pre id="htmlSource" class="source-box">Loading current page source...</pre>
          </div>
          <div class="mini-meta">
            <span>Section: ${escapeHtml(section.marker)}</span>
            <span>Agent: ${escapeHtml(agent.id)}</span>
            <span>Accent: ${escapeHtml(accent)}</span>
          </div>
        </div>
      </article>
    </section>

    <section class="pane anim">
      <div id="stage">
        <div id="grid" class="cfg-single"></div>

        <div id="text-layer" aria-hidden="true">
          <span id="word-a" class="word large">${escapeHtml(words.a)}</span>
          <span id="word-b" class="word small">${escapeHtml(words.b)}</span>
          <span id="word-c" class="word small">${escapeHtml(words.c)}</span>
          <span id="word-d" class="word xl">${escapeHtml(words.d)}</span>
        </div>

        <div id="red-line"></div>
        <div id="grain"></div>
      </div>
    </section>
  </main>

  <script>
    const VIDEO_PROMPT = ${JSON.stringify(videoPrompt)};

    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return Promise.resolve();
    }

    document.getElementById("copyPrompt").addEventListener("click", function () {
      copyText(VIDEO_PROMPT);
    });

    document.getElementById("copySource").addEventListener("click", function () {
      const source = document.getElementById("htmlSource").textContent || "";
      copyText(source);
    });

    fetch(window.location.href, { cache: "no-store" })
      .then(function (res) { return res.text(); })
      .then(function (html) {
        document.getElementById("htmlSource").textContent = html;
      })
      .catch(function () {
        document.getElementById("htmlSource").textContent = "Source load failed.";
      });

    const grid = document.getElementById("grid");
    const redLine = document.getElementById("red-line");

    const WORD_IDS = ["word-a", "word-b", "word-c", "word-d"];

    const PANELS = {
      tachometer: function (angle) {
        const a = typeof angle === "number" ? angle : -120;
        let ticks = "";
        for (let i = 0; i < 24; i += 1) {
          const deg = (i / 24) * 260 - 130;
          const rad = deg * Math.PI / 180;
          const x1 = 100 + 58 * Math.cos(rad);
          const y1 = 100 + 58 * Math.sin(rad);
          const x2 = 100 + 68 * Math.cos(rad);
          const y2 = 100 + 68 * Math.sin(rad);
          const major = i % 4 === 0;
          const hot = i > 18;
          ticks += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (hot ? '${accent}' : '#888') + '" stroke-width="' + (major ? 2.4 : 1) + '"/>';
        }

        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0f0f0f"/>' +
          '<circle cx="100" cy="100" r="84" fill="none" stroke="#2c2c2c" stroke-width="4"/>' +
          '<circle cx="100" cy="100" r="68" fill="#0a0a0a" stroke="#262626" stroke-width="2"/>' +
          ticks +
          '<line x1="100" y1="100" x2="' + (100 + 56 * Math.cos((a - 90) * Math.PI / 180)) + '" y2="' + (100 + 56 * Math.sin((a - 90) * Math.PI / 180)) + '" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="100" cy="100" r="6" fill="#333" stroke="${accent}" stroke-width="2"/>' +
          '<text x="100" y="132" text-anchor="middle" fill="#666" font-size="8" font-family="monospace">RPM x 100</text>' +
          '</svg>';
      },

      gearshift: function (gear) {
        const g = gear || 1;
        const nodes = [[70,80],[130,80],[70,110],[130,110],[70,140],[130,140]];
        let map = "";
        for (let i = 0; i < nodes.length; i += 1) {
          const x = nodes[i][0];
          const y = nodes[i][1];
          map += '<line x1="100" y1="' + y + '" x2="' + x + '" y2="' + y + '" stroke="#464646" stroke-width="3"/>';
          map += '<circle cx="' + x + '" cy="' + y + '" r="10" fill="#1a1a1a" stroke="' + (i === g - 1 ? '${accent}' : '#4a4a4a') + '" stroke-width="2"/>';
        }

        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#111"/>' +
          '<rect x="88" y="22" width="24" height="156" rx="4" fill="#1d1d1d" stroke="#3c3c3c"/>' +
          '<circle cx="100" cy="30" r="21" fill="#2a2a2a" stroke="#555" stroke-width="3"/>' +
          '<circle cx="100" cy="30" r="13" fill="#121212"/>' +
          '<text x="100" y="35" text-anchor="middle" fill="${accent}" font-size="15" font-family="monospace">' + g + '</text>' +
          map +
          '</svg>';
      },

      speedometer: function (speed) {
        const s = Math.max(0, Math.min(320, speed || 0));
        const needle = (s / 320) * 200 - 100;
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#101010"/>' +
          '<circle cx="100" cy="108" r="82" fill="none" stroke="#1f1f1f" stroke-width="18"/>' +
          '<line x1="100" y1="108" x2="' + (100 + 60 * Math.cos((needle - 90) * Math.PI / 180)) + '" y2="' + (108 + 60 * Math.sin((needle - 90) * Math.PI / 180)) + '" stroke="${accent}" stroke-width="2.6" stroke-linecap="round"/>' +
          '<circle cx="100" cy="108" r="7" fill="${accent}"/>' +
          '<text x="100" y="152" text-anchor="middle" fill="#666" font-size="9" font-family="monospace">MPH</text>' +
          '</svg>';
      },

      steeringWheel: function (rot) {
        const r = rot || 0;
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#101010"/>' +
          '<g transform="translate(100 100) rotate(' + r + ')">' +
          '<circle r="78" fill="none" stroke="#2b2b2b" stroke-width="18"/>' +
          '<circle r="78" fill="none" stroke="#4b4b4b" stroke-width="2"/>' +
          '<line x1="0" y1="22" x2="0" y2="60" stroke="#555" stroke-width="10" stroke-linecap="round"/>' +
          '<line x1="19" y1="-11" x2="52" y2="-30" stroke="#555" stroke-width="10" stroke-linecap="round"/>' +
          '<line x1="-19" y1="-11" x2="-52" y2="-30" stroke="#555" stroke-width="10" stroke-linecap="round"/>' +
          '<circle r="22" fill="#1e1e1e" stroke="#5b5b5b" stroke-width="3"/>' +
          '<circle r="8" fill="${accent}"/>' +
          '</g></svg>';
      },

      exhaust: function (frame) {
        const f = frame || 0;
        let smoke = '';
        if (f > 0) {
          smoke += '<ellipse cx="35" cy="100" rx="' + (8 + f * 3) + '" ry="' + (5 + f * 2) + '" fill="rgba(194,24,7,0.' + (2 + f) + ')"/>';
        }
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0d0d0d"/>' +
          '<rect x="60" y="82" width="120" height="36" rx="18" fill="#1a1a1a" stroke="#333" stroke-width="3"/>' +
          '<circle cx="62" cy="100" r="20" fill="#111" stroke="#444" stroke-width="4"/>' +
          '<circle cx="62" cy="100" r="12" fill="#090909"/>' +
          smoke +
          '</svg>';
      },

      nosValve: function () {
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0f0f0f"/>' +
          '<rect x="20" y="85" width="160" height="30" rx="3" fill="#1e1e1e" stroke="#333"/>' +
          '<rect x="82" y="40" width="36" height="120" rx="4" fill="#1b1b1b" stroke="#454545"/>' +
          '<circle cx="100" cy="100" r="16" fill="#222" stroke="${accent}" stroke-width="2"/>' +
          '<circle cx="100" cy="100" r="8" fill="${accent}"/>' +
          '</svg>';
      },

      tireTrack: function () {
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0a0a0a"/>' +
          '<rect x="30" y="20" width="140" height="160" rx="3" fill="#181818" stroke="#2a2a2a"/>' +
          '<line x1="30" y1="60" x2="170" y2="60" stroke="#2f2f2f" stroke-width="7"/>' +
          '<line x1="30" y1="100" x2="170" y2="100" stroke="#2f2f2f" stroke-width="7"/>' +
          '<line x1="30" y1="140" x2="170" y2="140" stroke="#2f2f2f" stroke-width="7"/>' +
          '</svg>';
      },

      driverEye: function (blink) {
        const closed = !!blink;
        if (closed) {
          return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#0b0b0b"/><line x1="20" y1="100" x2="180" y2="100" stroke="${accent}" stroke-width="2"/></svg>';
        }
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0b0b0b"/>' +
          '<ellipse cx="100" cy="100" rx="70" ry="22" fill="#170f0f" stroke="#333"/>' +
          '<ellipse cx="100" cy="100" rx="20" ry="20" fill="#100909" stroke="${accent}" stroke-width="1.3"/>' +
          '<circle cx="100" cy="100" r="12" fill="#050505"/>' +
          '<circle cx="94" cy="94" r="3.5" fill="#fff" opacity="0.55"/>' +
          '</svg>';
      }
    };

    const state = {
      tach: -130,
      dir: 1,
      steer: 0,
      speed: 0,
      gear: 1,
      frame: 0,
      blink: false,
      timer: null
    };

    function setGridConfig(cfg) {
      grid.className = '';
      grid.classList.add(cfg);
    }

    function setPanels(configs) {
      grid.innerHTML = '';
      configs.forEach(function (cfg) {
        const panel = document.createElement('div');
        panel.className = 'panel' + (cfg.anim ? ' ' + cfg.anim : '');
        panel.innerHTML = cfg.svg;
        grid.appendChild(panel);
      });
    }

    function showGrid() { grid.style.opacity = '1'; }
    function hideGrid() { grid.style.opacity = '0'; }

    function showWord(id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('visible');
    }

    function hideAllWords() {
      WORD_IDS.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('visible');
      });
    }

    function stopLive() {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
    }

    function startLive(mode) {
      stopLive();
      state.timer = setInterval(function () {
        if (mode === 'tach') {
          state.tach += state.dir * 16;
          if (state.tach > 130) state.dir = -1;
          if (state.tach < -130) state.dir = 1;
          const p = grid.querySelectorAll('.panel');
          if (p[0]) p[0].innerHTML = PANELS.tachometer(state.tach);
        }

        if (mode === 'split') {
          state.tach += 14;
          if (state.tach > 130) state.tach = -130;
          state.steer += 12;
          state.speed = Math.min(320, state.speed + 18);
          state.gear = (state.gear % 6) + 1;
          state.frame = (state.frame + 1) % 4;
          const p = grid.querySelectorAll('.panel');
          if (p[0]) p[0].innerHTML = PANELS.tachometer(state.tach);
          if (p[1]) p[1].innerHTML = PANELS.gearshift(state.gear);
          if (p[2]) p[2].innerHTML = PANELS.nosValve();
          if (p[3]) p[3].innerHTML = PANELS.steeringWheel(state.steer);
          if (p[4]) p[4].innerHTML = PANELS.exhaust(state.frame);
          if (p[5]) p[5].innerHTML = PANELS.speedometer(state.speed);
        }

        if (mode === 'eye') {
          state.blink = !state.blink;
          const b = state.blink && Math.random() < 0.2;
          const p = grid.querySelectorAll('.panel');
          if (p[0]) p[0].innerHTML = PANELS.driverEye(b);
        }
      }, 120);
    }

    const beats = [
      { t: 0, fn: function () { hideGrid(); hideAllWords(); stopLive(); redLine.classList.remove('pulse-line'); } },
      { t: 350, fn: function () { setGridConfig('cfg-single'); setPanels([{ svg: PANELS.tachometer(-130) }]); showGrid(); startLive('tach'); } },
      { t: 900, fn: function () { stopLive(); setGridConfig('cfg-2x1'); setPanels([{ svg: PANELS.gearshift(1) }, { svg: PANELS.tachometer(-112) }]); } },
      { t: 1300, fn: function () { setPanels([{ svg: PANELS.exhaust(3), anim: 'pulse' }, { svg: PANELS.nosValve() }]); } },
      { t: 1650, fn: function () { setGridConfig('cfg-3x2'); state.speed = 60; setPanels([{ svg: PANELS.tachometer(0) }, { svg: PANELS.gearshift(3) }, { svg: PANELS.nosValve() }, { svg: PANELS.steeringWheel(15) }, { svg: PANELS.exhaust(2), anim: 'pulse' }, { svg: PANELS.speedometer(80) }]); startLive('split'); } },
      { t: 3000, fn: function () { showWord('word-a'); } },
      { t: 4100, fn: function () { stopLive(); setGridConfig('cfg-2x2'); setPanels([{ svg: PANELS.nosValve() }, { svg: PANELS.steeringWheel(35) }, { svg: PANELS.tireTrack() }, { svg: PANELS.speedometer(170) }]); } },
      { t: 5300, fn: function () { showWord('word-b'); } },
      { t: 6000, fn: function () { setGridConfig('cfg-3x1'); setPanels([{ svg: PANELS.tachometer(100), anim: 'pulse' }, { svg: PANELS.gearshift(5), anim: 'pulse' }, { svg: PANELS.speedometer(280), anim: 'pulse' }]); } },
      { t: 6600, fn: function () { showWord('word-c'); } },
      { t: 7300, fn: function () { setGridConfig('cfg-3x2'); setPanels([{ svg: PANELS.speedometer(250), anim: 'pulse' }, { svg: PANELS.steeringWheel(100) }, { svg: PANELS.tachometer(100), anim: 'pulse' }, { svg: PANELS.nosValve() }, { svg: PANELS.gearshift(6), anim: 'pulse' }, { svg: PANELS.exhaust(3), anim: 'pulse' }]); startLive('split'); } },
      { t: 8450, fn: function () { showWord('word-d'); } },
      { t: 9550, fn: function () { stopLive(); hideAllWords(); setGridConfig('cfg-single'); setPanels([{ svg: PANELS.driverEye(false) }]); startLive('eye'); } },
      { t: 10600, fn: function () { stopLive(); hideGrid(); } },
      { t: 11000, fn: function () { redLine.classList.remove('pulse-line'); void redLine.offsetWidth; redLine.classList.add('pulse-line'); } },
      { t: 11800, fn: function () { redLine.classList.remove('pulse-line'); } },
      { t: 12400, fn: function () { runSequence(); } }
    ];

    function runSequence() {
      hideAllWords();
      hideGrid();
      stopLive();
      redLine.classList.remove('pulse-line');
      beats.forEach(function (beat) {
        setTimeout(beat.fn, beat.t);
      });
    }

    runSequence();
  </script>
</body>
</html>`;
}

function buildManualIndex(matrix) {
  const matrixJson = JSON.stringify(matrix);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Creatureliness Manual Flow</title>
  <style>
    :root {
      --bg: #eeebe4;
      --panel: #f8f5ef;
      --ink: #14171e;
      --muted: #5f6570;
      --line: #b8b1a4;
      --primary: #0f1522;
      --radius: 12px;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      min-height: 100%;
      background: var(--bg);
      color: var(--ink);
      font-family: "Avenir Next", "Segoe UI", system-ui, sans-serif;
    }

    .shell {
      max-width: 1280px;
      margin: 0 auto;
      padding: 10px;
      display: grid;
      gap: 8px;
    }

    .pane {
      border: 2px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      overflow: hidden;
    }

    .head {
      padding: 8px;
      border-bottom: 2px solid var(--line);
      background: #fff;
      display: grid;
      gap: 6px;
    }

    h1 { margin: 0; font-size: 1rem; }

    .meta {
      font-size: 0.74rem;
      color: var(--muted);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .btn {
      min-height: 30px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 10px;
      background: #fff;
      color: var(--ink);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      font: 800 0.62rem/1.1 inherit;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
    }

    .toolbar {
      padding: 8px;
      display: grid;
      gap: 8px;
    }

    .search {
      min-height: 34px;
      border: 2px solid var(--line);
      border-radius: 10px;
      background: #fff;
      color: var(--ink);
      font: inherit;
      font-size: 0.78rem;
      padding: 0 10px;
    }

    .count {
      font-size: 0.72rem;
      color: var(--muted);
    }

    .rows {
      max-height: calc(100vh - 190px);
      overflow: auto;
      background: #fff;
    }

    .row {
      border-top: 1px solid #e8e2d6;
      padding: 8px;
      display: grid;
      gap: 6px;
    }

    .row:first-child { border-top: 0; }

    .rid {
      font: 900 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .rtitle {
      margin: 0;
      font-size: 0.8rem;
    }

    .cells {
      display: grid;
      gap: 6px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .cell {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 7px;
      background: #f9f7f2;
      display: grid;
      gap: 4px;
    }

    .aid {
      font: 800 0.66rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: var(--muted);
    }

    .alabel {
      margin: 0;
      font-size: 0.75rem;
    }

    .mini-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .mini {
      min-height: 26px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 9px;
      background: #fff;
      color: var(--ink);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      font: 800 0.56rem/1.1 inherit;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="pane">
      <header class="head">
        <h1>Creatureliness Manual Flow</h1>
        <div class="meta">Manual-style completion pages for every section × agent, each with: Concept Breakdown, Beat Map, and Final Output.</div>
        <div class="actions">
          <a class="btn" href="../index.html">Main Index</a>
          <a class="btn" href="../graph-operator-creatureliness.html">Graph Operator</a>
          <button id="copyAll" class="btn" type="button">Copy All Video Prompts</button>
        </div>
      </header>
      <div class="toolbar">
        <input id="search" class="search" type="search" placeholder="Filter by section, agent, or prompt text">
        <div id="count" class="count"></div>
      </div>
      <div id="rows" class="rows"></div>
    </section>
  </main>

  <script>
    const MATRIX = ${matrixJson};

    const el = {
      search: document.getElementById("search"),
      count: document.getElementById("count"),
      rows: document.getElementById("rows"),
      copyAll: document.getElementById("copyAll")
    };

    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return Promise.resolve();
    }

    function filterMatrix(query) {
      const q = String(query || "").trim().toLowerCase();
      if (!q) return MATRIX;
      return MATRIX.filter(function (item) {
        const hay = [
          item.section.marker,
          item.section.major,
          item.agent.id,
          item.agent.label,
          item.video_prompt
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    function render(query) {
      const filtered = filterMatrix(query);
      const grouped = new Map();

      filtered.forEach(function (item) {
        const key = item.section.marker;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
      });

      const sectionOrder = [...new Set(MATRIX.map((item) => item.section.marker))];
      const rows = [];

      sectionOrder.forEach(function (marker) {
        const items = grouped.get(marker);
        if (!items || !items.length) return;

        items.sort(function (a, b) {
          return a.agent.order - b.agent.order;
        });

        const title = items[0].section.major;

        const cells = items.map(function (item) {
          return [
            '<section class="cell">',
            '<div class="aid">' + item.agent.id + '</div>',
            '<p class="alabel">' + item.agent.label + '</p>',
            '<div class="mini-actions">',
            '<a class="mini" href="' + item.files.page + '">Open Page</a>',
            '<a class="mini" href="' + item.files.prompt + '">Prompt MD</a>',
            '<button class="mini" type="button" data-copy="' + item.id + '">Copy Prompt</button>',
            '</div>',
            '</section>'
          ].join('');
        }).join('');

        rows.push([
          '<article class="row">',
          '<div class="rid">' + marker + '</div>',
          '<p class="rtitle">' + title + '</p>',
          '<div class="cells">' + cells + '</div>',
          '</article>'
        ].join(''));
      });

      el.rows.innerHTML = rows.join('');
      el.count.textContent = filtered.length + ' artifacts visible · ' + MATRIX.length + ' total artifacts';
    }

    el.rows.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-copy]");
      if (!btn) return;
      const id = btn.getAttribute("data-copy");
      const item = MATRIX.find(function (row) { return row.id === id; });
      if (!item) return;
      copyText(item.video_prompt);
    });

    el.copyAll.addEventListener("click", function () {
      const all = MATRIX.map(function (item) {
        return '## ' + item.section.marker + ' ' + item.section.major + ' :: ' + item.agent.id + ' ' + item.agent.label + '\\n\\n' + item.video_prompt;
      }).join('\\n\\n');
      copyText(all);
    });

    el.search.addEventListener("input", function () {
      render(el.search.value || "");
    });

    render("");
  </script>
</body>
</html>`;
}

function main() {
  const datasetText = readUtf8(DATASET_FILE);
  const pkg = JSON.parse(readUtf8(PACKAGE_FILE));

  const sections = parseActs(datasetText);
  const agents = Array.isArray(pkg.agents) ? pkg.agents : [];
  const globalSources = Array.isArray(pkg.global_sources) ? pkg.global_sources : [];

  if (!sections.length) throw new Error("No sections parsed.");
  if (!agents.length) throw new Error("No agents in package.");

  ensureDir(OUT_DIR);
  ensureDir(PAGES_DIR);
  ensureDir(PROMPTS_DIR);

  const matrix = [];

  sections.forEach((section, sIdx) => {
    const discovery = extractTaggedSection(section.text, "DISCOVERY_REPORT");
    const delivery = extractTaggedSection(section.text, "THE_COLD_DELIVERY");

    const insight = {
      seed: compactLine(extractField(discovery, "The_Seed"), "No seed supplied."),
      outlineCut: compactLine(extractField(discovery, "The_Outline_Straightjackets_Cut"), "No straightjacket cut supplied."),
      resonance: compactLine(extractField(discovery, "Emergent_Resonance"), "No resonance supplied."),
      lead: compactLine(splitLines(delivery).find((line) => line.trim()), "No lead line."),
      deliveryText: delivery || section.text
    };

    agents.forEach((agentRaw, aIdx) => {
      const agent = {
        id: agentRaw.id || `AG${pad2(aIdx + 1)}`,
        label: agentRaw.label || `Agent ${aIdx + 1}`,
        role: agentRaw.role || "Generate title-sequence output.",
        sourcePaths: [...new Set([...(globalSources || []), ...((agentRaw.prompt_sources || []))])],
        order: aIdx + 1
      };

      const beatMap = buildBeatMap(insight.seed, insight.outlineCut, insight.resonance, insight.lead);
      const videoPrompt = buildVideoPrompt(section, agent, insight, beatMap);
      const words = pickWords(section, insight, agent);
      const accent = accentColor(agent);

      const fileStem = `s${pad2(sIdx + 1)}-a${pad2(aIdx + 1)}-${slug(agent.id)}-${slug(section.marker)}`;
      const pageRelPath = `pages/${fileStem}.html`;
      const promptRelPath = `prompts/${fileStem}.md`;

      const pageHtml = buildPageHtml({
        section,
        agent,
        insight,
        beatMap,
        videoPrompt,
        words,
        accent,
        promptRelPath
      });

      const promptMd = buildPromptMarkdown(section, agent, insight, beatMap, videoPrompt, pageRelPath);

      fs.writeFileSync(path.join(OUT_DIR, pageRelPath), pageHtml, "utf8");
      fs.writeFileSync(path.join(OUT_DIR, promptRelPath), promptMd, "utf8");

      matrix.push({
        id: `${section.marker}-${agent.id}`,
        section: {
          index: section.index,
          marker: section.marker,
          major: section.major
        },
        agent: {
          id: agent.id,
          label: agent.label,
          order: agent.order
        },
        files: {
          page: pageRelPath,
          prompt: promptRelPath
        },
        video_prompt: videoPrompt,
        beat_map: beatMap,
        concept: {
          seed: insight.seed,
          outline_cut: insight.outlineCut,
          resonance: insight.resonance
        }
      });
    });
  });

  const indexHtml = buildManualIndex(matrix);
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexHtml, "utf8");

  fs.writeFileSync(path.join(OUT_DIR, "matrix.json"), JSON.stringify({
    generated_at: new Date().toISOString(),
    dataset_file: path.basename(DATASET_FILE),
    package_file: path.basename(PACKAGE_FILE),
    sections: sections.length,
    agents: agents.length,
    artifacts: matrix.length,
    matrix
  }, null, 2), "utf8");

  console.log(`Generated ${matrix.length} manual-flow artifacts in ${OUT_DIR}`);
}

main();
