## 1. Session Foundations

- [x] 1.1 Define the room, player, card, and zone domain models for a shared Spanish deck session
- [x] 1.2 Implement temporary room creation and room-code join flows with host assignment and player display names
- [x] 1.3 Implement server-authoritative session state storage and action validation boundaries

## 2. Shared Deck State and Actions

- [x] 2.1 Implement Spanish deck creation and authoritative card placement in the deck zone
- [x] 2.2 Implement host actions for shuffle, deal, and session reset
- [x] 2.3 Implement player actions for draw, play to table, and discard with valid zone transitions
- [x] 2.4 Implement view filtering so each player sees only their own hand while shared zones remain visible to all

## 3. Real-Time Multiplayer Experience

- [x] 3.1 Implement real-time room synchronization for player roster and session state updates
- [x] 3.2 Build the Android lobby flow for creating, joining, and waiting in a temporary room
- [x] 3.3 Build the Android table view showing deck count, shared table, discard area, other player summaries, and the current player's hand
- [x] 3.4 Wire host and player controls in the Android client to the authoritative room actions

## 4. Validation and MVP Readiness

- [x] 4.1 Add tests for room lifecycle, zone transitions, and card visibility rules
- [ ] 4.2 Validate the end-to-end multiplayer flow on an Android emulator and a locally installable device build
- [x] 4.3 Confirm the MVP scope excludes game-specific rules, alternate deck types, accounts, and offline/proximity mode
