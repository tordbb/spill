# City /v2 visual verification workflow

Use this skill for responsive layout, map-camera, orientation, coordinate-system, modal, or touch changes in `/v2` city.

This supplements `skills/ui-delivery-browser-regression.md`. The key rule is: do not call a responsive city change finished from source inspection or geometry assertions alone. Render the generated artifact and inspect it visually at the user's viewport.

## 1. Start from the generated artifact

The published app is assembled by `.github/workflows/pages.yml` from the compressed stable source, patches, and overlays. Always test the generated `dist/v2/index.html`, not a hand-written approximation.

The PR workflow should upload the generated `dist` directory as a short-lived `v2-preview` artifact before browser tests. This makes the exact CI-built HTML available for visual inspection even when a browser regression fails.

## 2. Reproduce the user's physical viewport

Use Chromium at the reported CSS viewport dimensions and orientation. For phone bugs, test at least:

- the reported portrait size;
- a short landscape size;
- any browser-chrome-reduced height that appeared in a screenshot.

Use `visualViewport` dimensions where the app does so. Do not substitute physical device pixels for CSS viewport pixels.

## 3. Inspect screenshots, not only transforms

Capture screenshots of the actual rendered city and inspect them before merging. For layout changes capture at minimum:

- initial city view;
- Settings open;
- Stats open;
- any dynamic overlay affected by the change, such as a selected bus route or building interior.

Confirm that text, icons, buildings, weekday labels, and controls point in the intended physical direction. A correct CSS matrix is not sufficient evidence.

## 4. Treat coordinate systems as separate layers

The city can involve several coordinate spaces simultaneously:

- logical row/column indices;
- unscaled grid pixels (`citTs`);
- portrait-remapped tile coordinates;
- camera translation/scale;
- SVG `viewBox` coordinates;
- physical browser coordinates from pointer events.

When an overlay is misplaced, trace every conversion instead of adding visual offsets. Bus polylines, hit testing, drag previews, vehicles, and building double-tap must all agree on the same mapping.

For SVG overlays, compare the SVG `viewBox` to the actual untransformed grid dimensions and compare transformed route endpoints to the physical centers of their matching stops.

## 5. Verify camera and board bounds

At full-board scale, the grid and viewport should have the same physical bounds. There must be no exposed viewport padding masquerading as extra grass outside the real board.

At the default zoom, verify the requested board edge is anchored correctly and that the transformed grid still covers the complete camera viewport.

Test legacy saved board sizes when size rules change. Migration must resize the saved logical state, not merely hide a Settings button.

## 6. Verify data-backed UI independently

For Stats, create controlled runtime states with known counts and verify the displayed totals/free capacity. Do not assume simulation connectivity rules are identical to physical inventory counts such as number of houses built.

## 7. Exercise real interactions

Use Playwright or equivalent to verify, at minimum when relevant:

- physical tile painting;
- building double-tap;
- bus line selection/path rendering;
- horizontal/vertical tool scrolling;
- Settings and Stats containment;
- Home navigation;
- zoom/pan behavior and full-board zoom-out.

Do not weaken a failing assertion until the generated DOM/runtime state proves the assertion was testing the wrong outcome.

## 8. Merge only after two visual passes

Before merge:

1. CI build succeeds.
2. Browser regressions succeed.
3. Download the PR `v2-preview` artifact.
4. Render it in Chromium at the target portrait and landscape viewports.
5. Inspect screenshots and affected interactions visually.

After merge:

1. Wait for the GitHub Pages deployment to succeed.
2. Download the exact Pages artifact for the merge commit.
3. Render `/v2` from that artifact again.
4. Repeat the key portrait/landscape screenshots and interactions.

Only then report the change as deployed and visually verified.
