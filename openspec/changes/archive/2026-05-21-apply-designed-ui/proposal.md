## Why

The app's current UI is functional but lacks the polished visual identity shown in the design mockups: a warm parchment aesthetic, Spanish playing card illustrations, rich color palette, and clearly structured game layout. Applying the designed UI will make the app feel cohesive and ready for real use.

## What Changes

- Replace the connect/join screen with a redesigned layout: parchment background, card fan hero, decorative title, labeled icon inputs, and two full-width CTA buttons ("Crear mesa" / "Unirse")
- Replace the game screen with a structured layout: header with room code and player count, remaining deck badge, player row with avatar initials and card backs, felt-textured mesa panel, discard panel, hand panel, and two rows of action buttons
- Introduce a consistent color palette: parchment `#e8d9c0`, dark brown `#2c1a0e`, terra cotta `#c1502a`, dark teal `#2e6b5e`, cream `#f5ead3`
- Add styled avatar circles with player initials and color coding
- Add crown indicator for host player
- Style card representations as rounded panels with suit/value labels

## Capabilities

### New Capabilities

_None — this is a pure visual redesign. No new functional capabilities are introduced._

### Modified Capabilities

_None — no spec-level behavior or requirements are changing._

## Impact

- `src/MazoApp.tsx`: Primary file for all UI changes (connect screen, game screen, styles)
- `App.tsx`: Minor background color alignment if needed
- No new dependencies required (using React Native built-in components and StyleSheet)
- No backend, API, or network changes
