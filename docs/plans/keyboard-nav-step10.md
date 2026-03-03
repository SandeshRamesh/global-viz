# Step 10 Verification — Global Graph Keyboard Navigation

## Scope
- Enabled only when `viewMode === "global"`.
- Applies only to radial SVG graph nodes (`circle.node`).
- Split mode and Local View are intentionally excluded in this phase.

## Implemented Behavior
- Roving tabindex: exactly one graph node has `tabindex="0"`; others use `-1`.
- Arrow navigation: left/up = previous sibling, right/down = next sibling (same parent, angle-ordered).
- Enter/Space: expand/collapse for expandable nodes; live-region message for leaf nodes.
- Escape: focus parent node; root remains focused when no parent exists.
- Focus recovery: if focused node is hidden/removed, fallback prefers parent, then root, then first visible node.
- Existing global hotkeys remain active outside node focus; handled graph keys stop propagation when node-focused.

## Verification Matrix
- [ ] Tab into Global graph lands on exactly one node.
- [ ] Arrow keys traverse siblings and wrap.
- [ ] Enter/Space toggles expandable nodes.
- [ ] Escape returns focus to parent.
- [ ] Focus persists across expand/collapse without dead-ends.
- [ ] Switching away from Global mode disables graph roving tabindex.
- [ ] Mouse click/double-click/hover behavior remains unchanged.

## Automated Checks
- `npm run test:a11y-nav`
- `npm run test:layout`
- `npx tsc --noEmit`
- `npm run build`
