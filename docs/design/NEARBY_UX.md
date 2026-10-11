# Nearby UX refinement

## One action and useful alternatives — 2026-10-11

Home now says **Lähimmät pisteet** and discloses use of location in its subtitle.
Its press sets a short-lived, consume-once in-memory search intent, then navigates.
The focused screen starts acquisition only for that explicit recent action. An
ordinary direct URL/deep link has no intent and keeps a manual search action;
back/remount/background return must not silently acquire a new fix. OS permission
still applies on first use. No persisted intent, route flag or location tracking.

Display up to five actual directory records within 100 km, sorted by straight-line
distance with stable ID ties. Cards show reported identity/operator, source address
or map destination, distance, explicit material reception/exclusions or missing-data
text. Material information is not hidden behind technical details. Never favor
named/material-rich records while calling them the closest or fabricate grouping
of nearby bins. Map is primary for the first record; refresh is quiet below the list.
Source, original fetch date and shared non-verification/caution precede the cards.
Accuracy/source IDs/full caveats and optional OS address lookup remain expandable;
that lookup still needs its own action and recipient disclosure.

The school-project Privacy page now provides factual transfers/retention/deletion
and sorting-source limitations, not a draft contract or legal-review banner. This
honors Roope's explicit request, without claiming approved production documents.
No school/demo badge, private design import, new package, motion or push.

The existing single theme provider now uses a synchronous external snapshot with
subscription/recheck instead of RN Web's initial-state/effect-only scheme hook.
Browser QA reproduced a missed scheme change during page loading; this repairs
that timing gap without delaying or reloading the user's task.

Current validation/reproduction/limits: `docs/final/NEARBY_POINTS_EVIDENCE.md`.
The existing browser runner below now also covers one-press Home versus direct URL,
five independently distance-ranked records, known/missing/excluded materials and
denied/cancelled/timed-out acquisition. Physical native acceptance remains separate.

## Original refinement — 2026-10-08

Scope: independent KierratysAppi baseline. No KeepItGreen experiment import or push.
The redesign-existing-projects and emil-design-eng workflows informed this focused
hierarchy/state refinement; preserve the existing font, colors and controls.

| Before | After | Why |
| --- | --- | --- |
| Long purpose paragraph precedes every result | Concise purpose before search; full explanation available below | Reduce repeat reading without hiding the privacy purpose |
| Refresh competes with the destination | Map is primary inside the result; refresh is quiet below | Make the next useful action obvious |
| Source identifier/accuracy interrupt finding the place | Expandable, labelled technical details | Keep evidence available without crowding the destination |
| Ambiguous unnamed heading and repeated type | Generic point heading; reported type for named points and in details | Do not invent identity or duplicate labels |
| Opaque spinner during address lookup | Explicit loading message, disabled action and recipient disclosure | Make waiting and the optional transfer understandable |
| Independent theme subscriptions update inconsistently | One root reactive theme provider | Keep text/surfaces synchronized on a live theme change |
| Native expanded state not exposed on web | Native state plus explicit ARIA | Announce disclosure state on both platforms |

Essential community uncertainty, accepted-material/access/hour caution, licence,
source and data date remain visible. Address estimates retain platform source and
non-verification labels. No automatic geocoding or new animations. All controls
retain minimum 44-point targets, flexible wrapping and normal press feedback.

## Browser reproduction

Start the existing team-baseline Metro on port 8093. Use installed QA tools rather
than adding application dependencies:

```sh
PLAYWRIGHT_MODULE_PATH=/absolute/path/to/playwright \
BROWSER_EXECUTABLE_PATH=/absolute/path/to/chrome \
node scripts/qa/nearby-ux-browser.cjs
```

Optional `NEARBY_QA_URL` selects another local Metro origin. Runner picks a real
unnamed public directory point for a synthetic GPS fix; this is not user GPS or
physical-device accuracy evidence. It saves local ignored screenshots under
`work/nearby-ux-qa/`.

Pass: FI/EN, first-viewport map action at 390×844, disclosure state/unknown detail,
offline local re-search, live dark switch with computed-background assertion,
approximate-location warning and reduced-motion preference. Screenshots inspected
in light/dark and with a 130% browser text-size simulation; no horizontal overflow.
Browser text scaling is not native Dynamic Type. Source-level tests preserve
optional geocoding consent/loading and native/web accessibility attributes.

Not run: native address result, native external map handoff, true VoiceOver,
physical large text or geographic/on-site accuracy. Keep these separate from the
passing browser evidence. Existing production NO-GO gates remain unchanged.
