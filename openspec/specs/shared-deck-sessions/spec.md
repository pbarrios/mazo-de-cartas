## ADDED Requirements

### Requirement: Players can create and join temporary shared deck sessions
The system SHALL allow a user to create a temporary online room, become its host, and allow other players to join the same room using a room code and a temporary display name.

#### Scenario: Host creates a room
- **WHEN** a user creates a new room
- **THEN** the system creates a temporary shared session, assigns that user as host, and returns a room code that can be shared with other players

#### Scenario: Player joins an existing room
- **WHEN** a user provides a valid room code and a temporary display name
- **THEN** the system adds that user to the room and shows the updated player list to all connected participants

### Requirement: The session uses a shared Spanish deck with authoritative card state
The system SHALL create and manage one Spanish deck per session and SHALL track each card as a unique entity whose location belongs to exactly one zone at a time.

#### Scenario: Session starts with a Spanish deck
- **WHEN** the host starts a new session
- **THEN** the system creates a standard Spanish deck for that room and places all cards in the deck zone

#### Scenario: Card moves between zones
- **WHEN** a valid session action changes a card location
- **THEN** the system updates the authoritative room state so that the card belongs to exactly one of `deck`, `hand:<player>`, `table`, or `discard`

### Requirement: The system enforces zone-based card visibility
The system SHALL present each player only the card information allowed by the authoritative zone of each card.

#### Scenario: Player sees their own hand
- **WHEN** a card belongs to `hand:<player>`
- **THEN** the owning player sees the full card identity and other players only see the count of cards in that hand

#### Scenario: Players see shared zones
- **WHEN** cards belong to the `table` or `discard` zone
- **THEN** all players see those cards according to the shared room state

#### Scenario: Players do not see deck contents
- **WHEN** cards belong to the `deck` zone
- **THEN** players see the remaining deck count but do not see the identities of the unrevealed cards

### Requirement: The host can perform session setup actions
The system SHALL allow the host to manage room-level setup actions needed to prepare and restart a shared deck session.

#### Scenario: Host shuffles the deck
- **WHEN** the host triggers a shuffle action
- **THEN** the system randomizes the order of the cards still in the deck zone and updates all players with the new remaining count

#### Scenario: Host deals cards to players
- **WHEN** the host triggers a deal action with a valid number of cards
- **THEN** the system moves cards from the deck zone into player hand zones and updates each player according to the visibility rules

#### Scenario: Host resets the session
- **WHEN** the host triggers a reset action
- **THEN** the system returns all session cards to a fresh shared deck state for the same room

### Requirement: Players can perform core hand and table actions
The system SHALL allow players to interact with the shared session using a small set of card actions without encoding game-specific rules.

#### Scenario: Player draws a card
- **WHEN** a player triggers a valid draw action
- **THEN** the system moves one card from the deck zone to that player's hand and reveals it only to that player

#### Scenario: Player plays a card to the table
- **WHEN** a player chooses one of their hand cards and plays it
- **THEN** the system moves that card from the player's hand zone to the table zone and makes it visible to all players

#### Scenario: Player discards a card
- **WHEN** a player chooses one of their hand cards and discards it
- **THEN** the system moves that card from the player's hand zone to the discard zone and updates all players with the new shared state

### Requirement: Session updates are synchronized across connected players
The system SHALL propagate room state changes to connected players so each player sees an up-to-date view of the same shared session.

#### Scenario: Player list changes
- **WHEN** a player joins or leaves an active room
- **THEN** the system updates the visible room roster for all connected participants

#### Scenario: Card action updates all views
- **WHEN** any valid shuffle, deal, draw, play, discard, or reset action completes
- **THEN** the system sends updated session state to all connected players with each view filtered according to the visibility rules
