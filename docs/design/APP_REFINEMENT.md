# App refinement — 2026-10-08

## Brief and two-pass design plan

An anonymous Finnish packaging-sorting utility, not a marketing site or a mature service dashboard. Preserve the independent team baseline, its real features and every uncertainty/source disclosure. No private KeepItGreen assets, mock points, environmental metrics, accounts or new dependencies. Do not add demo badges; communicate the actual scope through honest behavior and modest functionality. Legal review markers remain.

First pass: keep the accessible Atkinson family and the pine accent, but replace the repeated brand/eyebrow/card stacks with a consistent back row, normal document sections and focused forms. Display 32/36, page title 26/32, section 19/25, body 17/25, utility 14/20; IBM Plex Mono is for codes, not decorative all-caps headings. Light palette: canvas `#F5F7F2`, paper `#FFFFFF`, ink `#20352D`, secondary `#59665E`, action `#244D3C`, caution `#8D5700`; retain semantic error colors and the existing dark equivalents. Buttons 56 pt, targets at least 44 pt, 10–16 pt corner radii, no shadows, gradients or new motion.

One signature: a real barcode mark beside the primary scan action. Everything else is quiet, left-aligned and practical. Home has a compact wordmark/language switch, one invitation, one scan control and a plain list of secondary actions; detail pages have the same navigation rhythm.

```text
Home                         Detail
wordmark             FI EN   ‹ Back                 app
Sort a package               Page title
one short explanation        short purpose
[ barcode  Scan package › ]  labelled input / result
Enter code manually      ›   primary action
--------------------------   --------------------------
Nearest point            ›   explanation / honest limits
Sorting guide            ›   source, date and provenance
History                  ›
privacy / Finland
```

Second-pass critique: a big green hero with an arrow circle, decorative packaging illustrations, many tinted pills and uppercase technical subtitles would reproduce the current generic pattern. Remove those, rather than adding more decoration. Keep the barcode only where it explains scanning. Use separators for guide/history/legal sections, explicit radio indicators for choices, and an answer-first result with preparation and provenance. Do not hide missing-data explanations, source licensing or rule confidence to make screenshots cleaner.

## Validation scope

Inspect the real Expo web UI before/after at phone widths, Finnish/English, light/dark and synthetic large text. Exercise manual errors/recovery, component choices, material-code confirmation, local history/drafts, legal markers and local nearby search in isolated browser contexts. Browser fixtures are test-only; they are not application data. Run the existing nearby regression and full pinned `pnpm validate`. Browser evidence does not certify camera quality, native font scaling, VoiceOver, geocoding or a production release.

## Follow-up copy pass

The owner identified Home's three-part privacy sentence as unwanted filler.
First pass: read the rendered copy and FI/EN translation maps across Home,
manual, scan, result, material-code, component, guide, nearby, history, feedback
and legal. Keep the existing visual system; shorten repeated labels and
replace internal vocabulary with the user's actual task or next action.

Second-pass critique: privacy and uncertainty are not inherently filler.
Remove the Home/history slogan and duplicate scan/error/loading captions, not
permission purposes, recipient disclosures, legal review or provenance.
Retain material-code limitations rather than imply it identifies a bin.
Explicitly label history's existing clearing effect and unsent feedback.
Versioned sorting content and substantive legal drafts were reviewed but not
rewritten in this copy-only pass. Tests protect those boundaries.
