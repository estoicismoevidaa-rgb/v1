# Security Specification - Fruit Memory Game

## Data Invariants
- A `Room` must always have an `ownerId` matching the creator's UID.
- The `status` must progress from `waiting` -> `playing` -> `finished`.
- The `cards` array size must match the `difficulty` (16, 24, 36, or 48).
- `currentPlayerIndex` must be a valid index in the `players` array.
- Only the `ownerId` can modify the `status` from `waiting` to `playing`.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a room with an `ownerId` that doesn't match the current user.
2. **State Shortcutting**: Attempt to set `status` to `playing` without being the owner.
3. **Invalid Data (ID Poisoning)**: Attempt to use a room ID that is 1MB long.
4. **Invalid Data (Nicknames)**: Attempt to add a player with a nickname longer than 20 characters.
5. **Turn Stealing**: Attempt to update the `cards` array or `currentPlayerIndex` when it's not the user's turn.
6. **Card Cheating**: Attempt to mark cards as `isMatched` without actually finding a pair.
7. **Score Padding**: Attempt to increment own score without finding a match.
8. **Illegal Difficulty Change**: Attempt to change difficulty after the game has started.
9. **Player Ejection**: Attempt to remove another player from the room if you are not the owner.
10. **Game Reset Foul**: Attempt to reset the game state if you are not the owner.
11. **Huge Cards Array**: Attempt to inject 10,000 cards into the `cards` field.
12. **Premature Finish**: Attempt to set room status to `finished` when matching cards still remain.

## Test Runner (Draft)
A `firestore.rules.test.ts` would verify these scenarios return `PERMISSION_DENIED`.
