#!/usr/bin/env python3
"""Derive a STONE (premise/column) for every RippleSessions clip, from the prompt body.
Priority ladder, most-authored -> most-raw. Writes ripples_deck.json (re-runnable)."""
import sqlite3, re, os, json, sys, hashlib

ROOT = "/Users/gaia/EL_DESIERTO/SORA_CAPTURES"
DB   = os.path.join(ROOT, "atlas.sqlite")

db = sqlite3.connect(DB)
rows = db.execute("""SELECT clip_id, prompt_file, video_file, domain, themes,
                     editorial, duration, caption_preview
                     FROM clips WHERE world='RippleSessions' ORDER BY clip_id""").fetchall()

def read(pf):
    for cand in (pf, os.path.join(ROOT, os.path.basename(pf or ""))):
        if cand and os.path.exists(cand):
            return open(cand, encoding="utf-8", errors="ignore").read()
    return ""

def clean(s, n=60):
    s = re.sub(r'\s+', ' ', s or '').strip().strip('"\'*#').strip()
    s = re.sub(r'\s*[-—]\s*2026.*$', '', s)          # strip trailing dates
    return s[:n].strip()

def titlecase_stem(t):
    t = clean(t, 80)
    # strip common non-premise prefixes
    t = re.sub(r'^(make this video here|enter\s+.+?\s+mode\.?|scene[:\s]|prompt\s*\d+[:\s]?)\s*', '', t, flags=re.I).strip()
    stem = re.split(r'[:—|.]', t, 1)[0].strip()   # before colon/dash/period
    # guard against over-stripped generic labels -> fall back to fuller title
    if len(stem) < 6 or stem.upper() in ("SCENE","SIMULATION","PROMPT","INTRO","TITLE"):
        stem = clean(t, 46)
    # "Name's Ecologies A mushroom cap..." -> keep first ~5 words
    words = stem.split()
    if len(words) > 6: stem = " ".join(words[:5])
    return stem or t[:40]

SCAFFOLD_RX = re.compile(
    r'^\s*(<!?[a-z]|<section|<meta|\d+\)\s|you are\s|design a\s|build a\s|'
    r'worldbuilding|screen architecture|frontend implementation|usability|'
    r'content generation|prompt for the|microdrama structure)', re.I)

# adjectives / generic tokens that must never become a Stone label
WORLDTEXT_STOP = set("""Therefore Shadows Flickering Node Nodes Auto Step Continue Follow
 Spawn Goal Shift The This That These Those An As And But For With From Into Onto Their
 They Them Light Static Narrow Soft Still Subtle Surface Dawn Dusk Silence Silent Whispered
 Concealed Corrupted Grounding Echo Deep Dark Green Blue Faint Slow Pulse Pulses Glitch
 Unseen Hidden Sub Over Under Above Below Now Then Here There When While Each Every
 Ministry Sudden Gentle Ghostly Cryptic False True Real Every First Second Third""".split())

