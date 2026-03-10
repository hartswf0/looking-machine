#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DATASET_FILE = path.join(ROOT, "creatureliness-cold-delivery.md");
const PACKAGE_FILE = path.join(ROOT, "creatureliness-10-agent-package.json");

const OUT_DIR = path.join(ROOT, "creatureliness-singular-pages");
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
    .slice(0, 56) || "item";
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function hashString(input) {
  let h = 2166136261;
  const text = String(input || "");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed) {
  let s = seed >>> 0;
  return function next() {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000000) / 1000000;
  };
}

function shuffleWithRng(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
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

function baseTheme() {
  return {
    fonts: {
      display: '"Impact", "Arial Black", sans-serif',
      body: '"Avenir Next", "Segoe UI", sans-serif',
      mono: '"SF Mono", Menlo, monospace'
    },
    palette: {
      bgA: "#090b12",
      bgB: "#1a1e2c",
      bgC: "#111522",
      ink: "#e8ecf2",
      muted: "#9ca5b6",
      line: "#2f3749",
      panel: "#111721",
      accent: "#d62b1f",
      accent2: "#f59f67",
      flare: "rgba(214,43,31,0.35)",
      snow: "rgba(230,236,245,0.72)",
      smoke: "rgba(155,166,188,0.16)"
    },
    overlay: "reticle",
    motion: "percussive",
    layouts: ["cfg-single", "cfg-2x1", "cfg-3x2", "cfg-2x2", "cfg-3x1"],
    modules: ["gauge", "gear", "eye", "fire", "circuit", "monolith", "helix", "snow"],
    wordMode: "left",
    tint: "normal"
  };
}

function themeForAgent(agent) {
  const t = baseTheme();
  const id = (agent.id || "").toUpperCase();

  const themes = {
    AG01: {
      overlay: "helix",
      motion: "scan",
      modules: ["helix", "circuit", "gauge", "monolith", "snow", "eye", "wire"],
      palette: {
        bgA: "#0a1015", bgB: "#16242c", bgC: "#0c1821", accent: "#1f8aaf", accent2: "#7ad8f2", flare: "rgba(31,138,175,0.35)", line: "#28424d"
      },
      wordMode: "stack"
    },
    AG02: {
      overlay: "shards",
      motion: "jolt",
      modules: ["bars", "gauge", "wire", "redact", "fracture", "gear", "smoke"],
      palette: {
        bgA: "#130d10", bgB: "#2a171c", bgC: "#1a1115", accent: "#a3303d", accent2: "#f09c76", flare: "rgba(163,48,61,0.35)", line: "#51313b"
      },
      wordMode: "center"
    },
    AG03: {
      overlay: "paper",
      motion: "snap",
      modules: ["cutout", "spiral", "gauge", "bars", "silhouette", "monolith", "wire"],
      palette: {
        bgA: "#111212", bgB: "#29231b", bgC: "#181716", accent: "#eb4f2d", accent2: "#f0c27a", flare: "rgba(235,79,45,0.36)", line: "#534636"
      },
      wordMode: "left"
    },
    AG04: {
      overlay: "optic",
      motion: "pulse",
      modules: ["eye", "reticle", "circuit", "bars", "wire", "signal", "gauge"],
      palette: {
        bgA: "#100d15", bgB: "#261b31", bgC: "#171020", accent: "#8f4ec9", accent2: "#d1a6ff", flare: "rgba(143,78,201,0.35)", line: "#4c3a63"
      },
      wordMode: "right"
    },
    AG05: {
      overlay: "orbital",
      motion: "sterile",
      modules: ["biomech", "ring", "gauge", "circuit", "snow", "eye", "mono-line"],
      palette: {
        bgA: "#0d1118", bgB: "#1f2734", bgC: "#141b25", accent: "#c73a4f", accent2: "#f0b0bd", flare: "rgba(199,58,79,0.32)", line: "#3c4a5e"
      },
      wordMode: "stack"
    },
    AG06: {
      overlay: "double",
      motion: "smolder",
      modules: ["silhouette", "smoke", "crossfade", "wire", "eye", "fire", "gauge"],
      palette: {
        bgA: "#150f10", bgB: "#2d1b1b", bgC: "#1d1313", accent: "#bf5a29", accent2: "#f3cb96", flare: "rgba(191,90,41,0.35)", line: "#5a3f31"
      },
      wordMode: "left"
    },
    AG07: {
      overlay: "void",
      motion: "sparse",
      modules: ["void", "signal", "gauge", "monolith", "snow", "eye", "flare"],
      palette: {
        bgA: "#07090c", bgB: "#11161f", bgC: "#0c1118", accent: "#6c8ca6", accent2: "#a8c4d9", flare: "rgba(108,140,166,0.32)", line: "#2e3d4c"
      },
      wordMode: "center"
    },
    AG08: {
      overlay: "biohazard",
      motion: "diagnostic",
      modules: ["diag", "circuit", "gridwave", "gauge", "reticle", "signal", "monolith"],
      palette: {
        bgA: "#081112", bgB: "#153031", bgC: "#0f2223", accent: "#31b488", accent2: "#9ee3ca", flare: "rgba(49,180,136,0.32)", line: "#2d5e56"
      },
      wordMode: "right"
    },
    AG09: {
      overlay: "propaganda",
      motion: "collage",
      modules: ["poster", "glyph", "redact", "silhouette", "bars", "wire", "fire"],
      palette: {
        bgA: "#140c11", bgB: "#321724", bgC: "#210f18", accent: "#d14564", accent2: "#f2b6c6", flare: "rgba(209,69,100,0.34)", line: "#5f3144"
      },
      wordMode: "stack"
    },
    AG10: {
      overlay: "liquid",
      motion: "fluid",
      modules: ["liquid", "glyph", "helix", "ring", "eye", "signal", "circuit"],
      palette: {
        bgA: "#0b0d14", bgB: "#1f2035", bgC: "#14172a", accent: "#5e7bff", accent2: "#b7c5ff", flare: "rgba(94,123,255,0.34)", line: "#3e4ea5"
      },
      wordMode: "center"
    }
  };

  const patch = themes[id] || {};

  return {
    ...t,
    ...patch,
    palette: {
      ...t.palette,
      ...(patch.palette || {})
    }
  };
}

function buildBeatMap(seed, outlineCut, resonance, lead) {
  return [
    `0.0-1.2s Establish locus from seed motif: ${seed}`,
    "1.2-2.4s Split-screen expansion with immediate percussive cuts.",
    `2.4-3.6s Constraint rupture enters frame: ${outlineCut}`,
    "3.6-4.8s Body-machine contact under stress.",
    "4.8-6.0s Mechanical escalation across concurrent panels.",
    `6.0-7.2s Resonance motif surfaces: ${resonance}`,
    "7.2-8.4s Typography snap sequence in negative space.",
    "8.4-9.6s Convergence toward singular focal intensity.",
    `9.6-10.8s Lock image with narrative pressure: ${lead}`,
    "10.8-12.0s Hard cut to black, red pulse, reset."
  ];
}

function buildVideoPrompt(section, agent, insight, beatMap, theme) {
  const lines = [
    `Create a 12-second title sequence for \"${section.marker} ${section.major}\".`,
    `Agent lineage: ${agent.id} ${agent.label}.`,
    `Style lens: ${theme.overlay} overlay system, ${theme.motion} motion profile, palette anchored by ${theme.palette.accent}.`,
    `Seed: ${insight.seed}`,
    `Straightjacket cut: ${insight.outlineCut}`,
    `Emergent resonance: ${insight.resonance}`,
    "Output constraints: high-contrast graphic style, no smooth cinematic panning, rhythmic hard cuts only.",
    "Mechanical + creature motifs must coexist: apparatus macro + winter survival signal.",
    "Beat map:",
    ...beatMap.map((b) => `- ${b}`),
    "Return both outputs: (1) Master AI Video Prompt and (2) single-file HTML/CSS/JS animation artifact."
  ];
  return lines.join("\n");
}

function pickWords(section, insight, agent, rng) {
  const tokens = `${section.major} ${insight.seed} ${insight.resonance} ${agent.label}`
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length > 3)
    .map((t) => t.toUpperCase());

  const uniq = [...new Set(tokens)];
  const bag = uniq.length ? uniq : ["CREATURE", "COLD", "FIRE", "MACHINE", "ASH"]; 
  const picks = [];
  for (let i = 0; i < 4; i += 1) {
    picks.push(bag[Math.floor(rng() * bag.length)] || bag[i % bag.length]);
  }

  return {
    a: picks[0],
    b: picks[1],
    c: picks[2],
    d: picks[3]
  };
}

