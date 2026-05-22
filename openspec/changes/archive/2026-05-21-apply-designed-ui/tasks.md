## 1. Color Palette & Constants

- [x] 1.1 Add `COLORS` constant object at the top of `src/MazoApp.tsx` with all palette values (parchment, dark brown, terra cotta, dark teal, cream, avatar colors)
- [x] 1.2 Replace all hardcoded color strings in existing styles with `COLORS` references

## 2. Connect Screen — Layout

- [x] 2.1 Replace connect screen background with parchment `COLORS.parchment`
- [x] 2.2 Add card fan hero: three overlapping styled `View` components with suit symbols, positioned with `position: 'absolute'` at the top of the screen
- [x] 2.3 Add decorative title "Mazo de Cartas" using `fontFamily: 'serif'`, large font size, dark brown color
- [x] 2.4 Wrap URL, player name, and room code inputs in cream panels with icon + label rows above each `TextInput`
- [x] 2.5 Replace action buttons with two full-width styled buttons: "Crear mesa" (terra cotta) and "Unirse" (teal)

## 3. Game Screen — Header & Badge

- [x] 3.1 Add game screen header row: hamburger menu icon | room code title (serif) | 👥 player count badge
- [x] 3.2 Add dark teal pill badge below header showing "🃏 Mazo restante: N cartas"

## 4. Game Screen — Players Section

- [x] 4.1 Add "Jugadores" section label
- [x] 4.2 Replace `PlayerBadge` with new player card component: name, colored avatar circle with initial, 5 face-down mini card backs
- [x] 4.3 Add crown (👑) indicator next to host player's avatar

## 5. Game Screen — Mesa Panel

- [x] 5.1 Add "Mesa" section label
- [x] 5.2 Create dark green felt-textured panel (`backgroundColor: COLORS.felt`) with gold border
- [x] 5.3 Render face-up cards on the mesa panel and a face-down deck pile on the right

## 6. Game Screen — Discard & Hand Panels

- [x] 6.1 Add "Descarte" cream panel with section label and top discard card display
- [x] 6.2 Add "Mi mano" cream panel with section label
- [x] 6.3 Render hand cards face-up with name labels below each (e.g., "7 de espada")
- [x] 6.4 Add empty card slot placeholder when hand is empty

## 7. Game Screen — Action Buttons

- [x] 7.1 Add first action button row (4 buttons, dark teal): Robar | Mezclar | Reset | Repartir each with an icon
- [x] 7.2 Add second action button row (2 full-width buttons): "Bajar" (dark teal) | "Descartar" (terra cotta)

## 8. Cleanup & Validation

- [x] 8.1 Remove unused style declarations from `StyleSheet.create`
- [x] 8.2 Verify all existing state handlers (`handleConnect`, `handleDraw`, etc.) are still wired to the new button components
- [ ] 8.3 Run `npx expo start --clear` and confirm both screens render without errors on device
