## Why

Groups of friends sometimes want to play traditional card games together but do not have a physical deck available. We need a simple Android-first product direction that validates whether a shared virtual deck with private hands and a common table is useful before investing in game-specific rules, offline proximity mode, or Play Store publishing.

## What Changes

- Introduce temporary online rooms where a host can create a shared card table and other players can join with a room code.
- Introduce a fixed Spanish deck for the MVP, including shuffle, deal, draw, play to table, and discard interactions.
- Introduce private hands per player and shared visibility rules for deck, table, and discard zones.
- Introduce a lightweight host-controlled flow for starting, resetting, and managing a session without user accounts.
- Explicitly defer game-specific rule enforcement, scoring, alternate deck types, and offline/proximity networking.

## Capabilities

### New Capabilities
- `shared-deck-sessions`: Create and manage real-time multiplayer card sessions with a shared Spanish deck, private player hands, and common play zones.

### Modified Capabilities

None.

## Impact

- Defines the first end-to-end product slice for the Android app and backend session model.
- Requires a real-time session state model with card visibility and host/player actions.
- Requires room join flows, player presence, and shared deck interactions, but not account management or game rules.