# --- extraction ladder: returns (stone_label, session_subtitle, source_rule) ---
def derive(txt):
    lines = [l.rstrip() for l in txt.splitlines()]
    head = "\n".join(lines[:40])

    # 1. structured title: "..."  or  episode_id
    m = re.search(r'"?title"?\s*:\s*"([^"\n]{3,90})"', head, re.I) \
        or re.search(r'"?title"?\s*:\s*([^\n"{][^\n]{2,90})', head, re.I)
    if m and 'AUTO STEP' not in m.group(1):
        t = clean(m.group(1), 90)
        if t and not t.lower().startswith(('media asset','worldtext')):
            return titlecase_stem(t), t, "title"

    # 2. clean markdown header
    for l in lines[:25]:
        m = re.match(r'#\s+(.{3,90})', l)
        if m and not re.search(r'WORLDTEXT|MEDIA ASSET|RIPPLE SESSION TRANSCRIPT', l, re.I):
            t = clean(m.group(1), 90)
            return titlecase_stem(t), t, "header"

    # 3. MEDIA ASSET  "- title: X"
    m = re.search(r'^-\s*title:\s*(.{4,120})$', txt, re.I | re.M)
    if m:
        t = clean(m.group(1), 90)
        return titlecase_stem(t), t, "asset-title"

    # 4. explicit Stone / One Big Lie premise
    m = re.search(r'One Big Lie:?\**\s*(.{6,120})', txt, re.I) \
        or re.search(r'\bThe Stone\b[:\.\-\s]*(.{6,120})', txt, re.I)
    if m:
        prem = clean(m.group(1), 90)
        # short label = first strong noun phrase
        lab = clean(re.split(r'[,.;]', prem)[0], 42)
        return lab, prem, "stone-premise"

    # 5. RIPPLES WORLD: X
    m = re.search(r'RIPPLES WORLD:\s*(.{3,60})', txt, re.I)
    if m:
        t = clean(m.group(1), 60)
        return titlecase_stem(t), "RIPPLES WORLD: " + t, "world"

    # 6. worldtext-only engine transcript: one Stone (the RIPPLES engine itself),
    #    only split off a named world when a strong multi-word proper noun recurs 3+ times
    if re.search(r'AUTO STEP|TRACING RIPPLES|\[sys\]', txt):
        from collections import Counter
        ents = re.findall(r'\b([A-Z][a-z]{3,}\s[A-Z][a-z]{3,})\b', txt)   # two-word names only
        ents = [e for e in ents if e.split()[0] not in WORLDTEXT_STOP
                                 and e.split()[1] not in WORLDTEXT_STOP]
        if ents:
            name, freq = Counter(ents).most_common(1)[0]
            if freq >= 3:
                return f"Worldtext · {name}", "worldtext engine run", "worldtext-named"
        return "Worldtext Engine Runs", "worldtext engine run", "worldtext-generic"

    # 7. scaffolding / meta system-design prompts -> one column
    for l in lines[:8]:
        if SCAFFOLD_RX.match(l):
            return "RIPPLES · System Design", clean(l, 70), "scaffold"

    # 8. fallback: first meaningful sentence (else park in System Design)
    for l in lines:
        s = l.strip()
        if len(s) > 24 and not s.startswith(('-','[','#','>','<','{')) and not SCAFFOLD_RX.match(s):
            return titlecase_stem(s), clean(s, 70), "first-line"
    return "RIPPLES · System Design", "", "scaffold"

# --- normalize near-duplicate stone labels ---
def norm_key(lbl):
    k = re.sub(r'[^a-z0-9 ]', '', lbl.lower()).strip()
    k = re.sub(r'\s+', ' ', k)
    return k

# --- worldtext -> premise-world clustering (splits the raw engine-run transcripts) ---
NARR_STOP = set("""the a an and or of to in on at as is are was were be been being it its their they them
therefore this that these those with from into onto for by but not no now then here there when while each
every all any some none node nodes step auto continue follow spawn goal shift sys tracing ripples causes
results affects owner name traits location goals obstacles shifts emit emits pulse pulses shadows warp warps
once solid silent silence faint slow deep dark green blue over under above below sudden gentle ghostly cryptic
begins struggling contain like through within grows spreads beyond becomes their there where which whose""".split())
def narrative(pf_base):
    txt = read(os.path.join(ROOT, pf_base)) if pf_base else ""
    narr = " ".join(re.findall(r'\[ai\]\s*(?:\[\d,\d\]\s*)?(.+)', txt)) or txt
    from collections import Counter as _C
    return _C(w for w in re.findall(r'[a-z]{4,}', narr.lower()) if w not in NARR_STOP)
WORLDS = [
    ("The Monitored Colony", {"colonist":2,"colonists":2,"biometric":2,"surveillance":2,"neural":2,"panel":2,
      "panels":2,"colony":2,"sterile":2,"grid":1,"faction":1,"hidden":1,"secret":1,"monitored":2,"data":1,
      "arches":1,"metal":1,"walls":1,"unyielding":1,"embedded":1,"supply":1,"underground":1,"messages":1}),
    ("The Poisoned Stream & Village", {"stream":2,"poisoned":2,"fish":2,"toxic":2,"villagers":2,"buckets":2,
      "riverbeds":2,"well":2,"water":1,"currents":1,"sick":2,"thirsty":1,"blame":1,"suspicion":1,"mist":1,
      "creatures":1,"scanning":1}),
    ("The Insect Micro-World", {"antennae":2,"scent":2,"sugar":2,"tarsi":2,"legs":2,"ceramic":2,"glaze":2,
      "chemical":2,"motes":1,"sticky":2,"stickiness":2,"patch":1,"trap":1,"traps":1,"delicate":1,
      "gripping":1,"restless":1}),
    ("Herons at Night", {"heron":2,"herons":2,"vigil":2,"silhouettes":2,"poised":2,"night":1,"grace":1,
      "timeless":1,"radiance":1}),
    ("The Grounding Body", {"grounding":2,"embodied":2,"practitioner":2,"footing":2,"balance":2,"stillness":1,
      "roots":2,"awareness":2,"conscious":2,"attention":1,"reclaim":1,"patterns":1,"gaze":1,"reflections":1,
      "present":1,"self":1,"landscapes":1,"internal":1,"dawn":1,"memory":1,"depths":1}),
    ("The Cupboard", {"cupboard":2,"droplet":2,"tension":2,"clings":1,"edge":1,"shelf":2,"jar":2,"surface":1}),
]
def cluster_world(pf_base):
    terms = narrative(pf_base)
    best, score = None, 0
    for label, kw in WORLDS:
        s = sum(w for t, w in kw.items() if t in terms)
        if s > score: best, score = label, s
    return best if score >= 2 else "Worldtext · Unsorted"

