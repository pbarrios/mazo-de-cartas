export type Suit = "oro" | "copa" | "espada" | "basto";

export type ZoneKind = "deck" | "table" | "discard" | "hand";

export interface CardDefinition {
  id: string;
  suit: Suit;
  rank: number;
  label: string;
}

export interface PlayerSummary {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  handCount: number;
}

export interface VisibleCard extends CardDefinition {
  zone: ZoneKind;
  ownerPlayerId?: string;
}

export interface SessionView {
  roomCode: string;
  currentPlayerId: string;
  players: PlayerSummary[];
  deckCount: number;
  tableCards: VisibleCard[];
  discardCards: VisibleCard[];
  handCards: VisibleCard[];
  canManageTable: boolean;
}

export interface JoinRoomResponse {
  roomCode: string;
  playerId: string;
  playerToken: string;
  session: SessionView;
}

export type ClientActionType =
  | "shuffle"
  | "deal"
  | "reset"
  | "draw"
  | "play-card"
  | "discard-card";

export interface ClientAction {
  type: ClientActionType;
  count?: number;
  cardId?: string;
}

export interface SessionEnvelope {
  type: "session";
  session: SessionView;
}

export interface ErrorEnvelope {
  type: "error";
  message: string;
}

export type ServerEnvelope = SessionEnvelope | ErrorEnvelope;