function cellCount(layout) {
  const map = {
    "cfg-single": 1,
    "cfg-2x1": 2,
    "cfg-2x2": 4,
    "cfg-3x2": 6,
    "cfg-3x1": 3
  };
  return map[layout] || 1;
}

function buildShotRecipes(theme, rng) {
  const times = [0, 380, 920, 1500, 2200, 3000, 3950, 5000, 6100, 7300, 8500, 9800, 11100, 12400];
  const layouts = shuffleWithRng(theme.layouts, rng);
  const modules = shuffleWithRng(theme.modules, rng);
  const fxBag = ["", "pulse", "blur-x", "jitter", "contrast", "strobe"];

  const shots = times.map((t, idx) => {
    const layout = layouts[idx % layouts.length];
    const count = cellCount(layout);
    const panels = [];
    for (let i = 0; i < count; i += 1) {
      const mod = modules[(idx + i) % modules.length];
      const fx = fxBag[Math.floor(rng() * fxBag.length)];
      panels.push({ type: mod, fx });
    }

    return {
      t,
      layout,
      panels,
      wordCue: idx === 5 ? "a" : idx === 7 ? "b" : idx === 9 ? "c" : idx === 10 ? "d" : null,
      collapse: idx === 11,
      pulse: idx === 12
    };
  });

  return shots;
}

function buildPromptMarkdown(section, agent, insight, beatMap, videoPrompt, pageRelPath, theme) {
  const lines = [
    `# ${section.marker} ${section.major} :: ${agent.id} ${agent.label}`,
    "",
    "## 1. Concept Breakdown",
    `- seed: ${insight.seed}`,
    `- straightjackets cut: ${insight.outlineCut}`,
    `- emergent resonance: ${insight.resonance}`,
    `- lineage style: ${theme.overlay}/${theme.motion}`,
    "",
    "## 2. The Beat Map",
    ...beatMap.map((b, i) => `${i + 1}. ${b}`),
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
    ...(agent.sourcePaths || []).map((s) => `- ${s}`)
  ];

  return lines.join("\n");
}

