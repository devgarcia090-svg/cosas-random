---
name: Leonidas Sport Center
description: A Spanish boxing-night poster (cartel de velada) printed in black and red ink on yellow stock.
colors:
  papel: "#f3c21c"
  papel-osc: "#e2ae0c"
  tinta: "#16110e"
  rojo: "#c8161d"
  rojo-osc: "#9e0f15"
  rojo-texto: "#a30e15"
  crema: "#fff4d4"
typography:
  display:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "49.4cqi"
    fontWeight: 900
    lineHeight: 0.84
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(3rem, 10vw, 6.5rem)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(1.6rem, 4vw, 2.2rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.04em"
  numeral:
    fontFamily: "Alfa Slab One, Rockwell, serif"
    fontSize: "clamp(1.05rem, 2.6vw, 1.3rem)"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tnum"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  body-lead:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.55
  body-small:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.3
  label:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.14em"
rounded:
  none: "0px"
spacing:
  gutter: "clamp(16px, 4vw, 48px)"
  section: "clamp(56px, 9vw, 104px)"
  container: "1240px"
  cell-y: "14px"
  cell-x: "18px"
  gap: "12px"
components:
  ticket:
    backgroundColor: "{colors.rojo}"
    textColor: "{colors.crema}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  ticket-hover:
    backgroundColor: "{colors.rojo-osc}"
    textColor: "{colors.crema}"
  ticket-fixed:
    backgroundColor: "{colors.rojo}"
    textColor: "{colors.crema}"
    rounded: "{rounded.none}"
    height: "54px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
  programme-header:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
    typography: "{typography.title}"
    padding: "12px 18px 10px"
  tag-adultos:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    padding: "6px 8px 5px"
  tag-ninos:
    backgroundColor: "{colors.rojo}"
    textColor: "{colors.crema}"
    typography: "{typography.label}"
    padding: "6px 8px 5px"
  tag-todos:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
    typography: "{typography.label}"
    padding: "6px 8px 5px"
  top-band:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.crema}"
    height: "60px"
---

# Design System: Leonidas Sport Center

## Overview

**Creative North Star: "The Fight Bill"**

The whole site is one printed cartel de velada, read top to bottom like a bill: who presents, the main event, the undercard, the venue, the box office. The ground is saturated yellow poster stock and everything on it is ink: black and red, letterpress-flat, with no gradients, no glass and no glow. Full-width colour bands (black, red) cut the sheet the way a printer splits a poster into tiers, and heavy condensed woodtype fills the width edge to edge.

Density is poster density: very large type, few words per line, rules and borders doing the structural work that cards and shadows do elsewhere. Photography appears only as a one-ink halftone printed on a full-bleed red band that runs under the sheet. Ornament is limited to five-point stars and double printed rules, both drawn as vector ink. The world deliberately rejects the dark-gym template: a black ground with a red accent, gritty texture, and a hero photo under a dark overlay.

**Key Characteristics:**
- Yellow paper field (`papel`) as the dominant surface; black and red as the only inks.
- Condensed woodtype (Big Shoulders Display, 900) set uppercase, one discipline per line, each line fitted to the column width.
- Slab numerals (Alfa Slab One) for times, years, age ranges and the bill's dateline.
- Square corners everywhere; structure comes from 2-6px ink rules and solid colour bands.
- One-ink halftone photography; no colour photos.
- A single animated moment: the red "HOY" stamp landing on today's programme.

## Colors

Two inks on one paper stock, plus a cream that plays the role of unprinted paper on the dark and red bands.

### Primary
- **Bill Red** (`rojo`): the ticket ink. Fills every booking action (ticket box, header ticket, fixed mobile ticket), the kids' tags, the "HOY" stamp, star ornaments and the full-width red band of the kids' school. Not used for running text on yellow; it fails body contrast there (3.5:1).
- **Pressed Red** (`rojo-osc`): hover and pressed state for Bill Red surfaces only.
- **Red Text Ink** (`rojo-texto`): the red used for words printed on yellow (alternating headline lines, the emphasised word in section titles, the separator dots of the hero dateline, the town name). Darker than Bill Red so it holds 4.8:1 on `papel`.

### Neutral
- **Poster Yellow** (`papel`): the page ground and the gold of the system. On black it becomes the highlight ink: the LEONIDAS wordmark, programme headers, the "Desde 2011" slab block, emphasised words in the club band. The stylesheet also exposes it as `--oro`; same value, one token.
- **Folded Yellow** (`papel-osc`): a half-step darker stock for sub-bands inside a programme ("Mañana", "Tarde") and the map's backing.
- **Woodtype Black** (`tinta`): text on yellow, every printed rule and border, the top band, the club band, the footer, programme headers.
- **Paper Cream** (`crema`): text and rules on red and on black. Never used as a surface on the yellow sheet.

### Named Rules
**The Two Inks Rule.** Everything printed is either black or red. A third hue (blue links, green success, grey UI) breaks the poster. Yellow is the paper, cream is the paper showing through; neither is an ink on the yellow sheet.

