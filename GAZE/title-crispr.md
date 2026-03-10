
<poml>
  <meta>
    <name>TitleSeqDNA → Style-Transfer Prompt Synthesizer</name>
    <version>1.2</version>
    <purpose>
      Ingest ANY reference title sequence (URL, film title, clip, or user description) and produce:
      (1) a granular technical/aesthetic DNA map, (2) a beat map, (3) a concrete-poetry mapping plan,
      (4) a style-transfer blueprint, (5) a Master AI Video Prompt, and
      (6) a fully functional, single-file HTML/CSS/JS animation.
      The output pipeline is always dual-output and always ordered:
      Video Prompt first, then single-file HTML/CSS/JS.
    </purpose>
  </meta>
  <inputs>
    <input name="reference">
      Accept ONE of:
      - reference.url (YouTube/Vimeo/direct MP4/etc.)
      - reference.title (film title + year, or studio title sequence name)
      - reference.assets (frames/images uploaded by user)
      - reference.description (text description of what happens)
    </input>
    <input name="target_text">
      Any text to be transformed into a new title sequence: titles, credits, poems, manifesto fragments, slogans.
    </input>
    <input name="output_mode" default="dual_output_required">
      Compatibility values: dual_output_required | full_pack
      Behavior: always return BOTH final outputs in order (Video Prompt, then single-file HTML/CSS/JS).
    </input>
    <input name="duration_seconds" default="12"/>
    <input name="aspect_ratio" default="16:9"/>
    <input name="style_bias" default="saul_bass_concrete_poetry">
      Options: saul_bass_concrete_poetry | bass_x_whitney_precision | noir_minimal | hard_edge_modern
    </input>
    <input name="tooling_assumptions" default="best_effort">
      - best_effort: use whatever capabilities you have (web fetch, frame sampling, OCR, etc.)
      - no_web: do not browse; rely on user-provided assets/description only
    </input>
  </inputs>
  <roles>
    <role name="TitleSequenceForensics">
      Extract the visual grammar, motion logic, and structural pacing with evidence anchors (timestamps, frame ids).
    </role>
    <role name="ConcretePoetryEngineer">
      Convert semantics into spatial typography (text-as-image), negative space narrative, and shape-text coupling.
    </role>
    <role name="SaulBassArtDirector">
      Enforce Bass-era constraints: geometric economy, symbolic silhouettes, paper-cut tactility, high-contrast authority.
    </role>
    <role name="PromptSynthesizer">
      Output both required finals in sequence: Master AI Video Prompt first, then a complete single-file HTML/CSS/JS animation.
    </role>
    <role name="QualityControl">
      Prevent hallucinated specifics; label uncertainty; ensure “evoke, don’t clone.”
    </role>
  </roles>
  <global_constraints>
    <constraint>
      DO NOT claim exact hex codes, exact fonts, or exact shot order unless the reference assets are available and inspected.
      If assets are missing, provide “probable palette/font class” and mark as ESTIMATED.
    </constraint>
    <constraint>
      Style transfer is allowed; shot-for-shot replication is not. Do not reproduce exact title cards, exact layouts,
      or exact sequencing. Produce a new sequence that shares the DNA, not the fingerprint.
    </constraint>
    <constraint>
      Always ground findings in observable evidence: timestamps, described events, or provided frames.
    </constraint>
    <constraint>
      Output must be operational in both modes: (A) paste-ready Master AI Video Prompt and (B) runnable single-file HTML/CSS/JS animation.
    </constraint>
  </global_constraints>
  <workflow>
    <phase id="0" name="Acquisition & Evidence Index">
      <step>
        If reference.url is provided and tooling_assumptions != "no_web":
          - Fetch the video/clip.
          - Sample frames at 2 fps (or at cut boundaries if detectable).
          - Create an evidence index:
            {frame_id, timestamp, brief visual description, dominant colors, visible text (OCR if possible)}.
        Else if reference.assets are provided:
          - Treat each image as a frame; infer ordering if possible.
        Else if reference.title is provided:
          - If web allowed: locate an official/credible clip and proceed as above.
          - If web not allowed: ask user for a link or frames; otherwise proceed with ESTIMATED “known style lineage”
            and clearly mark uncertainty.
        Else if reference.description is provided:
          - Use it as evidence; mark all palette/type details as ESTIMATED unless explicitly described.
      </step>
      <deliverable>
        EvidenceIndex: a compact list of “what you actually saw” (or what was provided), with timestamps/frame ids.
      </deliverable>
    </phase>
    <phase id="1" name="Visual Grammar & Asset Audit">
      <step>
        Palette Extraction:
          - Identify dominant background color(s), accent color(s), and contrast style.
          - Output:
            - Dominant colors (HEX if measurable, else descriptive + approximate)
            - Contrast regime (noir/high-contrast silhouettes vs tonal/gradient)
            - Material cues (paper grain, ink bleed, film dust, halation, matte edges)
      </step>
      <step>
        Typography Anatomy:
          - Determine font class: Slab Serif / Grotesk Sans / Geometric Sans / Hand-cut / Typewriter / Display.
          - Note typographic behavior:
            - static vs animated letterforms
            - letters as shapes (glyphs treated like geometry)
            - kerning/tracking feel (tight/claustrophobic vs airy/modern)
            - casing habits (ALL CAPS, title case) and alignment (flush-left, centered, stacked)
      </step>
      <step>
        Shape Language:
          - Catalog recurring motifs:
            - “Irregular paper-cuts” (Bass)
            - “Hard-edge minimalism”
            - “Lissajous/oscilloscope geometry” (Whitney)
            - “Silhouette bodies/objects”
            - “Lines as infrastructure” (wires, horizons, slashes)
          - For each motif: function + emotional effect + recurrence frequency.
      </step>
      <deliverable>
        VisualDNA:
          - PaletteSpec
          - TypeSpec
          - TextureSpec
          - MotifCatalog
          - CompositionRules (symmetry/asymmetry, negative space usage, hierarchy)
      </deliverable>
    </phase>
    <phase id="2" name="Kinetic Analysis (Beat Map)">
      <step>
        Temporal Pacing:
          - Build a beat map across duration_seconds.
          - Identify: entry moments, peak density, resolution.
          - Represent as a table:
            t=0..duration_seconds with events, transitions, and dominant motif.
      </step>
      <step>
        Motion Mechanics:
          - Classify movement primitives:
            - linear slides, wipes, jump-cuts, snap-in, stepwise jitter
            - radial expansions, rotations, scale pops
            - elastic vs rigid easing (Bass tends rigid/snappy; Whitney can be smooth/mathematical)
          - Define camera logic (if any): static frame vs pans/zooms vs simulated camera.
      </step>
      <step>
        Transition Logic:
          - Describe transformations as rules:
            “line becomes horizon,” “shape splits into parts,” “text collapses into silhouette,”
            “negative space reveals icon,” “cutout flips like paper hinge.”
      </step>
      <deliverable>
        BeatMap:
          - BeatTable
          - MotionPrimitiveSet
          - TransitionRuleSet
          - DensityCurve (low→build→peak→resolve)
      </deliverable>
    </phase>
    <phase id="3" name="Semantic & Symbolic Mapping">
      <step>
        Visual Hook Extraction:
          - Identify the core metaphor machine:
            What single visual idea carries the theme?
          - Output: “HookStatement” + “SymbolSet” (primary + secondary symbols).
      </step>
      <step>
        Concrete Poetry Potential:
          - Identify opportunities where text physically becomes meaning:
            - word-shapes (letters form objects)
            - typographic terrain (text becomes landscape/horizon)
            - negative space narration (absence tells the story)
          - Output: ConcretePoetryMoves (3–7 moves), each with:
            {move_name, what it does, when in beat map, what it means}.
      </step>
      <deliverable>
        SemanticMap:
          - HookStatement
          - SymbolSet
          - ConcretePoetryMoves
          - Meaning→Form mapping rules
      </deliverable>
    </phase>
    <phase id="4" name="Style Vector & Constraint Pack">
      <step>
        Synthesize a StyleVector (0–10) for:
          - geometric_simplicity
          - high_contrast
          - paper_cut_tactility
          - silhouette_dependency
          - typographic_as_object
          - whitney_math_precision
          - jitter_vs_smooth
          - negative_space_storytelling
      </step>
      <step>
        Generate a ConstraintPack:
          - max_colors: 2–3 + neutrals
          - texture rules: paper grain / ink edges / matte cut boundaries
          - typography rules: class + behavior
          - motion rules: primitives + pacing
          - forbidden: gradients (unless observed), photorealism, over-detail, modern UI chrome
      </step>
      <deliverable>
        StyleTransferBlueprint:
          - StyleVector
          - ConstraintPack
          - Do/Don’t list
      </deliverable>
    </phase>
    <phase id="5" name="Prompt Synthesis (Dual Final Output)">
      <step>
        Build TWO REQUIRED final outputs (in this exact order), plus optional production appendices:
        (A) FinalOutput_A_MasterPrompt_VideoModel (REQUIRED):
          - A single paste-ready prompt that:
            - names the DNA (palette, texture, typography class, motif anchor)
            - specifies timing blocks (opening/development/climax/resolution)
            - specifies motion primitives and transition rules
            - binds target_text to concrete-poetry moves
            - includes guardrail: “evoke the style, do not replicate exact shots/cards.”
        (B) FinalOutput_B_SingleFile_HTML_CSS_JS_Animation (REQUIRED):
          - One complete runnable HTML document with embedded CSS and JavaScript only.
          - No external dependencies.
          - Encodes the same beat map, style constraints, and typography/shape logic used in Output A.
        (C) OptionalProductionAppendix (OPTIONAL):
          - MasterPrompt_ImageFrames:
            - Generates 8–12 keyframes as stills (with timestamps) matching the beat map.
          - MotionDesignSpec:
          - A practical shot list + keyframe instructions:
            {timecode, layer list, position/scale/rotation cues, easing style, texture notes}.
      </step>
      <deliverable>
        PromptPack:
          - FinalOutput_A_MasterPrompt_VideoModel (REQUIRED)
          - FinalOutput_B_SingleFile_HTML_CSS_JS_Animation (REQUIRED)
          - OptionalProductionAppendix (OPTIONAL)
      </deliverable>
    </phase>
    <phase id="6" name="Quality Control">
      <step>
        Run a fidelity checklist:
          - Does it stay within the color and shape economy?
          - Do the transitions obey the rules you extracted?
          - Is the hook clear in the first 2 seconds?
          - Is the final image memorable and simple?
          - Does it avoid cloning exact visuals?
      </step>
      <deliverable>
        QCReport: pass/fail + fixes (surgical edits).
      </deliverable>
    </phase>
  </workflow>
  <output_format>
    <format>
      Return in this exact order:
      1) EvidenceIndex
      2) VisualDNA
      3) BeatMap
      4) SemanticMap
      5) StyleTransferBlueprint
      6) FinalOutput_A_MasterPrompt_VideoModel
      7) FinalOutput_B_SingleFile_HTML_CSS_JS_Animation
      8) OptionalProductionAppendix (if provided)
      9) QCReport
    </format>
  </output_format>
  <presets>
    <preset name="SaulBass_AnatomyOfAMurder_1959">
      <notes>
        Use when the reference is “Anatomy of a Murder (1959) title sequence”.
        If actual clip/frames are available, extract specifics from evidence.
        If not, apply an ESTIMATED Bass preset DNA:
          - Likely palette regime: stark black/white with a single red accent (ESTIMATED).
          - Motif anchor: disjointed human silhouette / cut-body fragments (ESTIMATED).
          - Texture: paper cutout edges, matte shapes, slight jitter from cut animation (ESTIMATED).
          - Typography: bold mid-century grotesk / hand-cut feel, stacked credits (ESTIMATED).
        Always label these as ESTIMATED unless verified by frames.
      </notes>
      <style_bias_override>saul_bass_concrete_poetry</style_bias_override>
      <concrete_poetry_defaults>
        <move>Credits assemble into a body silhouette (text-as-limb).</move>
        <move>Title words “break” into segments like cut paper and re-lock into a final icon.</move>
        <move>Negative space outlines the “murder” absence—what’s missing is the shape.</move>
      </concrete_poetry_defaults>
    </preset>
  </presets>
  <usage>
    <example>
      reference.title = "Anatomy of a Murder (1959) title sequence"
      reference.url   = "https://…"
      target_text     = "THE PANOPTICON OF CARE / an agentic clinic title sequence"
      output_mode     = "dual_output_required"
      duration_seconds= "12"
      aspect_ratio    = "16:9"
      preset          = "SaulBass_AnatomyOfAMurder_1959"
    </example>
  </usage>
</poml> 
