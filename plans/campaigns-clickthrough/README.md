# Campaigns R1 — desktop click-through

Task D-3 of `plans/handoff-campaigns-r1-2026-09-05.md`. The ten desktop boards
D01–D10, exported from Paper file `01KZQXXEZ2SNPWS5PN2FCF31PC` ("Pictify —
Landing Redesign (Repro Shop)") at 1x PNG, named in the order a buyer walks
them. Open them in filename order and you have the whole product in nine
screens.

| # | File | Board | Node | Size |
|---|---|---|---|---|
| 01 | `01-D01-list.png` | Campaigns D01 — list (campaigns experience) | `BPC-0` | 1440×900 |
| 02 | `02-D02-D03-setup.png` | Campaigns D02/D03 — edition · Setup | `BT7-0` | 1440×1187 |
| 03 | `03-D04-data.png` | Campaigns D04 — edition · Data (upload + mapping) | `BZH-0` | 1440×900 |
| 04 | `04-D05-review.png` | Campaigns D05 — edition · Data review (warnings) | `CA0-0` | 1440×900 |
| 05 | `05-D06-preview-approve.png` | Campaigns D06 — edition · Preview & approve | `CJA-0` | 1440×1152 |
| 06 | `06-D07-generate.png` | Campaigns D07 — edition · Generate (partial failure) | `CVB-0` | 1440×900 |
| 07 | `07-D08-export-handoff.png` | Campaigns D08 — edition · Export & handoff (ready) | `D7Z-0` | 1440×900 |
| 08 | `08-D09-campaign-detail-new-period.png` | Campaigns D09 — campaign detail · New period | `DHL-0` | 1440×900 |
| 09 | `09-D10-delete-edition-data.png` | Campaigns D10 — delete edition data (typed confirmation) | `DLG-0` | 1440×900 |

**Nine files, ten spec IDs.** D02 (Setup) and D03 (the summary panel with the
live synthetic example) were drawn as one board because the panel is not a
screen — it is the right-hand third of Setup, and drawing it apart would have
invited it to be built apart. The file is numbered `02` and named for both.

Prefixes are **click-through position, not spec ID** — that is why `03` is D04.
Sorting by filename gives the walk; the board column gives the spec.

## What these are and are not

These are the **desktop** boards at 1440. They are the reference for D01–D10 in
V-2's screenshot comparison. They are not the whole design:

- Responsive variants (D-1) live on Paper as `EM1-0` (D05 · 1024) and `ESI-0`
  (390 · list / review / export / access / landing). Not exported here — the
  click-through is a desktop walk, and mixing widths into one folder makes the
  ordering lie.
- Interaction and variant boards — `EAM-0` (Setup R01), `EE7-0` (Review
  R02/R05), `EHD-0` (Run & export R04/R06), `EJE-0` (Entry & period variants) —
  hold the states these nine do not draw.
- Entry, outputs and marketing are `DQG-0`, `DS1-0`, `DSU-0`, `F31-0`.
- The AI-native additions (AN-01…AN-06) are a later spec and are deliberately
  absent: this folder is R1 as handed off, so a diff against it stays readable.

## Re-exporting

Paper `export`, one call, nodes above, `{format: "png", scale: "1x"}`. Files
land in `~/Downloads` named after the board; rename to the table above. Do not
re-export at 2x — these are read at 100% beside a browser at the same width, and
doubling the pixels only doubles the diff noise.