**The Red Has Two Weights Rule.** Fill red (`rojo`) is for surfaces, stamps and ornaments; text red (`rojo-texto`) is for words on yellow. Do not swap them.

## Typography

**Display Font:** Big Shoulders Display (with Arial Narrow, sans-serif)
**Numeral Font:** Alfa Slab One (with Rockwell, serif)
**Body Font:** Archivo (with system-ui, sans-serif)

**Character:** Condensed wood-type caps shout the bill; a fat slab prints the numbers the way a fight poster prints dates and weights; a plain grotesque carries the sentences parents actually read. All three are self-hosted woff2 files under `assets/fonts/`.

### Hierarchy
- **Display** (900, `49.4cqi` on the first line, 0.84, -0.01em): the stacked discipline bill of the hero only. The hero column is an inline-size container and each line is sized in `cqi` so it fills the column exactly, never wrapping (`49.4 / 31.3 / 26.2 / 18.5cqi` for BOXEO / JIU-JITSU / KICKBOXING / FULL CONTACT K1), alternating black and red text ink. A new line is fitted by measuring its own cqi value, not by reusing a clamp.
- **Headline** (900, `clamp(3rem, 10vw, 6.5rem)`, 0.86): section titles ("Cartelera semanal", "Escuela infantil", "Taquilla"), with the second word in red text ink. The club band uses a smaller sentence-length headline (900, `clamp(2.4rem, 6vw, 4rem)`, 0.9).
- **Title** (900, `clamp(1.6rem, 4vw, 2.2rem)`, 1, +0.04em): programme headers and kids' group names. Class names in the timetable sit just below (800, `clamp(1.35rem, 3.4vw, 1.75rem)`).
- **Numeral** (Alfa Slab One 400, tabular): class times, age ranges, the "Desde 2011" block in the club band (`clamp(3.4rem, 9vw, 6.5rem)`, 0.9, yellow on black) and the hero's dateline footer (`clamp(1rem, 2vw, 1.2rem)`, 1.3: place · days · year, red text-ink dots between unbreakable phrases).
- **Body** (Archivo 400, 1.0625rem, 1.55): explanatory sentences, capped at 52-58ch.
- **Body lead** (Archivo 400, 1.1rem): section intros, the club paragraphs and data-list values.
- **Body small** (Archivo, 1rem, 1.2): the ticket's subline (set at 600) and the kids' group schedules.
- **Label** (800, 0.82-1.15rem, +0.1em to +0.22em, uppercase): tags, sub-band labels, nav links, ribbon text, data-list terms, footer.

### Named Rules
**The Woodtype Caps Rule.** Every heading, label, button and nav item is Big Shoulders Display in uppercase. Archivo never appears in caps and never carries a heading.

**The Numbers Are Slab Rule.** Times, years, ages and the bill's dateline are set in Alfa Slab One. Slab never carries a heading or a paragraph.

## Layout

A single centred sheet (`container` 1240px max) with a fluid side `gutter` of 16-48px. Sections stack vertically with `section` padding (56-104px) and are separated by colour, not whitespace alone: yellow sheet, then a full-bleed red band (kids), a full-bleed black band (club), back to yellow (box office), black footer.

The hero is a two-column bill, bottom-aligned: the fitted woodtype stack (1.7fr) and a side column (1fr) holding, in order, the audience list, the ticket and the slab dateline, 22px apart. It collapses to one column at 900px. Below the sheet, at every breakpoint, the halftone photo runs as a full-bleed red band edge to edge (`clamp(380px, 42vw, 560px)` tall; 4:4.4 aspect below 900px), with its caption strip aligned to the sheet's container. Content grids are two columns (timetable programmes, kids' copy and group list, address and map) that collapse at 760-860px. Rows inside lists use `cell-y` / `cell-x` padding (14px / 18px) and are divided by full-width ink rules rather than gaps.

The top band is sticky (60px). Below 900px the nav links hide and the header ticket is replaced by a fixed red ticket pinned 12px from the bottom edge, which slides in only after the hero ticket has scrolled out of view.

Breakpoints observed: 380px (wordmark subtitle hides), 760px (timetable and club collapse), 860px (kids and box-office grids collapse), 900px (hero collapses, nav hides, fixed ticket appears).

## Elevation & Depth

Flat. This is printed paper: depth comes from colour bands and ink weight, never from shadow. Surfaces sit on one plane; a darker yellow stock (`papel-osc`) is the only tonal step. A very light fractal-noise paper grain (multiply, 22% opacity) sits over the whole page to read as stock rather than screen.

### Shadow Vocabulary
- **Double rule** (`box-shadow: 0 -7px 0 -4px tinta, 0 7px 0 -4px tinta`): not a shadow; it draws the second thin rule above and below the ribbon band to make a printed double rule.
- **Lifted ticket** (`box-shadow: 0 10px 28px rgba(22,17,14,.45)`): the one true shadow, reserved for the fixed mobile ticket because it floats over content.

### Named Rules
**The Printed Plane Rule.** Nothing on the sheet casts a shadow. Overprinted ink (the HOY stamp, the map) uses `mix-blend-mode: multiply` so it sits in the paper, not on it. The only lifted object is the fixed mobile ticket, because it is literally above the page.