function buildPageHtml(ctx) {
  const {
    section,
    agent,
    insight,
    beatMap,
    videoPrompt,
    theme,
    words,
    shots,
    promptRelPath,
    lineageTag,
    seed
  } = ctx;

  const conceptItems = [
    `Seed: ${insight.seed}`,
    `Straightjackets Cut: ${insight.outlineCut}`,
    `Emergent Resonance: ${insight.resonance}`,
    `Lineage: ${lineageTag}`,
    `Overlay/Motion: ${theme.overlay}/${theme.motion}`
  ];

  const conceptHtml = conceptItems.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
  const beatHtml = beatMap.map((b) => `<li>${escapeHtml(b)}</li>`).join("");

  const payload = {
    section: {
      marker: section.marker,
      major: section.major,
      label: `${section.marker} ${section.major}`
    },
    agent: {
      id: agent.id,
      label: agent.label,
      role: agent.role
    },
    insight,
    words,
    seed,
    theme,
    shots,
    beatMap,
    videoPrompt,
    lineageTag
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(section.marker)} ${escapeHtml(section.major)} :: ${escapeHtml(agent.id)} ${escapeHtml(agent.label)}</title>
  <style>
    :root {
      --bg-a: ${theme.palette.bgA};
      --bg-b: ${theme.palette.bgB};
      --bg-c: ${theme.palette.bgC};
      --ink: ${theme.palette.ink};
      --muted: ${theme.palette.muted};
      --line: ${theme.palette.line};
      --panel: ${theme.palette.panel};
      --accent: ${theme.palette.accent};
      --accent-2: ${theme.palette.accent2};
      --flare: ${theme.palette.flare};
      --snow: ${theme.palette.snow};
      --smoke: ${theme.palette.smoke};
      --ui-bg: #10151f;
      --ui-panel: #131926;
      --ui-line: #2f3a4e;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 100%;
      min-height: 100%;
      background: radial-gradient(circle at 20% 12%, var(--bg-b) 0%, var(--bg-a) 52%, #05070b 100%);
      color: var(--ink);
      font-family: ${theme.fonts.body};
    }

    .shell {
      max-width: 1400px;
      margin: 0 auto;
      padding: 10px;
      display: grid;
      gap: 8px;
    }

    .pane {
      border: 2px solid var(--ui-line);
      border-radius: 12px;
      background: var(--ui-panel);
      overflow: hidden;
    }

    .head {
      display: grid;
      gap: 6px;
      padding: 8px;
      border-bottom: 2px solid var(--ui-line);
      background: var(--ui-bg);
    }

    .kicker {
      font: 900 0.66rem/1 ${theme.fonts.mono};
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.09em;
    }

    h1 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.25;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .meta {
      color: var(--muted);
      font-size: 0.72rem;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .btn {
      min-height: 30px;
      border: 1px solid var(--ui-line);
      border-radius: 999px;
      background: #151e30;
      color: var(--ink);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      padding: 0 10px;
      font: 800 0.6rem/1.1 ${theme.fonts.body};
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
    }

    .btn.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .flow {
      padding: 8px;
      display: grid;
      gap: 8px;
      grid-template-columns: minmax(0, 1fr);
    }

    .step {
      border: 1px solid var(--ui-line);
      border-radius: 10px;
      background: #111828;
      overflow: hidden;
    }

    .step-head {
      padding: 7px 8px;
      border-bottom: 1px solid var(--ui-line);
      color: var(--muted);
      font-size: 0.72rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-weight: 900;
      background: #0f1521;
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
      font-size: 0.75rem;
      line-height: 1.35;
    }

    .compact-list li {
      border: 1px solid var(--ui-line);
      border-radius: 8px;
      background: #0d1320;
      padding: 6px 8px;
    }

    .prompt-box,
    .source-box {
      border: 1px solid var(--ui-line);
      border-radius: 8px;
      background: #090e18;
      color: #dfe7f5;
      font: 0.68rem/1.4 ${theme.fonts.mono};
      overflow: auto;
      white-space: pre-wrap;
      padding: 8px;
    }

    .prompt-box { max-height: 220px; }
    .source-box { max-height: 240px; white-space: pre; }

    .stage-wrap {
      padding: 8px;
      border-top: 1px solid var(--ui-line);
      background: #0d1320;
    }

    #stage {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      min-height: 290px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: linear-gradient(160deg, var(--bg-c) 0%, var(--bg-a) 52%, #06080e 100%);
      overflow: hidden;
      isolation: isolate;
    }

    #atmo {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 70% 12%, var(--flare) 0%, rgba(0,0,0,0) 46%), radial-gradient(circle at 20% 68%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 52%);
      z-index: 1;
    }

    #grid {
      position: absolute;
      inset: 0;
      display: grid;
      gap: 3px;
      opacity: 0;
      transition: opacity 0s;
      z-index: 2;
      background: rgba(0, 0, 0, 0.28);
    }

    #grid.cfg-single { grid-template-columns: 1fr; grid-template-rows: 1fr; }
    #grid.cfg-2x1 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; }
    #grid.cfg-2x2 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
    #grid.cfg-3x2 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr; }
    #grid.cfg-3x1 { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr 1fr; }

    .panel {
      position: relative;
      overflow: hidden;
      background: rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.04);
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
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 4px);
      pointer-events: none;
      z-index: 8;
    }

    .panel.pulse { animation: pulse 0.42s ease-in-out infinite alternate; }
    .panel.blur-x { animation: blurX 0.36s linear infinite; }
    .panel.jitter { animation: jitter 0.18s steps(2, end) infinite; }
    .panel.contrast { animation: contrast 0.26s ease-in-out infinite alternate; }
    .panel.strobe { animation: strobe 0.22s steps(2, end) infinite; }

    @keyframes pulse { from { filter: brightness(0.78); } to { filter: brightness(1.35); } }
    @keyframes blurX { 0% { filter: blur(0px) brightness(1); } 50% { filter: blur(2px) brightness(1.25); } 100% { filter: blur(0px) brightness(1); } }
    @keyframes jitter { 0% { transform: translate(0,0); } 50% { transform: translate(1px,-1px); } 100% { transform: translate(0,0); } }
    @keyframes contrast { from { filter: contrast(0.95); } to { filter: contrast(1.35); } }
    @keyframes strobe { 0% { opacity: 1; } 50% { opacity: 0.75; } 100% { opacity: 1; } }

    #overlay {
      position: absolute;
      inset: 0;
      z-index: 6;
      pointer-events: none;
      mix-blend-mode: screen;
      opacity: 0.58;
    }

    #overlay svg {
      width: 100%;
      height: 100%;
    }

    #text-layer {
      position: absolute;
      inset: 0;
      z-index: 9;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: ${theme.wordMode === "right" ? "flex-end" : theme.wordMode === "center" ? "center" : "flex-start"};
      padding: 6vw;
      mix-blend-mode: ${theme.tint === "hard" ? "normal" : "screen"};
      text-align: ${theme.wordMode === "right" ? "right" : theme.wordMode === "center" ? "center" : "left"};
    }

    .word {
      display: block;
      text-transform: uppercase;
      font-family: ${theme.fonts.display};
      font-weight: 900;
      letter-spacing: 0.08em;
      line-height: 0.86;
      color: var(--ink);
      transform: translateX(-40px) scale(0.98);
      opacity: 0;
      transition: none;
      text-shadow: 0 0 16px rgba(0,0,0,0.35);
    }

    .word.visible {
      transform: translateX(0) scale(1);
      opacity: 1;
    }

    .word.large { font-size: clamp(2.6rem, 9vw, 7.6rem); }
    .word.small { font-size: clamp(0.85rem, 3vw, 1.7rem); letter-spacing: 0.18em; color: var(--muted); }
    .word.xl { font-size: clamp(3rem, 12vw, 9.8rem); color: var(--accent); mix-blend-mode: normal; }

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
      z-index: 10;
    }

    #red-line.pulse-line { animation: pulseLine 0.62s ease-out forwards; }

    @keyframes pulseLine {
      0% { transform: scaleX(0); opacity: 1; }
      60% { transform: scaleX(1); opacity: 1; }
      100% { transform: scaleX(1); opacity: 0; }
    }

    #particles {
      position: absolute;
      inset: 0;
      z-index: 5;
      pointer-events: none;
    }

    #grain {
      position: absolute;
      inset: 0;
      z-index: 11;
      pointer-events: none;
      opacity: 0.08;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.0' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
      background-size: 190px;
    }

    .footer-meta {
      margin-top: 8px;
      font-size: 0.7rem;
      color: var(--muted);
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    @media (min-width: 1080px) {
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
        <div class="kicker">Singular Production Artifact</div>
        <h1>${escapeHtml(section.marker)} ${escapeHtml(section.major)} :: ${escapeHtml(agent.id)} ${escapeHtml(agent.label)}</h1>
        <div class="meta">Distinct lineage page. Prompt generated from section+agent, then translated into standalone animation artifact.</div>
        <div class="actions">
          <a class="btn" href="../index.html">Singular Index</a>
          <a class="btn" href="../../graph-operator-creatureliness.html">Graph Operator</a>
          <a class="btn" href="../${escapeHtml(promptRelPath)}">Prompt Markdown</a>
          <button id="copyPrompt" class="btn primary" type="button">Copy Video Prompt</button>
          <button id="copySource" class="btn" type="button">Copy HTML Source</button>
        </div>
      </header>

      <section class="flow">
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
              <strong style="font-size:0.72rem; letter-spacing:0.05em; text-transform:uppercase; color:var(--muted);">Master AI Video Prompt</strong>
              <pre id="videoPromptText" class="prompt-box">${escapeHtml(videoPrompt)}</pre>
            </div>
            <div>
              <strong style="font-size:0.72rem; letter-spacing:0.05em; text-transform:uppercase; color:var(--muted);">Single-File HTML/CSS/JS Source</strong>
              <pre id="htmlSource" class="source-box">Loading source...</pre>
            </div>
            <div class="footer-meta">
              <span>Lineage: ${escapeHtml(lineageTag)}</span>
              <span>Seed: ${escapeHtml(String(seed))}</span>
              <span>Shots: ${shots.length}</span>
            </div>
          </div>
        </article>
      </section>

      <section class="stage-wrap">
        <div id="stage">
          <div id="atmo"></div>
          <canvas id="particles"></canvas>
          <div id="grid" class="cfg-single"></div>
          <div id="overlay"></div>

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
    </section>
  </main>

  <script>
    const PAYLOAD = ${JSON.stringify(payload)};

    const el = {
      grid: document.getElementById("grid"),
      overlay: document.getElementById("overlay"),
      redLine: document.getElementById("red-line"),
      particles: document.getElementById("particles"),
      copyPrompt: document.getElementById("copyPrompt"),
      copySource: document.getElementById("copySource"),
      htmlSource: document.getElementById("htmlSource")
    };

    const state = {
      frame: 0,
      timer: null,
      live: null,
      wordShown: {
        a: false,
        b: false,
        c: false,
        d: false
      }
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

    el.copyPrompt.addEventListener("click", function () {
      copyText(PAYLOAD.videoPrompt);
    });

    el.copySource.addEventListener("click", function () {
      copyText(el.htmlSource.textContent || "");
    });

    fetch(window.location.href, { cache: "no-store" })
      .then(function (res) { return res.text(); })
      .then(function (html) { el.htmlSource.textContent = html; })
      .catch(function () { el.htmlSource.textContent = "Source load failed."; });

    function setGridLayout(layout) {
      el.grid.className = "";
      el.grid.classList.add(layout || "cfg-single");
    }

    function showGrid() {
      el.grid.style.opacity = "1";
    }

    function hideGrid() {
      el.grid.style.opacity = "0";
    }

    function showWord(key) {
      const id = "word-" + key;
      const node = document.getElementById(id);
      if (node) node.classList.add("visible");
      state.wordShown[key] = true;
    }

    function hideAllWords() {
      ["word-a", "word-b", "word-c", "word-d"].forEach(function (id) {
        const node = document.getElementById(id);
        if (node) node.classList.remove("visible");
      });
      state.wordShown = { a: false, b: false, c: false, d: false };
    }

    function panelSvg(type, frame, panelIndex) {
      const t = PAYLOAD.theme;
      const p = t.palette;
      const f = frame % 240;
      const wobble = Math.sin((f + panelIndex * 19) / 12);
      const tw = Math.cos((f + panelIndex * 23) / 15);
      const acc = p.accent;
      const acc2 = p.accent2;
      const line = p.line;

      if (type === "gauge") {
        const angle = -130 + ((f * 7 + panelIndex * 30) % 260);
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0b1118"/>' +
          '<circle cx="100" cy="100" r="82" fill="none" stroke="' + line + '" stroke-width="4"/>' +
          '<circle cx="100" cy="100" r="65" fill="#0a0d14" stroke="#2a3448" stroke-width="2"/>' +
          '<line x1="100" y1="100" x2="' + (100 + 56 * Math.cos((angle - 90) * Math.PI / 180)) + '" y2="' + (100 + 56 * Math.sin((angle - 90) * Math.PI / 180)) + '" stroke="' + acc + '" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="100" cy="100" r="7" fill="' + acc + '"/>' +
          '</svg>';
      }

      if (type === "gear") {
        const g = (Math.floor(f / 12) + panelIndex) % 6 + 1;
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#111019"/>' +
          '<rect x="85" y="25" width="30" height="150" rx="4" fill="#1d2330" stroke="' + line + '"/>' +
          '<circle cx="100" cy="28" r="22" fill="#202738" stroke="' + acc + '" stroke-width="2"/>' +
          '<text x="100" y="33" text-anchor="middle" fill="' + acc2 + '" font-size="15" font-family="monospace">' + g + '</text>' +
          '</svg>';
      }

      if (type === "eye") {
        const blink = ((f + panelIndex * 31) % 47) < 3;
        if (blink) {
          return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#0a0d14"/><line x1="18" y1="100" x2="182" y2="100" stroke="' + acc + '" stroke-width="2"/></svg>';
        }
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0a0d14"/>' +
          '<ellipse cx="100" cy="100" rx="70" ry="24" fill="#1a202f" stroke="' + line + '"/>' +
          '<ellipse cx="100" cy="100" rx="22" ry="22" fill="#11131c" stroke="' + acc + '" stroke-width="1.6"/>' +
          '<circle cx="100" cy="100" r="11" fill="#050609"/>' +
          '<circle cx="95" cy="95" r="4" fill="#f5f7fa" opacity="0.6"/>' +
          '</svg>';
      }

      if (type === "fire") {
        const h = 18 + ((f + panelIndex * 9) % 48);
        const h2 = 12 + ((f + panelIndex * 13) % 35);
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#08080a"/>' +
          '<rect x="0" y="140" width="200" height="60" fill="#10121a"/>' +
          '<polygon points="95,140 105,140 100,' + (140 - h) + '" fill="' + acc + '"/>' +
          '<polygon points="90,145 110,145 100,' + (145 - h2) + '" fill="' + acc2 + '" opacity="0.8"/>' +
          '</svg>';
      }

      if (type === "snow") {
        let flakes = "";
        for (let i = 0; i < 16; i += 1) {
          const x = (i * 17 + f * 2 + panelIndex * 13) % 200;
          const y = (i * 29 + f * 3 + panelIndex * 7) % 200;
          flakes += '<circle cx="' + x + '" cy="' + y + '" r="1.3" fill="' + p.snow + '"/>';
        }
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#0b1018"/>' + flakes + '</svg>';
      }

      if (type === "circuit") {
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0a1117"/>' +
          '<line x1="20" y1="40" x2="180" y2="40" stroke="' + line + '" stroke-width="2"/>' +
          '<line x1="20" y1="100" x2="140" y2="100" stroke="' + acc + '" stroke-width="2"/>' +
          '<line x1="60" y1="20" x2="60" y2="180" stroke="' + line + '" stroke-width="2"/>' +
          '<circle cx="140" cy="100" r="5" fill="' + acc2 + '"/>' +
          '</svg>';
      }

      if (type === "monolith") {
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#090d14"/>' +
          '<rect x="68" y="24" width="64" height="152" fill="#101722" stroke="' + line + '" stroke-width="2"/>' +
          '<circle cx="100" cy="100" r="22" fill="none" stroke="' + acc + '" stroke-width="1.8"/>' +
          '</svg>';
      }

      if (type === "helix") {
        let curve = "";
        for (let i = 0; i < 9; i += 1) {
          const y = 20 + i * 20;
          const x = 100 + Math.sin((f + i * 24) / 18) * 34;
          curve += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + (i % 2 === 0 ? acc : acc2) + '"/>';
        }
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#0a1217"/>' + curve + '</svg>';
      }

      if (type === "wire") {
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0a0f16"/>' +
          '<path d="M10,30 C80,' + (60 + wobble * 14) + ' 120,' + (16 + tw * 16) + ' 190,60" stroke="' + acc + '" fill="none" stroke-width="2"/>' +
          '<path d="M10,120 C90,' + (90 + wobble * 11) + ' 120,' + (170 + tw * 8) + ' 190,150" stroke="' + acc2 + '" fill="none" stroke-width="2"/>' +
          '</svg>';
      }

      if (type === "bars" || type === "redact") {
        let bars = "";
        for (let i = 0; i < 10; i += 1) {
          const y = 16 + i * 18;
          const w = 140 + ((i + panelIndex) % 4) * 11;
          bars += '<rect x="' + (20 + (i % 2) * 6) + '" y="' + y + '" width="' + w + '" height="10" fill="' + (i % 3 === 0 ? acc : line) + '" opacity="0.65"/>';
        }
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#0d0f17"/>' + bars + '</svg>';
      }

      if (type === "fracture" || type === "shards") {
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0f1117"/>' +
          '<polygon points="20,20 92,80 30,150" fill="' + line + '" opacity="0.55"/>' +
          '<polygon points="180,24 134,96 174,170" fill="' + acc + '" opacity="0.62"/>' +
          '<polygon points="76,130 126,90 148,170" fill="' + acc2 + '" opacity="0.54"/>' +
          '</svg>';
      }

      if (type === "spiral" || type === "ring") {
        let rings = "";
        for (let i = 0; i < 6; i += 1) {
          rings += '<circle cx="100" cy="100" r="' + (18 + i * 16 + (f % 9)) + '" fill="none" stroke="' + (i % 2 ? acc : acc2) + '" stroke-width="1" opacity="0.55"/>';
        }
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#0a1018"/>' + rings + '</svg>';
      }

      if (type === "silhouette" || type === "poster") {
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0d1118"/>' +
          '<path d="M70,180 L80,120 L95,94 L105,94 L120,120 L130,180 Z" fill="#161f2b" stroke="' + line + '"/>' +
          '<circle cx="100" cy="76" r="18" fill="#161f2b" stroke="' + acc + '"/>' +
          '</svg>';
      }

      if (type === "signal" || type === "diag") {
        let pts = "";
        for (let i = 0; i < 20; i += 1) {
          const x = i * 10;
          const y = 100 + Math.sin((f + i * 9) / 10) * 18;
          pts += (i ? " L" : "M") + x + "," + y;
        }
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#081018"/><path d="' + pts + '" stroke="' + acc + '" fill="none" stroke-width="2"/></svg>';
      }

      if (type === "gridwave") {
        let grid = "";
        for (let i = 0; i < 10; i += 1) {
          const o = 0.2 + (i % 3) * 0.15;
          grid += '<line x1="0" y1="' + (i * 20) + '" x2="200" y2="' + (i * 20) + '" stroke="' + line + '" opacity="' + o + '"/>';
          grid += '<line x1="' + (i * 20) + '" y1="0" x2="' + (i * 20) + '" y2="200" stroke="' + line + '" opacity="' + o + '"/>';
        }
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#081018"/>' + grid + '</svg>';
      }

      if (type === "liquid") {
        const y1 = 70 + Math.sin((f + panelIndex * 17) / 12) * 16;
        const y2 = 120 + Math.cos((f + panelIndex * 19) / 14) * 14;
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="200" height="200" fill="#0a0f1a"/>' +
          '<path d="M0,' + y1 + ' C40,' + (y1 - 24) + ' 80,' + (y1 + 24) + ' 120,' + y1 + ' C160,' + (y1 - 20) + ' 180,' + (y1 + 18) + ' 200,' + y1 + ' L200,200 L0,200 Z" fill="' + acc + '" opacity="0.55"/>' +
          '<path d="M0,' + y2 + ' C40,' + (y2 - 16) + ' 80,' + (y2 + 16) + ' 120,' + y2 + ' C160,' + (y2 - 14) + ' 180,' + (y2 + 14) + ' 200,' + y2 + ' L200,200 L0,200 Z" fill="' + acc2 + '" opacity="0.4"/>' +
          '</svg>';
      }

      if (type === "void") {
        const r = 24 + ((f + panelIndex * 33) % 34);
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#05070c"/><circle cx="100" cy="100" r="' + r + '" fill="none" stroke="' + acc2 + '" opacity="0.5"/><circle cx="100" cy="100" r="' + Math.max(10, r - 18) + '" fill="#070a10"/></svg>';
      }

      if (type === "biomech") {
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#091018"/><ellipse cx="100" cy="100" rx="70" ry="40" fill="none" stroke="' + line + '" stroke-width="3"/><line x1="20" y1="100" x2="180" y2="100" stroke="' + acc + '" stroke-width="2"/></svg>';
      }

      if (type === "glyph") {
        const chars = ["I", "X", "O", "V", "A", "Y"];
        let out = "";
        for (let i = 0; i < 10; i += 1) {
          out += '<text x="' + (18 + (i % 5) * 34) + '" y="' + (34 + Math.floor(i / 5) * 78) + '" fill="' + (i % 2 ? acc : acc2) + '" opacity="0.65" font-size="28" font-family="monospace">' + chars[(i + panelIndex) % chars.length] + '</text>';
        }
        return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#0b0f16"/>' + out + '</svg>';
      }

      return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#0d1018"/></svg>';
    }

    function overlaySvg(style, frame) {
      const p = PAYLOAD.theme.palette;
      const acc = p.accent;
      const line = p.line;
      const w = Math.sin(frame / 18) * 16;

      if (style === "reticle" || style === "optic") {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="28" fill="none" stroke="' + acc + '" stroke-width="0.5" opacity="0.4"/><line x1="50" y1="0" x2="50" y2="100" stroke="' + line + '" stroke-width="0.35"/><line x1="0" y1="50" x2="100" y2="50" stroke="' + line + '" stroke-width="0.35"/></svg>';
      }
      if (style === "helix") {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10,12 C40,' + (20 + w * 0.1) + ' 60,' + (80 - w * 0.1) + ' 90,88" stroke="' + acc + '" fill="none" stroke-width="0.6" opacity="0.5"/><path d="M10,88 C40,' + (80 - w * 0.1) + ' 60,' + (20 + w * 0.1) + ' 90,12" stroke="' + p.accent2 + '" fill="none" stroke-width="0.6" opacity="0.4"/></svg>';
      }
      if (style === "shards" || style === "propaganda") {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="4,8 36,20 12,46" fill="' + line + '" opacity="0.2"/><polygon points="96,14 70,42 92,74" fill="' + acc + '" opacity="0.18"/><polygon points="24,86 52,62 74,92" fill="' + p.accent2 + '" opacity="0.14"/></svg>';
      }
      if (style === "paper") {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="10" width="84" height="80" fill="none" stroke="' + line + '" stroke-dasharray="2 2" opacity="0.3"/><line x1="8" y1="32" x2="92" y2="32" stroke="' + acc + '" opacity="0.2"/></svg>';
      }
      if (style === "orbital") {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="50" rx="35" ry="14" fill="none" stroke="' + acc + '" opacity="0.3"/><ellipse cx="50" cy="50" rx="18" ry="35" fill="none" stroke="' + p.accent2 + '" opacity="0.26"/></svg>';
      }
      if (style === "double") {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="16" width="72" height="68" fill="none" stroke="' + line + '" opacity="0.2"/><line x1="18" y1="20" x2="84" y2="80" stroke="' + acc + '" opacity="0.25"/></svg>';
      }
      if (style === "void") {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="44" fill="none" stroke="' + line + '" opacity="0.2"/><circle cx="50" cy="50" r="18" fill="none" stroke="' + acc + '" opacity="0.3"/></svg>';
      }
      if (style === "biohazard") {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="8" fill="none" stroke="' + acc + '"/><circle cx="50" cy="30" r="16" fill="none" stroke="' + line + '" opacity="0.35"/><circle cx="34" cy="60" r="16" fill="none" stroke="' + line + '" opacity="0.35"/><circle cx="66" cy="60" r="16" fill="none" stroke="' + line + '" opacity="0.35"/></svg>';
      }
      if (style === "liquid") {
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M0,34 C24,' + (30 + w * 0.2) + ' 48,' + (38 - w * 0.15) + ' 72,34 C84,' + (32 + w * 0.15) + ' 92,30 100,34" stroke="' + p.accent2 + '" fill="none" opacity="0.35"/><path d="M0,68 C24,' + (70 - w * 0.2) + ' 48,' + (62 + w * 0.14) + ' 72,68 C84,' + (70 - w * 0.1) + ' 92,72 100,68" stroke="' + acc + '" fill="none" opacity="0.3"/></svg>';
      }

      return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="50" x2="100" y2="50" stroke="' + line + '" opacity="0.2"/></svg>';
    }

    function setPanels(shot) {
      setGridLayout(shot.layout || "cfg-single");
      el.grid.innerHTML = "";

      shot.panels.forEach(function (panel, idx) {
        const node = document.createElement("div");
        node.className = "panel" + (panel.fx ? " " + panel.fx : "");
        node.dataset.type = panel.type;
        node.dataset.idx = String(idx);
        node.innerHTML = panelSvg(panel.type, state.frame, idx);
        el.grid.appendChild(node);
      });

      showGrid();
    }

    function refreshLivePanels() {
      const panels = el.grid.querySelectorAll(".panel");
      panels.forEach(function (panel, idx) {
        const type = panel.dataset.type || "gauge";
        panel.innerHTML = panelSvg(type, state.frame, idx);
      });
      el.overlay.innerHTML = overlaySvg(PAYLOAD.theme.overlay, state.frame);
    }

    function startLive() {
      stopLive();
      state.live = setInterval(function () {
        state.frame += 1;
        refreshLivePanels();
      }, 110);
    }

    function stopLive() {
      if (state.live) {
        clearInterval(state.live);
        state.live = null;
      }
    }

    function pulseLine() {
      el.redLine.classList.remove("pulse-line");
      void el.redLine.offsetWidth;
      el.redLine.classList.add("pulse-line");
    }

    function snowParticles(frame) {
      const canvas = el.particles;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const count = 70;
      ctx.fillStyle = PAYLOAD.theme.palette.snow;
      for (let i = 0; i < count; i += 1) {
        const x = ((i * 57) + frame * 2 + (i % 7) * 11) % w;
        const y = ((i * 41) + frame * 3 + (i % 9) * 7) % h;
        const r = (i % 3) + 0.6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = PAYLOAD.theme.palette.smoke;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);
    }

    function resizeCanvas() {
      const box = el.particles.getBoundingClientRect();
      el.particles.width = Math.max(2, Math.floor(box.width));
      el.particles.height = Math.max(2, Math.floor(box.height));
    }

    function runSequence() {
      stopLive();
      hideGrid();
      hideAllWords();
      state.frame = 0;
      el.overlay.innerHTML = overlaySvg(PAYLOAD.theme.overlay, state.frame);

      PAYLOAD.shots.forEach(function (shot, idx) {
        setTimeout(function () {
          if (shot.collapse) {
            hideGrid();
            stopLive();
          } else {
            setPanels(shot);
            startLive();
          }

          if (shot.wordCue && !state.wordShown[shot.wordCue]) {
            showWord(shot.wordCue);
          }

          if (shot.pulse) {
            pulseLine();
          }

          state.frame += idx * 3;
          refreshLivePanels();
        }, shot.t);
      });
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    setInterval(function () {
      state.frame += 1;
      snowParticles(state.frame);
    }, 70);

    runSequence();
    setInterval(runSequence, 12600);
  </script>
</body>
</html>`;
}

function buildIndex(matrix) {
  const matrixJson = JSON.stringify(matrix);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Creatureliness Singular Pages</title>
  <style>
    :root {
      --bg: #070b11;
      --panel: #111722;
      --ink: #e6ecf5;
      --muted: #97a4ba;
      --line: #2f3a4e;
      --radius: 12px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      min-height: 100%;
      background: radial-gradient(circle at 20% 12%, #1b2738 0%, #0a1018 52%, #06090f 100%);
      color: var(--ink);
      font-family: "Avenir Next", "Segoe UI", system-ui, sans-serif;
    }

    .shell {
      max-width: 1320px;
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
      background: #0f1521;
      display: grid;
      gap: 6px;
    }

    h1 { margin: 0; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.03em; }

    .meta { color: var(--muted); font-size: 0.74rem; }

    .actions { display: flex; flex-wrap: wrap; gap: 6px; }

    .btn {
      min-height: 30px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #162034;
      color: var(--ink);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      padding: 0 10px;
      font: 800 0.6rem/1.1 inherit;
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
      background: #0f1521;
      color: var(--ink);
      font: inherit;
      font-size: 0.78rem;
      padding: 0 10px;
    }

    .count { color: var(--muted); font-size: 0.72rem; }

    .rows {
      max-height: calc(100vh - 190px);
      overflow: auto;
      background: #0d131e;
    }

    .row {
      border-top: 1px solid #223048;
      padding: 8px;
      display: grid;
      gap: 6px;
    }

    .row:first-child { border-top: 0; }

    .rid {
      font: 900 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #b7c4d8;
    }

    .rtitle { margin: 0; font-size: 0.8rem; }

    .cells {
      display: grid;
      gap: 6px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .cell {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 7px;
      background: #111a2a;
      display: grid;
      gap: 4px;
    }

    .aid { font: 800 0.66rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted); }
    .alabel { margin: 0; font-size: 0.75rem; }

    .mini-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .mini {
      min-height: 26px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 9px;
      background: #17243a;
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
        <h1>Creatureliness Singular Pages</h1>
        <div class="meta">Each section-agent pair is rendered as a distinct production page with its own overlay system, shot graph, and motion identity.</div>
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
          item.video_prompt,
          item.lineage
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

      const sectionOrder = [...new Set(MATRIX.map(function (item) { return item.section.marker; }))];
      const rows = [];

      sectionOrder.forEach(function (marker) {
        const items = grouped.get(marker);
        if (!items || !items.length) return;

        items.sort(function (a, b) { return a.agent.order - b.agent.order; });

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
          '<p class="rtitle">' + items[0].section.major + '</p>',
          '<div class="cells">' + cells + '</div>',
          '</article>'
        ].join(''));
      });

      el.rows.innerHTML = rows.join('');
      el.count.textContent = filtered.length + ' singular artifacts visible · ' + MATRIX.length + ' total';
    }

    el.rows.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-copy]");
      if (!btn) return;
      const id = btn.getAttribute("data-copy");
      const item = MATRIX.find(function (r) { return r.id === id; });
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
  const agentsRaw = Array.isArray(pkg.agents) ? pkg.agents : [];
  const globalSources = Array.isArray(pkg.global_sources) ? pkg.global_sources : [];

  if (!sections.length) throw new Error("No section blocks found.");
  if (!agentsRaw.length) throw new Error("No agents found.");

  ensureDir(OUT_DIR);
  ensureDir(PAGES_DIR);
  ensureDir(PROMPTS_DIR);

  const matrix = [];

  sections.forEach((section, sIdx) => {
    const discovery = extractTaggedSection(section.text, "DISCOVERY_REPORT");
    const deliveryText = extractTaggedSection(section.text, "THE_COLD_DELIVERY") || section.text;

    const insight = {
      seed: compactLine(extractField(discovery, "The_Seed"), "No seed supplied."),
      outlineCut: compactLine(extractField(discovery, "The_Outline_Straightjackets_Cut"), "No cut supplied."),
      resonance: compactLine(extractField(discovery, "Emergent_Resonance"), "No resonance supplied."),
      lead: compactLine(splitLines(deliveryText).find((line) => line.trim()), "No lead line."),
      deliveryText
    };

    agentsRaw.forEach((aRaw, aIdx) => {
      const agent = {
        id: aRaw.id || `AG${pad2(aIdx + 1)}`,
        label: aRaw.label || `Agent ${aIdx + 1}`,
        role: aRaw.role || "Generate singular title output.",
        sourcePaths: [...new Set([...(globalSources || []), ...((aRaw.prompt_sources || []))])],
        order: aIdx + 1
      };

      const theme = themeForAgent(agent);
      const lineageTag = `${agent.id}:${theme.overlay}:${theme.motion}`;
      const seed = hashString(`${section.marker}|${agent.id}|${insight.seed}|${insight.resonance}`);
      const rng = makeRng(seed);

      const beatMap = buildBeatMap(insight.seed, insight.outlineCut, insight.resonance, insight.lead);
      const videoPrompt = buildVideoPrompt(section, agent, insight, beatMap, theme);
      const words = pickWords(section, insight, agent, rng);
      const shots = buildShotRecipes(theme, rng);

      const fileStem = `s${pad2(sIdx + 1)}-a${pad2(aIdx + 1)}-${slug(agent.id)}-${slug(section.marker)}`;
      const pageRelPath = `pages/${fileStem}.html`;
      const promptRelPath = `prompts/${fileStem}.md`;

      const pageHtml = buildPageHtml({
        section,
        agent,
        insight,
        beatMap,
        videoPrompt,
        theme,
        words,
        shots,
        promptRelPath,
        lineageTag,
        seed
      });

      const promptMd = buildPromptMarkdown(section, agent, insight, beatMap, videoPrompt, pageRelPath, theme);

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
        lineage: lineageTag,
        files: {
          page: pageRelPath,
          prompt: promptRelPath
        },
        video_prompt: videoPrompt,
        beat_map: beatMap
      });
    });
  });

  const indexHtml = buildIndex(matrix);
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexHtml, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "matrix.json"), JSON.stringify({
    generated_at: new Date().toISOString(),
    dataset_file: path.basename(DATASET_FILE),
    package_file: path.basename(PACKAGE_FILE),
    sections: sections.length,
    agents: agentsRaw.length,
    artifacts: matrix.length,
    matrix
  }, null, 2), "utf8");

  console.log(`Generated ${matrix.length} singular pages in ${OUT_DIR}`);
}

main();
