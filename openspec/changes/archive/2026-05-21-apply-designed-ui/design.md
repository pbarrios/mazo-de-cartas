## Context

The app is a React Native / Expo SDK 54 single-file UI (`src/MazoApp.tsx`, ~387 lines). It has two screens: a connect screen (enter URL, name, room code) and a game screen (deck control, player hands, table). The current UI uses flat styling — no illustrations, no visual hierarchy, and a minimal color palette. The design mockups (`docs/images/`) define a warm parchment aesthetic with structured sections, avatar cards, a felt-textured table panel, and two rows of action buttons.

## Goals / Non-Goals

**Goals:**
- Implement the parchment color palette and cream panel system
- Redesign the connect screen with card fan hero, decorative title, and icon+label inputs
- Redesign the game screen with: header, deck badge, player row, mesa panel, discard panel, hand panel, and action button rows
- Keep all existing state management and WebSocket logic untouched

**Non-Goals:**
- Loading real card illustrations or images (use placeholder shapes)
- Adding custom fonts (use system serif/default fonts)
- Changing any functional behavior or network protocol
- Animating card transitions

## Decisions

**Single-file approach**: Keep all UI in `src/MazoApp.tsx`. The file is already self-contained; splitting into multiple component files would add complexity without benefit for this redesign scope.
- Alternative: Split into `ConnectScreen.tsx`, `GameScreen.tsx`, `components/`. Rejected — unnecessary for a single-change visual overhaul.

**No image assets for card illustrations**: Use styled `View` + `Text` elements to represent cards (suit symbol + value label). The mockup card fan hero will be simulated with overlapping styled `View` components.
- Alternative: Add PNG card images. Rejected — adds asset management complexity and SDK 54 asset pipeline issues are already a concern.

**No custom fonts**: Use `fontFamily: 'serif'` (system font) for display text. This avoids `expo-font` loading complexity and async font loading state.
- Alternative: Load a Google Font via `@expo-google-fonts`. Rejected — adds a dependency and async loading logic outside the change scope.

**Inline StyleSheet**: Keep all styles in the `StyleSheet.create` block at the bottom of the file. This is consistent with the existing pattern and keeps the component readable.

**Color constants object**: Define `COLORS` at the top of the file to centralize the palette and avoid magic strings.

## Risks / Trade-offs

- [Risk] The card fan hero layout uses absolute positioning — may render differently on small screens → Mitigation: Use percentage-based offsets and test on a small device (360dp width)
- [Risk] `fontFamily: 'serif'` renders differently on Android vs iOS → Mitigation: Acceptable for now; no custom font loading in scope
- [Risk] Existing state/logic is interleaved with JSX in `MazoApp.tsx` — large edits risk breaking it → Mitigation: Preserve all state declarations and handlers; only replace JSX return blocks and styles
