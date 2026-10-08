# Nearby UX refinement — 2026-10-08

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
