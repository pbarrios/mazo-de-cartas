import type { CardDefinition, SessionView, Suit, VisibleCard } from "@shared/session";

export interface Player {
  id: string;
  token: string;
  name: string;
  isHost: boolean;
  connected: boolean;
}

export interface CardState extends CardDefinition {
  zone: "deck" | "table" | "discard" | "hand";
  ownerPlayerId?: string;
}

export interface RoomState {
  roomCode: string;
  players: Player[];
  cards: Record<string, CardState>;
  deck: string[];
  table: string[];
  discard: string[];
  hands: Record<string, string[]>;
}

const SUITS: Suit[] = ["oro", "copa", "espada", "basto"];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

function rankLabel(rank: number) {
  if (rank === 10) {
    return "Sota";
  }

  if (rank === 11) {
    return "Caballo";
  }

  if (rank === 12) {
    return "Rey";
  }

  return String(rank);
}

function createCardId(suit: Suit, rank: number) {
  return `${rank}-${suit}`;
}

function createCardLabel(suit: Suit, rank: number) {
  return `${rankLabel(rank)} de ${suit}`;
}

export function createSpanishDeck() {
  const cards: Record<string, CardState> = {};
  const deck: string[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const id = createCardId(suit, rank);
      cards[id] = {
        id,
        suit,
        rank,
        label: createCardLabel(suit, rank),
        zone: "deck",
      };
      deck.push(id);
    }
  }

  return { cards, deck };
}

export function createRoom(roomCode: string, hostName: string, hostId: string, hostToken: string): RoomState {
  const host: Player = {
    id: hostId,
    token: hostToken,
    name: hostName,
    isHost: true,
    connected: true,
  };

  const deckState = createSpanishDeck();

  return {
    roomCode,
    players: [host],
    cards: deckState.cards,
    deck: deckState.deck,
    table: [],
    discard: [],
    hands: {
      [hostId]: [],
    },
  };
}

export function resetRoom(room: RoomState) {
  const deckState = createSpanishDeck();
  room.cards = deckState.cards;
  room.deck = deckState.deck;
  room.table = [];
  room.discard = [];
  room.hands = Object.fromEntries(room.players.map((player) => [player.id, []]));
}

export function addPlayer(room: RoomState, player: Player) {
  room.players.push(player);
  room.hands[player.id] = [];
}

export function shuffleDeck(room: RoomState, random = Math.random) {
  const next = [...room.deck];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  room.deck = next;
}

function moveCardToHand(room: RoomState, cardId: string, playerId: string) {
  const card = room.cards[cardId];
  card.zone = "hand";
  card.ownerPlayerId = playerId;
  room.hands[playerId].push(cardId);
}

function moveCardToSharedZone(room: RoomState, cardId: string, zone: "table" | "discard") {
  const card = room.cards[cardId];
  card.zone = zone;
  delete card.ownerPlayerId;
  room[zone].push(cardId);
}

function removeCardFromHand(room: RoomState, playerId: string, cardId: string) {
  room.hands[playerId] = room.hands[playerId].filter((current) => current !== cardId);
}

export function dealCards(room: RoomState, count: number) {
  const activePlayers = room.players;
  for (let round = 0; round < count; round += 1) {
    for (const player of activePlayers) {
      const cardId = room.deck.shift();
      if (!cardId) {
        return;
      }
      moveCardToHand(room, cardId, player.id);
    }
  }
}

export function drawCard(room: RoomState, playerId: string) {
  const cardId = room.deck.shift();
  if (!cardId) {
    throw new Error("No hay cartas restantes en el mazo.");
  }
  moveCardToHand(room, cardId, playerId);
}

export function playCard(room: RoomState, playerId: string, cardId: string) {
  const hand = room.hands[playerId] ?? [];
  if (!hand.includes(cardId)) {
    throw new Error("La carta no pertenece a la mano del jugador.");
  }
  removeCardFromHand(room, playerId, cardId);
  moveCardToSharedZone(room, cardId, "table");
}

export function discardCard(room: RoomState, playerId: string, cardId: string) {
  const hand = room.hands[playerId] ?? [];
  if (!hand.includes(cardId)) {
    throw new Error("La carta no pertenece a la mano del jugador.");
  }
  removeCardFromHand(room, playerId, cardId);
  moveCardToSharedZone(room, cardId, "discard");
}

function toVisibleCard(card: CardState): VisibleCard {
  return {
    id: card.id,
    suit: card.suit,
    rank: card.rank,
    label: card.label,
    zone: card.zone,
    ownerPlayerId: card.ownerPlayerId,
  };
}

export function buildSessionView(room: RoomState, playerId: string): SessionView {
  const player = room.players.find((entry) => entry.id === playerId);
  if (!player) {
    throw new Error("Jugador desconocido.");
  }

  return {
    roomCode: room.roomCode,
    currentPlayerId: playerId,
    players: room.players.map((entry) => ({
      id: entry.id,
      name: entry.name,
      isHost: entry.isHost,
      connected: entry.connected,
      handCount: room.hands[entry.id]?.length ?? 0,
    })),
    deckCount: room.deck.length,
    tableCards: room.table.map((cardId) => toVisibleCard(room.cards[cardId])),
    discardCards: room.discard.map((cardId) => toVisibleCard(room.cards[cardId])),
    handCards: (room.hands[playerId] ?? []).map((cardId) => toVisibleCard(room.cards[cardId])),
    canManageTable: player.isHost,
  };
}
