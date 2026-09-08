# Agent instructions

For changes to the experimental `/new/` UI or game interactions, read and follow `skills/ui-delivery-browser-regression.md` before editing or merging.

For responsive layout, map-camera, orientation, coordinate-system, modal, or touch changes in the main city or its `/v2` mirror, also read and follow `skills/city-v2-visual-verification.md`. The generated PR preview and final Pages artifact must be visually inspected in Chromium at the relevant phone viewports before the change is reported as finished.

The browser-regression method is mandatory for responsive UI work. In particular:

- keep experimental changes scoped to their intended path unless the user explicitly requests stable-root changes;
- test the generated artifact, not only source fragments;
- reproduce the relevant phone/tablet viewport and orientation;
- test real interactions such as clicking, scrolling, opening menus, and returning home;
- include regression checks for nearby screens that could be affected by broad selectors or shared functions;
- do not merge a failing PR;
- remove temporary diagnostics before the final verification run;
- for the main city and `/v2`, perform both a pre-merge visual pass on the CI preview artifact and a post-deploy visual pass on the Pages artifact.
