import crypto from "node:crypto";
import type { ClientAction, JoinRoomResponse, ServerEnvelope } from "@shared/session";
import {
  addPlayer,
  buildSessionView,
  createRoom,
  dealCards,
  discardCard,
  drawCard,
  playCard,
  resetRoom,
  shuffleDeck,
  type Player,
  type RoomState,
} from "./domain";

function randomId(length: number) {
  return crypto.randomBytes(length).toString("hex");
}

function createRoomCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export class RoomService {
  private readonly rooms = new Map<string, RoomState>();

  private readonly roomSockets = new Map<string, Set<{ playerId: string; send: (payload: ServerEnvelope) => void }>>();

  createRoom(playerName: string): JoinRoomResponse {
    const roomCode = createRoomCode();
    const playerId = randomId(8);
    const playerToken = randomId(16);
    const room = createRoom(roomCode, playerName.trim(), playerId, playerToken);
    this.rooms.set(roomCode, room);

    return {
      roomCode,
      playerId,
      playerToken,
      session: buildSessionView(room, playerId),
    };
  }

  joinRoom(roomCode: string, playerName: string): JoinRoomResponse {
    const room = this.getRoom(roomCode);
    const playerId = randomId(8);
    const playerToken = randomId(16);
    const player: Player = {
      id: playerId,
      token: playerToken,
      name: playerName.trim(),
      isHost: false,
      connected: true,
    };

    addPlayer(room, player);
    this.broadcast(room.roomCode);

    return {
      roomCode: room.roomCode,
      playerId,
      playerToken,
      session: buildSessionView(room, playerId),
    };
  }

  getSession(roomCode: string, playerId: string, token: string) {
    const room = this.getRoom(roomCode);
    this.getPlayer(room, playerId, token);
    return buildSessionView(room, playerId);
  }

  connect(roomCode: string, playerId: string, token: string, send: (payload: ServerEnvelope) => void) {
    const room = this.getRoom(roomCode);
    const player = this.getPlayer(room, playerId, token);
    player.connected = true;

    const sockets = this.roomSockets.get(room.roomCode) ?? new Set();
    sockets.add({ playerId, send });
    this.roomSockets.set(room.roomCode, sockets);

    send({ type: "session", session: buildSessionView(room, playerId) });
    this.broadcast(room.roomCode);

    return () => {
      player.connected = false;
      const current = this.roomSockets.get(room.roomCode);
      if (current) {
        for (const entry of current) {
          if (entry.playerId === playerId && entry.send === send) {
            current.delete(entry);
          }
        }
      }
      this.broadcast(room.roomCode);
    };
  }

  handleAction(roomCode: string, playerId: string, token: string, action: ClientAction) {
    const room = this.getRoom(roomCode);
    const player = this.getPlayer(room, playerId, token);

    switch (action.type) {
      case "shuffle":
        this.assertHost(player);
        shuffleDeck(room);
        break;
      case "deal":
        this.assertHost(player);
        dealCards(room, Math.max(1, Math.min(action.count ?? 1, 12)));
        break;
      case "reset":
        this.assertHost(player);
        resetRoom(room);
        break;
      case "draw":
        drawCard(room, player.id);
        break;
      case "play-card":
        if (!action.cardId) {
          throw new Error("Falta la carta a jugar.");
        }
        playCard(room, player.id, action.cardId);
        break;
      case "discard-card":
        if (!action.cardId) {
          throw new Error("Falta la carta a descartar.");
        }
        discardCard(room, player.id, action.cardId);
        break;
      default:
        throw new Error("Accion no soportada.");
    }

    this.broadcast(room.roomCode);
    return buildSessionView(room, player.id);
  }

  private broadcast(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return;
    }
    const sockets = this.roomSockets.get(roomCode);
    if (!sockets) {
      return;
    }

    for (const entry of sockets) {
      entry.send({
        type: "session",
        session: buildSessionView(room, entry.playerId),
      });
    }
  }

  private getRoom(roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      throw new Error("Sala no encontrada.");
    }
    return room;
  }

  private getPlayer(room: RoomState, playerId: string, token: string) {
    const player = room.players.find((entry) => entry.id === playerId && entry.token === token);
    if (!player) {
      throw new Error("Jugador no autorizado.");
    }
    return player;
  }

  private assertHost(player: Player) {
    if (!player.isHost) {
      throw new Error("Solo el host puede ejecutar esta accion.");
    }
  }
}
