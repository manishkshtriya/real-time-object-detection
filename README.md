<div align="center">

# 🌊 SUNKEN

**A bioluminescent dive-platformer in a single HTML file.**
Original sprites · synthesised sonar audio · eight hand-authored dives · zero dependencies.

`recover the pearl → reach the airlock`

[▶ Play it](https://manishkshtriya.github.io/sunken/) · [📄 Documentation](./SUNKEN_Project_Documentation.pdf)

</div>

---

## About

**SUNKEN** is a complete 2D side-scrolling platformer written as one self-contained `.html`
document. You play a diver descending through reefs, kelp and a sunken wreck — recover the
pearl, then reach the airlock before the crushing dark, the vents or the drifters end the dive.

There is no engine, no framework and no asset pipeline. Sprites are painted procedurally into
offscreen canvases at boot, audio is synthesised at runtime with the Web Audio API, and the
eight dives are declarative JSON-serialisable objects in a single array. The whole game runs by
**double-clicking the file** — or hosting it as a static page.

The visual identity is a submersible **dive computer**: near-black seawater framed by a
brushed-teal instrument console, one bioluminescent accent (`#2fe3d0`) echoed by the game's own
collectibles, and a circular pressure gauge that fills as you descend.

## Features

- **Deterministic, frame-rate-independent physics** — a fixed 60 Hz timestep with an accumulator
  and interpolated rendering, so the simulation is bit-identical at 60, 120 or 144 Hz.
- **Non-tunnelling collision** — substepped, axis-separated swept AABB resolution; verified against
  simulated speeds above 300 px/frame.
- **Everything procedural** — sprites, levels and audio are generated in code. The deliverable stays
  a single file with no external assets.
- **Fails soft** — Gamepad, Web Audio and `localStorage` are each feature-detected. If any is refused
  by the browser, that feature turns off and the game keeps running.
- **Full input support** — keyboard, gamepad and touch, with fully rebindable controls and a
  versioned save.
- **Eight graded dives**, each validated as completable (console assertions + automated flood-fill +
  a headless simulation soak).

## Controls

| Action    | Keyboard        | Gamepad   |
|-----------|-----------------|-----------|
| Swim      | `← →` / `A D`    | Stick / D-pad |
| Kick up   | `Space`         | A         |
| Thruster  | `Shift`         | B / RB    |
| Spear     | `F`             | X / RT    |
| Hold      | `Esc`           | Start     |
| Debug     | `F3`            | —         |

On touch devices an on-screen pad appears automatically.

## Gameplay

Take the pearl to open the airlock, then reach it. Along the way:

| Salvage        | Points | Hazards / enemies        |
|----------------|--------|--------------------------|
| Shard          | 200    | Crush-dark (fatal)       |
| Bloom          | 500    | Hydrothermal vent (fatal)|
| Relic          | 1 000  | Urchin (fatal)           |
| Pearl          | 1 000  | Drifter — jellyfish patrol |
| Drifter / eel  | 300    | Eel — hovering shooter   |
| Spare tank     | 500    |                          |

Air pockets refill the thruster tank; spear packs restock ammunition. You start each dive with
three lives, six spears and an empty tank.

## Running locally

It's a single static file — no build step.

```bash
# clone
git clone https://github.com/manishkshtriya/sunken.git
cd sunken

# just open it
open sunken.html          # macOS
xdg-open sunken.html      # Linux
start sunken.html         # Windows

# …or serve it (any static server works)
python3 -m http.server 8000
# then visit http://localhost:8000/sunken.html
```

## Architecture

The script is organised into thirteen numbered sections forming a strict dependency chain — nothing
below a section reaches upward into one above it. Every tuning value lives in the `CFG` object at the
top, so no literal number appears in the logic beneath it.

| §   | Module           | Responsibility |
|-----|------------------|----------------|
| 1   | `CFG`            | Single source of truth for physics, scoring, timing, layout |
| 2   | `LEVELS`         | Declarative dive data |
| 3   | `Save`           | Versioned persistence; fails soft to defaults |
| 4   | `Sound`          | Web Audio synthesis + look-ahead ambient scheduler |
| 5   | `SPR`            | Procedural sprite atlas |
| 6   | `Input`          | Keyboard / gamepad / touch → one state object per step |
| 7   | `World`          | Grid construction, tile queries, AABB overlap sets |
| 8   | `moveAndCollide` | Substepped, axis-separated swept AABB |
| 9   | `Game`           | State machine, entities, camera, scoring, rendering |
| 10  | `UI`             | Screen machine, keyboard nav, settings, telemetry |
| 11–13 | `resize · Loop · boot` | Integer scaling, fixed-timestep loop, init |

## Authoring a dive

A dive is 52 × 15 tiles (16 px each). Ground is runs along the bottom row, shelves are rectangles,
and everything else is a single character at a tile coordinate. Append an object to the `LEVELS`
array and the dive log and progression pick it up automatically.

```js
{
  name: "Shallows",
  ground: [[0, 52, '#']],                        // [x, length, tile]
  blocks: [[8, 12, 4], [13, 10, 4], [19, 9, 5]], // [x, y, width, height?]
  items:  [[1, 13, 'P'], [22, 8, 'T'], [50, 13, 'D']] // [x, y, char]
}
```

**Tile & item vocabulary:** `#` rock · `=` shelf · `~` crush-dark · `*` vent · `^` urchin ·
`P` spawn · `T` pearl · `D` airlock · `o` shard · `b` bloom · `c` relic · `j` air · `a` spears ·
`+` spare tank · `e` drifter · `s` eel.

`buildLevel()` warns in the console at load time if a dive is missing its pearl or airlock.

## Tech

Vanilla JavaScript (ES6+) · Canvas 2D · Web Audio API · `localStorage` · CSS3.
Fonts: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (UI) and
[Space Mono](https://fonts.google.com/specimen/Space+Mono) (instrument readouts).

## Tested

| Test | Method | Result |
|------|--------|--------|
| Frame-rate independence | Simulation at 60 / 120 / 144 Hz | Positions identical; no drift |
| Tunnelling | Forced velocities > 300 px/frame | No pass-through |
| Accumulator stall | Tab hidden 60 s, then restored | Clamped; auto-pause on blur |
| Dive reachability | Automated flood-fill, all 8 dives | Pearl + airlock reachable |
| Simulation soak | 4 000 headless update ticks per dive | No exception |
| API refusal | Gamepad / AudioContext / storage blocked | Game continues, feature off |
| Save schema | Corrupt / version-mismatched payloads | Falls back to defaults |

## Credits

Built by **Manisha GP** (NNM23IS093), Dept. of Information Science & Engineering,
NMAM Institute of Technology, Nitte.

Design inspiration from the run-to-the-exit lineage of classic DOS platformers; all art, audio,
levels and code are original.

## License

MIT — see [`LICENSE`](./LICENSE).