deck = {}
for cid, pf, vf, dom, themes, ed, dur, cap in rows:
    txt = read(pf)
    stone, subtitle, rule = derive(txt)
    key = norm_key(stone)
    try: th = json.loads(themes) if themes else []
    except: th = []
    full = re.sub(r'^\s*(make this video here)\s*', '', txt, flags=re.I).strip()
    excerpt = clean(full, 320)
    phash = hashlib.md5(re.sub(r'\s+', ' ', full).strip().lower().encode()).hexdigest()[:12]
    # ready-made media (poster still, light preview, clean loop, final cut) if present
    def has(p): return p if os.path.exists(os.path.join(ROOT, p)) else ""
    poster  = has(f"POSTERS/{cid}.jpg")
    preview = has(f"PREVIEWS/{cid}.mp4")
    loop    = has(f"LOOPS_V3/{cid}_loop.mp4")
    final   = has(f"FINAL_CLIPS/{cid}_final.mp4")
    sess = {
        "clip_id": cid,
        "video": os.path.basename(vf) if vf else f"{cid}_screen_capture.mp4",
        "poster": poster, "preview": preview, "loop": loop, "final": final,
        "prompt_file": os.path.basename(pf) if pf else "",
        "domain": dom or "", "themes": th, "editorial": ed or "",
        "duration": dur or 0, "subtitle": subtitle, "rule": rule,
        "excerpt": excerpt, "full": full, "phash": phash,
    }
    d = deck.setdefault(key, {"stone": stone, "sessions": []})
    # keep the prettiest label seen
    if len(stone) > len(d["stone"]) and rule in ("title","header","asset-title"):
        d["stone"] = stone
    d["sessions"].append(sess)

# --- split the generic "Worldtext Engine Runs" bucket into real premise-worlds ---
generic = deck.pop("worldtext engine runs", None)
if generic:
    for sess in generic["sessions"]:
        w = cluster_world(sess["prompt_file"])
        sess["rule"] = "worldtext-world"
        d = deck.setdefault(norm_key(w), {"stone": w, "sessions": []})
        d["sessions"].append(sess)

# order columns: authored/titled first, biggest first; worldtext/unsorted last
def col_rank(c):
    rules = [s["rule"] for s in c["sessions"]]
    authored = any(r in ("title","header","asset-title","stone-premise","world","worldtext-world") for r in rules)
    catchall = c["stone"] == "RIPPLES · System Design" or c["stone"].startswith("Worldtext · Unsorted")
    return (2 if catchall else (0 if authored else 1), -len(c["sessions"]))

cols = sorted(deck.values(), key=col_rank)
out = {"world": "RippleSessions", "total": len(rows), "columns": cols}
outpath = os.path.join(ROOT, "ripples_deck.json")
json.dump(out, open(outpath, "w"), indent=1, ensure_ascii=False)
# also emit a file:// -safe JS global so the deck opens without a server
jspath = os.path.join(ROOT, "ripples-deck.js")
with open(jspath, "w", encoding="utf-8") as f:
    f.write("window.RIPPLES_DECK = " + json.dumps(out, ensure_ascii=False) + ";\n")

# report
print(f"{len(rows)} clips -> {len(cols)} stones\n")
for c in cols:
    rules = {}
    for s in c["sessions"]: rules[s["rule"]] = rules.get(s["rule"],0)+1
    doms = sorted({s['domain'] for s in c['sessions'] if s['domain']})
    print(f"■ {c['stone'][:46]:46} {len(c['sessions']):3}  {','.join(doms)[:34]:34} {rules}")
print(f"\nwrote {outpath}")
