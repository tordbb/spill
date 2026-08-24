# Agent instructions

For changes to the experimental `/new/` UI or game interactions, read and follow `skills/ui-delivery-browser-regression.md` before editing or merging.

The browser-regression method in that skill is mandatory for responsive UI work. In particular:

- keep experimental changes scoped to `/new/` unless the user explicitly requests stable-root changes;
- test the generated artifact, not only source fragments;
- reproduce the relevant phone/tablet viewport and orientation;
- test real interactions such as clicking, scrolling, opening menus, and returning home;
- include regression checks for nearby screens that could be affected by broad selectors or shared functions;
- do not merge a failing PR;
- remove temporary diagnostics before the final verification run.
