const cardsRoot = document.getElementById("cards");
const template = document.getElementById("video-card-template");
const meta = document.getElementById("meta");
const docsRoot = document.getElementById("docs-list");
const markdownFiles = ["prompt.md", "titles.md", "bass.md"];

void init();

async function init() {
  try {
    const response = await fetch("titles.md", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load titles.md (${response.status})`);
    }

    const markdown = await response.text();
    const entries = parseMarkdownEntries(markdown);
    renderEntries(entries);

    const available = entries.filter((entry) => entry.videoId).length;
    meta.textContent = `${entries.length} titles loaded, ${available} with embeddable YouTube URLs.`;
  } catch (error) {
    meta.textContent = "Could not load titles.md.";
    showEmptyState(String(error.message || error));
  }

  await loadMarkdownDocs();
}

function parseMarkdownEntries(markdown) {
  const entries = [];

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("- **")) {
      continue;
    }

    const titleMatch = line.match(/^-\s+\*\*(.+?)\*\*/);
    if (!titleMatch) {
      continue;
    }

    const title = titleMatch[1].replace(/:\s*$/, "").trim();
    const urls = [...line.matchAll(/\((https?:\/\/[^\s)]+)\)/g)].map((match) => match[1]);
    const youtubeUrl = urls.find(isYouTubeUrl) || null;
    const videoId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;

    entries.push({ title, youtubeUrl, videoId });
  }

  return entries;
}

function isYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

function extractYouTubeId(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host.endsWith("youtube.com")) {
      const paramId = parsed.searchParams.get("v");
      if (paramId) {
        return paramId;
      }

      const parts = parsed.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }

      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex !== -1 && parts[shortsIndex + 1]) {
        return parts[shortsIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

function renderEntries(entries) {
  cardsRoot.innerHTML = "";

  if (!entries.length) {
    showEmptyState("No title bullets were found in titles.md.");
    return;
  }

  for (const entry of entries) {
    cardsRoot.append(createCard(entry));
  }
}

function createCard(entry) {
  const card = template.content.firstElementChild.cloneNode(true);
  const title = card.querySelector(".card-title");
  const status = card.querySelector(".card-status");
  const playerWrap = card.querySelector(".player-wrap");
  const iframe = card.querySelector("iframe");
  const actions = card.querySelector(".card-actions");
  const openLink = card.querySelector(".open-link");
  const copyButton = card.querySelector(".copy-btn");
  const snippet = card.querySelector(".embed-snippet");
  const snippetCode = snippet.querySelector("code");

  title.textContent = entry.title;

  if (!entry.videoId || !entry.youtubeUrl) {
    status.textContent = "No embeddable YouTube URL found for this title.";
    card.classList.add("unavailable");
    return card;
  }

  const embedSrc = `https://www.youtube.com/embed/${entry.videoId}?rel=0`;
  const embedHtml = buildEmbedHtml(entry.videoId, entry.title);

  status.textContent = "Ready to watch in iframe and embed elsewhere.";
  playerWrap.classList.remove("hidden");
  iframe.src = embedSrc;
  iframe.title = `${entry.title} (YouTube embed)`;

  actions.classList.remove("hidden");
  openLink.href = entry.youtubeUrl;
  copyButton.addEventListener("click", () => {
    void copyEmbedCode(embedHtml, copyButton);
  });

  snippet.classList.remove("hidden");
  snippetCode.textContent = embedHtml;

  return card;
}

function buildEmbedHtml(videoId, title) {
  return [
    `<iframe`,
    `  width="560"`,
    `  height="315"`,
    `  src="https://www.youtube.com/embed/${videoId}"`,
    `  title="${escapeAttribute(title)}"`,
    `  frameborder="0"`,
    `  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"`,
    `  referrerpolicy="strict-origin-when-cross-origin"`,
    `  allowfullscreen`,
    `></iframe>`,
  ].join("\n");
}

function escapeAttribute(value) {
  return value.replace(/"/g, "&quot;");
}

async function copyEmbedCode(code, button) {
  const defaultLabel = button.textContent;

  try {
    await navigator.clipboard.writeText(code);
    button.textContent = "Copied";
    button.classList.add("copied");
  } catch {
    button.textContent = "Copy failed";
  } finally {
    window.setTimeout(() => {
      button.textContent = defaultLabel;
      button.classList.remove("copied");
    }, 1400);
  }
}

function showEmptyState(message) {
  cardsRoot.innerHTML = "";
  const block = document.createElement("p");
  block.className = "empty-state";
  block.textContent = message;
  cardsRoot.append(block);
}

async function loadMarkdownDocs() {
  if (!docsRoot) {
    return;
  }

  docsRoot.innerHTML = "";

  for (const file of markdownFiles) {
    docsRoot.append(await createDocItem(file));
  }
}

async function createDocItem(file) {
  const wrapper = document.createElement("article");
  wrapper.className = "doc-item";

  const head = document.createElement("div");
  head.className = "doc-head";

  const name = document.createElement("p");
  name.className = "doc-name";
  name.textContent = file;

  const actions = document.createElement("div");
  actions.className = "doc-actions";

  const open = document.createElement("a");
  open.className = "doc-btn doc-open";
  open.href = file;
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  open.textContent = "Open";

  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "doc-btn doc-copy";
  copy.textContent = "Copy";

  const pre = document.createElement("pre");
  pre.className = "doc-pre";

  try {
    const response = await fetch(file, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed (${response.status})`);
    }

    const text = await response.text();
    pre.textContent = text;
    copy.addEventListener("click", () => {
      void copyDoc(text, copy);
    });
  } catch (error) {
    pre.classList.add("error");
    pre.textContent = `Unable to load ${file}: ${String(error.message || error)}`;
    copy.disabled = true;
  }

  actions.append(open, copy);
  head.append(name, actions);
  wrapper.append(head, pre);

  return wrapper;
}

async function copyDoc(text, button) {
  const defaultLabel = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
    button.classList.add("copied");
  } catch {
    button.textContent = "Copy failed";
  } finally {
    window.setTimeout(() => {
      button.textContent = defaultLabel;
      button.classList.remove("copied");
    }, 1400);
  }
}
