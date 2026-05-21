import type { ClientAction, JoinRoomResponse, ServerEnvelope, SessionView } from "@shared/session";

export async function createRoom(serverUrl: string, playerName: string) {
  return post<JoinRoomResponse>(`${serverUrl}/api/rooms`, { playerName });
}

export async function joinRoom(serverUrl: string, roomCode: string, playerName: string) {
  return post<JoinRoomResponse>(`${serverUrl}/api/rooms/${roomCode.toUpperCase()}/join`, { playerName });
}

export async function sendAction(
  serverUrl: string,
  roomCode: string,
  playerId: string,
  playerToken: string,
  action: ClientAction,
) {
  const result = await post<{ session: SessionView }>(`${serverUrl}/api/rooms/${roomCode}/actions`, {
    ...action,
    playerId,
    playerToken,
  });
  return result.session;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "No se pudo completar la accion.");
  }
  return data as T;
}

export function createSessionSocket(
  serverUrl: string,
  auth: { roomCode: string; playerId: string; playerToken: string },
  onMessage: (payload: ServerEnvelope) => void,
) {
  const wsUrl = serverUrl.replace(/^http/, "ws");
  const socket = new WebSocket(
    `${wsUrl}/ws?roomCode=${auth.roomCode}&playerId=${auth.playerId}&token=${auth.playerToken}`,
  );

  socket.onmessage = (event) => {
    const payload = JSON.parse(event.data) as ServerEnvelope;
    onMessage(payload);
  };

  return socket;
}
