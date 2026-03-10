#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

const ROOT = process.cwd();
const FILM_PAGE = path.join(ROOT, "creatureliness-manual-pages", "film-cut.html");
const OUT_DIR = path.join(ROOT, "creatureliness-manual-pages", "render");
const TEMP_DIR = path.join(OUT_DIR, "_temp");

const SCENE_COUNT = Number(process.env.SCENE_COUNT || 10);
const SCENE_MS = Number(process.env.SCENE_MS || 12600);
const LEAD_IN_MS = 900;
const TAIL_MS = 1200;
const TOTAL_MS = SCENE_COUNT * SCENE_MS + LEAD_IN_MS + TAIL_MS;

const TARGET_W = 1280;
const TARGET_H = 720;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const name of fs.readdirSync(dirPath)) {
    fs.rmSync(path.join(dirPath, name), { recursive: true, force: true });
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch({
      headless: true,
      args: ["--disable-gpu", "--no-sandbox"]
    });
  } catch (err) {
    console.warn("Bundled Chromium failed, retrying with system Chrome channel...");
    return chromium.launch({
      channel: "chrome",
      headless: true,
      args: ["--disable-gpu", "--no-sandbox"]
    });
  }
}

async function recordWebm() {
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: TARGET_W, height: TARGET_H },
    recordVideo: {
      dir: TEMP_DIR,
      size: { width: TARGET_W, height: TARGET_H }
    }
  });

  const page = await context.newPage();
  const video = page.video();

  await page.goto(pathToFileURL(FILM_PAGE).href, { waitUntil: "load" });
  await page.waitForTimeout(TOTAL_MS);

  await context.close();
  await browser.close();

  const rawPath = await video.path();
  return rawPath;
}

function transcodeToMp4(webmPath, mp4Path) {
  execFileSync("ffmpeg", [
    "-y",
    "-i", webmPath,
    "-vf", `scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=decrease,pad=${TARGET_W}:${TARGET_H}:(ow-iw)/2:(oh-ih)/2`,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "medium",
    "-crf", "18",
    "-movflags", "+faststart",
    mp4Path
  ], { stdio: "inherit" });
}

async function main() {
  if (!fs.existsSync(FILM_PAGE)) {
    throw new Error(`Missing film page: ${FILM_PAGE}`);
  }

  ensureDir(OUT_DIR);
  ensureDir(TEMP_DIR);
  cleanDir(TEMP_DIR);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const webmOut = path.join(OUT_DIR, `creatureliness-feature-cut-${stamp}.webm`);
  const mp4Out = path.join(OUT_DIR, `creatureliness-feature-cut-${stamp}.mp4`);

  console.log(`Recording feature cut (${Math.round(TOTAL_MS / 1000)}s) ...`);
  const tempWebm = await recordWebm();
  fs.copyFileSync(tempWebm, webmOut);

  console.log("Transcoding to MP4 ...");
  transcodeToMp4(webmOut, mp4Out);

  console.log("Done.");
  console.log(`WEBM: ${webmOut}`);
  console.log(`MP4 : ${mp4Out}`);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
