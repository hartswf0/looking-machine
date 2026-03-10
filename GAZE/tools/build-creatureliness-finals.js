#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DATASET_FILE = path.join(ROOT, "creatureliness-cold-delivery.md");
const PACKAGE_FILE = path.join(ROOT, "creatureliness-10-agent-package.json");
const OUT_DIR = path.join(ROOT, "creatureliness-finals");
const PAGES_DIR = path.join(OUT_DIR, "pages");
const PROMPTS_DIR = path.join(OUT_DIR, "prompts");

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function slug(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44) || "item";
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

function parseActBlocks(markdown) {
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

function cleanLine(text, fallback) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function operatorStyleLens(agent) {
  const key = `${agent.id} ${agent.label}`.toLowerCase();
  if (key.includes("westworld")) return "Austere biomechanical precision, porcelain textures, monochrome engineering contrasts.";
  if (key.includes("true detective")) return "Sulfuric noir, industrial decay, layered silhouettes, ritual dread.";
  if (key.includes("alien")) return "Near-dark emergence, vacuum silence, typographic suspense and negative space.";
  if (key.includes("andromeda")) return "Clinical containment graphics, procedural telemetry, escalating system warnings.";
  if (key.includes("high castle")) return "Archival propaganda friction, ideological dissonance, symbolic collage.";
  if (key.includes("ghost")) return "Cybernetic metamorphosis, ritualized machine lyricism, liquid-body transitions.";
  if (key.includes("bass")) return "Geometric paper-cut minimalism, hard contrast, symbolic reduction.";
  if (key.includes("deconstruction")) return "Motif disassembly and reconstruction with explicit transition logic.";
  if (key.includes("dna")) return "Forensic motif extraction and strict title-sequence grammar.";
  if (key.includes("optical")) return "Apparatus-aware gaze, surveillance optics, ideological overprint.";
  return "High-contrast editorial motion with material textures and disciplined pacing.";
}

function buildBeatMap(seed, resonance, outline, lead) {
  return [
    `0.0-1.2s  Establish locus: ${seed}`,
    "1.2-2.4s  Intrusion: frost, breath, smoke, or telemetry instability enters frame.",
    `2.4-3.6s  Constraint cut: ${outline}`,
    "3.6-4.8s  Contact event: body and apparatus collide under resistance.",
    "4.8-6.0s  System response: stuttered text, pulse bars, unstable logic cadence.",
    `6.0-7.2s  Emergent resonance: ${resonance}`,
    "7.2-8.4s  Threshold turn: analysis collapses into survival mechanics.",
    "8.4-9.6s  Material witness: wire, ash, frost, blood, or soot anchors reality.",
    "9.6-10.8s Recomposition: language condenses into operational intent.",
    `10.8-12.0s Lock image: ${lead}`
  ];
}

function buildVideoPrompt(section, agent, insight, beatMap) {
  const styleLens = operatorStyleLens(agent);
  const lines = [
    `Create a 12-second cinematic title sequence for \"${section.marker} ${section.major}\".`,
    `Agent lens: ${agent.label}.`,
    `Stylistic direction: ${styleLens}`,
    `Seed motif: ${insight.seed}`,
    `Outline straightjacket cut: ${insight.outlineCut}`,
    `Emergent resonance: ${insight.resonance}`,
    "Visual language: high-contrast typography, hard geometric framing, physical textures (frost, ash, wire, smoke), no glossy futurism.",
    "Camera language: measured dolly and lock-offs, punctuated by abrupt calibration drifts at beat transitions.",
    "Audio direction: low mechanical hum, brittle transient impacts, no triumphant score.",
    "Output must include exact beat timing map:",
    ...beatMap.map((item) => `- ${item}`),
    "Deliver both: (1) master video prompt text and (2) a functional single-file HTML/CSS/JS animation interpretation."
  ];
  return lines.join("\n");
}

function renderLineBlock(lines, blockIdPrefix) {
  return lines
    .map((line, i) => {
      const no = i + 1;
      return [
        `<div class=\"lrow\">`,
        `<button class=\"ln\" type=\"button\" data-copy-line=\"${blockIdPrefix}\" data-line=\"${no}\">${no}</button>`,
        `<pre class=\"lt\">${escapeHtml(line || " ")}</pre>`,
        `</div>`
      ].join("");
    })
    .join("");
}

function buildPairPage(section, agent, insight, beatMap, videoPrompt, relPromptPath, relIndexPath) {
  const title = `${section.marker} ${section.major} | ${agent.id} ${agent.label}`;
  const deliveryText = insight.deliveryText;
  const deliveryLead = insight.deliveryLead;
  const videoPromptLines = splitLines(videoPrompt);
  const deliveryLines = splitLines(deliveryText);

  const beatJson = JSON.stringify(beatMap);
  const seedJson = JSON.stringify(insight.seed);
  const leadJson = JSON.stringify(deliveryLead);

  return `<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #eeebe4;
      --panel: #f8f5ef;
      --ink: #14171e;
      --muted: #5f6570;
      --line: #b8b1a4;
      --primary: #0f1522;
      --accent: #b9472e;
      --radius: 12px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; background: var(--bg); color: var(--ink); font-family: \"Avenir Next\", \"Segoe UI\", system-ui, sans-serif; }
    .shell { max-width: 1100px; margin: 0 auto; padding: 10px; display: grid; gap: 8px; }
    .pane { border: 2px solid var(--line); border-radius: var(--radius); background: var(--panel); overflow: hidden; }
    .head { padding: 8px; border-bottom: 2px solid var(--line); background: #fff; display: grid; gap: 6px; }
    .kicker { font: 900 0.66rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    h1 { margin: 0; font-size: 1rem; line-height: 1.25; }
    .meta { font-size: 0.72rem; color: var(--muted); }
    .actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .btn { min-height: 32px; border: 1px solid var(--line); border-radius: 999px; padding: 0 10px; background: #fff; color: var(--ink); font: 800 0.62rem/1.1 inherit; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .btn.primary { background: var(--primary); color: #fff; border-color: var(--primary); }
    .grid { display: grid; gap: 8px; grid-template-columns: minmax(0, 1fr); }
    .block { padding: 8px; display: grid; gap: 8px; }
    .block h2 { margin: 0; font-size: 0.78rem; letter-spacing: 0.06em; text-transform: uppercase; }
    .canvas { border: 1px solid var(--line); border-radius: 10px; background: #0d1016; color: #e4e8ef; min-height: 180px; padding: 12px; display: grid; align-content: space-between; gap: 10px; }
    .glyph { height: 74px; border: 1px solid #2b3344; border-radius: 8px; position: relative; overflow: hidden; }
    .bar { position: absolute; top: 0; bottom: 0; width: 8%; background: linear-gradient(180deg, #e8ecef 0%, #6a7489 100%); left: 2%; transform: skewX(-8deg); opacity: 0.9; transition: left 0.35s ease, width 0.35s ease, opacity 0.35s ease; }
    .glow { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(185,71,46,0.34) 0%, rgba(13,16,22,0) 62%); pointer-events: none; }
    .beat { font: 700 0.76rem/1.35 ui-monospace, SFMono-Regular, Menlo, monospace; color: #ced5e2; min-height: 40px; }
    .list { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; background: #fff; }
    .lrow { display: grid; grid-template-columns: 48px minmax(0,1fr); border-top: 1px solid #ece7dc; }
    .lrow:first-child { border-top: 0; }
    .ln { border: 0; border-right: 1px solid #ece7dc; background: #f7f3ea; color: #8b93a1; text-align: right; padding: 6px 8px 6px 0; font: 800 0.66rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; cursor: pointer; }
    .lt { margin: 0; padding: 6px 10px; white-space: pre-wrap; font: 0.72rem/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; }
    .timeline { display: grid; gap: 4px; }
    .beat-row { border: 1px solid var(--line); border-radius: 8px; padding: 6px 8px; background: #fff; font: 0.7rem/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; }
    .beat-row.active { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); background: #fff5f2; }
    @media (min-width: 960px) {
      .grid { grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); }
    }
  </style>
</head>
<body>
  <main class=\"shell\">
    <section class=\"pane\">
      <header class=\"head\">
        <div class=\"kicker\">Creatureliness Finals Artifact</div>
        <h1>${escapeHtml(title)}</h1>
        <div class=\"meta\">Section ${escapeHtml(section.marker)} · Agent ${escapeHtml(agent.id)} · Dual output generated.</div>
        <div class=\"actions\">
          <a class=\"btn\" href=\"${escapeHtml(relIndexPath)}\">Back To Manual</a>
          <a class=\"btn\" href=\"${escapeHtml(relPromptPath)}\">Open Prompt Markdown</a>
          <button id=\"copyPrompt\" class=\"btn primary\" type=\"button\">Copy Video Prompt</button>
          <button id=\"copyDelivery\" class=\"btn\" type=\"button\">Copy Act Text</button>
        </div>
      </header>
    </section>

    <section class=\"grid\">
      <section class=\"pane block\">
        <h2>Master AI Video Prompt</h2>
        <div class=\"list\" id=\"videoBlock\">
          ${renderLineBlock(videoPromptLines, "video")}
        </div>
      </section>

      <section class=\"pane block\">
        <h2>Single-File HTML Animation (Live)</h2>
        <div class=\"canvas\">
          <div class=\"glyph\"><div class=\"bar\" id=\"bar\"></div><div class=\"glow\"></div></div>
          <div class=\"beat\" id=\"beatText\"></div>
          <div class=\"actions\">
            <button id=\"playBtn\" class=\"btn\" type=\"button\">Play 12s Loop</button>
            <button id=\"stopBtn\" class=\"btn\" type=\"button\">Stop</button>
          </div>
        </div>
        <div class=\"timeline\" id=\"timeline\"></div>
      </section>
    </section>

    <section class=\"pane block\">
      <h2>Cold Delivery Source (Line-Copy Enabled)</h2>
      <div class=\"list\" id=\"deliveryBlock\">
        ${renderLineBlock(deliveryLines, "delivery")}
      </div>
    </section>
  </main>

  <script>
    const BEATS = ${beatJson};
    const SEED = ${seedJson};
    const LEAD = ${leadJson};
    const VIDEO_PROMPT = ${JSON.stringify(videoPrompt)};
    const DELIVERY_TEXT = ${JSON.stringify(deliveryText)};

    const el = {
      bar: document.getElementById("bar"),
      beatText: document.getElementById("beatText"),
      timeline: document.getElementById("timeline"),
      copyPrompt: document.getElementById("copyPrompt"),
      copyDelivery: document.getElementById("copyDelivery"),
      playBtn: document.getElementById("playBtn"),
      stopBtn: document.getElementById("stopBtn")
    };

    let t = null;
    let idx = 0;

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

    function renderTimeline(active) {
      el.timeline.innerHTML = BEATS.map(function (line, i) {
        const css = i === active ? "active" : "";
        return "<div class=\\\"beat-row " + css + "\\\">" + line.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</div>";
      }).join("");
    }

    function paint(i) {
      const normalized = i / Math.max(1, BEATS.length - 1);
      const left = 2 + normalized * 78;
      const width = 8 + (i % 3) * 4;
      el.bar.style.left = left + "%";
      el.bar.style.width = width + "%";
      el.bar.style.opacity = String(0.55 + (i % 4) * 0.1);
      el.beatText.textContent = BEATS[i] + " | Seed: " + SEED;
      renderTimeline(i);
    }

    function startLoop() {
      stopLoop();
      idx = 0;
      paint(idx);
      t = setInterval(() => {
        idx = (idx + 1) % BEATS.length;
        paint(idx);
      }, 1200);
    }

    function stopLoop() {
      if (t) clearInterval(t);
      t = null;
    }

    document.body.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-copy-line]");
      if (!btn) return;
      const block = btn.getAttribute("data-copy-line");
      const line = Number(btn.getAttribute("data-line"));
      if (!Number.isFinite(line)) return;
      if (block === "video") {
        const lineText = VIDEO_PROMPT.split("\\n")[line - 1] || "";
        void copyText(lineText);
      }
      if (block === "delivery") {
        const lineText = DELIVERY_TEXT.split("\\n")[line - 1] || "";
        void copyText(lineText);
      }
    });

    el.copyPrompt.addEventListener("click", () => { void copyText(VIDEO_PROMPT); });
    el.copyDelivery.addEventListener("click", () => { void copyText(DELIVERY_TEXT); });
    el.playBtn.addEventListener("click", startLoop);
    el.stopBtn.addEventListener("click", stopLoop);

    paint(0);
    el.beatText.textContent = BEATS[0] + " | Lock image lead: " + LEAD;
  </script>
</body>
</html>`;
}

function buildPromptMarkdown(section, agent, insight, beatMap, videoPrompt, pagePath) {
  const lines = [
    `# ${section.marker} ${section.major} :: ${agent.id} ${agent.label}`,
    "",
    "## Concept Breakdown",
    `- seed: ${insight.seed}`,
    `- straightjackets cut: ${insight.outlineCut}`,
    `- emergent resonance: ${insight.resonance}`,
    `- operator role: ${agent.role}`,
    "",
    "## Beat Map (12s)",
    ...beatMap.map((item, i) => `${i + 1}. ${item}`),
    "",
    "## Final Output",
    "### Master AI Video Prompt",
    "```text",
    videoPrompt,
    "```",
    "",
    "### Single-File HTML Artifact",
    `- file: ${pagePath}`,
    "",
    "## Source Prompt Files",
    ...(agent.sourcePaths || []).map((item) => `- ${item}`)
  ];
  return lines.join("\n");
}

function buildManualIndex(sections, agents, matrix) {
  const matrixJson = JSON.stringify(matrix);
  const sectionsJson = JSON.stringify(sections.map((s) => ({ marker: s.marker, major: s.major, index: s.index })));
  const agentsJson = JSON.stringify(agents.map((a) => ({ id: a.id, label: a.label })));

  return `<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
  <title>Creatureliness Finals Manual</title>
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
    html, body { margin: 0; min-height: 100%; background: var(--bg); color: var(--ink); font-family: \"Avenir Next\", \"Segoe UI\", system-ui, sans-serif; }
    .shell { max-width: 1280px; margin: 0 auto; padding: 10px; display: grid; gap: 8px; }
    .pane { border: 2px solid var(--line); border-radius: var(--radius); background: var(--panel); overflow: hidden; }
    .head { padding: 8px; border-bottom: 2px solid var(--line); background: #fff; display: grid; gap: 6px; }
    .title { margin: 0; font-size: 1rem; }
    .meta { color: var(--muted); font-size: 0.74rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .btn { min-height: 32px; border: 1px solid var(--line); border-radius: 999px; padding: 0 10px; background: #fff; color: var(--ink); text-decoration: none; display: inline-flex; align-items: center; font: 800 0.62rem/1.1 inherit; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; }
    .btn.primary { background: var(--primary); border-color: var(--primary); color: #fff; }
    .toolbar { padding: 8px; display: grid; gap: 8px; grid-template-columns: minmax(0, 1fr); }
    .search { min-height: 34px; border: 2px solid var(--line); border-radius: 10px; padding: 0 10px; font: inherit; font-size: 0.78rem; background: #fff; color: var(--ink); }
    .count { color: var(--muted); font-size: 0.72rem; }
    .rows { max-height: calc(100vh - 190px); overflow: auto; }
    .row { border-top: 1px solid #e8e2d6; padding: 8px; display: grid; gap: 6px; background: #fff; }
    .row:first-child { border-top: 0; }
    .rid { font: 900 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
    .rtitle { font-size: 0.8rem; margin: 0; }
    .cells { display: grid; gap: 6px; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
    .cell { border: 1px solid var(--line); border-radius: 10px; padding: 7px; background: #f9f7f2; display: grid; gap: 4px; }
    .aid { font: 800 0.66rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted); }
    .alabel { margin: 0; font-size: 0.75rem; }
    .cell-actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .mini { min-height: 26px; border: 1px solid var(--line); border-radius: 999px; padding: 0 9px; background: #fff; color: var(--ink); text-decoration: none; display: inline-flex; align-items: center; font: 800 0.56rem/1.1 inherit; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; }
  </style>
</head>
<body>
  <main class=\"shell\">
    <section class=\"pane\">
      <header class=\"head\">
        <h1 class=\"title\">Creatureliness Finals Manual</h1>
        <div class=\"meta\">Generated matrix artifacts for every section x agent pair. Includes actual HTML pages and prompt markdown files.</div>
        <div class=\"actions\">
          <a class=\"btn\" href=\"../index.html\">Back To Main Index</a>
          <a class=\"btn\" href=\"../graph-operator-creatureliness.html\">Open Graph Operator</a>
          <button id=\"copyAll\" class=\"btn primary\" type=\"button\">Copy All Video Prompts</button>
        </div>
      </header>
      <div class=\"toolbar\">
        <input id=\"search\" class=\"search\" type=\"search\" placeholder=\"Filter sections or agents\">
        <div id=\"count\" class=\"count\"></div>
      </div>
      <div id=\"rows\" class=\"rows\"></div>
    </section>
  </main>

  <script>
    const MATRIX = ${matrixJson};
    const SECTIONS = ${sectionsJson};
    const AGENTS = ${agentsJson};

    const bySection = new Map();
    for (const item of MATRIX) {
      const key = item.section.marker;
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key).push(item);
    }

    const el = {
      search: document.getElementById("search"),
      count: document.getElementById("count"),
      rows: document.getElementById("rows"),
      copyAll: document.getElementById("copyAll")
    };

    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
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

    function filterItems(query) {
      const q = String(query || "").trim().toLowerCase();
      if (!q) return MATRIX;
      return MATRIX.filter((item) => {
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
      const filtered = filterItems(query);
      const localMap = new Map();
      for (const item of filtered) {
        const key = item.section.marker;
        if (!localMap.has(key)) localMap.set(key, []);
        localMap.get(key).push(item);
      }

      const rows = [];
      for (const section of SECTIONS) {
        const items = localMap.get(section.marker) || [];
        if (!items.length) continue;

        items.sort((a, b) => a.agent.order - b.agent.order);

        const cellsHtml = items.map((item) => {
          return [
            "<section class=\\\"cell\\\">",
            "<div class=\\\"aid\\\">" + item.agent.id + "</div>",
            "<p class=\\\"alabel\\\">" + item.agent.label + "</p>",
            "<div class=\\\"cell-actions\\\">",
            "<a class=\\\"mini\\\" href=\\\"" + item.files.page + "\\\">Open Page</a>",
            "<a class=\\\"mini\\\" href=\\\"" + item.files.prompt + "\\\">Prompt MD</a>",
            "<button class=\\\"mini\\\" type=\\\"button\\\" data-copy=\\\"" + item.id + "\\\">Copy Prompt</button>",
            "</div>",
            "</section>"
          ].join("");
        }).join("");

        rows.push([
          "<article class=\\\"row\\\">",
          "<div class=\\\"rid\\\">" + section.marker + "</div>",
          "<p class=\\\"rtitle\\\">" + section.major + "</p>",
          "<div class=\\\"cells\\\">",
          cellsHtml,
          "</div>",
          "</article>"
        ].join(""));
      }

      el.rows.innerHTML = rows.join("");
      el.count.textContent = filtered.length + " artifacts visible · " + SECTIONS.length + " sections · " + AGENTS.length + " agents";
    }

    el.rows.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-copy]");
      if (!btn) return;
      const id = btn.getAttribute("data-copy");
      const item = MATRIX.find((row) => row.id === id);
      if (!item) return;
      void copyText(item.video_prompt);
    });

    el.copyAll.addEventListener("click", () => {
      const all = MATRIX
        .map((item) => "## " + item.section.marker + " " + item.section.major + " :: " + item.agent.id + " " + item.agent.label + "\\n\\n" + item.video_prompt)
        .join("\\n\\n");
      void copyText(all);
    });

    el.search.addEventListener("input", () => render(el.search.value));
    render("");
  </script>
</body>
</html>`;
}

function main() {
  const datasetText = readUtf8(DATASET_FILE);
  const pkg = JSON.parse(readUtf8(PACKAGE_FILE));

  const sections = parseActBlocks(datasetText);
  if (!sections.length) {
    throw new Error("No section blocks found in dataset.");
  }

  const globalSources = Array.isArray(pkg.global_sources) ? pkg.global_sources : [];
  const agents = Array.isArray(pkg.agents) ? pkg.agents : [];
  if (!agents.length) {
    throw new Error("No agents found in package.");
  }

  ensureDir(OUT_DIR);
  ensureDir(PAGES_DIR);
  ensureDir(PROMPTS_DIR);

  const sourceCache = new Map();
  const getSource = (filePath) => {
    if (sourceCache.has(filePath)) return sourceCache.get(filePath);
    const abs = path.join(ROOT, filePath);
    let text = "";
    let ok = true;
    if (fs.existsSync(abs)) {
      text = readUtf8(abs);
    } else {
      ok = false;
      text = `MISSING SOURCE: ${filePath}`;
    }
    const value = { filePath, ok, text };
    sourceCache.set(filePath, value);
    return value;
  };

  const matrix = [];

  sections.forEach((section, sectionIdx) => {
    const discovery = extractTaggedSection(section.text, "DISCOVERY_REPORT");
    const deliveryText = extractTaggedSection(section.text, "THE_COLD_DELIVERY");
    const insight = {
      seed: cleanLine(extractField(discovery, "The_Seed"), "No seed supplied."),
      outlineCut: cleanLine(extractField(discovery, "The_Outline_Straightjackets_Cut"), "No outline-cut supplied."),
      resonance: cleanLine(extractField(discovery, "Emergent_Resonance"), "No resonance supplied."),
      deliveryText: String(deliveryText || section.text),
      deliveryLead: cleanLine(splitLines(deliveryText).find((line) => line.trim()), "No delivery lead.")
    };

    agents.forEach((agent, agentIdx) => {
      const sourcePaths = [...new Set([...(globalSources || []), ...((agent.prompt_sources || []))].filter(Boolean))];
      const sourceBundle = sourcePaths.map((p) => getSource(p));
      const beatMap = buildBeatMap(insight.seed, insight.resonance, insight.outlineCut, insight.deliveryLead);
      const normalizedAgent = {
        id: agent.id || `AG${pad2(agentIdx + 1)}`,
        label: agent.label || `Agent ${agentIdx + 1}`,
        role: agent.role || "Generate dual-output finals.",
        sourcePaths,
        sourceBundle,
        order: agentIdx + 1
      };

      const videoPrompt = buildVideoPrompt(section, normalizedAgent, insight, beatMap);

      const base = `s${pad2(sectionIdx + 1)}-a${pad2(agentIdx + 1)}-${slug(normalizedAgent.id)}-${slug(section.marker)}`;
      const pageRel = `pages/${base}.html`;
      const promptRel = `prompts/${base}.md`;

      const pageHtml = buildPairPage(section, normalizedAgent, insight, beatMap, videoPrompt, `../${promptRel}`, "../index.html");
      const promptMd = buildPromptMarkdown(section, normalizedAgent, insight, beatMap, videoPrompt, pageRel);

      fs.writeFileSync(path.join(OUT_DIR, pageRel), pageHtml, "utf8");
      fs.writeFileSync(path.join(OUT_DIR, promptRel), promptMd, "utf8");

      matrix.push({
        id: `${section.marker}-${normalizedAgent.id}`,
        section: {
          index: section.index,
          marker: section.marker,
          major: section.major
        },
        agent: {
          id: normalizedAgent.id,
          label: normalizedAgent.label,
          order: normalizedAgent.order
        },
        files: {
          page: pageRel,
          prompt: promptRel
        },
        source_paths: sourcePaths,
        video_prompt: videoPrompt,
        beat_map: beatMap
      });
    });
  });

  const manualHtml = buildManualIndex(sections, agents, matrix);
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), manualHtml, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "matrix.json"), JSON.stringify({
    generated_at: new Date().toISOString(),
    dataset_file: path.basename(DATASET_FILE),
    package_file: path.basename(PACKAGE_FILE),
    sections: sections.length,
    agents: agents.length,
    artifacts: matrix.length,
    matrix
  }, null, 2), "utf8");

  console.log(`Generated ${matrix.length} artifacts in ${OUT_DIR}`);
}

main();
