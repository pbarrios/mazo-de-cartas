import http from "node:http";
import { URL } from "node:url";
import { WebSocketServer } from "ws";
import type { ClientAction, ServerEnvelope } from "@shared/session";
import { RoomService } from "./room-service";

const roomService = new RoomService();
const port = Number(process.env.PORT ?? 4000);

function json(response: http.ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request: http.IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = http.createServer(async (request, response) => {
  if (!request.url || !request.method) {
    json(response, 404, { error: "Not found" });
    return;
  }

  if (request.method === "OPTIONS") {
    json(response, 204, {});
    return;
  }

  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      json(response, 200, { ok: true });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/rooms") {
      const body = await readJson(request);
      const result = roomService.createRoom(String(body.playerName ?? "").trim() || "Host");
      json(response, 201, result);
      return;
    }

    const joinMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]+)\/join$/i);
    if (request.method === "POST" && joinMatch) {
      const body = await readJson(request);
      const result = roomService.joinRoom(joinMatch[1], String(body.playerName ?? "").trim() || "Jugador");
      json(response, 200, result);
      return;
    }

    const actionMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]+)\/actions$/i);
    if (request.method === "POST" && actionMatch) {
      const body = (await readJson(request)) as ClientAction & { playerId?: string; playerToken?: string };
      const session = roomService.handleAction(
        actionMatch[1],
        String(body.playerId ?? ""),
        String(body.playerToken ?? ""),
        body,
      );
      json(response, 200, { session });
      return;
    }

    json(response, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    json(response, 400, { error: message });
  }
});

const socketServer = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  try {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    const roomCode = url.searchParams.get("roomCode");
    const playerId = url.searchParams.get("playerId");
    const token = url.searchParams.get("token");

    if (!roomCode || !playerId || !token) {
      socket.destroy();
      return;
    }

    socketServer.handleUpgrade(request, socket, head, (websocket) => {
      const send = (payload: ServerEnvelope) => {
        websocket.send(JSON.stringify(payload));
      };

      const disconnect = roomService.connect(roomCode, playerId, token, send);
      websocket.on("close", disconnect);
    });
  } catch {
    socket.destroy();
  }
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mazo backend listening on http://localhost:${port}`);
});
