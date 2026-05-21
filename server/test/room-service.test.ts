import test from "node:test";
import assert from "node:assert/strict";
import { RoomService } from "../src/room-service";

test("room creation assigns host and a fresh Spanish deck", () => {
  const service = new RoomService();
  const created = service.createRoom("Host");

  assert.equal(created.session.roomCode.length, 6);
  assert.equal(created.session.players.length, 1);
  assert.equal(created.session.players[0]?.isHost, true);
  assert.equal(created.session.deckCount, 40);
});

test("joining a room adds a second visible player", () => {
  const service = new RoomService();
  const host = service.createRoom("Host");
  const guest = service.joinRoom(host.roomCode, "Guest");

  assert.equal(guest.session.players.length, 2);
  assert.equal(guest.session.players[1]?.name, "Guest");
});

test("dealing and playing cards preserve private and shared visibility", () => {
  const service = new RoomService();
  const host = service.createRoom("Host");
  const guest = service.joinRoom(host.roomCode, "Guest");

  service.handleAction(host.roomCode, host.playerId, host.playerToken, { type: "deal", count: 2 });
  const hostView = service.handleAction(host.roomCode, host.playerId, host.playerToken, { type: "draw" });
  const guestViewBeforePlay = service.getSession(guest.roomCode, guest.playerId, guest.playerToken);

  assert.equal(hostView.handCards.length, 3);
  assert.equal(hostView.players[1]?.handCount, 2);

  const guestView = service.handleAction(guest.roomCode, guest.playerId, guest.playerToken, {
    type: "play-card",
    cardId: guestViewBeforePlay.handCards[0]?.id ?? "",
  });

  assert.equal(guestView.tableCards.length, 1);
  assert.equal(guestView.handCards.length, 1);
});
