# UI delivery with browser regression checks

Use this method for responsive game/UI changes, especially the generated experimental build under `/new/`.

## 1. Define scope and invariants before editing

Write down what may change and what must not change. Prefer the smallest owning layer rather than adding unrelated global overrides.

For `/new/` work, assume these invariants unless the request says otherwise:

- the stable root must not receive experimental overlays;
- unrelated games must keep their navigation and behavior;
- map size must not shrink unless the requested feature truly requires it;
- fixed controls must remain visible while only the intended content scrolls;
- shared selectors/functions must be scoped to the owning game.

## 2. Inspect the generated build path

The deployed page is assembled from compressed source, patches, and overlays. Read the workflow and the active overlay chain before editing. A source-only inspection is not enough.

Build `dist/new/index.html` exactly as the workflow does and verify overlay order and isolation.

## 3. Reproduce the user's actual viewport

Use browser tests at the dimensions/orientation shown by the user's device or screenshot. Add at least one contrasting orientation when layout is responsive.

For transformed/rotated layouts, inspect physical `getBoundingClientRect()` geometry; CSS logical axes may not match the user's physical swipe direction.

## 4. Test behavior, not markers

Static greps are useful only for build/isolation checks. They do not prove the UI works.

Use Playwright (or equivalent) to exercise the generated page:

- open every potentially affected screen;
- click exit/home controls and verify the destination;
- open settings and verify important actions are visible and clickable;
- switch every relevant category and verify stable icons/controls;
- perform real scroll/touch gestures and click an item that was initially out of view;
- verify fixed controls do not move while scrollable content moves;
- verify important visual geometry such as map dimensions;
- verify dynamic states such as thought bubbles before, during, and after updates.

When mobile touch behavior matters, use a touch-capable browser context and real touch events rather than only assigning `scrollTop` or calling `scrollIntoView()`.

## 5. Diagnose failures before changing assertions

A failing browser test is evidence. Inspect the generated DOM, computed styles, bounding boxes, and runtime state.

Do not weaken a test merely to make it green. Change an assertion only when it was demonstrably testing the wrong semantic outcome.

## 6. Protect against cross-game leakage

Avoid document-wide searches for controls when a game-local root exists. Query within the owning screen/container.

Regression tests should include unrelated games when a selector, CSS class, or global function is shared. This catches failures such as a city script accidentally hiding another game's exit button.

## 7. Keep layout responsibilities separate

For compact control panels:

- keep navigation, category selectors, undo/remove controls, and other fixed controls outside the scrolling element;
- give the scrollable category-content region an explicit viewport size;
- allow the physical gesture direction required by transformed layouts;
- preserve the control panel's short-axis footprint so the map does not shrink.

## 8. Merge discipline

Work on a branch and PR for non-trivial UI changes.

Before merging:

1. run syntax/build checks;
2. run the browser regression suite on the final PR head;
3. remove temporary diagnostic scripts/tests;
4. rerun the suite after cleanup;
5. verify experimental overlays do not leak into the stable root;
6. merge only when the final head is green.

If the final cleanup changes the PR head, the previous green run no longer counts.
