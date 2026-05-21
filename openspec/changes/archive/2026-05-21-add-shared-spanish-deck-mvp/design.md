## Context

The first product slice for Mazo de Cartas is an Android-first app that friends can install locally and use to share a virtual Spanish deck in real time. The product must feel like a replacement for a physical deck, not a full implementation of a specific card game. The MVP intentionally favors debuggability and iteration speed over offline or proximity-based networking, so the first version will use online rooms and a server-authoritative shared state.

The main technical constraint is partial card visibility: each player must see only their own hand while all players share the same room state, deck counts, and table state. This requires modeling the deck as a single source of truth rather than a collection of client-side views.

## Goals / Non-Goals

**Goals:**
- Support temporary online rooms with a host and multiple joined players.
- Model a single Spanish deck whose cards move between deck, player hands, table, and discard.
- Enforce visibility rules so only the owning player can see cards in their hand.
- Support a small set of host and player actions that make traditional card games playable without encoding their rules.
- Keep the first implementation simple enough to run on Android devices and emulators before Play Store publication work begins.

**Non-Goals:**
- Enforcing the rules or scoring of Truco, Escoba, Casita Robada, or any other game.
- Supporting offline, proximity, Bluetooth, or peer-to-peer networking.
- Supporting multiple deck types, account systems, friends lists, or persistent player identity.
- Preventing every form of cheating beyond normal server-side validation for room actions.

## Decisions

### Server-authoritative room state
The system will keep one authoritative room state on the backend. Clients will send actions such as join, shuffle, deal, draw, and play-card, and the backend will validate and apply them in order.

Rationale:
- Prevents conflicting client-side interpretations of deck order and card ownership.
- Simplifies debugging because every card transition is derived from one state machine.
- Keeps the product extensible if future versions add offline sync alternatives or game-specific rule layers.

Alternatives considered:
- Host-authoritative clients were rejected for the MVP because they complicate reconnect behavior and make debugging less predictable.
- Peer-to-peer synchronization was rejected because hidden card visibility and conflict resolution would add disproportionate complexity.

### Explicit card zones with visibility derived from zone
Each card will belong to exactly one zone at a time: `deck`, `hand:<player>`, `table`, or `discard`. Visibility will be derived from the zone and card presentation rules rather than from ad hoc per-screen logic.

Rationale:
- Matches the real-world mental model of a shared physical deck.
- Makes it easier to validate legal transitions and reconstruct client views.
- Reduces ambiguity when players reconnect or when actions arrive close together.

Alternatives considered:
- A looser "freeform card state" model was rejected because it increases branching and makes view filtering harder to reason about.

### Temporary sessions without user accounts
Players will create or join a room using a code and choose a temporary display name. The room is the unit of identity for the MVP.

Rationale:
- Reduces friction for groups who want to start playing quickly.
- Avoids account, recovery, and profile complexity before the core interaction is validated.

Alternatives considered:
- Persistent user accounts were rejected as unnecessary for validating the core product.

### Host-controlled session management with shared gameplay actions
The host will control room lifecycle and shared setup actions such as creating the deck, shuffling, dealing, and resetting the table. Regular players will control their own hand-level actions such as viewing their cards, drawing when enabled, and playing cards to the table or discard.

Rationale:
- Keeps the interaction model predictable and prevents session chaos in the MVP.
- Preserves enough flexibility for different traditional games without encoding their rules.

Alternatives considered:
- Fully symmetric permissions were rejected because they increase accidental conflicts and require more moderation controls.

### Online-only MVP with installable Android builds
The MVP will target Android execution through locally installable builds and emulators, but not require Play Store distribution readiness yet.

Rationale:
- Lets the team validate the gameplay loop before distribution, compliance, or store polish.
- Keeps the product exploration focused on usability and core state transitions.

Alternatives considered:
- Delaying until Play Store readiness was rejected because it adds non-product work too early.

## Risks / Trade-offs

- [Room state becomes complex as more actions are added] → Keep the MVP action set small and model transitions explicitly per zone.
- [Players may expect game rule enforcement] → Position the MVP clearly as a shared deck and table, not a full game implementation.
- [Server-authoritative flow adds backend dependency] → Accept this for the MVP to maximize consistency and observability.
- [Temporary identity may make reconnection awkward] → Scope reconnect behavior narrowly for the first version and improve it later if the core product validates.
- [Host privileges may feel restrictive in some games] → Keep host controls to setup and reset flows while leaving core play actions to players.