## Shapes

Every corner is square (`rounded.none`). Form is made of rules: 2px between rows, 3px around programme cards, data lists and buttons, 6px across the top of the timetable section. Tickets are the one composite shape: a solid red block with a 2px dashed cream perforation inset inside a solid red outline, so the dashed line reads as a tear-off edge. The "HOY" stamp is the one rotated object (-9deg). Star ornaments are a single five-point SVG symbol at 0.8em, always in an ink colour.

## Components

### Buttons
- **Ticket (primary):** the booking action and the most important object on the page. Bill Red block, cream text, square, 16px 20px padding, 2px dashed cream perforation inside a 5px red outline. Woodtype title (900, `clamp(1.7rem, 3vw, 2.3rem)`), one Archivo line beneath it (600, 1rem/1.3), a 44px WhatsApp glyph on the right. Max 520px wide.
- **Hover / Active:** background and outline go to Pressed Red (0.15s); active nudges down 1px.
- **Header ticket:** the same perforated recipe at 1.05rem label size inside the top band; hidden below 900px.
- **Fixed ticket:** the same recipe at 54px tall across the bottom of the phone screen, with the one real shadow; enters with a 0.35s slide on the ink-impact curve.
- **Outline button (secondary):** 48px tall, 3px black border, transparent fill, woodtype label. Hover inverts to black fill with yellow text. Used for "Cómo llegar" and "Instagram".

### Chips
- **Tags:** square woodtype labels with a 2px border. Adults: black outline on yellow. Kids: red fill, cream text. Everyone: black fill, yellow text. They mark the audience of each class row and nothing else.

### Cards / Containers
- **Programme card:** 3px black frame, square, no fill. Black header strip with yellow title, optional Folded Yellow sub-bands ("Mañana" / "Tarde"), then class rows (slab time, woodtype class name, tag) separated by 2px rules. The Friday card spans both columns.
- **Audience list:** the hero side column's stacked list (Adultos / Niños por edades / Todos los niveles): woodtype 800 caps at `clamp(1.2rem, 2.4vw, 1.6rem)`, each row led by a red star and closed by a 3px black rule, with a 3px rule on top.
- **Data list:** term / value rows (120px term column) between 3px rules, used for phone, prices and trial class.

### Navigation
- **Top band:** sticky 60px black band. Wordmark "LEONIDAS" in yellow woodtype 900 plus a tracked "Sport Center" label. Nav links are tracked woodtype labels in cream at 80% opacity, going to full yellow on hover. Below 900px the links hide.

### Ribbon (cinta)
A full-width band of tracked woodtype caps between a printed double rule, with red stars at each end or between phrases. It opens the sheet as the billing line: "Leonidas Sport Center presenta".

### HOY Stamp
A red woodtype "HOY" (900, 2.4rem, +0.12em) inside a single 5px Bill Red border, with no fill: the stamp is transparent and set to `mix-blend-mode: multiply` so it overprints the card like real ink. Rotated -9deg and hanging off the top-right corner of today's programme card. It lands once when the timetable enters view: scale 2.4 to 1 with a 6px blur clearing, 0.42s on `cubic-bezier(.16, 1, .3, 1)`. With reduced motion it is simply present.

### Halftone Photo Band
A full-bleed red band directly under the hero sheet, at every breakpoint, carrying a one-ink halftone of the instructor (`object-fit: cover`, `object-position: 60% 9%`, 72% 22% below 900px). A black caption strip runs along its bottom edge with its text aligned to the sheet container (tracked woodtype label left, the motto in yellow right).

### Pending-data Marker
Missing club facts (ages, prices, phone, instructor) are shown, not hidden: a 2px dashed border in the current ink around the placeholder text, with `box-decoration-break: clone` so every wrapped line gets its own closed box. It is a content state, to be removed as the real facts arrive.

## Do's and Don'ts

### Do:
- **Do** keep yellow `papel` as the dominant field and print only in `tinta` and red.
- **Do** use `rojo-texto` for red words on yellow and `rojo` for red fills, stamps and stars.
- **Do** set headings, labels and buttons in uppercase Big Shoulders Display, and numbers in Alfa Slab One.
- **Do** separate content with full-width ink rules (2px, 3px, 6px) and full-bleed colour bands.
- **Do** make every booking action the perforated red ticket: red fill, dashed cream inset, red outline, square corners.
- **Do** render photography as a single-ink halftone on a colour band.
- **Do** keep motion to one ink-impact moment per page, honouring `prefers-reduced-motion`.
- **Do** mark missing facts with the dashed pending-data outline instead of inventing them.

### Don't:
- **Don't** use a black page ground with a red accent, gritty texture, or a hero photo under a dark overlay; that is the dark-gym template this world rejects.
- **Don't** round corners or add soft shadows to anything that sits on the sheet.
- **Don't** introduce a third ink colour or colour photography.
- **Don't** set body text in Bill Red on yellow (3.5:1).
- **Don't** set headings in Archivo or in sentence case.
