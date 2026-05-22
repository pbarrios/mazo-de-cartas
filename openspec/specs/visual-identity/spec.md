### Requirement: Connect screen uses parchment design language
The connect screen SHALL display the parchment color palette, a card fan hero, a decorative title, and labeled icon inputs for URL, player name, and room code, with two full-width CTA buttons.

#### Scenario: Connect screen renders parchment background
- **WHEN** the app loads the connect screen
- **THEN** the background color is parchment `#e8d9c0` and all panels use cream `#f5ead3`

#### Scenario: CTA buttons are visually distinct
- **WHEN** the connect screen is displayed
- **THEN** "Crear mesa" button is terra cotta `#c1502a` and "Unirse" button is teal `#2e7d71`

### Requirement: Game screen uses structured layout with named sections
The game screen SHALL display sections for: header (room code + player count), remaining deck badge, player row, mesa panel, discard panel, hand panel, and two rows of action buttons.

#### Scenario: Game screen shows all sections
- **WHEN** the app transitions to the game screen
- **THEN** all six sections (header, players, mesa, discard, hand, actions) are visible

#### Scenario: Player avatars show initials with color-coded circles
- **WHEN** the players list is rendered
- **THEN** each player displays a colored circle with their name initial inside

#### Scenario: Host player is marked with crown indicator
- **WHEN** the host player's card is rendered
- **THEN** a crown (👑) icon appears adjacent to the host's avatar
