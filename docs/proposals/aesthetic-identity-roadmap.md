# Noirable — Design & Generative-Identity Roadmap

> Make the app gorgeous, and make every generated artifact — UI, images, audio, music, voice, atmosphere, copy — feel **unique and deeply adapted to each aesthetic preset** (and to custom profiles).

_Generated 2026-06-05 from an 8-angle deep analysis of the codebase (visual/motion, preset identity, image gen, audio/music, voice/narration, A2UI generation & variants, customization-lab UX, architecture). 84 grounded ideas distilled below._


---

## North-star vision

Noirable becomes a machine for inhabiting worlds, not skinning one. Every generated artifact — the UI surface, its images, its voice, its music and weather, even its loading state and microcopy — is resolved from a single per-preset identity model, so a Nostromo session feels like a Weyland-Yutani mainframe and a Gothic session feels like a candlelit manuscript, not noir-with-different-paint. The whole experience is driven by one data-driven aesthetic definition that built-in presets and AI-generated custom worlds both flow through, making each world deep, internally coherent, and cheap to extend.


## Cross-cutting themes

### Collapse the scattered identity into one resolved model

Per-preset identity is currently hand-copied across registry.ts, globals.css, audio-packs.ts, voice-defaults.ts, ColorCustomization PRESET_COLORS, and two hardcoded switch statements in SurfaceRenderer (with literal magenta-500/cyan-400 that drift from the #00ffcc/#ff007f tokens and omit minimal+custom). A single client-safe AestheticDefinition + resolveAesthetic(baseId, customProfile?) is the keystone: it kills the duplication, makes custom profiles real supersets of their base, and lets renderers/CSS/audio/voice/image/copy all read identical data.

### Kill noir leakage in the chrome and atmosphere

The desk-lamp amber glow (rgba(255,191,0)), CRT bloom, scrollbar, rain/fog/lightning, film grain, dictaphone framing, and hardcoded strings ('Evidence Board','CASE FILE','WIRE TAP PENDING') are noir-only and forced onto every world. Driving glow/atmosphere/copy from per-preset tokens is the highest consistency-per-effort win and the difference between five worlds and one recolored world.

### Make the live surface materialize, not pop

The live render path (SurfaceRenderer) has zero framer-motion despite it being an installed, already-used dep. Staggered per-preset entrance, micro-interactions, real icon glyphs (instead of literal [name] text), characterful skeletons, and physical card materials (the gorgeous .bg-paper/.coffee-stain treatments are wasted because the live CardRenderer never applies them) turn 'it rendered' into 'it materialized'.

### Per-preset generation, not per-preset color

The model gets identical structural advice for all five presets, so a terminal and a manuscript come out the same shape. Per-preset LAYOUT DOCTRINE + a component playbook + few-shot examples + a hero-image rule make the generated UI a different SHAPE per world. Structured image specs with real negatives/aspect-ratios and per-preset develop reveals make images native to the world.

### Adapt every output channel, not just the visual

Voice prosody is identical across presets (MU-TH-UR sounds like the gothic narrator); music presets are 100% 1940s jazz; SFX fire on noir-only English keywords so 4 of 5 presets are silent; nostromo plays 'rain' to fake a ship hum. Per-preset voice direction, music prompts, an event-driven SFX bus, and a correct ambient vocabulary make the soundscape and spoken voice belong to each world.

### Variants and iteration as first-class delight

Today one tree replaces the last (sendPrompt clears every time) and the built v0.9 Update Rules path is dead (evidence hardcoded undefined). Wiring baseline-into-prompt, adding regenerate/'make it fancier'/variant-pick affordances, image variants, and a composition seed turns the app from a one-shot generator into a creative tool — for UI, images, and narration takes.

### Customization Lab that is complete, live, and generative

A custom profile's CSS only 'wakes up' after the user nudges the Colors tab (injectProfileStyles is never called on mount/switch); there's no font or image-style editor though the engine honors both; Effects/Audio tabs write to global settings not the profile. Fix the live-apply bug, close the editor gaps, add legibility guardrails, palette harmony, a gallery, and AI 'describe-a-vibe' generation to make creating a world delightful.


## Foundation first (the keystone)

The single client-safe AestheticDefinition + resolveAesthetic() model must land before scaling per-preset work — it is the keystone the analyses independently converge on. Right now every per-preset literal (noir's #ffbf00 alone lives in 4 files: registry.ts, globals.css, ColorCustomization PRESET_COLORS, and as drifted text-cyan-400/magenta-500 in SurfaceRenderer's switch), and there is no compiler enforcement that the copies agree — adding a 6th preset or deepening one means editing 5-6 files in lockstep. Without this, every gorgeous-making idea (styleTokens, atmosphere, per-preset copy, voice direction, structured images, AI theme generation) either has to invent its own scattered switch (more drift) or can't reach custom profiles at all. Concretely: (1) extract AESTHETIC_DEFINITIONS as pure client-safe data with room for the new identity fields, keeping persona bodies server-only; (2) make audio-packs.ts/voice-defaults.ts/PRESET_COLORS re-export from it; (3) build resolveAesthetic + useResolvedAesthetic so built-ins and custom profiles present ONE shape to every consumer; (4) add a definitions.test.ts asserting completeness + that asset paths exist + (eventually) that globals.css vars match the def, ideally by generating the [data-aesthetic] CSS blocks from the def at build time. Two surgical bug-fixes should ride alongside as immediate enablers because they block visible customization regardless of architecture: the injectProfileStyles-on-activation fix (custom profiles currently render as bare base on load/switch) and threading the current surface into the v0.9 stream's buildSystemPrompt evidence arg (the Update Rules path is built but dead). Keep noir byte-identical throughout and lean on the existing e2e layout snapshots to catch regressions.


## Quick wins — high impact, low effort

Do these right after (or alongside) the foundation.


**1. Fix live-preview-on-activation (the #1 correctness bug)**  _(from: Customization Lab)_  

injectProfileStyles is only called from ColorCustomization, so a saved custom profile renders as its bare base preset on load and on profile switch — silently breaking every customization. Add an effect in DetectiveWorkspace keyed on activeProfile.id+updatedAt that injects the active profile's CSS, and iterate all loaded profiles once after loadProfiles() so the [data-custom-profile] selector always matches. Centralize in useCustomProfileStore setActiveProfile/updateProfile.  

`src/components/layout/DetectiveWorkspace.tsx (loadProfiles effect ~102), src/lib/store/useCustomProfileStore.ts, src/lib/customization/css-injection.ts (injectProfileStyles:120)`


**2. Theme-aware desk-lamp glow, CRT bloom, and scrollbar**  _(from: Visual polish & motion / Preset identity)_  

Swap hardcoded noir-amber rgba(255,191,0) in DeskLayout's rim glow, the .crt-glow text-shadow, and the scrollbar hover #ffbf00 for color-mix(in srgb, var(--aesthetic-accent) X%, transparent). DeskLayout already uses color-mix for the readability gradient. Add a --aesthetic-glow-strength per [data-aesthetic] so minimal glows ~zero and neon presets glow harder. Stops cyan/green/crimson worlds sitting under an amber lamp.  

`src/components/layout/DeskLayout.tsx (~182), src/app/globals.css (.crt-glow ~203, scrollbar ~287-303, per-aesthetic blocks)`


**3. Real icon glyphs in IconRenderer**  _(from: Visual polish & motion)_  

IconRenderer renders literal '[name]' text, which instantly cheapens any card. Map names to lucide-react components (already a dep used throughout the chrome) with a curated lookup + HelpCircle fallback; color via var(--aesthetic-accent); keep role=img/aria-label. Inherits per-preset glow from existing text-shadow rules.  

`src/components/a2ui/SurfaceRenderer.tsx (IconRenderer)`


**4. Var-ize Kanban/Dashboard + add minimal/custom branch**  _(from: Visual polish & motion / Architecture)_  

The two switch(baseAestheticId) blocks hardcode Tailwind hex that drift from tokens — cyber uses literal text-cyan-400/magenta-500 (not even a Tailwind color, so it renders unstyled) instead of #00ffcc/#ff007f, omit a 'minimal' arm, and ignore custom profiles. Replace color classes with bg-[var(--aesthetic-surface)]/border-[var(--aesthetic-border)]/var(--aesthetic-accent); keep only genuinely unique decoration (scanlines, neon shadow) per-case; add minimal. Custom profiles then adapt for free.  

`src/components/a2ui/SurfaceRenderer.tsx (KanbanBoardRenderer ~1074-1127, DataDashboardRenderer ~1223-1275)`


**5. Reconcile the duplicated, drifted noir persona**  _(from: A2UI Generation Quality)_  

registry.ts inlines a noirPersona (64-94) that has drifted from personas.ts NOIR_PERSONA (the other four already import from personas.ts via PERSONA_PROMPTS). Set noirProfile.persona.systemPrompt = NOIR_PERSONA so every future prompt-quality edit lands uniformly. Pure consolidation, prerequisite for all prompt work.  

`src/lib/aesthetic/registry.ts (noirPersona 63-94), src/lib/aesthetic/personas.ts`


**6. Per-preset voice DIRECTION, not just a voiceId**  _(from: Voice & narration)_  

Every preset speaks with identical prosody (the tts route resolves only voiceId; stability/style/speed fall back to one global ELEVENLABS_CONFIG). Add voiceDirection {stability,similarityBoost,style,speed} per profile and resolve it as the fallback layer before the global config: noir weary/0.85 speed, nostromo flat-robotic/0.0 style, cyber amped/1.1, gothic theatrical, minimal neutral. Fully backward compatible extra layer.  

`src/lib/aesthetic/types.ts (AestheticProfile), src/lib/aesthetic/registry.ts, src/app/api/tts/route.ts (~51-59), src/lib/elevenlabs/config.ts`


**7. Per-preset default music prompt + music presets**  _(from: Sound & music)_  

MUSIC_PRESETS are 100% 1940s noir jazz, so a cyber/nostromo user hitting 'generate music' is offered saxophone solos. Add musicStylePrompt (+ optional musicPresets) per profile, mirror client-safe like audio-packs.ts/voice-defaults.ts, and seed the textarea + quick-buttons from the active preset. The generate route already forwards an arbitrary prompt with force_instrumental — no route change.  

`src/lib/aesthetic/types.ts, registry.ts, audio-packs.ts mirror, src/components/settings/ChatSettingsPanel.tsx (MUSIC_PRESETS)`


**8. Per-preset layout doctrine + component playbook in the persona prompt**  _(from: A2UI Generation Quality)_  

All five presets get the same structural advice. Factor shared Core Directives into SHARED_DIRECTIVES, then append a per-preset LAYOUT_DOCTRINE (noir=case-file dossier, nostromo=terminal readout, cyber=HUD panels, gothic=manuscript/ledger, minimal=clean cards) plus a compact intent→component playbook (tabular→table, KPIs→stat/Dashboard, workflow→Kanban, >2 cards→grid) with anti-patterns. Phrase as 'prefer/lean toward'. Highest-impact cheap generation lever.  

`src/lib/aesthetic/personas.ts, src/lib/ai/prompts.ts (buildSystemPrompt)`


**9. Per-preset chrome copy + dictaphone label/color theming**  _(from: Preset identity / Voice & narration / Architecture)_  

DeskLayout hardcodes 'CASE FILE // JSON DATA','Evidence Board' and DictaphonePanel hardcodes 'Cassette Log #N','Incinerate Tape' + amber rgba(255,191,0). Add a lexicon/copy map per preset (workspaceTitle, imagePending, etc.) and a DICTAPHONE_FRAMING map; swap the literal amber to var(--aesthetic-accent). Ship label+color theming now (S); alternate chrome (reels→waveform→wax cylinder) later. Note: DetectiveWorkspace.test and setup.test assert literal strings — update fixtures, keep noir defaults identical.  

`src/components/layout/DeskLayout.tsx (~232,267), src/components/dictaphone/DictaphonePanel.tsx (labels, amber ~340,419)`


**10. Per-preset preview line + sample prompt chips on the empty state**  _(from: Voice & narration / A2UI Generation Quality)_  

VoiceCustomization hardcodes the noir preview 'The rain never stops in this town.' for all presets, and CaseBoardEmptyState has zero example prompts so new users type 'a button' and never see the range. Add VOICE_PREVIEW_LINES and per-preset samplePrompts (themed to each doctrine); render staggered chips that call handleSendMessage on click. Both are pure data + small UI.  

`src/components/settings/VoiceCustomization.tsx (~163), src/components/board/CaseBoardEmptyState.tsx, registry/definitions`


## Bigger bets — larger high-impact initiatives


### 1. Single client-safe AestheticDefinition + resolveAesthetic() (the keystone)

**What:** Create src/lib/aesthetic/definitions.ts (NO server-only) exporting AESTHETIC_DEFINITIONS with colors/fonts/audio/voiceId/imageStylePrompt PLUS new fields (styleTokens, atmosphere, copy, voiceDirection, identity). registry.ts becomes a thin server wrapper that spreads the def + attaches the server-only persona body. audio-packs.ts, voice-defaults.ts, and ColorCustomization.PRESET_COLORS all re-export from defs. Add resolveAesthetic(baseId, customProfile?) returning one merged ResolvedAesthetic + a useResolvedAesthetic() hook replacing the bespoke useBaseAestheticId / 'activeProfile?.baseAestheticId ?? settings.aestheticId' pattern in 5+ components.


**Why:** Removes 3-4 duplicate copies of every literal (noir #ffbf00 lives in 4 files) and makes custom profiles real supersets of their base, not colors-only skins. Every other deepening idea (tokens, atmosphere, copy, voice, image) becomes a pure-data change consumed identically by client and server.


**Sequencing:** FOUNDATION — do first. Keep noir output byte-identical to start. Persona bodies must stay server-only (keep them in personas.ts keyed by id; defs must not transitively import them).


### 2. styleTokens + effects layer; delete the renderer switch statements

**What:** Add styleTokens (radius, cardGlow, borderStyle, surfaceTint, headerCase) and a declarative effects profile (card: parchment|hologram|wireframe|paper; stamp; screen: scanlines|phosphor|none; bloom) to the def, emitted as CSS vars / data-effect-* attributes. Rewrite KanbanBoard/DataDashboard to read tokens, deleting ~110 lines of drifted switch. Migrate the per-[data-aesthetic] .bg-paper/.mask-stamp/scanline blocks to data-effect-* keys so custom profiles can opt into 'gothic parchment' or 'cyber hologram'. Give CardRenderer real per-preset material (the wasted .bg-paper treatment) with card-local text color to fix the light-paper/light-text contrast trap.


**Why:** Decouples palette from treatment, makes the two heaviest components correct for all presets AND custom profiles, and unlocks the app's richest existing identity (parchment, wax seals, holograms) that today is unreachable.


**Sequencing:** After the definition keystone. Stage behind the existing e2e layout snapshots; introduce data-effect-* mirroring data-aesthetic 1:1 first, then migrate selectors. Add the minimal .bg-paper override (currently missing) so minimal doesn't inherit paper texture.


### 3. Per-preset atmosphere + entrance motion driven by the def

**What:** Add an atmosphere block (particle type+color, glowColor, rain/fog/grain/vignette intensity, lightning freq) and a motion personality (variants/transition/stagger) to the def. Re-skin RainOverlay/FogOverlay/LightningOverlay/film-grain from CSS vars instead of hardcoded blue rain + amber lamp. Wrap SurfaceRenderer's child list in a framer-motion staggered Reveal gated by useReducedMotion (the EvidenceBoard pattern). Generalize PhotoDeveloper so the image-develop reveal matches the world (noir sepia darkroom, cyber scanline+RGB-split, nostromo raster print, gothic candle fade, minimal crisp fade) — including the figure/frame chrome, not just the filter.


**Why:** Atmosphere + how things move + how images arrive are the strongest 'different world' signals and are currently identical everywhere (gothic and nostromo both get noir's blue rain, amber lamp, and a 1940s sepia photo bath). framer-motion is already installed and used in ~12 files.


**Sequencing:** After tokens/effects land (shares the def + CSS-var plumbing). Gate everything by prefers-reduced-motion (already globally reset); keep particle counts bounded; apply motion wrappers at the existing weight-wrapper div so flex/grid math is unaffected.


### 4. Generalize the audio model + Web Audio mixer with voice ducking

**What:** Replace the fixed 3-SFX + rain/crackle contract with a per-preset named ambient-bed + SFX vocabulary (nostromo: shipHum+computerBeeps+airlock; cyber: synthHum+neonBuzz; gothic: windHowl+clockTick+organ) so worlds stop faking a ship hum with 'rain'. Add an event-driven SFX bus (message.start/complete, component.placed, error, dramatic.beat) mapped per preset, replacing the noir-only English keyword scan (so 4-of-5 silent presets become reactive) and finally firing the dead playTypewriter on token stream (throttled). Route music+ambient+sfx+voice through one AudioContext with a master gain and duck music ~35% under TTS narration.


**Why:** Sound is half of 'a different world' and is the most structurally noir-locked subsystem. Ducking is the single biggest 'professional film mix' upgrade and makes the centerpiece voice intelligible. A compat shim keeps old custom profiles resolving rain/crackle volume overrides.


**Sequencing:** Generalized pack model first (touches the public AudioPack contract + tests), then event bus, then mixer. Needs careful createMediaElementSource (one-connection limit) + Safari autoplay-unlock; reuse the existing resume-on-pointerdown patterns. Throttle per-token SFX hard; respect soundEnabled.


### 5. AI-assisted theme generation: describe-a-vibe → full coherent world

**What:** New /api/theme route + theme-generator using the existing Anthropic client, with a tool whose schema mirrors customProfileSchema (palette, font pair, persona systemPrompt, imageStylePrompt, voice descriptor mapped to nearest ElevenLabs voice, audio/effect intensities). The model picks the closest base preset as scaffolding (so audio/effects inherit sensibly), is told the 5 worlds' signatures, and the immutable generate_ui core directives are appended server-side so a generated persona can't break tool usage. On return: createProfile+updateProfile+setActiveProfile+inject. Pair with offline 'Surprise Me' (curated building blocks, no API key) and a shipped-variants gallery.


**Why:** The headline feature for 'generate genuinely unique worlds' — turns the Lab from knob-fiddling into a creative generator producing internally-coherent worlds a casual user could never hand-tune. All infra (Anthropic SDK, structured tool output, zod schema, image+voice pipelines) already exists.


**Sequencing:** Requires the live-apply bug fix (#quickwin1), the legibility/contrast guardrails (so generated palettes are AA-safe), and ideally the resolveAesthetic keystone so a generated profile can populate the full identity, not just colors.


### 6. Variants + iterative regeneration across UI, images, and narration

**What:** Three coordinated affordances: (a) UI variants — generate 2-3 distinct layouts per prompt via parallel streamText with a per-preset composition seed and a 'Take 1/2/3' picker (server already loops callIndex for multiple tool calls; useA2UIStream currently clear()s every send); (b) image variants — generate N seed-bumped images shown as a themed contact-sheet/HUD-reticle/lineup picker; (c) narration re-record — an alternate-register take ('colder/wearier','terser/verbose') landing as a new dictaphone tape (the x-recording-hash plumbing already creates tapes). Plus 'Make it fancier'/'Simplify'/'Different angle' that feed the current tree back as baseline.


**Why:** The brief explicitly asks for nicer VARIANTS. Today output is one-shot and the built Update Rules path is dead (evidence hardcoded undefined in route.ts:307). Choice + iteration make the app feel like a creative tool and exploit infrastructure that already half-exists.


**Sequencing:** First wire the existing baseline-into-prompt path (thread the active surface into the v0.9 stream as buildSystemPrompt's evidence arg) — small and high value. Then layer the composition seed, then the variant fan-out. Gate N-generation behind a setting (3x latency/cost); use a cheaper model for variants.


### 7. Structured per-preset image specs with real negatives and provider options

**What:** Replace the flat imageStylePrompt string (joined as '. Style: X.') with an ImageStyleSpec (medium, lighting, palette, lens, framing, negative[], rotating motifs[]) assembled into an ordered prompt + a true negative prompt. Thread negatives + aspect ratio + seed through generateImageDataUrl (Google imageConfig.aspectRatio, Imagen negativePrompt/seed) instead of one string. Add per-preset preferred image model, a session seed+index so a board's images cohere, and themed fallback SVG + 'IMAGE PENDING' copy (today hardcoded noir DARKROOM).


**Why:** Images are a marquee output but every image in a preset shares one rigid sentence the model often ignores; aspect/seed/negatives are never sent so output is square, random, off-aesthetic single images. Structured specs + rotating motifs also deliver the intra-preset variety the brief wants.


**Sequencing:** Can proceed in parallel with the def keystone (imageStylePrompt already lives on the profile). Keep current strings as the default to avoid prompt regressions; A/B against images.test.ts. Provider option shapes differ — guard each branch.


### 8. Customization Lab completeness: editors, guardrails, persistence, live preview

**What:** Close the gaps that make a 'custom world' not actually custom: add Fonts and Image-Style tabs (engine already honors profile.fonts and profile.imageStylePrompt — there's literally no UI); add WCAG contrast warnings + one-click auto-fix-to-AA in the color tab (css-injection only regex-validates a color is syntactically valid); add palette harmony (one accent seed → 9 coherent swatches, extract-from-background); fix EffectsCustomization/AudioCustomization to write to the active profile (today they write to global useA2UIStore so the tuning is lost on export/switch); add a persistent ProfilePreviewCard + before/after compare.


**Why:** Theming-completeness and portability bugs: users can't edit fonts or image style at all, can produce illegible palettes, and their effect/audio tuning never makes it into the portable profile. These are prerequisites for trusting AI/surprise-me output and for the Lab feeling powerful.


**Sequencing:** After the live-apply fix (#quickwin1). The persistence fix mirrors the already-correct VoiceCustomization branch-on-activeProfile pattern. Guardrails should be reused inside /api/theme to repair bad generated palettes.


## Per-preset signature touches

The 2-3 things that would make each world unmistakable:


### noir

Cards become real aged-paper dossiers with coffee-stain + corner-tape and a deterministic tilt (the .bg-paper treatment that exists but is wasted), under a warm amber desk-lamp pool; images keep the chemical sepia darkroom develop with red safelight and Polaroid tape/exhibit caption; voice is weary and deliberate (low speed, mid style) over smoky 40s jazz that ducks hard under narration, with rain that swells while the detective 'investigates'.


### minimal

Intentional restraint as identity: near-zero glow, no grain/scanlines/particles, no pins or tilt — just clean elevation shadows, a flat white card with a hairline border (the currently-missing .bg-paper override), fast 100-120ms fade-rise with no overshoot; crisp instant image fade with a thin border and no frame; neutral 1.05-speed voice over an airy near-ambient pad, a single soft tick on completion, blue selection and a thin neutral scrollbar.


### cyber-fixer

Components boot in with a 1-2px glitch jitter and opacity flicker into floating holographic panes with cyan/magenta neon glow (tokens, not the broken literal magenta-500); images reveal via scanline wipe with chromatic-aberration RGB split framed as a HUD pane; magenta/cyan digital rain + neon-buzz ambient + a synth-riser/modem sting on generation, an amped fast-clipped voice, and a generate-from-vibe-friendly HUD composition doctrine (stat row on top, tabbed decks).


### nostromo-console

Surfaces print top-to-bottom like a terminal (per-row reveal / raster scan) inset into a CRT bezel with heavy phosphor scanlines + flicker and a tight green halo; images raster-print line-by-line in phosphor green; the dictaphone becomes a scrolling waveform/log ('AUDIO LOG // MU-TH-UR'), a flat robotic voice (stability high, style 0) over a low droning reactor hum (not faked 'rain') with computer-beep cadence, ALL-CAPS bracketed log copy ('SYSTEM LOG','[SURFACE ONLINE]'), and a green block-cursor scrollbar/caret.


### gothic-manor

Slow 400ms candlelit fade-up with faint blur-to-zero into parchment cards with double-stone borders, a wax seal, and a serif drop-cap on h1; images emerge from darkness via warm candlelight into a vignetted gilt frame ('Plate I'); heavy warm vignette + crimson embers/ash drifting up (no scanlines), a theatrical ornate voice over solo pipe-organ + cello that swells back up on speech-end, crimson selection, and a manuscript/chronicle composition doctrine with ornamental dividers.


---

## Appendix — full idea catalogue by angle

_All 84 ideas as produced by the specialist agents, grounded in specific files. Effort S/M/L, impact low/medium/high._


### Visual polish & motion — making the rendered A2UI surfaces and the detective-desk chrome genuinely gorgeous and per-preset adapted, exploiting framer-motion (already a dep) and the existing CSS-var aesthetic system.

**Current state:** The live render path is DetectiveWorkspace -> A2UIv09Preview -> SurfaceRenderer.tsx (the legacy A2UIRenderer.tsx + EvidenceBoard pipeline is a parallel non-live island). SurfaceRenderer.tsx has NO framer-motion at all: CardRenderer, StatRenderer, TableRenderer, BadgeRenderer, GridRenderer, KanbanBoardRenderer, DataDashboardRenderer, TextRenderer all mount instantly with no entrance, no stagger, no layout transition. The only motion in the surface is PhotoDeveloper.tsx (a hardcoded sepia/safelight darkroom develop, identical for every preset) and CSS-keyframe ambient effects. The desk chrome (DeskLayout.tsx) has nice atmospherics — film-grain, vignette, venetian gradient, a vertical readability gradient using color-mix (theme-aware), rain/fog/crackle overlays, and a sticky 'Evidence Board' header — but its warm desk-lamp rim glow is hardcoded rgba(255,191,0,...) amber (line 182), as is the CRT-glow text-shadow (globals.css 203-204) and the scrollbar hover (#ffbf00, line 302), so cyber-fixer/nostromo/gothic get a noir-amber glow that fights their accent. globals.css has strong per-[data-aesthetic] treatments for .bg-paper, .mask-stamp, scanlines, neon/phosphor blooms, and form controls — but those .bg-paper/.coffee-stain/.mask-stamp dossier visuals only attach to the legacy DossierCard, NOT to SurfaceRenderer's CardRenderer, which is a flat dark box with a thin amber top rule. KanbanBoardRenderer and DataDashboardRenderer hardcode per-preset Tailwind hex (text-green-500, bg-slate-950, magenta-500 which is not even a Tailwind color) instead of CSS vars, and both fall through their switch to the noir branch for 'minimal' and all custom profiles. LightningOverlay is a single global white flash dispatched on message send (noir-lightning event from ChatSidebar) — not adapted per preset. EvidenceSkeleton is a generic gray animate-pulse with a bouncing-dots 'Compiling evidence' indicator, theme-agnostic in shape. IconRenderer renders literal [name] text. framer-motion 12.27 is installed and already used in TypewriterText and EvidenceBoard (spring stamp).


#### Staggered entrance animation for every surface component  `[M effort · high impact]`

- **What:** Wrap each rendered A2UI node in SurfaceRenderer in a motion element so the component tree reveals with a depth-aware stagger instead of popping in instantly — the single highest-impact 'wow' fix because right now the live surface has zero entrance motion.

- **Why:** A generated UI snapping in fully-formed feels like a static dump; a cascade of cards/stats/rows settling into place reads as the detective laying evidence on the board piece by piece. This is the difference between 'it rendered' and 'it materialized'.

- **How:** In SurfaceRenderer.tsx, add a small motion wrapper (e.g. a `Reveal` component using framer-motion `motion.div` with `initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}`) and apply it inside ChildList's map and/or in ComponentRenderer for leaf content nodes. Use a shared parent `motion.div` with `variants` + `staggerChildren` so depth-ordered reveal is automatic. Gate all of it behind framer-motion `useReducedMotion()` (already the pattern in EvidenceBoard.tsx). Keep wrappers `display:contents`-friendly so Row/Column/Grid flex/grid math is unaffected — or apply the wrapper only to children that aren't weighted flex items.

- **Per-preset:** noir: cards drop in with a slight settle + the existing -1deg paper tilt; minimal: fast clean 120ms fade+rise, no tilt, no overshoot (editorial restraint); cyber-fixer: components 'boot' in with a 1-2px glitch x-jitter and a quick opacity flicker; nostromo-console: reveal top-to-bottom like a terminal printing rows (clip-path or per-row delay); gothic-manor: slow 400ms candlelit fade-up with a faint blur(2px)->0. Drive per-preset timing/easing from a map keyed on useBaseAestheticId() (already imported in SurfaceRenderer).

- **Risk:** Flex/grid layout math (weight grow, Row wrap) can break if the motion wrapper introduces an extra block box; mitigate by wrapping at the existing weight-wrapper div in ChildList rather than adding a new layer, and test the layout e2e snapshots already in the repo.


#### Give CardRenderer real evidence-dossier physicality, per preset  `[M effort · high impact]`

- **What:** Replace the flat dark CardRenderer box with a preset-aware physical card: noir gets the aged-paper/coffee-stain/corner-tape dossier look that currently only exists in the unused DossierCard; other presets get their own material (hologram pane, terminal wireframe, parchment).

- **Why:** The CardRenderer is the most-emitted container and currently it's the least characterful surface in the app — a generic dark rectangle with a thin amber rule. The gorgeous .bg-paper / .coffee-stain / .mask-stamp treatments in globals.css already exist and are wasted because the live renderer never applies the .bg-paper class.

- **How:** In SurfaceRenderer.tsx CardRenderer, add the `bg-paper` class (and a `.coffee-stain` decoration div like Surface.tsx PaperFrame) for noir so the existing per-[data-aesthetic] .bg-paper overrides in globals.css (lines 508-619) light up automatically. Add a subtle deterministic rotation (reuse PhotoDeveloper's src-hash trick) for the desk-clutter feel. Optionally add a folded-corner pseudo-element and a hover lift (translateY + shadow grow).

- **Per-preset:** All five already have bespoke .bg-paper rules in globals.css: noir = aged paper + inset sepia; cyber-fixer = translucent neon hologram with cyan glow; nostromo = green wireframe with bracket corners (::after); gothic = double-stone-bordered parchment with blood-splatter stain; minimal = needs a NEW clean override added (flat white card, hairline border, soft shadow, no texture) since minimal currently has no .bg-paper rule and would inherit paper texture wrongly. Add that minimal block in the same file.

- **Risk:** Light paper-on-dark contrast: noir paper is light (#e0e0e0) with dark ink, but the child TextRenderer uses var(--aesthetic-text) which is light — text would vanish on light paper. Must scope card body text color (the legacy DossierCard solved this by forcing border/ink colors). Resolve by setting a card-local text color or a `.bg-paper` descendant text rule.


#### Make the desk-lamp glow, CRT bloom, and scrollbar theme-aware  `[S effort · medium impact]`

- **What:** Swap the hardcoded noir-amber in DeskLayout's rim glow (rgba(255,191,0,...)), the .crt-glow text-shadow, and the scrollbar hover (#ffbf00) for the active accent so the desk chrome stops fighting non-noir palettes.

- **Why:** Right now a cyber-fixer or nostromo session has cyan/green UI sitting under a warm amber desk-lamp pool and an amber scrollbar — a jarring tonal clash that undercuts the 'deeply adapted' goal. This is a cheap, high-consistency win.

- **How:** DeskLayout.tsx line 182: change the radial-gradient to use `color-mix(in srgb, var(--aesthetic-accent) 12%, transparent)` (the file already uses color-mix for the readability gradient). globals.css .crt-glow (203-205): drive the text-shadow color from var(--aesthetic-accent) via rgb channels or a dedicated --aesthetic-glow-rgb var per [data-aesthetic]. Scrollbar (287-303): set thumb:hover to var(--aesthetic-accent). Add a per-preset glow intensity var so neon presets glow harder than minimal.

- **Per-preset:** noir: warm amber lamp pool, low bloom; minimal: near-zero glow / neutral scrollbar (no bloom at all — clean); cyber-fixer: stronger cyan bloom radius; nostromo: tight green phosphor halo; gothic: dim crimson candle pool biased lower/warmer. Expose intensity as --aesthetic-glow-strength in each [data-aesthetic] block.

- **Risk:** color-mix and the existing .crt-glow flicker animation interact; keep the always-on glow theme-driven but leave the reduced-motion flicker gate intact. Minimal should get essentially no glow to preserve its clean look.


#### Preset-specific 'develop' reveal for images (not just noir sepia)  `[M effort · high impact]`

- **What:** Generalize PhotoDeveloper.tsx so the image reveal animation matches each aesthetic instead of always being a sepia darkroom develop with a red safelight.

- **Why:** Images are a centerpiece (generated per imageStylePrompt), but a cyberpunk hologram or a green terminal scan emerging via a 1940s chemical sepia bath breaks immersion. Per-preset reveal makes generated images feel native to the world.

- **How:** PhotoDeveloper.tsx already centralizes image rendering (ImageRenderer delegates to it). Read the active base aesthetic (useBaseAestheticId pattern) and switch the wrapper className + overlay between named CSS keyframe sets defined in globals.css. Add new keyframes alongside the existing photo-develop/safelight: e.g. `scanline-render`, `raster-print`, `candle-reveal`, `crisp-fade`. Keep the existing reduced-motion fallbacks (globals.css 699-724) and extend them for the new classes.

- **Per-preset:** noir: keep chemical develop + red safelight + sepia + Polaroid tilt/tape; minimal: instant crisp fade, no frame, no tilt (just a hairline border); cyber-fixer: scanline wipe reveal with chromatic-aberration RGB split + cyan edge glow, framed as a HUD pane; nostromo: top-to-bottom raster line-by-line print with phosphor green tint and heavy scanlines; gothic: slow warm candlelight fade from darkness with a vignetted gilt frame.

- **Risk:** The Polaroid figure chrome (tape, exhibit caption, rotation) is hardcoded noir; for other presets the FRAME also needs to change, not just the filter, or you get a cyberpunk image in a 1940s photo border. Scope the figure styling per preset too.


#### Per-preset 'flash' overlay replacing the single white lightning  `[S effort · medium impact]`

- **What:** Turn LightningOverlay into an aesthetic-driven 'reveal flash' that fires when new evidence/surface arrives, with a different visual signature per preset.

- **Why:** The lightning flash is a great moment-of-arrival beat, but a white storm flash only makes sense for noir/gothic. A unified, themed 'arrival flash' makes every preset's generation feel like an event in its own idiom.

- **How:** LightningOverlay.tsx already listens for a window CustomEvent ('noir-lightning', dispatched in ChatSidebar.tsx 196/383). Pass the active aesthetic in (via prop from NoirEffects, which already receives aestheticId) and branch the overlay's color/animation. Define new keyframes in globals.css next to lightning-flash-anim. Optionally couple to the existing thunder/SFX trigger so audio+visual land together.

- **Per-preset:** noir: keep white lightning + thunder; minimal: no flash, or a single subtle 80ms accent-tinted vignette pulse; cyber-fixer: magenta/cyan glitch flash with a horizontal RGB tear; nostromo: a CRT 'sync roll' — a bright green horizontal band sweeping top-to-bottom + brief scanline intensification; gothic: a warm crimson candle-flare bloom from the edges rather than a cold flash.

- **Risk:** Frequency/annoyance — a full-screen flash on every message can fatigue. Make it subtle for fast presets, respect reduced-motion (already a global reset), and consider firing only on first surface of a session or on explicit generation completion.


#### Convert Kanban/Dashboard hardcoded hex to CSS vars + add minimal/custom branch  `[M effort · high impact]`

- **What:** Rework KanbanBoardRenderer and DataDashboardRenderer so their per-preset styles come from var(--aesthetic-*) instead of hardcoded Tailwind hex, and add real handling for 'minimal' and custom profiles (which currently fall through to the noir branch).

- **Why:** These two are the most visually ambitious components but they break the 'deeply adapted' promise: minimal and every custom profile render as NOIR boards, and the cyber branch even references `magenta-500` which is not a Tailwind color (so it silently renders unstyled). Custom profiles with bespoke palettes get ignored entirely.

- **How:** In both renderers (SurfaceRenderer.tsx ~1045-1397), replace the switch-of-hardcoded-classes with var-driven classes: containerClass uses bg-[var(--aesthetic-surface)], borders use var(--aesthetic-border), accents use var(--aesthetic-accent). Keep only genuinely preset-unique decoration (scanlines for nostromo, neon shadow for cyber) behind the switch, and add a `minimal` case. Because custom profiles set the CSS vars at the layout root, var-driven styling makes them adapt for free. Fix the `magenta-500` bug to use var(--aesthetic-accent-muted).

- **Per-preset:** noir: amber accents on dark surface (current); minimal: white cards, blue accent, hairline borders, no glow (the currently-missing case); cyber-fixer: cyan/magenta from accent + accent-muted vars with neon box-shadow kept; nostromo: green vars + crt-scanlines class retained; gothic: crimson accent + parchment surface via vars; CUSTOM profiles inherit automatically since they only set vars today.

- **Risk:** Some preset charm lives in the exact hardcoded shadows/tints; moving fully to vars could flatten them. Keep the bespoke shadow/scanline bits per-case and only var-ize the color tokens. Verify the existing layout snapshot tests.


#### Micro-interactions: hover lift, press, and focus glow across interactive components  `[M effort · medium impact]`

- **What:** Add consistent, tactile hover/active/focus micro-interactions to Buttons, Badges, Stats, Table rows, Tabs, and ChoicePicker options so the surface feels alive and responsive rather than a flat printout.

- **Why:** Hover states are currently inconsistent: Buttons have a color shift, Table rows have hover bg, but Stats/Cards/Badges are static and Buttons have no press feedback or lift. Cohesive micro-interactions are a big part of perceived polish and 'wow'.

- **How:** In SurfaceRenderer.tsx add shared transition + transform utilities: ButtonRenderer gets `active:translate-y-px` and a hover shadow grow (the legacy A2UIRenderer button already does `active:translate-y-px` — mirror it); Stat/Card get a subtle hover lift + border-accent brighten; Badge gets a hover border-accent; Tabs get an animated underline (framer-motion `layoutId` shared element between the active tab indicator). Centralize timing in a few CSS-var-driven transition tokens.

- **Per-preset:** noir: soft physical lift + shadow (paper on desk); minimal: 100ms color/opacity only, no transform (editorial calm); cyber-fixer: hover intensifies neon box-shadow + faint flicker; nostromo: hover brightens phosphor glow and shows a `>` caret/bracket; gothic: slow ease, accent shifts toward gilt/crimson, gentle shadow bloom. Tie transform magnitude to the same --aesthetic-glow-strength var from the desk-lamp idea.

- **Risk:** Over-animating hurts minimal and can feel gimmicky; keep transforms tiny (1-2px) and durations short, and ensure focus-visible rings (already present) are never replaced by hover-only affordances for a11y.


#### Themed, characterful loading skeleton instead of generic gray pulse  `[S effort · medium impact]`

- **What:** Replace EvidenceSkeleton's generic gray animate-pulse + bouncing dots with a preset-flavored generating state that matches the world the user is in.

- **Why:** The loading state is the user's longest single visual moment (waiting for the LLM + image gen), yet it's the most generic surface in the app. A characterful wait makes the whole experience feel bespoke and reduces perceived latency.

- **How:** EvidenceSkeleton.tsx is already CSS-var-based for color; branch its shimmer/animation and copy on the active base aesthetic (read via the same useBaseAestheticId pattern or a prop). Swap the shimmer technique (a moving gradient sweep reads more premium than animate-pulse) and the status copy. framer-motion can drive a sweeping highlight bar.

- **Per-preset:** noir: 'Developing the negatives...' with a darkroom red-safelight shimmer over the skeleton (reuse safelight keyframe); minimal: clean neutral shimmer, copy 'Generating'; cyber-fixer: 'INJECTING GRID LOAD...' with scanline shimmer + glitch; nostromo: 'COMPILING LOG...' with a blinking block cursor and line-by-line fill; gothic: 'Manifesting the chronicle...' with a slow candlelight pulse. Pull copy from the registry terminology map (component/generate verbs already exist per preset).

- **Risk:** Skeleton shape should still roughly predict the real layout to avoid jarring reflow; keep the structural blocks, only restyle the shimmer + copy.


#### Real icon glyphs replacing the literal [name] text in IconRenderer  `[S effort · medium impact]`

- **What:** Make IconRenderer render actual icons (lucide-react, already a dep used throughout the chrome) with per-preset styling instead of printing the bracketed text [name].

- **Why:** [help] / [search] literal text in a generated surface looks broken and instantly cheapens an otherwise polished card. lucide-react is already imported across the app, so this is low-hanging fruit with outsized polish payoff.

- **How:** In SurfaceRenderer.tsx IconRenderer, map the resolved name to a lucide-react icon component (a name->component lookup, with a sensible fallback like HelpCircle). Color via var(--aesthetic-accent)/text and size from a variant. Keep the role=img/aria-label for a11y.

- **Per-preset:** noir: amber line icons; minimal: neutral thin-stroke icons; cyber-fixer: cyan icons with a faint neon drop-shadow; nostromo: green phosphor-glow icons (the [data-aesthetic] text-shadow rules already glow spans); gothic: crimson icons, slightly heavier weight to read as engraved. Mostly a color/glow inheritance via existing CSS vars + per-preset text-shadow rules.

- **Risk:** Unbounded icon-name space from the LLM — need a curated map + graceful fallback so an unknown name doesn't crash; consider keeping a tiny text fallback for unmapped names but styled (not raw brackets).


#### Depth & lighting layering for the evidence board (parallax + corner pins)  `[L effort · high impact]`

- **What:** Give the evidence board surface genuine depth: a subtle parallax/tilt response, drop-shadow elevation tiers between nested cards, and decorative push-pins/tape on top-level cards so the board reads as a physical 3D pinboard rather than a flat scroll.

- **Why:** The 'evidence board' framing is the app's signature metaphor but the rendered surface is currently flat — every card sits in the same plane. Layered shadows + a few physical accents (pins, tape, shadow under tilted cards) sell the metaphor and create the first-impression 'wow'.

- **How:** In SurfaceRenderer.tsx, give top-level Card components a higher elevation shadow + an absolutely-positioned pin/tape decoration (CSS pseudo or a small element, reusing PhotoDeveloper's tape recipe and DossierCard's deterministic rotation). Add an optional pointer-driven subtle 3D tilt (framer-motion `useMotionValue`/`useTransform` on mouse position, clamped to ~1-2deg) on the board container, behind reduced-motion. Establish 2-3 shadow elevation tokens as CSS vars so nesting depth maps to shadow strength.

- **Per-preset:** noir: cork/board feel — pins, tape, paper shadows, warm; minimal: NO pins/tilt — just clean elevation shadows (flat material design); cyber-fixer: floating holographic panes with stronger drop glow and a faint z-translate, no physical pins; nostromo: panels feel inset into a CRT bezel (inner shadow) rather than pinned on top; gothic: framed portraits hung with cord/nails, heavy dramatic shadow. Drive pin/tilt on/off and shadow palette from the preset.

- **Risk:** Parallax tilt can hurt readability and performance and clashes hard with minimal; must be opt-out per preset and gated by reduced-motion. Pins/tape only suit physical presets — make them preset-conditional, not global. Largest effort here is doing it without breaking the existing flex/grid layout and scroll.


#### Typographic hierarchy & rhythm pass on TextRenderer and headings  `[M effort · medium impact]`

- **What:** Tighten the typographic system in TextRenderer and the renderers' inline labels: better heading scale/letter-spacing/line-height, drop-cap or rule accents on h1/h2, consistent uppercase-tracked label treatment, and per-preset type personality.

- **Why:** Type is doing a lot of the noir 'feel' (Special Elite typewriter, uppercase tracked labels) but TextRenderer's scale is generic (text-3xl/2xl/xl with mb-* only) and there's no editorial detail — no rules under headings, no drop caps, no measure control. Refined type is the cheapest route to 'designed, not generated'.

- **How:** In SurfaceRenderer.tsx TextRenderer, enrich each variant: h1/h2 get an accent underline rule or a leading kicker, captions get tracking, body gets a max-width measure (~66ch) and relaxed leading. Add per-preset type tweaks driven by useBaseAestheticId or just by the existing per-[data-aesthetic] font stacks already in globals.css (407-421). Consider a CSS `::first-letter` drop-cap for gothic h1.

- **Per-preset:** noir: typewriter caps with amber rule under headings; minimal: clean sans, tight tracking, generous whitespace, no decoration; cyber-fixer: mono with wide tracking + glitch-on-hover for headings, cyan rule; nostromo: all-caps green mono with a blinking caret after headings; gothic: serif with a drop-cap on h1 and small-caps subheads, crimson rule. The font stacks per preset already exist in globals.css — this idea adds rhythm/decoration on top.

- **Risk:** Aggressive measure/max-width can fight the card/grid widths; apply measure only to standalone body paragraphs, not text inside tight grid cells. Drop-caps and decorative rules must not reduce contrast or accessibility.


### Preset identity depth and uniqueness — making each preset feel like a different world rather than a recolor, and making identity data-driven through the registry instead of scattered switch statements.

**Current state:** Today a preset is an AestheticProfile in src/lib/aesthetic/registry.ts carrying: theme.colors (9 tokens), theme.fonts (3), an AudioPack (3 sfx + 1 music + rain/crackle ambient), a persona.systemPrompt + a 3-key terminology map (component/generate/error), a voiceId, and one imageStylePrompt string. That is the entire surface of "identity," and ~90% of perceived difference is just color tokens piped through CSS vars (src/app/globals.css :root + [data-aesthetic=...] blocks) plus a font stack. Depth that DOES exist is hand-coded and NOT in the registry: globals.css has bespoke per-aesthetic blocks for card chrome (.bg-paper), the status stamp (.mask-stamp -> wax seal vs neon tag vs terminal bracket), coffee-stain treatment, text bloom/glow, form controls, and background scanline/grid overlays. The KanbanBoardRenderer and DataDashboardRenderer in src/components/a2ui/SurfaceRenderer.tsx (lines ~1074 and ~1223) each carry a 4-arm switch(baseAestheticId) hardcoding Tailwind class strings (e.g. cyber-fixer uses text-cyan-400/border-magenta-500 literals that don't even match the registry's #00ffcc/#ff007f tokens) — this is the smell: it's duplicated, drifts from the tokens, omits the "minimal" arm, and ignores custom profiles. Meanwhile the rest of the renderer (Card/Table/Stat/Tabs/Button/inputs) is token-driven and identical across presets — same rounded-sm corners, same border weights, same uppercase tracking-widest typewriter labels, same motion. The app chrome is hardwired noir: DeskLayout.tsx hardcodes "CASE FILE // JSON DATA", "Evidence Board", the amber desk-lamp radial glow (rgba(255,191,0,...)), and the case-file overlay; NoirEffects + RainOverlay (blue-white drops) + FogOverlay (gray haze) + LightningOverlay render the SAME rain/fog/lightning for every preset regardless of world; the crt-glow keyframe is amber-tinted for all. The terminology map is essentially unused in the UI. narration.ts has good per-preset voice prompts but duplicates the persona definitions. Image identity is a single flat string appended as ". Style: X." with no structure or variation. Net: presets share one skeleton (corners, motion, decorative grammar, atmosphere, copy) and differ by paint. Infrastructure that's underused: the registry as a typed config object, CSS custom properties, framer-motion (a dep, used in only ~12 files), and css-injection.ts which already proves colors can be driven from data via a token->var map.


#### Add an `identity` block to AestheticProfile and drive the Kanban/Dashboard switches from it  `[M effort · high impact]`

- **What:** Extend AestheticProfile (types.ts/registry.ts) with a structured `identity` object: cornerStyle ('sharp'|'soft'|'round'|'beveled'), borderStyle ('hairline'|'double'|'glow'|'bracket'), surfaceTexture, motionPersonality, and a `componentTokens` sub-map for Kanban/Dashboard (containerBg, columnBg, cardBorder, accentText, etc.) expressed as CSS-var references, not literal Tailwind colors. Replace the two switch(baseAestheticId) blocks in SurfaceRenderer.tsx (~1074, ~1223) with a single lookup into profile.identity.componentTokens.

- **Why:** Kills the central smell: the duplicated 4-arm switches drift from the real tokens (cyber-fixer literals text-cyan-400/border-magenta-500 vs registry #00ffcc/#ff007f), have no 'minimal' arm, and ignore custom profiles. A data-driven identity block makes adding a 6th preset or a rich custom profile a pure-data change and guarantees Kanban/Dashboard inherit the same world as the rest of the surface.

- **How:** In types.ts add `IdentityConfig` interface + `identity: IdentityConfig` on AestheticProfile. Populate it in registry.ts for all 5. In SurfaceRenderer.tsx delete both switches; compute classes from `useActiveProfile().identity` (the file already has useBaseAestheticId/useResolve helpers). Reference --aesthetic-* vars so custom profiles work for free. Keep a noir default fallback.

- **Per-preset:** noir: cornerStyle 'soft' (rounded-sm), hairline amber border, paper texture. minimal: 'round', no glow, flat zinc surfaces (finally gets a real arm). cyber-fixer: 'beveled', neon glow border, cyan/magenta from tokens. nostromo-console: 'sharp' (rounded-none), bracket border, phosphor bloom. gothic-manor: 'beveled' double border, parchment texture, wax-seal accents.

- **Risk:** Touching the two most complex renderers; needs snapshot tests updated (e2e layout snapshots already exist per recent commits). Mitigate by keeping noir output byte-identical first.


#### Make atmosphere per-preset: re-skin rain/fog/lightning/glow instead of always-noir  `[M effort · high impact]`

- **What:** Replace the hardcoded blue-white rain (RainOverlay.tsx:116), gray fog (FogOverlay.tsx), amber lightning/desk-lamp glow (DeskLayout.tsx radial-gradient rgba(255,191,0)) and amber crt-glow keyframe with a registry-driven `atmosphere` config: a particle type + color, an overlay glow color, and an optional signature animated element.

- **Why:** Atmosphere is the single biggest 'this is a different world' lever and it's currently identical everywhere — gothic-manor and nostromo both get noir's blue rain and amber desk lamp, which actively breaks immersion. Each world should have its OWN weather.

- **How:** Add `atmosphere` to IdentityConfig: { particle: 'rain'|'ash'|'data'|'dust'|'none', particleColor, glowColor, signature?: 'embers'|'scanSweep'|'dustMotes' }. Drive RainOverlay/FogOverlay colors from CSS vars set in DeskLayout (e.g. --atmo-particle, --atmo-glow). Reuse the existing rain-fall/fog-drift keyframes but parametrize color. The cyber-fixer scan-sweep and nostromo scanlines already exist in globals.css — fold them into this system.

- **Per-preset:** noir: cold blue rain + amber lamp (today's look, preserved). minimal: particle 'none', soft neutral glow only. cyber-fixer: magenta/cyan digital rain + neon glow, keep scan-sweep. nostromo-console: green phosphor 'data' flecks + faint green glow, keep heavy scanlines+flicker. gothic-manor: warm crimson 'embers'/ash drifting up + candle-amber glow, heavier thunder (already 0.95 vol).

- **Risk:** Overlays are client perf-sensitive; keep particle counts low and honor prefers-reduced-motion (already globally reset in globals.css).


#### Promote `terminology` into a real per-preset copy/microcopy system used by the chrome  `[S effort · high impact]`

- **What:** Expand the under-used terminology map into a `lexicon` covering chrome strings the app currently hardcodes as noir: 'CASE FILE // JSON DATA', 'Evidence Board', 'Eject', 'Dictaphone', 'Training', empty/error states ('NO EVIDENCE LOADED', 'CASE FILE ERROR'), and the DossierCard status stamp words. Render those from the active profile's lexicon.

- **Why:** The chrome screams 'noir detective' in every world — MU-TH-UR's mainframe shouldn't say 'Evidence Board' and the vampire shouldn't 'Eject'. Microcopy is cheap and disproportionately sells a distinct world. The registry already has the concept (terminology) but it's barely wired anywhere.

- **How:** Add `lexicon: Record<string,string>` to PersonaConfig (or IdentityConfig). In DeskLayout.tsx replace literal strings with lexicon lookups (pass profile or a useLexicon() hook). Provide a noir-default lexicon so missing keys fall back. Update DossierCard status stamp labels likewise.

- **Per-preset:** noir: 'CASE FILE','Evidence Board','Eject','Dictaphone'. minimal: 'Source','Canvas','Export','Transcript'. cyber-fixer: 'DATA SHARD','The Grid','Jack Out','Recorder'. nostromo-console: 'LOG ENTRY','MAIN DISPLAY','Purge','Voice Log'. gothic-manor: 'Manuscript','The Gallery','Banish','Phonograph'.

- **Risk:** Test fixtures assert literal strings (DetectiveWorkspace.test.tsx, setup.test.tsx) — update them. Keep noir defaults identical so noir tests pass untouched.


#### Per-preset SFX semantics + a signature sound, not just re-volumed noir clips  `[M effort · medium impact]`

- **What:** Give each preset a distinct sonic signature: map the 3 generic slots (typewriter/thunder/phone) to in-world events and add a 'generate complete' signature sting per preset. Note minimal currently REUSES the noir clips at lower volume (audio-packs.ts) — give it either silence or subtle UI ticks.

- **Why:** Sound is half of 'feeling like a different world' and right now it's three filenames swapped per folder. A signature sting on generation completion (the app's core moment) is a high-impact identity beat that costs one asset + one trigger.

- **How:** Add `signatureSfx` to AudioPack and a play call at generation-complete in DetectiveWorkspace. Rename the semantic intent in a per-preset comment/registry note. For minimal, set sfx volumes to 0 or point to short neutral ticks. The audio plumbing (getAudioPack, NoirEffects) already accepts arbitrary src per aesthetic.

- **Per-preset:** noir: typewriter ding + thunder. minimal: soft click / none. cyber-fixer: synth riser + modem screech as the sting. nostromo-console: relay clack + computer chime ('READY'). gothic-manor: harpsichord/organ stab + raven caw on completion.

- **Risk:** Requires sourcing audio assets; without them this is just registry scaffolding. Keep default OFF to respect soundEnabled.


#### Structured, varied image style — replace the single flat string with a layered imagery profile  `[M effort · high impact]`

- **What:** Replace the single imageStylePrompt string (joined as `. Style: X.` in images.ts:80) with an `imagery` object: { medium, palette, lighting, lens/texture, negative, motifs[] } plus a small `variants[]` array so repeated image requests don't all look identical.

- **Why:** Generated images are a marquee output and currently every image in a preset shares one rigid sentence, so they read same-y and the model often ignores buried clauses. A structured prompt with a rotating motif/variant makes imagery feel curated to the world AND introduces the nice variation the goal asks for.

- **How:** Add `imagery` to AestheticProfile. In buildNoirImagePrompt (images.ts) compose deterministically-but-rotating: pick a motif by hash of prompt, assemble medium+palette+lighting+motif+negative. Keep backward-compat by deriving today's strings as the default. Custom profiles still use their single imageStylePrompt.

- **Per-preset:** noir: 35mm B&W, chiaroscuro, rain motifs rotate (alley/venetian blinds/neon puddle). minimal: clean vector, high-key, rotating flat-illustration motifs. cyber-fixer: synthwave, neon, motifs (HUD/chrome/market). nostromo-console: green CRT, scanlines, motifs (console/corridor/airlock). gothic-manor: oil painting, candlelit, motifs (portrait/graveyard/library).

- **Risk:** Prompt regressions; gate behind keeping the current string as default and A/B with images.test.ts assertions.


#### Per-preset motion personality via a framer-motion preset map  `[M effort · medium impact]`

- **What:** Define a `motion` profile per preset (entrance transition, easing, stagger, hover behavior) and apply it where evidence cards/surfaces mount. framer-motion is already a dependency but used in only ~12 files and motion is currently uniform across worlds.

- **Why:** How things move is a strong, mostly-free identity signal. A terminal should type/boot in; a hologram should glitch/flicker in; parchment should fade like ink bleeding; minimal should be near-instant. Same content, totally different feel.

- **How:** Add `motion: { variants, transition }` to IdentityConfig as framer-motion config objects. Wrap the evidence-render container in DetectiveWorkspace/SurfaceRenderer root with motion.div using profile.motion. Respect prefers-reduced-motion (globals.css already neutralizes animations).

- **Per-preset:** noir: slide-up + slight rotate (paper landing on desk). minimal: fast fade/scale, snappy easing. cyber-fixer: glitch-in (clip-path + RGB split flash). nostromo-console: line-by-line reveal / scan-in. gothic-manor: slow ink-bleed opacity + faint sway.

- **Risk:** Per-component framer wrappers can fight existing CSS animations (photo-develop, typewriter); scope to the surface root, not every leaf.


#### Per-preset cursor, selection, scrollbar, and focus ring  `[S effort · medium impact]`

- **What:** The scrollbar (globals.css ::-webkit-scrollbar) is hardcoded noir-gray/amber for all presets, and there's no ::selection or custom cursor styling. Add per-[data-aesthetic] scrollbar, ::selection, caret-color, and focus-ring color, plus an optional themed cursor.

- **Why:** These are the tiny tactile details that make a UI feel bespoke. A green phosphor scrollbar with a block cursor instantly says 'terminal'; a crimson selection says 'gothic'. Cheap, pure-CSS, high polish-per-effort.

- **How:** Add [data-aesthetic=...] ::-webkit-scrollbar-thumb, ::selection, and caret-color rules in globals.css mirroring the existing per-aesthetic block pattern. Optionally set `cursor` via a data-driven class. Tie colors to --aesthetic-accent so custom profiles inherit automatically.

- **Per-preset:** noir: amber thumb (today). minimal: thin neutral, blue selection, default cursor. cyber-fixer: neon cyan thumb + magenta selection + glow caret. nostromo-console: green block scrollbar, green selection, blinking block caret (reuse typewriter-blink). gothic-manor: crimson thumb, blood-red selection, thin serif caret.

- **Risk:** ::-webkit-scrollbar is Chromium-only; Firefox uses scrollbar-color (add both). Low risk overall.


#### Per-preset default layout / scene skeleton when a request is vague  `[S effort · medium impact]`

- **What:** Give each preset a signature default arrangement the model leans toward (e.g. a 'case board' grid vs a 'terminal readout' single column vs a 'ledger' two-column). Encode it as a per-preset layout hint injected into the system prompt and/or a default empty-state scene.

- **Why:** Even with identical content, the COMPOSITION differs between worlds. A mainframe defaults to dense terminal readouts; a gothic detective to a centered illuminated dossier. This shapes generated output structurally, not just cosmetically — directly serving 'generate nicer, world-adapted output'.

- **How:** Add `layoutHint` string to PersonaConfig and append it to the persona prompt in personas.ts/the API route that assembles the system prompt. Optionally drive the empty/initial 'CASE FILE // UNOPENED' scene per preset from the lexicon idea.

- **Per-preset:** noir: pinboard grid of evidence cards. minimal: single clean centered column. cyber-fixer: multi-panel HUD with stat row on top. nostromo-console: full-width monospace readout, stacked sections, status line. gothic-manor: centered single illuminated-manuscript card with ornament dividers.

- **Risk:** Prompt bloat / the model over-applying the hint to specific requests; phrase as 'when ambiguous, prefer...'.


#### Signature decorative elements rendered as data-driven ornaments  `[M effort · medium impact]`

- **What:** Each preset gets one or two signature decorative motifs layered onto surfaces: noir's coffee-stain (exists), and equivalents for the others — corner brackets/ID tags for nostromo, hologram corner glints for cyber-fixer, filigree/ornamental dividers and a wax seal for gothic, nothing for minimal. Drive which ornament renders from the registry.

- **Why:** The coffee-stain is the clearest 'signature object' in the app but only noir has one; the CSS already tries (gothic blood-splatter stain, nostromo bracket ::after) but it's hidden in globals.css overrides rather than a real ornament system. A named ornament per world is memorable identity.

- **How:** Add `ornaments: OrnamentId[]` to IdentityConfig. In Surface.tsx/DossierCard.tsx render ornaments from a small registry of SVG/CSS components keyed by id, instead of always emitting .coffee-stain. Migrate the existing globals.css per-aesthetic stain/bracket hacks into these components.

- **Per-preset:** noir: coffee-stain + paperclip. minimal: none (intentional restraint). cyber-fixer: animated corner glints + holographic edge shimmer. nostromo-console: ASCII corner brackets + 'REC' blink + serial-number tag. gothic-manor: wax seal (exists) + filigree corner flourishes + crimson ribbon.

- **Risk:** Over-decoration can hurt readability; cap to 1-2 ornaments and make them aria-hidden/pointer-events-none (as coffee-stain already is).


#### Per-preset iconography mapping (lucide icon set per world)  `[M effort · low impact]`

- **What:** DeskLayout uses fixed lucide icons (Database/Code/Disc/PanelLeft...). Map a per-preset icon set so the same control reads differently per world, and let the A2UI `icon` component resolve through a preset-aware alias table.

- **Why:** Icons carry strong genre signals. A cassette Disc fits noir; a terminal/CPU glyph fits nostromo; a chip/cpu fits cyber-fixer; a quill/book fits gothic. Reusing one icon set flattens identity. SurfaceRenderer already renders icons (line ~646) so the hook exists.

- **How:** Add `icons: Partial<Record<SemanticIcon, LucideIcon>>` to IdentityConfig. Replace hardcoded imports in DeskLayout with lookups (semantic key -> profile icon -> noir default). For the A2UI icon component, add a preset alias pass before name->component resolution.

- **Per-preset:** noir: Disc, FileText, Stamp. minimal: clean geometric (FileCode, Download, Square). cyber-fixer: Cpu, Zap, Wifi. nostromo-console: Terminal, Server, Radio. gothic-manor: BookOpen, Feather, Skull/Moon.

- **Risk:** lucide doesn't have perfect thematic glyphs for every world; some will be approximations. Low blast radius.


#### Per-preset shader/grain overlays (grain/scanline/glitch/halation) as a composable stack  `[M effort · high impact]`

- **What:** Today film-grain + vignette are applied globally to every preset in DeskLayout, while scanlines/scan-sweep exist only as ad-hoc cyber/nostromo CSS. Unify these into a composable, registry-driven `effects` list (grain, vignette, scanlines, glitch, halation/bloom, parchment-vignette) applied per preset.

- **Why:** A consistent shader stack lets each world layer the RIGHT post-processing: gothic wants heavy warm vignette + no scanlines; nostromo wants heavy scanlines + barrel-ish CRT bloom; minimal wants nothing. Right now noir's grain+vignette is forced onto the clean minimal preset, muddying it.

- **How:** Add `effects: EffectId[]` to IdentityConfig. In DeskLayout replace the always-on `film-grain vignette` classes with classes derived from profile.effects. Move the scattered ::after/::before scanline rules in globals.css into named effect classes toggled by the same list. Keep all gated by prefers-reduced-motion.

- **Per-preset:** noir: grain + vignette (today). minimal: none (clean). cyber-fixer: faint grain + scan-sweep + halation bloom. nostromo-console: heavy scanlines + phosphor flicker + slight bloom, light grain. gothic-manor: heavy warm vignette + paper grain, no scanlines.

- **Risk:** Stacking blend-mode overlays can tank perf on low-end GPUs and wash out the light 'minimal' theme; test contrast and keep z-index/opacity conservative.


### Image generation uniqueness and quality per preset

**Current state:** test


#### Structured per-preset style spec with separate negatives  `[M effort · high impact]`

- **What:** Replace flat imageStylePrompt with ImageStyleSpec (medium, lighting, palette, lens, framing, negative[]); assemble ordered prompt plus negative.

- **Why:** Comma soup gives weak control; ordered labeled language is steerable and a real negative suppresses off-aesthetic artifacts.

- **How:** Add ImageStyleSpec to aesthetic/types.ts and styleSpec on AestheticProfile in registry.ts; add buildStructuredPrompt in images.ts.

- **Per-preset:** noir 35mm Double-X; minimal softbox high-key; cyber anamorphic neon HUD; nostromo P1 phosphor CRT; gothic Rembrandt oil painterly.

- **Risk:** Long prompts over-constrain; keep subject first.


#### Pass negatives and provider options (aspect, seed, size)  `[M effort · high impact]`

- **What:** Thread negatives and image config into generateImageDataUrl instead of one string.

- **Why:** Negatives are just words and aspect/seed never sent, so output is square random single images.

- **How:** Google providerOptions.google.imageConfig.aspectRatio; openai.image size/n; Imagen negativePrompt/aspect/seed. Extend PendingImageMetadata (imageStore.ts:87-92).

- **Per-preset:** noir 4:5, minimal 16:9, cyber 21:9, nostromo 4:3, gothic 3:4; negatives no color/daylight/photoreal/neon respectively.

- **Risk:** Provider shapes differ; guard each branch.


#### Per-aesthetic PhotoDeveloper development treatments  `[M effort · high impact]`

- **What:** Per-preset reveal: noir sepia Polaroid, cyber neon glitch, nostromo green CRT scan, gothic oil vignette, minimal clean fade.

- **Why:** Biggest aesthetic break: every preset gets a sepia wash. Reuses CSS vars and framer-motion.

- **How:** PhotoDeveloper.tsx reads the aesthetic (prop/data-aesthetic ancestor); add keyframes in globals.css beside photo-develop-image; only noir/gothic keep sepia.

- **Per-preset:** noir Exhibit, minimal Fig, cyber FEED, nostromo REC 001, gothic Plate I.

- **Risk:** PhotoDeveloper lacks aesthetic access; pass aestheticId.


#### Generate N variants and let the user pick  `[L effort · high impact]`

- **What:** Generate 2-4 variants (seed-bumped or gpt-image n) and show a selectable set; chosen one commits.

- **Why:** Variant choice improves quality and control; themes as contact sheet/feed/lineup.

- **How:** New /api/images/[id]/variants generates N storing uuid-0..N; framer-motion grid picker re-points node url.

- **Per-preset:** noir CONTACT SHEET, minimal 2x2 grid, cyber HUD reticle, nostromo SELECT FRAME, gothic framed studies.

- **Risk:** Cost multiplies by N; gate behind setting, default 2.


#### Per-preset model selection plus session seed consistency  `[M effort · medium impact]`

- **What:** Presets declare preferred image model honored before env; per-scene seed plus anchor so images cohere.

- **Why:** Models have different looks (selectImageModel ignores aesthetic); shared seed stops a board looking unrelated.

- **How:** Add preferredImageModels to AestheticProfile; selectImageModel takes aestheticId; sceneSeed plus index into PendingImageMetadata.

- **Per-preset:** noir/minimal photoreal, cyber Gemini Pro Image, nostromo Gemini Flash, gothic painterly.

- **Risk:** Model may be unavailable (fallback); Gemini seed limited.


#### Framing hints, themed fallback, persona subjects, custom controls  `[M effort · medium impact]`

- **What:** Map variant tokens to aspect/framing, theme fallbackSvgDataUrl and IMAGE PENDING, add image-subject line per persona, add negativePrompt/aspect/model to custom profiles.

- **Why:** Variants ignored so headers crop; fallback hardcoded noir DARKROOM; non-noir personas give no image direction; custom profiles only free text.

- **How:** Read node.variant/fit (PhotoDeveloper.tsx:55-62); aestheticId into fallbackSvgDataUrl (images.ts:83-102) and IMAGE PENDING (SurfaceRenderer.tsx:626-631); sentence per persona in personas.ts; extend customProfileSchema (customization/types.ts).

- **Per-preset:** cyber header 21:9, noir avatar 4:5 mugshot, gothic 3:4 oil; subjects cyber implants, nostromo corridors, gothic ravens.

- **Risk:** Confirm variant in resolved tree; bump exportedSettingsSchema, keep fields optional.


### Sound effects and music uniqueness per preset

**Current state:** The audio system is structurally locked to a noir vocabulary and then "re-skinned" per preset. The type model in src/lib/aesthetic/types.ts hardcodes exactly three SFX names — `SfxName = "typewriter" | "thunder" | "phone"` — plus one music track, plus ambient `rain` + `crackle`. Every preset's AudioPack (registry.ts and the client-duplicated audio-packs.ts) must therefore express its identity through those same five buckets.

Per-preset asset files DO exist (public/assets/{cyber-fixer,nostromo-console,gothic-manor}/{thunder,typewriter,phone,rain,crackle,music}.mp3) and have distinct MD5 hashes, so they are not literal byte copies of noir. But the CONCEPTS are wrong: cyber-fixer and nostromo-console both ship a `rain.mp3` and `thunder.mp3` and a `crackle` (vinyl-crackle semantics) — a spaceship interior has no rain or thunder, and a neon-noir fixer's "crackle" should be neon-tube buzz, not vinyl. The ambient layer in NoirEffects.tsx only ever renders RainAudio + CrackleAudio (+ RainOverlay/FogOverlay/LightningOverlay), so nostromo literally plays "rain" at low volume to fake a ship hum. minimal reuses the literal noir files (/assets/noir/*) at reduced volume.

SFX are NOT generative/procedural — every sound is a static file played via raw HTMLAudioElement (NoirSoundEffects.tsx pools one element per name; RainAudio/CrackleAudio/NoirMusic each manage their own element with rAF volume fades). There is zero Web Audio API usage anywhere in src (grep for AudioContext/GainNode/PannerNode returns nothing), so there is no spatialization, no filtering, no ducking, and music does not duck under TTS narration.

SFX triggering is keyword-driven and noir-biased: ChatSidebar.tsx (lines 189-220) scans the last assistant message for THUNDER_KEYWORDS (["lightning","thunder","relámpago","trueno"]) and PHONE_KEYWORDS (["phone rang","telephone rang",...]). The cyber-fixer/nostromo/gothic personas rarely emit "the phone rang" or "lightning", so their thunder/phone SFX almost never fire in practice. The typewriter SFX (playTypewriter) is wired only to a manual test button in ChatSettingsPanel.tsx (line 487) — it is never triggered by streaming/typewritten text, so reactive keystroke audio is effectively dead code for all presets.

Music generation (api/music/generate/route.ts) supports ElevenLabs + Lyria and `force_instrumental: true`, but the prompt is entirely user/noir-driven: MUSIC_PRESETS in ChatSettingsPanel.tsx are all "1940s film noir jazz / muted trumpet / rainy alleyway piano / brooding detective strings", and the textarea placeholder is "Describe the melody, tempo, and instrumentation" with no preset awareness. There is no per-preset default music prompt and no link from registry.imageStylePrompt-style fields to a musicStylePrompt. Custom profiles (customization/types.ts profileAudioSchema) can only override volumes + customMusicUrl + customRainUrl — there is no way for a custom profile to supply its own crackle/thunder/SFX URLs or a generative music seed.


#### Replace the fixed 3-SFX/rain+crackle model with a named per-preset 'ambient bed' + SFX vocabulary  `[L effort · high impact]`

- **What:** Generalize AudioPack so each preset declares its OWN ambient layers and SFX names (e.g. nostromo: shipHum + computerBeeps + airlock; cyber: synthHum + neonBuzz + dataGlitch; gothic: windHowl + clockTick + distantOrgan) instead of forcing everything into rain/thunder/crackle/phone.

- **Why:** The single biggest uniqueness problem: nostromo and cyber-fixer literally play 'rain' to fake their ambience because the type system only knows rain+crackle. A ship has no rain; a neon street has no vinyl. Naming sounds correctly is what makes each preset feel authored rather than re-skinned.

- **How:** In src/lib/aesthetic/types.ts change AmbientAudioConfig from fixed rain?/crackle? to `layers: { id: string; src: string; loop: true; intensityVolume?: {low,medium,high}; volume?: number }[]` and SfxName from a literal union to `Record<string, SfxConfig>` keyed by preset-defined names. Update registry.ts + audio-packs.ts packs. Rewrite NoirEffects.tsx to map over `audioPack.ambient.layers` and render a generic <AmbientLayer> (refactor of RainAudio.tsx, which is already a generic looping-fader). Keep rain/crackle visual overlays gated on whether a layer id is 'rain'/'crackle' so existing FogOverlay/CrackleOverlay still bind for noir/gothic.

- **Per-preset:** noir=rain+vinylCrackle (unchanged), gothic=windHowl+clockTick+distantOrgan+fireCrackle, cyber=synthHum+neonBuzz+rainOnNeon, nostromo=shipHum+computerBeeps+airlockHiss+reactorThrum, minimal=single near-silent roomTone or nothing.

- **Risk:** Touches the public AudioPack contract consumed by custom profiles, settings slice, and tests (audio-packs.test.ts, registry.test.ts). Needs a migration/compat shim so older custom profiles importing rain/crackle volume overrides still resolve.


#### Add a per-preset 'reactive SFX' event bus driven by narration semantics, not English keywords  `[M effort · high impact]`

- **What:** Emit a small set of abstract UI/narration events (message.start, message.complete, component.placed, error, dramatic.beat) and let each preset map them to its own SFX, replacing the hardcoded English/Spanish keyword scan that only fires for noir.

- **Why:** Today thunder/phone only fire on literal strings like 'phone rang'/'lightning' (ChatSidebar.tsx 189-220), which the cyber/nostromo/gothic personas almost never say — so 4 of 5 presets get silent SFX. An event→SFX map makes every preset reactive: nostromo gets a keyboard-clack on each streamed line, cyber a synth-blip, noir its typewriter.

- **How:** Add src/lib/aesthetic/sfx-map.ts: `Record<AestheticId, Partial<Record<SfxEvent, sfxName>>>`. In ChatSidebar.tsx replace/augment the keyword block with dispatches of these abstract events as messages stream and complete; resolve via the active preset's map and call the generalized SFX controls (idea 1). Keep an OPTIONAL keyword layer for genuinely cinematic beats. Wire the already-existing playTypewriter into message.tokenStream so the dead typewriter SFX finally fires (throttled).

- **Per-preset:** noir: tokenStream→typewriter, dramatic.beat→thunder; nostromo: tokenStream→keyboardClack, message.complete→computerBeep, error→alarmKlaxon; cyber: tokenStream→dataChirp, component.placed→synthBlip, error→connectionDrop; gothic: message.complete→clockChime, dramatic.beat→organStab; minimal: subtle click on complete only.

- **Risk:** Per-token SFX can become machine-gun annoying; needs throttling/rate-limit and respect for soundEnabled. Must not double-fire with TTS-synced path (ttsSetting branch in ChatSidebar).


#### Per-preset default music-generation prompt + preset-aware MUSIC_PRESETS  `[S effort · high impact]`

- **What:** Add a `musicStylePrompt` (and a small set of preset music presets) to each AestheticProfile, and have the music composer seed its prompt/quick-buttons from the active preset instead of always showing 1940s jazz.

- **Why:** MUSIC_PRESETS in ChatSettingsPanel.tsx are 100% noir ('film noir jazz', 'rainy alleyway piano'). A cyber-fixer or nostromo user who hits 'generate music' is offered saxophone solos. Mirroring the existing imageStylePrompt pattern makes generated music instantly on-brand.

- **How:** In types.ts AestheticProfile add `musicStylePrompt?: string` and optional `musicPresets?: {icon,name,prompt}[]`. Populate per preset in registry.ts (and expose via a client-safe accessor like audio-packs.ts, since ChatSettingsPanel is a client component). In ChatSettingsPanel.tsx replace the const MUSIC_PRESETS with `getMusicPresets(aestheticId)` and prefill the textarea placeholder/initial prompt from musicStylePrompt. The api/music/generate route needs no change — it already forwards an arbitrary prompt with force_instrumental.

- **Per-preset:** noir: smoky 40s jazz/muted trumpet; cyber: dark synthwave, arpeggiated bass, neon pads, 110bpm; nostromo: low droning sci-fi ambient, sparse sonar pings, no melody (Alien/Blade-Runner Vangelis vibe); gothic: solo pipe organ + cello, minor-key funeral waltz; minimal: airy lo-fi pad, near-ambient.

- **Risk:** Low. Pure prompt/data plumbing reusing the existing generate route; only risk is keeping the client-safe duplication (audio-packs.ts pattern) in sync with the server registry.


#### Introduce a Web Audio mixer with music ducking under TTS narration  `[L effort · high impact]`

- **What:** Route music + ambient through a shared AudioContext graph with a master GainNode, and automatically duck (lower) music/ambient gain while TTS voice/narration is speaking, restoring after.

- **Why:** The detective's voice is the centerpiece, but today music plays at a flat volume over it (separate HTMLAudioElements, no coordination). Ducking is the single most 'professional film mix' upgrade and makes narration intelligible in every preset.

- **How:** New module src/lib/audio/mixer.ts owning one AudioContext, with buses (music, ambient, sfx, voice) as GainNodes. Convert NoirMusic.tsx + the ambient layers (idea 1) to feed createMediaElementSource into the mixer instead of setting el.volume directly. Listen for TTS play/stop (the existing DictaphonePanel/voice playback path) and ramp music/ambient bus gain to ~35% during speech via gain.setTargetAtTime. Keep the rAF fade logic only as a no-WebAudio fallback.

- **Per-preset:** Duck depth per preset: noir ducks music hard (voice is king), nostromo barely ducks the ship hum (computer voice coexists with machinery), cyber ducks to a filtered low-pass 'underwater' bed during dialogue, gothic swells organ back up dramatically on speech end.

- **Risk:** createMediaElementSource taints/limits the element (can only connect once) and has Safari autoplay-unlock quirks; needs careful context.resume() on first gesture (the components already have resume-on-pointerdown patterns to reuse).


#### Procedural ambient generators for presets where loops are hard to source  `[L effort · medium impact]`

- **What:** Synthesize key ambient beds in-browser via Web Audio oscillators/noise instead of shipping loop files — e.g. nostromo reactor hum (detuned sine cluster + filtered brown noise), cyber neon buzz (60Hz hum + sawtooth + bitcrush), gothic wind (filtered noise with slow LFO on cutoff).

- **Why:** Procedural beds never loop-click, are tiny (no MB of audio), and can react to state (intensity, activity). They also give each preset a sonic signature that's impossible to mistake for a stock loop. Exploits the AudioContext from idea 4.

- **How:** src/lib/audio/generators/*.ts exporting factories that return {start,stop,setIntensity} bound to the mixer's ambient bus. Register a generator per ambient layer id in the preset pack (idea 1) as an alternative to `src`. NoirEffects/AmbientLayer picks generator vs file based on which the pack provides. Drive setIntensity from ambient.intensity (low/medium/high already in store).

- **Per-preset:** nostromo=reactorThrum + periodic randomized computerBeeps (scheduled via context.currentTime); cyber=neon 60Hz buzz + occasional dataGlitch bursts; gothic=wind LFO + sparse randomized clockTick; noir/minimal keep recorded loops (rain/vinyl are better sampled than synthesized).

- **Risk:** Synthesized hums can sound cheap/sterile if not carefully voiced; CPU on low-end devices; needs a quality bar or it undermines the 'gorgeous' goal. Good as opt-in per layer, not a wholesale replacement.


#### Stereo spatialization of ambient + SFX tied to on-screen position  `[M effort · medium impact]`

- **What:** Pan ambient layers and event SFX across the stereo field — e.g. typewriter from where the chat sits, thunder sweeping L→R, a component 'placed' blip panned to the desk side it lands on.

- **Why:** Flat mono audio reads as 'a website with sound'; spatialized audio reads as 'a room'. The DeskLayout already has clear spatial zones (chat sidebar, evidence board) that SFX panning can map to, deepening immersion per preset.

- **How:** Add StereoPannerNode/PannerNode per voice in the mixer (idea 4). For event SFX (idea 2), pass an optional pan derived from the triggering element's bounding-box x-center (component.placed event already knows which card mounted in EvidenceBoard.tsx). For thunder, animate pan over ~600ms via setValueAtTime ramp.

- **Per-preset:** noir thunder sweeps overhead L→R; cyber dataGlitch pings hard-panned to mimic scattered HUD nodes; nostromo computerBeeps localized to the console panel; gothic clockTicks fixed slightly off-center like a mantel clock; minimal stays centered/mono (restraint is its identity).

- **Risk:** Requires the mixer (idea 4) first. Headphone-only benefit; on speakers/mono it's neutral. Over-panning can be disorienting — keep subtle.


#### Activity-reactive ambient intensity (audio responds to generation state)  `[M effort · medium impact]`

- **What:** Modulate ambient bed intensity and add a 'thinking' texture while the LLM is streaming — rain intensifies and distant thunder rumbles during generation; on completion it settles.

- **Why:** Right now ambient is static regardless of what's happening. Tying it to isLoading/streaming makes the soundscape feel alive and gives each preset a signature 'working' state, reinforcing the persona (the detective's storm rises as the case breaks).

- **How:** Subscribe to the chat loading state already used in ChatSidebar.tsx; on generation start ramp the ambient bus / setIntensity('high') and trigger a preset 'working' loop; on settle, ramp back to the stored ambient.intensity. Reuse mixer gain ramps (idea 4) or el.volume fades if mixer not built yet.

- **Per-preset:** noir: rain swells + low thunder rumble while 'investigating'; cyber: synthHum pitches up + faster data chirps (overclocking); nostromo: reactorThrum rises + 'PROCESSING' beep cadence; gothic: wind howls louder, organ drone swells; minimal: a single soft progress tick, then silence.

- **Risk:** Can feel gimmicky if overdone; must be subtle and respect reduced-motion/quiet preferences. Coupling audio to network latency means inconsistent durations — fade logic must tolerate very short and very long generations.


#### Give each preset a 3-5 second sonic 'sting' on aesthetic switch (audio identity)  `[S effort · medium impact]`

- **What:** Play a short signature flourish when the user switches into a preset — a one-shot that instantly communicates the world (jazz piano sting for noir, modem-handshake/synth riser for cyber, ship boot-up chime for nostromo, organ chord + thunder for gothic).

- **Why:** Switching presets is currently silent on the audio side; the visual theme swaps but there's no sonic 'arrival'. A sting is a tiny asset that hugely boosts the sense that each preset is its own place — like a channel ident.

- **How:** Add `sting?: SfxConfig` to AudioPack. Fire it from the place that handles aestheticId changes (settingsSlice.updateSettings consumers / the preset switcher UI) via the generalized SFX controls (idea 2) or a one-shot through the mixer. One short file per preset under public/assets/<preset>/sting.mp3.

- **Per-preset:** noir=lazy upright-bass + cymbal swell; cyber=glitchy synth riser + bass drop; nostromo=Weyland-Yutani boot chime + relay clicks; gothic=single deep organ chord + distant thunder; minimal=clean single 'tink' or nothing (restraint).

- **Risk:** Could annoy on rapid toggling — debounce and gate on soundEnabled; only play on actual change, not initial load.


#### Extend custom profiles to fully author their own SFX/ambient URLs and a music seed prompt  `[M effort · medium impact]`

- **What:** Expand profileAudioSchema so custom profiles can supply their own thunder/crackle/typewriter/SFX URLs and a musicStylePrompt seed, not just volume overrides + customMusicUrl + customRainUrl.

- **Why:** A custom profile today inherits its base preset's SFX/ambience and can only retint music; it can't be sonically distinct. To make custom profiles 'deeply adapted', users need to point at their own loops/one-shots and a generative music seed, paralleling the per-preset packs.

- **How:** In src/lib/customization/types.ts add optional URL fields to profileAudioSchema (customCrackleUrl, customStingUrl, customSfxUrls: Record<string,url>, ambientLayers) and a `musicStylePrompt`. Thread them through the resolver that builds the effective AudioPack for a custom id (the path that today merges volumes), and into ChatSettingsPanel music seeding (idea 3). Reuse the existing mediaUrlSchema validation.

- **Per-preset:** Custom profiles inherit their baseAestheticId's vocabulary (idea 1) then override per-layer — e.g. a 'submarine' custom profile based on nostromo overrides shipHum→sonar and supplies its own musicStylePrompt; a 'speakeasy' custom based on noir swaps jazz for ragtime.

- **Risk:** Depends on the generalized pack model (idea 1) to be clean. Must keep import/export back-compat with already-saved profiles (the schema already uses .optional() + clamping precedent for that).


#### Loop-seam crossfading and de-correlated start offsets for all looping beds  `[M effort · low impact]`

- **What:** Eliminate audible loop clicks on music + ambient by crossfading the loop seam (or using gapless decoded buffers) and varying playback rate/EQ slightly per cycle so the loop is less obviously periodic.

- **Why:** RainAudio/CrackleAudio already randomize the start offset (currentTime = Math.random()*duration), which helps, but raw HTMLAudioElement `loop=true` still produces a seam click on most encodes, and a 30s music loop becomes obvious fast. Polishing the seam is what separates 'gorgeous' from 'web audio loop'.

- **How:** With the mixer (idea 4), schedule two AudioBufferSourceNodes ping-ponging with a short equal-power crossfade at the seam, or apply a subtle, slow LFO to detune/filter so repetition is masked. Without the mixer, at minimum add a short fade-out/fade-in around loop boundary in NoirMusic.tsx using the existing fadeTo on a timeupdate near duration.

- **Per-preset:** Most impactful for noir jazz and gothic organ (melodic, repetition obvious); for nostromo/cyber drone beds the LFO-detune trick doubles as part of the 'living machine' texture; minimal's near-silent bed barely needs it.

- **Risk:** Gapless looping in Web Audio needs the buffer fully decoded (memory) and precise scheduling; getting the crossfade wrong can introduce a volume dip. Low user-visible payoff relative to ideas 1-4.


#### Preload/decoding strategy and graceful fallback per preset to avoid first-trigger lag  `[S effort · low impact]`

- **What:** Warm up each preset's SFX/ambient/music on aesthetic activation (decode-ahead) and provide a silent fallback if a preset asset 404s, so reactive SFX (idea 2) fire instantly and switching presets never plays the wrong (stale noir) sound.

- **Why:** NoirSoundEffects pools and recreates an element when src changes, but the first trigger after a preset switch can lag while decoding, and NoirMusic/NoirEffects default to noir assets — a missing cyber asset silently plays nothing or a stale buffer. Tight, correct audio per preset requires deterministic preloading.

- **How:** On aestheticId change (settings consumers), iterate the active pack and call audio.load()/decodeAudioData for each src (or warm the mixer buffers). Add a tiny manifest check or onerror handler in the generalized AmbientLayer/SFX components to fall back to silence (not noir) and log, so a preset gap is obvious in dev but silent in prod.

- **Per-preset:** Uniform mechanism, but the manifest makes per-preset gaps visible — surfaces exactly the cases flagged here (nostromo/cyber 'rain' mismatch) so they can be replaced with correct beds from idea 1.

- **Risk:** Preloading several files per preset adds bandwidth on switch; gate behind soundEnabled and only warm the active preset, not all five.


### VOICE & NARRATION uniqueness per preset — making the assistant SOUND like the world it inhabits, across spoken voice tuning, narration writing style, the tape/playback framing, and keyword-driven atmospheric SFX sync.

**Current state:** Today the system is voice-thin per preset. Each preset carries exactly one ElevenLabs voiceId: registry.ts (`noirProfile.voiceId` r5wMVcYycQezNCms1jJb, minimal 21m00..., cyber-fixer pNInz..., nostromo N2lVS..., gothic JBFqn...) and the client mirror in voice-defaults.ts (AESTHETIC_DEFAULT_VOICE_IDS). But prosody is NOT per-preset: src/app/api/tts/route.ts resolves only voiceId from the profile (lines 51-59); stability/similarityBoost/style/speed all fall back to the single global src/lib/elevenlabs/config.ts ELEVENLABS_CONFIG (stability:0, style:0.75, speed:0.75). So MU-TH-UR (should be flat, slow, robotic) and the gothic narrator (should be ornate, theatrical) get IDENTICAL prosody unless a custom profile overrides it. The model is `eleven_v3`, which supports inline audio tags ([whispers], [static], [sighs], [robotic]) — never used. Narration text comes from src/lib/ai/narration.ts NARRATION_SYSTEM, a separate, thinner copy of the personas in personas.ts: it gives mood ("hardboiled metaphor", "machine style", "gothic tone") but no hard STYLE constraints (sentence shape, vocabulary, formatting) and always frames output as a "spoken reply for the chat log." It's called in parallel in both route handlers (chat/route.ts:318, a2ui/stream/route.ts:298) and TTS-spoken via ChatSidebar.playTts. The dictaphone framing is hardcoded noir: DictaphonePanel.tsx labels everything "Dictaphone Logs / Cassette Log #N / Incinerate Tape", uses literal amber `rgba(255,191,0)` glows and a reel-to-reel cassette deck — identical for nostromo (should be a data-log readout) and cyber (should be a netrunner audio cache). Atmospheric SFX sync (ChatSidebar.tsx:166-227 scanner + 369-414 TTS-timed scheduler) only ever matches thunder/lightning and phone keywords (EN+ES); it is not preset-aware (no klaxon for nostromo, no static/glitch for cyber, no church-bell/raven for gothic) and only fires noir's three SFX names (typewriter/thunder/phone). There is no voice for UI feedback (generation start/done/error) — TTS only ever speaks the chat narration.


#### Per-preset voice DIRECTION (prosody profile), not just a voiceId  `[S effort · high impact]`

- **What:** Add a `voiceDirection` block to each AestheticProfile (stability, similarityBoost, style, speed, optional use_speaker_boost) and have the TTS route resolve it per preset instead of always falling back to the single global ELEVENLABS_CONFIG.

- **Why:** Right now every preset speaks with identical prosody (stability 0, style 0.75, speed 0.75). A flat corporate mainframe and a theatrical Victorian narrator sounding the same is the single biggest miss. Direction is what makes a voice belong to a world.

- **How:** Extend AestheticProfile in src/lib/aesthetic/types.ts with `voiceDirection?: { stability; similarityBoost; style; speed }`. Populate per profile in registry.ts: noir = stability 0.35 / style 0.55 / speed 0.85 (weary, deliberate); minimal = stability 0.7 / style 0.1 / speed 1.05 (clean, neutral); cyber-fixer = stability 0.2 / style 0.8 / speed 1.1 (fast, hyped); nostromo = stability 0.85 / style 0.0 / speed 0.8 (flat, robotic); gothic = stability 0.3 / style 0.7 / speed 0.8 (ornate, theatrical). In src/app/api/tts/route.ts, after resolving the profile (line 52), pull `profile.voiceDirection` as the fallback layer BEFORE ELEVENLABS_CONFIG so explicit voiceSettings > preset direction > global default. Mirror the values into a client-safe constant beside voice-defaults.ts so VoiceCustomization's preview and reset use them.

- **Per-preset:** This IS the per-preset adaptation — each preset gets a hand-tuned prosody curve (noir weary, cyber amped, nostromo robotic-flat, gothic theatrical, minimal neutral). Custom profiles keep using their own voice block, unchanged.

- **Risk:** ElevenLabs voices respond differently to the same settings; values need one tuning pass per voice. Low code risk — it's an extra fallback layer, fully backward compatible.


#### Per-preset narration STYLE contract (sentence shape, vocabulary, format), not just mood  `[S effort · high impact]`

- **What:** Rewrite NARRATION_SYSTEM entries to impose hard, distinct WRITING rules per preset rather than only a mood adjective, so the spoken text reads unmistakably like that world even before you hear the voice.

- **Why:** The brief asks for noir=hardboiled metaphor, nostromo=clipped computer log, gothic=ornate Victorian, cyber=street slang. The current prompts gesture at mood but don't constrain structure, so output drifts toward generic 'Here is your UI, detective.' Style rules make the difference legible in the transcript and the dictaphone label.

- **How:** In src/lib/ai/narration.ts, give each entry explicit constraints: noir — 'one weather/shadow metaphor, max 2 sentences, present tense, no greeting'; nostromo — 'format as a terminal log: leading bracket tag like [SURFACE ONLINE], ALL-CAPS system nouns, no contractions, no emotion'; gothic — 'one ornate dependent clause, archaic diction (whence/thus), reference candlelight or shadow'; cyber — 'street slang, drop articles, chrome/grid/deck nouns, exclamation energy'; minimal — keep crisp. Keep the existing 'no markdown/tools' guard. These run through the same generateText call (lines 60-66), so no plumbing change.

- **Per-preset:** Each preset gets a distinct grammar and lexicon contract; nostromo even gets a different visual format (bracketed log lines) that doubles as the cassette label text. Custom profiles still use the customSystemPrompt branch (line 56) untouched.

- **Risk:** Over-constraining can make the model robotic for noir/gothic where flow matters; keep 'max 2-3 sentences' and test that nostromo's bracket format doesn't get spoken literally (mitigate with idea on v3 tags stripping).


#### v3 audio-tag injection layer per preset (whispers, static, robotic, sighs)  `[M effort · high impact]`

- **What:** Add a server-side step that injects ElevenLabs v3 inline performance tags into the narration before TTS, chosen per preset, and strips them from the on-screen chat text.

- **Why:** The app already uses model `eleven_v3` (config.ts) which natively supports `[whispers]`, `[static]`, `[robotic]`, `[sighs]`, `[clears throat]` — a free, dramatic uniqueness lever currently unused. A nostromo line prefixed `[robotic]` or a noir line with a mid-sentence `[sighs]` instantly sells the character.

- **How:** New tiny module src/lib/ai/voiceTags.ts exporting `decorateForVoice(text, aestheticId)` -> returns the tagged version for TTS. Map: noir = occasional `[sighs]`/`[exhales]`; nostromo = leading `[robotic]` + `[static]`; cyber = `[excited]`; gothic = `[whispers]` on the final clause; minimal = none. Call it inside src/app/api/tts/route.ts right before building the ElevenLabs body (around line 98), keyed on body.aestheticId. Critically, the CHAT display text must stay clean — narration.ts returns plain text for the transcript; tags are added only at the TTS boundary, so the cassette label and chat bubble never show `[robotic]`.

- **Per-preset:** Each preset gets its own signature tag vocabulary; minimal opts out entirely. For custom profiles, default to no tags (safe) unless the user's voice block opts in later.

- **Risk:** v3 is the slower/pricier model and tag support varies by voice; if a voice ignores tags it's a no-op (safe). Must guard against double-injection on cache hits — fold the decorated text into the existing hash (route.ts:71-74).


#### Preset-aware atmospheric SFX keyword maps  `[M effort · high impact]`

- **What:** Replace the hardcoded thunder+phone keyword lists in ChatSidebar with a per-preset keyword->SFX map so the narration triggers world-appropriate sounds.

- **Why:** The scanner (ChatSidebar.tsx:189-220 and the TTS-timed copy at 369-414) only knows 'lightning/thunder' and 'phone ring' — pure noir. When MU-TH-UR says 'PROXIMITY ALARM' or the cyber fixer says 'the grid glitched', nothing fires. Sound that reacts to the words is the cheapest, most magical uniqueness win.

- **How:** Define `ATMOSPHERIC_TRIGGERS: Record<AestheticId, Array<{ keywords: string[]; sfx: 'thunder'|'phone'|'typewriter' }>>` near audio-packs.ts (client-safe). noir keeps thunder/phone; nostromo maps 'alarm/klaxon/proximity/breach' -> thunder (already the loudest hit), 'incoming transmission' -> phone; cyber maps 'glitch/static/jacked in/spike' -> thunder, 'call/ping' -> phone; gothic maps 'thunder/storm/lightning' -> thunder, 'bell/chime/knock' -> phone. Refactor the two duplicated scanner blocks in ChatSidebar.tsx into one helper that reads the active aestheticId (already in scope, line 93) and iterates the map. Reuses the existing three SFX channels — no new assets required for a first pass.

- **Per-preset:** Each preset listens for its own vocabulary and routes to the SFX that best fits its audio pack; the audio packs are already per-preset (registry.ts) so the same 'thunder' channel plays a klaxon-ish hit for nostromo if that asset is swapped later.

- **Risk:** Reusing only 3 SFX channels limits fidelity (a klaxon via the 'thunder' slot is approximate). Keyword false-positives could over-trigger; keep the existing once-per-message Set guard.


#### Add a 4th+ SFX channel per preset to back the new triggers  `[M effort · medium impact]`

- **What:** Extend the AudioPack SFX set with a preset-specific signature effect (e.g. nostromo `klaxon`, cyber `glitch`, gothic `bell`, noir keeps `phone`) so the keyword map routes to a real sound, not a repurposed thunder clip.

- **Why:** Idea above is bottlenecked by only having typewriter/thunder/phone. A true klaxon/glitch/bell is what makes the SFX sync feel authored rather than improvised.

- **How:** Extend `SfxName` in types.ts and the `sfx` record in each profile in registry.ts (and the client mirror in audio-packs.ts) with an optional `signature` entry pointing at a new asset under /assets/<preset>/. NoirSoundEffects (already passed sfxConfig in ChatSidebar.tsx:523-528) gains a `playSignature` control; expose it through the sfxControls object consumed by the scanner. Keep it optional so presets without the asset degrade to thunder.

- **Per-preset:** Each preset declares its own signature sound; minimal can leave it undefined (silence). Custom profiles already accept audio URLs, so expose a 'signature SFX URL' field in the lab later.

- **Risk:** Requires sourcing/licensing 4 new audio files; asset weight. Type change ripples through audio-packs mirror and any SfxName switch statements — grep before editing.


#### Reframe the Dictaphone deck per preset (it is hardcoded noir)  `[L effort · high impact]`

- **What:** Make DictaphonePanel's framing, labels, and chrome adapt to the active preset: noir = reel-to-reel cassette ('Dictaphone Logs'), nostromo = data-log readout ('AUDIO LOG // MU-TH-UR'), cyber = netrunner audio cache ('VOICE SHARDS'), gothic = phonograph/wax cylinder ('Recorded Confessions'), minimal = plain audio list.

- **Why:** The dictaphone is the signature spoken-word artifact, but DictaphonePanel.tsx is 100% noir: 'Dictaphone Logs', 'Cassette Log #N', 'Incinerate Tape', literal `rgba(255,191,0)` amber glows, spinning reels. On nostromo or cyber it breaks immersion completely. The brief explicitly asks 'the dictaphone tape framing for noir — what's the equivalent per preset?'

- **How:** In DictaphonePanel.tsx accept/derive the active aestheticId (it's available via useA2UIStore like ChatSidebar) and drive a `DICTAPHONE_FRAMING: Record<AestheticId, { title; itemLabel; deleteLabel; emptyHint; chrome:'reels'|'waveform'|'cylinder' }>`. Swap the hardcoded amber `rgba(255,191,0,*)` literals (lines 340, 419) to `var(--aesthetic-accent)` with alpha so the glow already follows the theme. For nostromo, render the reels as a scrolling waveform/log instead of spinning spools (conditional on chrome); for gothic, a wax-cylinder graphic. Reuse framer-motion (already a dep) for the differing idle animation.

- **Per-preset:** The physical metaphor changes per world (tape deck -> log terminal -> data shard -> wax cylinder); custom profiles fall back to a neutral 'Audio Log' framing keyed on baseAestheticId.

- **Risk:** Largest visual surface; the SVG VU-meter/reel hardware is bespoke and reworking it for 5 variants is real effort. Phase it: ship label/color theming (S) first, then alternate chrome (L).


#### Spoken UI-feedback voice lines (the assistant talks while it works)  `[M effort · medium impact]`

- **What:** Add short, preset-specific spoken interjections at generation lifecycle points: start ('on the case'), surface-rendered ('evidence filed'), and error ('trail went cold'), spoken in the preset voice via the existing TTS route.

- **Why:** Currently TTS only ever speaks the chat narration after completion. A brief in-voice 'Processing evidence...' line at request time, or an error bark, makes the world feel alive and responsive — and reuses terminology already defined per preset (registry.ts `terminology`: noir 'file a report'/'trail went cold', nostromo 'compile log'/'system error', etc.).

- **How:** New client helper that, gated behind ttsEnabled, POSTs a tiny canned line to /api/tts on submit and on the existing isLoading->done transition in ChatSidebar/DetectiveWorkspace. Source the lines from a `VOICE_FEEDBACK: Record<AestheticId, { start; done; error }>` map; the strings can derive from the existing `terminology` map in registry.ts so they stay in-voice. Cache-friendly: these are fixed strings so they hash-hit on the TTS disk cache (route.ts:77) after first play — near-zero cost/latency on repeat.

- **Per-preset:** Each preset's feedback lines use its terminology ('FILE A REPORT' / 'COMPILE LOG' / 'INJECT GRID LOAD' / 'MANIFEST CHRONICLE'); minimal stays silent or says a flat 'Generating.' Custom profiles derive a generic line from their system prompt or stay silent.

- **Risk:** Easy to become annoying/chatty; must be opt-in or low-frequency (e.g. only the 'done' line, or a settings toggle). Overlapping audio with the main narration TTS needs guarding (stopTts before playing).


#### Per-preset preview line in VoiceCustomization  `[S effort · medium impact]`

- **What:** Replace the hardcoded noir preview sentence with a preset-appropriate one so previewing the voice demonstrates the world, not always 'The rain never stops in this town.'

- **Why:** VoiceCustomization.tsx:163 hardcodes 'The rain never stops in this town. Neither does the code.' — pure noir. Previewing the nostromo or gothic voice with that line undersells the persona and confuses custom-profile users.

- **How:** Add `VOICE_PREVIEW_LINES: Record<BuiltInAestheticId, string>` beside voice-defaults.ts (client-safe). noir keeps the rain line; nostromo 'INTERFACE ONLINE. ALL SYSTEMS NOMINAL. AWAITING INPUT.'; cyber 'Neon's bleeding, choom. Deck's hot — what're we running?'; gothic 'The candles gutter, and still the shadows whisper their secrets.'; minimal 'Voice preview. This is how I sound.' Pick by `activeAestheticId` (already computed at line 56) in handlePreview. Pair with idea #3's tags for an even richer preview by passing aestheticId (already sent at line 180).

- **Per-preset:** Each preset gets a signature line that doubles as a personality demo; custom profiles fall back to a neutral preview line.

- **Risk:** Trivial; only risk is the line exceeding MAX_TTS_CHARS (520) — all proposed lines are well under.


#### TTS-timed SFX sync that scales to actual audio duration  `[S effort · medium impact]`

- **What:** Replace the fixed 65ms-per-char heuristic in the TTS-timed scheduler with timing derived from the actual audio element duration once loaded, so keyword SFX land on the spoken word across speeds.

- **Why:** ChatSidebar.tsx:371 hardcodes msPerChar=65, but per-preset speed now varies (idea #1: nostromo 0.8 vs cyber 1.1) and ElevenLabs pacing differs by voice. A thunderclap that lands mid-sentence on noir lands a beat late on the slow nostromo voice, breaking the magic.

- **How:** In playTts, after the Audio element has metadata (audio.onloadedmetadata gives duration), compute msPerChar = (duration*1000)/text.length and schedule the keyword timeouts then, instead of using the constant before playback. Keep the constant as a pre-metadata fallback. Minimal change inside the existing sfxControls block (lines 369-414).

- **Per-preset:** Indirectly per-preset: the slower nostromo/gothic voices and faster cyber voice now get correctly-timed atmospheric hits without per-preset tuning. No custom-profile-specific work needed.

- **Risk:** onloadedmetadata can fire before/after play() depending on browser; need to guard against scheduling twice or after stopTts cleared timeouts.


#### Narration variants — speak a different 'take' on demand  `[M effort · medium impact]`

- **What:** Let the user regenerate the narration in an alternate register (e.g. 'darker', 'terser', 'more poetic') for the same surface, producing a new tape — leveraging the existing dictaphone archive.

- **Why:** The brief asks for nicer VARIANTS and unique spoken framing. The dictaphone already archives tapes; offering 2-3 in-voice takes on the same case turns it into a real artifact collection and showcases the persona's range.

- **How:** Add a small 'Re-record' affordance on the assistant message (next to the existing Volume2 button in ChatSidebar.tsx:647) that calls a new lightweight narration endpoint variant: reuse generateNarration but append a register hint to the system (e.g. ', deliver this take terser and darker'). The returned text plays via the existing playTts path and lands as a new tape (the x-recording-hash plumbing at line 353 already creates tapes). No store schema change — tapes are keyed by hash.

- **Per-preset:** Register options are preset-flavored: noir 'colder / wearier', nostromo 'verbose log / terse alert', gothic 'more ornate / funereal', cyber 'more hyped / paranoid'. Custom profiles offer generic 'shorter / longer'.

- **Risk:** Extra LLM+TTS calls cost latency/$$; gate behind an explicit button. Need to dedupe near-identical takes so the archive doesn't fill with noise.


#### Bilingual/diegetic keyword expansion + accent-aware voice metadata  `[S effort · low impact]`

- **What:** Broaden the atmospheric keyword sets and surface voice accent/label metadata so the spoken voice and the SFX vocabulary feel native to each preset's diegesis.

- **Why:** The current keyword lists are EN+ES only and noir-specific; the VoiceCustomization dropdown already fetches ElevenLabs `labels.accent/gender/age` (lines 334-336) but nothing in the preset DEFAULT path surfaces 'this voice should have a gravelly American accent for noir'. Tightening the link between persona and chosen voice characteristics deepens immersion.

- **How:** Two parts. (a) In the preset keyword maps (idea #4) include the in-world synonyms each persona actually uses (nostromo: 'klaxon, decompression, airlock'; gothic: 'tempest, knell, raven'); these come straight from the persona vocabularies in personas.ts. (b) Add an advisory `voiceProfile?: { accent; descriptor }` to each AestheticProfile and show it as a hint in VoiceCustomization ('Preset wants: gravelly, American, weary') so users picking a custom voice stay on-theme; purely informational, no API change.

- **Per-preset:** Keyword synonyms and the advised voice descriptor are drawn from each persona's own lexicon (personas.ts), so they're inherently per-preset; custom profiles show no advisory.

- **Risk:** Mostly additive/informational; main risk is keyword over-matching common words (e.g. 'bell') causing spurious SFX — scope keywords to multi-word or distinctive terms.


### A2UI Generation Quality & Variants — prompt engineering, per-preset layout conventions, few-shot examples, multi-variant generation, remix/regenerate affordances, and tasteful use of the full A2UI catalog.

**Current state:** The generation pipeline is: client `useA2UIStream.sendPrompt` (src/lib/a2ui/hooks/useA2UIStream.ts) → POST /api/a2ui/stream → `streamText` with `toolChoice: { type: "tool", toolName: "generate_ui" }` (src/app/api/a2ui/stream/route.ts:304-315). The system prompt comes from `buildSystemPrompt(undefined, aestheticId, customSystemPrompt)` — note evidence is hardcoded `undefined` in the v0.9 path (route.ts:307), so there is NO current-state/baseline context fed to the model. The model emits ONE A2UI tree as a JSON string (tools.ts:67-90); it's coerced (`coerceComponentInput`), normalized (`normalizeA2UI`), validated, image-prompts resolved, then flattened to the catalog adjacency list (`flattenLegacyToCatalog`) for SurfaceRenderer.

The persona prompts (src/lib/aesthetic/personas.ts) are the only steering. They are near-identical boilerplate: every persona repeats Core Directives 1-11 verbatim, differing only in a 3-line flavor intro and the image-prompt hint. There are: NO few-shot examples (only noir has a single prose "Example Response"), NO per-preset layout conventions (noir≠nostromo≠cyber visually but the model gets the same structural advice), NO guidance on WHEN to use Kanban/Dashboard/Tabs/Stat/Grid/Modal, and NO "make it beautiful/composed" instruction. The directives even teach the LOWERCASE legacy schema (container/card/row, text.content) — the model never targets the richer v0.9 catalog directly; everything routes through the legacy adapter (legacyToCatalog.ts), which is lossy (callout→plain Column, list→plain text items, no icons, no AudioPlayer/Video/Slider unless legacy schema has them).

There is heavy evidence the model produces malformed output: `coerceComponentInput` repairs unquoted-key JSON, `normalizeA2UI` (schema.ts:361-584) rewrites ~15 classes of mistakes (text/content swaps, card-with-children, variant aliases, grid cols, table headers/object-rows, missing labels, tab shapes). `inferBadgeVariant` (legacyToCatalog.ts:49-59) exists because "Models rarely set variant, so infer." The noir persona is DUPLICATED in registry.ts (noirPersona, lines 64-88) and has DRIFTED — registry's copy lacks directives 9a/9b/9c (badge variants, modals, table shapes) that personas.ts has; registry's copy is dead for prompting (getPersonaPrompt reads personas.ts) but is a maintenance trap.

There are NO variants: `sendPrompt` calls `clear()` every time (useA2UIStream.ts:179), one tree replaces the last. No regenerate/remix/"make it fancier" affordance exists anywhere (grep found none). The only retry is `handleRetry` for failed prompts (DetectiveWorkspace.tsx:498). Narration runs as a separate tool-less call (narration.ts) with its own per-preset prompts — those ARE per-preset, unlike the layout guidance. The renderer is already preset-aware for KanbanBoard/DataDashboard (SurfaceRenderer.tsx:1074-1275 switch on baseAestheticId) but generic Card/Stat/Table/Badge are noir-flavored only via CSS vars.


#### Add per-preset layout-convention sections to the persona prompts  `[S effort · high impact]`

- **What:** Append a preset-specific 'LAYOUT DOCTRINE' block to each persona that prescribes a signature composition: noir = case-file dossier (heading + suspect cards in a grid + an evidence table + status badges); nostromo = terminal readout (stacked stat rows, monospace tables, a DataDashboard of ship telemetry, ALL-CAPS headings); cyber = HUD panels (grid of metric Stats, neon Dashboard charts, tabbed 'decks'); gothic = manuscript/ledger (serif headings, a chronicle list, a single ornate card, table as 'registry'); minimal = clean cards (one heading, 2-3 cards in a grid, generous whitespace, no badges unless asked).

- **Why:** Today all five presets get identical structural advice, so a nostromo terminal and a gothic manuscript come out structurally identical and only differ by CSS color. A doctrine block makes each preset produce a recognizably different SHAPE of UI, not just a recolor — the core of 'deeply adapted to the aesthetic.'

- **How:** In src/lib/aesthetic/personas.ts, factor the shared Core Directives into one `SHARED_DIRECTIVES` const, then give each persona its own `LAYOUT_DOCTRINE` string concatenated after it. Keep the lowercase legacy vocabulary the adapter expects. No new modules; getPersonaPrompt already returns the assembled string.

- **Per-preset:** This idea IS the per-preset adaptation: each preset gets a distinct doctrine (dossier / terminal / HUD / manuscript / clean cards) with named component recipes.

- **Risk:** Over-prescription could make outputs samey within a preset; mitigate by phrasing as 'prefer/lean toward', not 'always', and listing 2-3 alternative compositions per preset.


#### Inject 1-2 curated few-shot A2UI examples per preset into the system prompt  `[M effort · high impact]`

- **What:** Embed a hand-authored, gorgeous example tree (as compact JSON in the lowercase legacy schema) for each preset, chosen to exercise grid + cards + stat + badge + table + a hero image, so the model anchors on a high-quality target shape rather than emitting a flat text node.

- **Why:** The model has no concrete reference for 'good'. The huge normalize/coerce repair layer (schema.ts normalizeA2UI, tools.ts coerceComponentInput) and inferBadgeVariant prove it routinely emits minimal/malformed trees. A worked example dramatically raises baseline structure and reduces malformed output, which is the cheapest quality lever for LLM UI generation.

- **How:** Add a new module src/lib/ai/examples.ts exporting `getFewShot(aestheticId): string` returning 1-2 minified example trees with a one-line caption ('A strong noir suspect dossier looks like:'). Concatenate in buildSystemPrompt (src/lib/ai/prompts.ts) after the persona. Keep examples small (<800 tokens) and valid against a2uiInputSchema (add a unit test that parses each).

- **Per-preset:** Each preset gets its own example reflecting its doctrine: noir dossier, nostromo telemetry dashboard, cyber HUD grid, gothic chronicle, minimal card row — so few-shot reinforces the per-preset shape.

- **Risk:** Token cost on every request and risk of the model copying the example too literally; mitigate by labeling it 'illustrative structure, not content to reuse' and rotating among 2 examples per preset.


#### Generate 2-3 layout variants and let the user pick  `[L effort · high impact]`

- **What:** On a single prompt, request N (default 3) distinct layouts and present them as selectable 'takes' (e.g. a row of thumbnail surfaces or a 'Take 1 / Take 2 / Take 3' switcher) before committing one to the board.

- **Why:** The brief explicitly asks for VARIANTS. Right now one tree replaces the last (useA2UIStream clears every send). Choice makes the app feel like a creative tool, surfaces the model's range, and lets users escape a weak first draft without re-prompting.

- **How:** Two implementable paths: (a) server fan-out — in route.ts, run `streamText`/`generateText` 2-3x in parallel with a varied 'composition style' hint appended (e.g. 'compact', 'spacious hero', 'data-dense') and emit each as its own surfaceId; (b) prompt the model for an array via the tool called 3 times. Add a `variantCount` to the request body (A2UIStreamRequest) and a `variants: SurfaceState[]` concept in useSurfaceStore. UI: a small variant strip in A2UIv09Preview. Server already supports multiple tool calls (callIndex loop in route.ts:363-371) so the plumbing for multiple trees partly exists.

- **Per-preset:** Variant axes are themed per preset: noir variants = 'rap sheet / surveillance board / interrogation summary'; nostromo = 'status readout / diagnostics / manifest'; cyber = 'HUD / netrunner deck / market feed'; gothic = 'chronicle / portrait gallery / ledger'; minimal = 'compact / spacious / data-table'.

- **Risk:** 3x latency and cost; mitigate with parallel requests, a cheaper model for variants, and a setting to disable. Streaming UX for 3 surfaces needs care so partial trees don't flicker.


#### 'Make it fancier' / 'Remix' regenerate affordances on the board  `[M effort · high impact]`

- **What:** Add quick-action buttons near a rendered surface: 'Make it fancier' (richer composition, more components), 'Simplify', 'Different angle', and a plain 'Regenerate'. Each re-runs generation with the original prompt PLUS a modifier instruction, using the existing tree as baseline.

- **Why:** Cheap, high-delight iteration loop. It exploits the fact that the v0.9 path currently throws away baseline context — feeding the current tree back as 'Current Evidence' (which buildSystemPrompt already supports via the evidence arg) turns regeneration into editing/elevation rather than starting from scratch.

- **How:** buildSystemPrompt already accepts an `evidence` arg and emits Update Rules (prompts.ts:28-39) — the v0.9 route just passes undefined. Thread the current surface's component list into the request body and into buildSystemPrompt. Add a `modifier` field to A2UIStreamRequest; map button → modifier string ('Elevate this: add visual hierarchy, use a hero image, group with cards/grid, add status badges'). UI: a small action bar in A2UIv09Preview / EvidenceBoard. Reuse sendV09Prompt with an extra arg.

- **Per-preset:** 'Fancier' means different things per preset: noir → add evidence photo + redaction badges; nostromo → add scanline dashboard + telemetry stats; cyber → add glowing HUD metrics + tabs; gothic → add ornamental divider + portrait card; minimal → add whitespace and a single accent stat, NOT more chrome.

- **Risk:** Feeding the prior tree back can cause the model to make trivial edits; counter with an explicit 'substantially restructure' instruction for 'Different angle' vs 'preserve content, improve presentation' for 'Fancier'.


#### Add explicit component-usage guidance so the model uses the full catalog tastefully  `[S effort · high impact]`

- **What:** Add a 'COMPONENT PLAYBOOK' to the prompt that maps intents to components: tabular/comparative data → table; KPIs/counts → stat or DataDashboard; workflow/status columns → KanbanBoard; multi-section content → tabs; categorical choices → select; long lists → list; reveal-on-click → modal; >2 sibling cards → grid (columns 2-3). Include anti-patterns ('don't dump everything in one container of paragraphs').

- **Why:** The catalog is rich (KanbanBoard, DataDashboard, Tabs, Stat, Grid, Modal, Slider) but the prompt only says 'Prefer container/row/column/grid.' Result: most outputs are stacks of cards/paragraphs. A decision table is the standard way to get LLMs to reach for the right widget and makes outputs feel designed, not generic.

- **How:** Add to the shared directives in personas.ts (or a `COMPONENT_PLAYBOOK` const concatenated in buildSystemPrompt). Keep it as a compact intent→component table. Pair with idea #1's doctrine. Verify each named component survives the legacy adapter (legacyToCatalog.ts) — e.g. callout currently degrades to a Column, so either steer away from callout or improve its rendering (see idea #9).

- **Per-preset:** Bias the playbook per preset: nostromo and cyber lean into DataDashboard/Stat (telemetry/HUD); noir leans into table + cards + modal (case files, sealed evidence); gothic leans into list + single ornate card + table-as-registry; minimal leans into grid of cards + stat, avoiding Kanban/dashboard unless asked.

- **Risk:** The model may over-reach for fancy widgets on simple prompts; add 'match complexity to the request — a one-line answer is a single text/card, not a dashboard.'


#### Feed current-state baseline into the v0.9 stream for true iterative editing  `[M effort · high impact]`

- **What:** Pass the currently-rendered surface (component tree) into the v0.9 generation so follow-up prompts ('add a phone number field', 'mark Vance as armed') modify the existing UI instead of regenerating from nothing.

- **Why:** buildSystemPrompt has a full 'Current Evidence' + 'Update Rules' branch (prompts.ts:28-39) that the v0.9 path never uses (route.ts:307 passes undefined). This is built infrastructure sitting unused — wiring it makes the assistant feel like it remembers the case, which is core to the detective fantasy and to good iterative UX.

- **How:** In useA2UIStream.sendPrompt, read the active surface from useSurfaceStore and include a `baselineComponents` (or reconstructed legacy tree) in the POST body. In route.ts, pass it as the `evidence` arg of buildSystemPrompt. Optionally convert the flat catalog list back to the legacy nested shape the prompt examples use, or just pass the catalog JSON with a note. Gate behind a 'continue case' vs 'new case' toggle since sendPrompt currently always clears().

- **Per-preset:** Update Rules phrasing can be themed via the persona ('amend the case file', 'recompile the log', 'append to the chronicle'), but the mechanism is preset-agnostic — every preset benefits from iterative edits.

- **Risk:** Larger prompts (token cost) and risk the model returns partial trees; the existing Update Rules already say 'Return a complete root component' — keep and emphasize that.


#### Themed suggested-prompt chips / 'opening cases' on the empty state  `[S effort · medium impact]`

- **What:** Show 3-5 clickable example prompts on CaseBoardEmptyState, themed to the active preset, that are pre-written to produce gorgeous multi-component outputs (e.g. noir: 'Open a case file on three suspects with mugshots, status, and an evidence log').

- **Why:** There are zero example prompts anywhere (grep confirms). New users type 'a button' and get a flat result, never seeing the app's range. Curated prompts both onboard and showcase the doctrine/playbook, doubling as a quality demo.

- **How:** Add a `samplePrompts: string[]` per profile in registry.ts (AestheticProfile type in src/lib/aesthetic/types.ts) or a small map in a new src/lib/aesthetic/sample-prompts.ts. Render chips in CaseBoardEmptyState (src/components/board/CaseBoardEmptyState.tsx); on click, call handleSendMessage with the text. framer-motion (already a dep) can stagger them in.

- **Per-preset:** Each preset ships its own chips matched to its doctrine: noir suspect dossiers, nostromo system diagnostics, cyber netrun dashboards, gothic family-curse chronicles, minimal clean product cards. Custom profiles fall back to generic 'design a dashboard / form / pricing table'.

- **Risk:** Chips can feel canned; rotate/randomize a larger pool and keep wording in-voice.


#### Reconcile and de-duplicate the persona source of truth  `[S effort · medium impact]`

- **What:** Make personas.ts the single source for prompts and delete/redirect the duplicated, drifted noir persona inlined in registry.ts (noirPersona, registry.ts:64-88), which is missing directives 9a/9b/9c that personas.ts has.

- **Why:** Two copies of the noir prompt have already diverged — a latent bug where editing one (e.g. adding new layout doctrine) silently won't apply if a future code path reads the registry copy. Consolidation is a prerequisite for every prompt-quality idea here so improvements land everywhere.

- **How:** In registry.ts, set `noirPersona.systemPrompt = NOIR_PERSONA` (import from personas.ts, as the other four profiles already do) instead of the inline string. Keep terminology in registry. Confirm no consumer relies on the divergent text (grep getAestheticProfile().persona.systemPrompt usage).

- **Per-preset:** Preset-agnostic hygiene; ensures per-preset doctrine/few-shot/playbook edits apply uniformly across all five presets and custom profiles.

- **Risk:** Low; purely a consolidation. Verify no test snapshots the inline registry string.


#### Upgrade lossy adapter mappings so 'designed' components don't degrade  `[M effort · medium impact]`

- **What:** Improve legacyToCatalog.ts so callout renders as a real accented callout (not a bare Column), list optionally renders ordered/iconed, and add adapter support for icons (legacy schema lacks an icon node entirely) and AudioPlayer/Video where the persona references 'wire taps' and 'footage'.

- **Why:** The prompt invites rich components, but the adapter quietly downgrades them: callout→plain Column (legacyToCatalog.ts:99-105), list→stacked Text. So even when the model composes well, the result looks generic. Closing the gap between 'what the model is told it can use' and 'what actually renders nicely' is essential to make output feel designed.

- **How:** Add a Callout renderer to SurfaceRenderer.tsx (accent left-border + icon, like Stat) and emit `component: 'Callout'` from the adapter with a `tone` field. Add an Icon legacy node to schema.ts + adapter (IconRenderer already exists, just renders '[name]' — improve it to a real glyph/material set). For audio/video, the legacy schema would need new node types; note these as new schema additions explicitly.

- **Per-preset:** Callout/icon styling switches on aesthetic: noir = amber rule + paperclip glyph; nostromo = green '>' prompt + scanline; cyber = neon glow border; gothic = crimson wax-seal motif; minimal = subtle gray rule. Reuses the existing per-preset switch pattern (KanbanBoardRenderer).

- **Risk:** Renderer surface area grows; keep new components behind the same CSS-variable theming so custom profiles inherit them. Icon font/glyph choice needs an asset decision.


#### Post-generation quality pass / auto-enrichment heuristics  `[M effort · medium impact]`

- **What:** After validation, run cheap deterministic enrichment on the tree: auto-wrap 3+ sibling cards in a grid(columns:2-3), promote a lone leading text to a heading, ensure every card-heavy surface has a top-level heading, and default badge variants via the existing inferBadgeVariant for any preset.

- **Why:** Even with better prompts, models emit flat stacks. A small server-side beautifier raises the floor on EVERY generation for near-zero latency and no extra LLM cost — complementary to prompt work. inferBadgeVariant already exists and is only called in the adapter; generalize the idea into a composition pass.

- **How:** Add src/lib/a2ui/enrich.ts with pure functions operating on the legacy A2UIInput tree (before flattenLegacyToCatalog) in route.ts emitComponent. Keep transforms conservative and idempotent; unit-test each. Make it opt-out via a request flag for power users editing JSON directly.

- **Per-preset:** Enrichment intensity per preset: minimal stays restrained (no auto-badges, no forced grids beyond 2 cols); noir/cyber/gothic/nostromo allow richer auto-grouping and decorative dividers between sections. Read aestheticId in the enrich pass.

- **Risk:** Heuristics can fight the model's intent or the JSON editor; keep them minimal, reversible, and disabled when a baseline tree is being edited (idea #6).


#### Per-preset image-prompt + placement guidance for hero imagery  `[S effort · medium impact]`

- **What:** Instruct the model (per preset) to include exactly one hero image in image-heavy compositions and where to place it (noir: a suspect mugshot inside the top card; cyber: a wide HUD banner; gothic: a portrait beside the chronicle; nostromo: usually NO photo, a schematic instead; minimal: optional clean product shot).

- **Why:** imageStylePrompt exists per preset in registry.ts and the image pipeline works, but the layout prompt gives no guidance on WHEN/WHERE to use images, so outputs are either image-less or randomly placed. Deliberate hero imagery is the single biggest 'gorgeous' multiplier, and tying placement to the doctrine makes it feel composed.

- **How:** Extend the LAYOUT_DOCTRINE (idea #1) with a one-line image rule per preset. The model already knows to omit image.src and pass prompt/alt (resolveA2UIImagePrompts handles the rest). Optionally cap to 1-2 images per surface in the enrich pass (idea #10) to control latency/cost.

- **Per-preset:** Directly per-preset: each preset specifies image role, placement, and whether to use imagery at all (nostromo prefers schematics/ASCII over photos, minimal stays sparse).

- **Risk:** More images = more latency and generation cost (deferred image generation already exists per recent commits, which mitigates this); cap count and respect the existing imageModel setting.


#### Composition-style seed for intra-preset variety (anti-sameness)  `[S effort · medium impact]`

- **What:** Rotate a small 'composition seed' hint per generation (e.g. asymmetric / centered-hero / data-grid / split-column / single-focus) so repeated prompts in the same preset don't produce identical skeletons.

- **Why:** Strong doctrine + few-shot risks making every noir output the same dossier. A rotating structural seed preserves preset identity while varying the arrangement, keeping the app feeling alive across sessions — and it's the engine behind the variant feature (idea #3).

- **How:** Maintain a `COMPOSITION_SEEDS: string[]` in a new src/lib/ai/composition.ts; pick one (random or round-robin by prompt hash) and append 'Compose this with a {seed} layout.' to the user message in route.ts. For variants (idea #3), pick N distinct seeds. Cheap, no schema change.

- **Per-preset:** Seed vocabulary is themed: noir = 'pinboard / dossier-spread / surveillance-grid'; nostromo = 'readout / diagnostics-grid / manifest'; cyber = 'HUD / split-deck / ticker'; gothic = 'illuminated-page / portrait-and-text / ledger'; minimal = 'centered / two-column / card-grid'.

- **Risk:** Some seeds may not suit some prompts (e.g. 'ticker' for a login form); phrase as a soft preference and let content needs override.


### Customization Lab & Personalization UX — making custom aesthetic creation delightful, powerful, complete, and AI-assisted

**Current state:** The Customization Lab is a right-side slide-in panel (src/components/settings/CustomizationPanel.tsx) with 8 tabs: Profile, Colors, Persona, Audio, Voice, Effects, Portability, Advanced. A custom profile is a thin override layer over one of the 5 built-in presets (`baseAestheticId`), defined in src/lib/customization/types.ts: optional colors, fonts ({body,heading} from a 4-value enum system/serif/typewriter/mono), audio (volumes + customMusicUrl/customRainUrl), voice (voiceId + EL params), effects (rain/fog/crackle/typewriterSpeed), imageStylePrompt (≤500 chars), systemPrompt (≤3000 chars), and backgroundImageUrl. Profiles live in localStorage via useCustomProfileStore.ts + storage.ts; create/clone/delete and import/export JSON (schemaVersion 1) all work. Overrides reach generation correctly: DetectiveWorkspace.tsx passes activeProfile.systemPrompt → customSystemPrompt, activeProfile.imageStylePrompt → customImageStylePrompt, and activeProfile.voice → voiceSettings into the chat/a2ui/tts routes (confirmed in route.ts buildSystemPrompt/createTools). Colors/fonts/bg apply via injectProfileStyles() in css-injection.ts, which writes a `[data-custom-profile="<id>"]` rule layered on top of the element's `data-aesthetic` base block (DeskLayout.tsx sets both attributes).

KEY GAPS FOUND IN CODE: (1) THEMING IS INCOMPLETE — the schema supports `fonts` and `imageStylePrompt`, and both are wired to rendering/generation, but there is NO Font editor tab and NO image-style-prompt editor tab in CustomizationPanel.tsx. Users literally cannot edit fonts or image style from the UI even though the engine honors them. (2) NO LIVE PREVIEW ON ACTIVATION — injectProfileStyles() is called ONLY from ColorCustomization.tsx (on a color/bg edit). DetectiveWorkspace.tsx calls loadProfiles() on mount but NEVER injects the active profile's CSS, so a saved profile's custom colors/fonts/bg do not apply on page load or when switching profiles via the dropdown — they only "wake up" after the user opens the Colors tab and nudges a value. (3) NO STARTING POINT — creating a profile (ProfileSelector.tsx) yields an empty override layer with zero seeded values; the color editor must read PRESET_COLORS (a hand-duplicated copy of registry.ts colors) just to show swatches. (4) Color editing is 9 independent hex pickers with no harmony/contrast tooling and no legibility guardrails (css-injection only regex-validates that a value is a valid CSS color). (5) No gallery of shipped/community variants, no "surprise me", no AI-assisted theming despite all the AI infra (chat route, generate_ui, image generation) being present. (6) Audio/Voice/Effects tabs partly write to global useA2UIStore settings rather than the active profile (e.g., EffectsCustomization always writes settings.effectIntensities, never profile.effects), so those "customizations" aren't actually saved into the portable profile.


#### Fix live-preview-on-activation: inject the active profile's CSS on mount and on switch  `[S effort · high impact]`

- **What:** Make a custom profile's colors/fonts/background actually apply the moment it is active — on first page load and on every profile switch — not only after the user pokes the Colors tab.

- **Why:** This is the single biggest correctness/delight bug in the Lab. Today a user crafts a gorgeous palette, reloads, and sees the bare base preset because injectProfileStyles() is never called outside ColorCustomization. Every other idea here (gallery, AI theming, surprise-me) is dead on arrival without this, because applying a generated profile must instantly repaint the desk.

- **How:** In DetectiveWorkspace.tsx, alongside the existing loadProfiles() useEffect, add an effect keyed on activeProfile?.id + updatedAt that calls injectProfileStyles(activeProfile) (and clears/re-injects when switching). Also iterate all customProfiles once after loadProfiles() to inject each saved profile's rule so the `[data-custom-profile]` selector always has a match. Optionally hoist injection into useCustomProfileStore.ts setActiveProfile/updateProfile so it's centralized. Guard with the existing typeof document check.

- **Per-preset:** Preset-agnostic plumbing, but it is what lets a custom profile visibly diverge from its base preset; without it, e.g. a noir-derived profile silently renders as plain noir.

- **Risk:** Double-injection / stale rules if the marker-splice logic in css-injection.ts isn't idempotent; mitigate by re-running buildProfileCSS and replacing the whole style element on activation.


#### Add the missing Fonts and Image-Style tabs (close the theming-completeness gap)  `[M effort · high impact]`

- **What:** Add a Typography control (body/heading from the existing FontPreset enum, with a richer preset list) and an Image Style editor (free-text imageStylePrompt with examples and a 'test render' button) to CustomizationPanel.tsx.

- **Why:** The schema and engine already honor profile.fonts and profile.imageStylePrompt, but there is no UI to set them — so a 'custom aesthetic' can never actually change its typography or the look of generated images, the two things that most define a world. This is low-hanging because the wiring exists end to end.

- **How:** Add tabs 'typography' and 'imagery' to TABS in CustomizationPanel.tsx. Typography: two segmented selectors writing profile.fonts.{body,heading}; on change call injectProfileStyles (font vars already mapped in css-injection.ts buildFontVariables). Expand FONT_FAMILIES/fontPresetSchema with a few more families (e.g. 'display-serif', 'grotesk', 'pixel') so worlds feel distinct. Imagery: a textarea bound to profile.imageStylePrompt (max 500) plus a 'Preview image' button that hits the existing image route with a fixed test subject so users see their style applied.

- **Per-preset:** Seed defaults per base preset: noir→typewriter+display serif headings; minimal→grotesk; cyber-fixer→mono; nostromo→pixel/mono; gothic-manor→display-serif. The image-style placeholder text is pre-filled with that preset's registry imageStylePrompt so editing starts from the real world, not blank.

- **Risk:** Adding new FontPreset values requires matching CSS @font-face/system fallbacks; keep to web-safe/already-loaded families to avoid FOUT and bundle bloat.


#### AI-assisted theme generation: 'describe a vibe → full profile'  `[L effort · high impact]`

- **What:** A prompt box ('rain-soaked Tokyo back-alley ramen bar at 3am') that calls a new /api/theme route returning a complete CustomProfile: 9-color palette, font pair, persona systemPrompt, imageStylePrompt, a voice pick, and audio/effect intensities — then applies it live.

- **Why:** This is the headline feature for 'generate genuinely unique worlds.' All the infra exists (Anthropic SDK in chat route, structured tool output, the CustomProfile zod schema as a perfect output contract). It turns the Lab from a knob-fiddling chore into a creative generator and produces internally-coherent worlds a casual user could never hand-tune.

- **How:** New module src/lib/ai/theme-generator.ts + src/app/api/theme/route.ts using the same Anthropic client as chat/route.ts, with a tool whose schema mirrors customProfileSchema (colors/fonts/imageStylePrompt/systemPrompt + a voice 'persona description' the server maps to the nearest ElevenLabs voice via /api/elevenlabs/voices labels). System prompt instructs: pick a base preset, produce a legible palette (enforce contrast — see guardrails idea), write a 1-2 paragraph persona consistent with generate_ui directives. On return, createProfile() + updateProfile() with all fields, setActiveProfile, injectProfileStyles. Add a 'Generate from a vibe' button at the top of ProfileSelector.tsx.

- **Per-preset:** The model chooses the closest base preset as scaffolding (so audio packs/effects inherit sensibly) and is told the 5 worlds' signatures so 'haunted lighthouse' biases toward gothic-manor base, 'derelict mining ship' toward nostromo. Custom personas still inherit the non-negotiable generate_ui core directives.

- **Risk:** LLM can emit low-contrast/illegible palettes or a persona that forgets to use the tool; mitigate with the contrast-clamp guardrail and by appending the core directives server-side rather than trusting the model.


#### Palette generation & harmony tools in the Color tab  `[M effort · high impact]`

- **What:** Augment the 9 raw hex pickers with: a single 'accent' seed that auto-derives a harmonious 9-swatch palette (complementary/analogue/triadic), light/dark base toggle, and 'extract palette from background image'.

- **Why:** Nine independent pickers make it almost impossible for non-designers to produce a cohesive world; most attempts look muddy. Deriving the full set from one or two seeds is how you get gorgeous results fast, and it pairs with the surprise-me and AI ideas.

- **How:** New src/lib/customization/palette.ts with pure functions (hex→HSL, generateHarmony(seed, scheme, mode) → ProfileColors). In ColorCustomization.tsx add a 'Harmonize' control above COLOR_GROUPS that fills all 9 keys then calls onUpdate. For image extraction, sample the already-uploaded backgroundImageUrl via a canvas/quantize pass (small k-means) to seed accent/background. No new deps required (pure TS); framer-motion already present for swatch transitions.

- **Per-preset:** The harmony engine respects the base preset's mood: noir/gothic/nostromo default to dark-mode generation (low-L background, high-L text), minimal to light-mode, cyber-fixer to a dark base with neon accent + magenta accentMuted. Schemes are seeded from each preset's signature accent so 'reset' lands back on-brand.

- **Risk:** Auto-derived palettes can still produce ugly combos for extreme seeds; keep manual override (current pickers) as the escape hatch.


#### Legibility / contrast guardrails with a live warning badge  `[S effort · medium impact]`

- **What:** Compute WCAG contrast for text-on-background, text-on-surface, and accent-on-background as colors change; show inline warnings and offer one-click 'auto-fix to AA'.

- **Why:** css-injection.ts only validates that a value is syntactically a CSS color — nothing stops a user (or the AI generator) from picking dark-grey text on black, which silently destroys the whole UI. Guardrails make freeform theming safe and are a prerequisite for trusting AI/surprise-me output.

- **How:** Add contrastRatio(a,b) and clampForContrast(fg,bg,target) to the new palette.ts. In ColorCustomization.tsx render a small badge next to text/textMuted/accent showing the ratio and a warning icon below ~4.5:1, plus an 'Auto-fix legibility' button that nudges L until AA passes and writes back via onUpdate. Reuse the same check inside the /api/theme generator to reject/repair bad palettes before returning.

- **Per-preset:** Targets adapt per preset intent: minimal enforces strict AA (productivity tool); noir/cyber/gothic allow 'atmospheric' AA-large thresholds so moody low-key palettes aren't over-corrected into looking flat; nostromo's mono-green is checked phosphor-on-black specifically.

- **Risk:** Over-aggressive auto-fix can wash out an intentionally moody palette; make it advisory (warn) by default and auto-fix opt-in.


#### 'Surprise Me' one-click world generator (offline, no API key)  `[M effort · medium impact]`

- **What:** A dice button that instantly assembles a coherent random profile from curated building blocks — palette seed + scheme, font pair, base preset, effect intensities, and a persona drawn from a small bank — with a re-roll.

- **Why:** Gives instant delight and a starting point even for users without an LLM key, and showcases the system's range. It's the gateway drug to deeper customization (re-roll until close, then tweak).

- **How:** New src/lib/customization/surprise.ts exporting rollProfile(): seeds the palette engine from idea #4, picks from curated arrays of font pairs / persona blurbs / effect ranges, returns a CustomProfile. Wire a 'Surprise me' button in ProfileSelector.tsx next to 'Create New Profile' that createProfile + applies + injects. Make the persona bank short, atmospheric, and always carry the generate_ui directives.

- **Per-preset:** Each base preset has its own curated pools (noir gets jazz-lounge/precinct/femme-fatale personas + amber/brass accents; cyber-fixer gets street-slang variants + neon seeds; gothic gets Victorian-poet variants). The roll first picks a base preset, then samples only that world's pools, so results feel like dialects of a world rather than random soup.

- **Risk:** Curated banks can feel repetitive after many rolls; mitigate by combining seed-palette randomness (continuous) with discrete persona/font choices.


#### Shipped-variants gallery (preset 'remixes' as starting points)  `[M effort · high impact]`

- **What:** A visual grid of 10-15 hand-authored profile variants (e.g. 'Noir: Sepia Archive', 'Cyber: Acid Vapor', 'Nostromo: Amber Terminal', 'Gothic: Crimson Chapel', 'Minimal: Carbon') shown as live mini-swatch cards; click to clone-and-edit.

- **Why:** An empty 'Create New Profile' → blank overrides flow gives users nothing to react to. A gallery of gorgeous, already-coherent variants makes the Lab feel rich on first open, teaches what's possible, and gives every world several flavors instead of one.

- **How:** New src/lib/customization/variants.ts exporting an array of partial CustomProfile presets (colors/fonts/imageStylePrompt/persona deltas, validated against customProfileSchema). New ProfileGallery.tsx in settings rendered at the top of the Profile tab: cards render a tiny 3-color bar + name using each variant's own colors. Clicking calls createProfile(name, base) then updateProfile(...variant) then applies. These are the same JSON shape as export, so a future 'community import' is trivial.

- **Per-preset:** Every one of the 5 worlds ships with 2-3 named variants so each base aesthetic has visible breadth (different palette/typography/persona while keeping its audio identity). This is literally 'nice variants' for the aesthetic, authored once.

- **Risk:** Authoring quality is on us — bad variants make the app look worse; keep the set small and curated, contrast-checked via idea #5.


#### Make Audio/Voice/Effects actually persist into the active profile  `[S effort · medium impact]`

- **What:** Route EffectsCustomization (and the global parts of AudioCustomization) writes to profile.effects / profile.audio when a custom profile is active, instead of always mutating the shared useA2UIStore settings.

- **Why:** Theming-completeness/portability bug: profile.effects and most profile.audio fields exist in the schema and export, but EffectsCustomization.tsx unconditionally writes settings.effectIntensities/typewriterSpeed, and AudioCustomization writes global sfx/music/ambient — so a user's effect+audio tuning is NOT saved into the profile and is lost on export/import or profile switch. A 'custom world' that can't carry its own rain/fog/typewriter feel isn't really custom.

- **How:** Mirror the pattern already correct in VoiceCustomization.tsx (which branches on activeProfile): in EffectsCustomization.tsx and AudioCustomization.tsx, when getActiveProfile() is non-null write to updateProfile(id, { effects/audio }) and read from profile.effects/profile.audio with settings as fallback; otherwise keep editing global settings. Then DetectiveWorkspace.tsx (already merges activeProfile.audio for rain/crackle/music) should likewise prefer activeProfile.effects for rain/fog/crackle/typewriterSpeed.

- **Per-preset:** Lets each world own its atmosphere intensity (gothic = heavy fog + loud thunder; nostromo = high crackle, minimal rain; minimal = effects near zero) and have it survive export/import as part of the portable identity.

- **Risk:** Need to keep the no-custom-profile path writing to global settings so built-in presets stay tunable; a clean ternary on activeProfile avoids regressions, covered by existing tests.


#### Persona editor upgrade: scaffolding, base-preset diff, and 'rewrite in this voice' assist  `[M effort · medium impact]`

- **What:** Replace the blank 3000-char textarea with a structured starting point (prefilled with the base preset's actual persona), a 'fields' helper (terminology: component/generate/error labels), and an optional AI 'polish/rewrite' button.

- **Why:** PersonaCustomization.tsx today is an intimidating empty box with only a placeholder; users don't know they must preserve generate_ui directives (the inline AlertCircle warns but provides no scaffold). Personas are the soul of each world, so making them easy to write well directly improves output uniqueness.

- **How:** Prefill promptValue with the base preset's persona text (expose via a client-safe export mirroring registry personas, like voice-defaults.ts mirrors voiceIds) so editing starts from the real thing and 'Reset' is meaningful. Add structured inputs for the three terminology terms (stored on the profile; currently only built-ins have terminology). Add a 'Rewrite for vibe' button hitting the /api/theme generator (idea #3) scoped to persona-only. Always append the immutable core directives server-side so user edits can't break tool usage.

- **Per-preset:** Scaffold and terminology defaults come from each base preset's registry persona (noir's hard-boiled monologue, nostromo's MU-TH-UR computer log, gothic's Victorian verse), so a custom world starts as a recognizable dialect and the user edits flavor, not boilerplate.

- **Risk:** Server must enforce core directives regardless of user/AI text to prevent personas that stop emitting valid A2UI; cap length stays at 3000.


#### Soundscape pack picker + AI-suggested ambience to complete the audio identity  `[M effort · medium impact]`

- **What:** Let custom profiles choose which built-in audio pack to borrow from (decoupled from base preset) and offer curated/AI-suggested ambient URL sets, not just a single custom-music upload.

- **Why:** Right now a custom profile's audio is locked to its baseAestheticId's pack (getAudioPack) with only a single customMusicUrl override (customRainUrl exists in schema but has no UI). Sound is half the immersion; letting a 'minimal-based' productivity world adopt nostromo's hums, or pick a distinct rain bed, makes worlds feel uniquely scored.

- **How:** Add a 'sound pack' selector in AudioCustomization.tsx writing a new profile.audioPackId (extend types.ts) that DetectiveWorkspace/getAudioPack consult before falling back to baseAestheticId. Surface the existing customRainUrl upload next to customMusicUrl. For AI: extend the /api/theme generator to suggest mood tags ('vinyl + distant thunder') the UI maps to pack+intensity presets. Reuse the existing /api/uploads + isSafeMediaUrl validation already in place.

- **Per-preset:** Each preset's pack stays its default, but mix-and-match unlocks cross-world scoring (gothic visuals + jazz, cyber visuals + nostromo console hums). The AI generator picks the pack whose texture matches the described vibe.

- **Risk:** Adding audioPackId touches the resolution path and export schema (bump considered); keep it optional with safe fallback to current behavior so old exports still validate.


#### Live preview header card + before/after compare in the Lab  `[M effort · high impact]`

- **What:** A persistent mini 'world preview' at the top of the panel showing a rendered sample card (heading, paragraph, badge, button, stat) using the in-progress profile, plus a press-and-hold 'compare to base' toggle.

- **Why:** Editing colors/fonts while the panel covers the desk means users can't see effects on real components. A self-contained preview makes every knob immediately legible and is where contrast warnings and font changes visibly land — turning fiddling into a tight feedback loop.

- **How:** New ProfilePreviewCard.tsx rendered in CustomizationPanel.tsx above the tab content, wrapped in its own element carrying data-aesthetic + data-custom-profile so it inherits the injected vars. Render a small static A2UI-like sample using the same aesthetic CSS vars the SurfaceRenderer uses. 'Compare to base' temporarily strips data-custom-profile via state. Use framer-motion (already a dep) for a subtle crossfade on change.

- **Per-preset:** The sample content reflects the active world's terminology/persona flavor (noir shows an 'Evidence' card and 'File Report' button; nostromo shows a 'MODULE' log line; gothic an 'Artifact' chronicle), so the preview previews not just colors but the world's voice.

- **Risk:** Must keep the preview's injected CSS scoped so it doesn't fight the live desk's data-custom-profile rule; use a distinct preview profile id or a scoped wrapper attribute.


#### First-run onboarding: a 3-step 'forge your world' wizard  `[M effort · medium impact]`

- **What:** On first open of the Lab (or via a 'New from scratch' button), a short guided flow: pick a base world → pick or generate a palette → name it; lands the user in a complete, applied, gorgeous profile.

- **Why:** The current create flow (ProfileSelector dialog: name + base dropdown) drops users into an invisible empty override layer with nothing applied (idea #1 bug) and no guidance. A 3-step wizard that ends with a visibly themed desk is the difference between 'I made a thing' and 'I gave up.'

- **How:** New ProfileWizard.tsx using framer-motion step transitions; reuses ProfileGallery (idea #7) for step 1, the palette/harmony tool (idea #4) or 'Surprise me' (idea #6) for step 2, and createProfile+inject for completion. Gate first-run on a localStorage flag. Wire the entry from ProfileSelector's 'Create New Profile'.

- **Per-preset:** Step 1 IS the preset choice and frames the rest: choosing 'Gothic Manor' filters the gallery/surprise pools and palette defaults to that world's mood, so the wizard adapts its suggestions to the chosen aesthetic rather than offering generic swatches.

- **Risk:** Scope creep — keep it 3 steps and skippable; depends on ideas #1/#4/#7 existing to be worthwhile.


### Architecture for aesthetic cohesion: collapsing the 4-6 scattered sources of per-preset identity into a single data-driven model that renderers, CSS, audio, voice, image, and copy all consume — so deepening or adding a preset is DRY and sustainable.

**Current state:** Aesthetic identity for the 5 presets is fragmented across at least six places, and the same literal values are hand-copied between them:

1. `src/lib/aesthetic/registry.ts` (server-only) — the nominal "source of truth": `ThemeConfig` colors+fonts, `AudioPack`, `PersonaConfig`, `voiceId`, `imageStylePrompt`. Marked `import "server-only"` so clients cannot read it.
2. `src/app/globals.css` — hand-written `[data-aesthetic="..."]` blocks duplicate every color from registry.ts (e.g. noir `--aesthetic-accent: #ffbf00` appears in both), plus bg-image/case-file image vars and a large body of per-preset effect CSS (`.bg-paper`, `.mask-stamp`, scanlines, glows, form controls) that exist ONLY here keyed by attribute.
3. `src/lib/aesthetic/audio-packs.ts` — a full second copy of every `AudioPack` (the file header literally says "duplicated from the server-only registry for client-side use").
4. `src/lib/aesthetic/voice-defaults.ts` — a third copy of the `voiceId` map ("Mirrored from the server-only aesthetic registry ... Keep in sync").
5. `src/components/settings/ColorCustomization.tsx` — `PRESET_COLORS` is a FOURTH copy of all preset color palettes, used to show custom-profile color defaults.
6. `src/components/a2ui/SurfaceRenderer.tsx` — `KanbanBoardRenderer` (lines ~1074-1127) and `DataDashboardRenderer` (lines ~1223-1275) each contain a `switch (baseAestheticId)` with hardcoded Tailwind classes per preset (e.g. cyber-fixer uses literal `text-cyan-400`/`magenta-500`, gothic-manor uses `#3e2723`/`#eae2cf`), NOT the `var(--aesthetic-*)` tokens the rest of the renderer uses. These hardcoded palettes drift from the registry and don't pick up custom-profile color overrides at all.

Consumers: `prompts.ts:buildSystemPrompt` pulls persona from `personas.ts`; `images.ts` reads `profile.imageStylePrompt`; `tts/route.ts` reads `profile.voiceId`. Custom profiles (`src/lib/customization/types.ts`) layer overrides as CSS via `css-injection.ts` (`[data-custom-profile="id"]` scoped vars, inheriting the base preset's `data-aesthetic` block). DeskLayout sets both `data-aesthetic` and `data-custom-profile`. NoirEffects only varies audio by preset (via `getAudioPack`); atmosphere visuals (rain/fog) are NOT preset-differentiated. The custom-profile model only exposes colors/fonts/audio/voice/effects/prompts — it has no hook into the per-preset CSS effects or the renderer switch classes, so a custom profile can never get cyber-fixer's neon card glow or its own component styling.

Net: adding a preset or deepening one means editing 5-6 files in lockstep with no compiler enforcement that they agree.


#### Single client-safe AestheticDefinition as the one source of truth  `[M effort · high impact]`

- **What:** Split each preset into a pure-data, client-safe definition object (colors, fonts, audio pack, voiceId, imageStylePrompt, plus new fields for styleTokens/atmosphere/copy) and keep ONLY the long persona prompt strings server-side. registry.ts becomes a thin server wrapper that imports the data defs and attaches the persona. audio-packs.ts, voice-defaults.ts, and ColorCustomization's PRESET_COLORS all re-export from the shared defs instead of re-declaring literals.

- **Why:** Today noir #ffbf00 lives in 4 files; any deepening of a preset risks silent drift. Collapsing to one client-safe def removes 3 duplicate copies and lets both server (prompt/image/tts) and client (CSS injection, effects, renderers, settings) read identical data. This is the keystone every other idea depends on.

- **How:** New `src/lib/aesthetic/definitions.ts` (NO server-only) exporting `AESTHETIC_DEFINITIONS: Record<BuiltInAestheticId, AestheticDefinition>` where AestheticDefinition extends the current ThemeConfig+AudioPack+voiceId+imageStylePrompt. Move the persona prompt bodies to stay in `personas.ts` (server-only). `registry.ts` builds `AESTHETIC_REGISTRY` by spreading `AESTHETIC_DEFINITIONS[id]` + `{ persona: { systemPrompt: PERSONA[id] } }`. Rewrite `audio-packs.ts` AUDIO_PACKS to map over definitions; `voice-defaults.ts` and `ColorCustomization.PRESET_COLORS` to derive from definitions. Add a vitest that asserts globals.css values match definitions (or generate CSS — see separate idea).

- **Per-preset:** Mechanical for all 5 — each preset's literals collapse to one entry. Custom profiles already merge onto a base def; this makes the base they extend a real importable object so the Customization Lab can show true defaults instead of the hand-copied PRESET_COLORS.

- **Risk:** Persona strings must stay server-only (they're large and define behavior); care needed so the client-safe def file doesn't transitively import personas.ts. Mitigate by keeping persona as a separate server-only map keyed by id.


#### Generate the globals.css [data-aesthetic] variable blocks from the registry at build time  `[M effort · medium impact]`

- **What:** Replace the hand-maintained `:root` + five `[data-aesthetic=...]` color/font/image blocks in globals.css with a generated CSS file produced from AESTHETIC_DEFINITIONS, imported into globals.css. Keep the hand-authored effect CSS (scanlines, glows) separate.

- **Why:** The `[data-aesthetic]` blocks are a verbatim duplicate of registry colors — the single highest-churn duplication. Generating them guarantees CSS vars and the registry can never disagree, and adding a preset becomes 'add one def entry' instead of 'also hand-write a CSS block'.

- **How:** Add a small codegen script `scripts/gen-aesthetic-css.mjs` (run via a `prebuild`/`predev` npm script, or a vitest snapshot that writes the file) that reads `AESTHETIC_DEFINITIONS`, emits `src/app/generated/aesthetic-vars.css` with `[data-aesthetic="id"] { --aesthetic-*: ... }` plus `--aesthetic-bg-image`/`--aesthetic-case-file-image` (add those two paths to the def as `backgroundImage`/`caseFileImage` fields). `globals.css` does `@import "./generated/aesthetic-vars.css";` then keeps only the effect blocks. Commit the generated file and add a CI check that it's up to date.

- **Per-preset:** Each preset contributes its color set + image paths from one place. Custom profiles are unaffected (they still inject scoped vars after this file in document order, so equal-specificity overrides still win — same contract css-injection.ts already documents).

- **Risk:** Adds a codegen step; if skipped, generated CSS goes stale. Mitigate with a CI 'is generated file current' test. Tailwind v4 @import ordering must keep the generated file before the effect overrides.


#### Add a styleTokens layer to the def and make renderers consume tokens, not switch statements  `[L effort · high impact]`

- **What:** Introduce per-preset `styleTokens` (cardShape, cardGlow, borderStyle, surfaceTint, mono-vs-serif, glowColor, radius) on AestheticDefinition, expose them as CSS custom properties, and rewrite KanbanBoardRenderer/DataDashboardRenderer to read those tokens instead of their hardcoded `switch (baseAestheticId)` Tailwind classes.

- **Why:** The two `switch` blocks (~110 lines) hardcode palettes that already drifted from the registry (literal cyan/magenta/#3e2723 instead of var tokens) and completely ignore custom-profile color overrides — a custom profile based on cyber-fixer gets generic cyan kanban cards. Token-driven rendering makes these components automatically correct for all presets AND custom profiles, and kills the switch.

- **How:** Add `styleTokens` to the def: e.g. `{ radius: '0px'|'4px', cardGlow: 'none'|'cyan'|'green', borderWeight, headerCase }`. Emit them as `--a2-radius`, `--a2-card-glow`, etc. in the generated CSS (previous idea). In SurfaceRenderer.tsx, delete the `switch` in `KanbanBoardRenderer`/`DataDashboardRenderer` and replace the class strings with `var(--aesthetic-*)`/`var(--a2-*)`-based classes (matching what CardRenderer/StatRenderer already do). Glow/scanline accents move to globals.css keyed by `[data-aesthetic]` (or driven by the glow token) so the component stays preset-agnostic.

- **Per-preset:** Each preset sets its tokens once (noir=sharp+amber, cyber-fixer=neon glow+rounded, nostromo=square+phosphor, gothic=parchment+serif, minimal=clean). Crucially, custom profiles inherit the base preset's tokens and override the colors via the existing var pipeline, so their dashboards/boards finally respect their palette.

- **Risk:** Visual regression risk on the two heaviest components; the e2e layout snapshots (mentioned in recent commits) will catch shifts. Do it preset-by-preset behind the snapshots.


#### Move per-preset effect CSS into a declarative effect registry keyed off tokens  `[L effort · medium impact]`

- **What:** Treat the large body of `[data-aesthetic=...] .bg-paper / .mask-stamp / scanlines / glows / form-controls` CSS as a structured 'effect profile' per preset (which surface treatment, which stamp style, which scanline type, which text-bloom) referenced from the def, rather than ad-hoc CSS blocks discovered only by reading globals.css.

- **Why:** Right now the richest part of each preset's identity (parchment cards, wax-seal stamps, neon holograms, phosphor bloom) is invisible to the def/types and unreachable by custom profiles. Cataloguing effects as named, composable treatments makes 'this preset's card look' a first-class, documented property and lets a custom profile opt into 'gothic parchment' or 'cyber hologram' explicitly.

- **How:** Add `effects: { card: 'parchment'|'hologram'|'wireframe'|'paper', stamp: 'waxSeal'|'digital'|'terminal'|'ink', screen: 'scanlines'|'phosphor'|'none', textBloom: 'cyan'|'green'|'none' }` to the def. Keep the actual CSS in globals.css but key the selectors on a generic `[data-effect-card="parchment"]` attribute that DeskLayout sets from the resolved def, instead of `[data-aesthetic="gothic-manor"]`. DeskLayout (and css-injection for custom profiles) writes `data-effect-*` attributes. Now effects are reusable/mixable and a custom profile can pick a card treatment.

- **Per-preset:** Decouples 'palette' from 'treatment': gothic-manor=parchment+waxSeal+ink, cyber-fixer=hologram+digital+scanlines+cyan-bloom, nostromo=wireframe+terminal+phosphor+green-bloom, noir=paper+(stamp)+none, minimal=clean+none. A custom noir-based profile could choose the hologram card while keeping noir colors.

- **Risk:** Largest CSS refactor; selector churn could break the existing per-preset polish. Stage it: introduce data-effect-* attributes that initially mirror data-aesthetic 1:1, then migrate selectors, validating with visual snapshots.


#### Promote per-preset copy/terminology to a first-class typed field feeding both UI chrome and prompts  `[M effort · high impact]`

- **What:** Expand the existing `persona.terminology` map into a structured, typed `copy` object (component noun, generate verb, error phrase, plus UI-chrome strings like the 'CASE FILE // JSON DATA' / 'Evidence Board' labels and the placeholder strings 'IMAGE PENDING'/'WIRE TAP PENDING'/'FOOTAGE PENDING') and source those strings from the def everywhere.

- **Why:** Hardcoded noir chrome ('Evidence Board', 'CASE FILE', 'WIRE TAP PENDING') leaks noir identity into every other preset, breaking immersion — a Nostromo console shouldn't say 'Evidence Board'. Centralizing copy in the def makes the chrome adapt per preset (and per custom profile) and gives the prompt builder consistent terminology to inject.

- **How:** Add `copy: { workspaceTitle, editorTitle, imagePending, audioPending, videoPending, componentNoun, generateVerb, errorPhrase }` to AestheticDefinition. Replace literals in DeskLayout.tsx (lines ~232, 267) and SurfaceRenderer placeholders (ImageRenderer/Video/AudioPlayer) with values resolved from the active def via a `useAestheticCopy()` hook (reads the def via the same client-safe definitions module). Feed `copy.componentNoun/generateVerb` into buildSystemPrompt so terminology is consistent between the persona text and the UI.

- **Per-preset:** noir='Evidence Board'/'WIRE TAP PENDING'; nostromo='SYSTEM LOG'/'AUDIO STREAM OFFLINE'; cyber-fixer='THE GRID'/'SIGNAL LOST'; gothic='The Chronicle'/'PORTRAIT UNDEVELOPED'; minimal='Workspace'/'Image loading'. Custom profiles can override copy strings (add an optional `copy` to customProfileSchema).

- **Risk:** Touches many string sites; missing one leaves a noir term in a non-noir preset. A grep/lint rule for the known literals helps catch stragglers.


#### Unify built-in presets and custom profiles behind one ResolvedAesthetic model  `[L effort · high impact]`

- **What:** Create a single `resolveAesthetic(baseId, customProfile?)` function returning a fully-merged ResolvedAesthetic (colors, fonts, audio, voice, image, styleTokens, effects, copy) that both built-ins and custom profiles flow through, so every consumer reads one shape regardless of source.

- **Why:** Today built-ins and custom profiles take divergent paths: built-ins via registry/CSS attribute, customs via injected scoped CSS + a partial override schema that can't reach styleTokens/effects/copy. A single resolver makes 'custom profile' just 'base def + overrides', eliminating the special-casing scattered across SurfaceRenderer's useBaseAestheticId, ChatSidebar, VoiceCustomization, DetectiveWorkspace.

- **How:** New `src/lib/aesthetic/resolve.ts` (client-safe): `resolveAesthetic(baseId, profile?) => ResolvedAesthetic` deep-merges `AESTHETIC_DEFINITIONS[baseId]` with the custom profile's overrides (colors/fonts/audio/voice/imageStylePrompt/systemPrompt + new effects/copy/styleTokens once added). Provide a `useResolvedAesthetic()` hook reading the custom-profile store + settings (replacing the bespoke `useBaseAestheticId` and the repeated `activeProfile?.baseAestheticId ?? settings.aestheticId` pattern found in 5+ components). CSS injection and DeskLayout attributes are then derived from the same resolved object.

- **Per-preset:** Makes the 5 presets and any custom profile interchangeable to consumers. A custom profile becomes a true superset-capable extension of its base preset rather than a colors/audio-only skin.

- **Risk:** Central abstraction touched by many components; introduce alongside existing helpers and migrate incrementally rather than big-bang. Server consumers (prompts/images/tts) need a server-safe variant that adds the persona.


#### Compile-time/test invariants that keep the def, CSS, and consumers in agreement  `[S effort · medium impact]`

- **What:** Add a typed manifest + tests asserting every BuiltInAestheticId has a complete def, that globals.css vars equal def colors (until codegen lands), that every preset declares all required styleTokens/copy keys, and that asset paths referenced in defs exist on disk.

- **Why:** The current 'keep in sync' comments in audio-packs.ts and voice-defaults.ts are the only safeguard against drift — there is no enforcement. Tests turn silent drift into red CI and make adding a preset a guided, checklist-driven task.

- **How:** Extend the existing `registry.test.ts`/`audio-packs.test.ts`. Add `definitions.test.ts`: iterate `getAvailableAesthetics()`, assert each def has all ThemeColors/fonts/audio/voice/image/styleTokens/copy keys (use TS `Required<>` + runtime check). Add a test parsing `globals.css` (or the generated file) and comparing `--aesthetic-accent` etc. to the def. Add a fs.existsSync check over audio `src`, bg-image, and case-file paths under `public/`. A `satisfies Record<BuiltInAestheticId, AestheticDefinition>` annotation gives compile-time completeness.

- **Per-preset:** Preset-agnostic guardrail: any of the 5 missing a token or a misspelled asset path fails CI. Directly enables confident 6th-preset addition.

- **Risk:** Parsing CSS in a test is brittle if formatting changes — prefer doing this only after the codegen idea so the test reads structured output, or keep the CSS assertion loose (regex per var).


#### Drive NoirEffects atmosphere (rain/fog/lightning/grain) from the def, not just audio  `[M effort · high impact]`

- **What:** Add an `atmosphere` block to the def (rainDensity, fogOpacity, lightningEnabled+frequency, grainOpacity, vignetteStrength, particle type) and have NoirEffects + the film-grain/vignette overlays read it, instead of only switching the audio pack by preset.

- **Why:** Currently NoirEffects only differentiates SOUND per preset; the visible rain, fog, film grain (0.04 fixed), and vignette are identical across all 5. A Nostromo terminal raining like a noir alley, or gothic-manor with no candle-flicker dust, breaks the per-preset 'feels unique' goal. The infra (overlays, framer-motion) already exists; it just isn't parameterized.

- **How:** Add `atmosphere: { rain: number, fog: number, lightning: boolean, grain: number, vignette: number, particles?: 'rain'|'dust'|'static'|'embers'|'none' }` to AestheticDefinition. NoirEffects.tsx reads it from the resolved aesthetic and passes intensities to RainOverlay/FogOverlay; the `.film-grain`/`.vignette` opacity become CSS vars (`--grain-opacity`, `--vignette-strength`) set in the generated per-preset CSS and referenced in globals.css. Custom-profile `effects` schema already has rain/fog/crackle/typewriterSpeed — extend it to feed the same vars.

- **Per-preset:** noir=heavy rain+fog+grain; cyber-fixer=light rain+digital static particles+scanline; nostromo=no rain, heavy phosphor flicker+static, minimal grain; gothic=heavy fog+dust embers+lightning; minimal=none. Custom profiles already expose rain/fog/crackle sliders, so this wires existing UI to real visuals.

- **Risk:** More moving particles can hurt perf/motion sensitivity; gate behind the existing prefers-reduced-motion resets and keep particle counts bounded per intensity.


#### Pull image-style and voice identity into the same def-driven, custom-aware pipeline  `[M effort · medium impact]`

- **What:** Treat `imageStylePrompt` and the voice settings (voiceId + stability/style/speed defaults) as def fields that custom profiles override through the unified resolver, and have images.ts/tts route accept a fully-resolved aesthetic instead of re-reading registry by id.

- **Why:** images.ts and tts/route.ts read `getAestheticProfile(id).imageStylePrompt/voiceId` directly, which ignores custom-profile overrides server-side unless separately threaded (custom image/system prompts are already passed ad hoc from DetectiveWorkspace). Folding voice defaults (currently only voiceId per preset) and image style into the resolved def gives images, narration, and TTS one consistent identity source.

- **How:** Add optional `voice: { voiceId, stability, similarityBoost, style, speed }` defaults to the def (today only voiceId exists; the values are baked into ElevenLabs config). The chat/tts/images server paths call a server `resolveAesthetic` that merges the custom profile (already validated by customProfileSchema.voice/imageStylePrompt) so a custom profile's voice tuning and image style flow through automatically. buildNoirImagePrompt and tts route take the resolved `imageStylePrompt`/`voice` rather than re-deriving from id.

- **Per-preset:** Each preset gets a curated voice character (not just an id) — noir=gravelly slow, nostromo=flat synthetic, gothic=theatrical, cyber=clipped, minimal=neutral. Custom profiles inherit then tune via the Lab's existing voice sliders, with no separate server plumbing.

- **Risk:** ElevenLabs param ranges differ (speed clamped 0.7-1.2 per types.ts); keep clamping in the resolver. Changing voice defaults alters TTS output—coordinate with whoever curated the voiceIds.


#### Define a documented 'add a preset' contract and scaffolder once the def is the single source  `[S effort · medium impact]`

- **What:** Provide a typed template + short script/doc that, given a new preset id and a populated AestheticDefinition, wires everything (registry entry, persona stub, generated CSS, settings options, def test) so a 6th preset is a single guided change.

- **Why:** The whole point of consolidating is sustainability. Once defs are the source of truth + codegen + tests exist, capture the 'how to add a preset' steps so the next contributor doesn't rediscover the 6 touchpoints. This is the payoff that makes 'unique per preset' actually maintainable.

- **How:** Add `docs/adding-an-aesthetic.md` and a `scripts/scaffold-aesthetic.mjs` that appends a typed skeleton to `definitions.ts`, a persona stub to `personas.ts`, an option to the settings/ProfileSelector enum and customProfileSchema baseAestheticId enum (currently a hardcoded z.enum in types.ts — note this enum is itself a duplication of BuiltInAestheticId that should be derived), then runs the CSS codegen + tests. The def test (idea 7) verifies completeness.

- **Per-preset:** Preset-agnostic enabler. Also surfaces a real bug to fix in passing: `customProfileSchema.baseAestheticId` (types.ts) and `isBuiltInAestheticId` (aesthetic/types.ts) each independently list the 5 ids — derive both from one const tuple so adding a preset doesn't require editing the zod enum by hand.

- **Risk:** Scaffolders rot if the architecture keeps moving; keep it thin (a doc + minimal codegen) rather than an elaborate generator. Deriving the zod enum from a tuple needs `z.enum(TUPLE)` with `as const` to preserve literal types.
