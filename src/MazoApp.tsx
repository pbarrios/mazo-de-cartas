import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { JoinRoomResponse, SessionView, VisibleCard } from "@shared/session";
import { createRoom, createSessionSocket, joinRoom, sendAction } from "./api";

type ConnectionState = {
  serverUrl: string;
  playerName: string;
  roomCode: string;
};

const DEFAULT_SERVER_URL = "http://10.0.2.2:4000";

function CardPill({ card, accent }: { card: VisibleCard; accent: string }) {
  return (
    <View style={[styles.cardPill, { borderColor: accent }]}>
      <Text style={styles.cardLabel}>{card.label}</Text>
    </View>
  );
}

function PlayerBadge({ name, handCount, isHost, connected }: SessionView["players"][number]) {
  return (
    <View style={styles.playerBadge}>
      <Text style={styles.playerName}>
        {name}
        {isHost ? " · host" : ""}
      </Text>
      <Text style={styles.playerMeta}>
        {handCount} cartas · {connected ? "online" : "desconectado"}
      </Text>
    </View>
  );
}

export function MazoApp() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [playerName, setPlayerName] = useState("Pablo");
  const [roomCode, setRoomCode] = useState("");
  const [auth, setAuth] = useState<JoinRoomResponse | null>(null);
  const [session, setSession] = useState<SessionView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dealCount, setDealCount] = useState("3");

  useEffect(() => {
    if (!auth) {
      return;
    }

    const socket = createSessionSocket(serverUrl, auth, (payload) => {
      if (payload.type === "error") {
        setError(payload.message);
        return;
      }
      setSession(payload.session);
    });

    socket.onerror = () => setError("Se perdio la conexion en tiempo real.");
    return () => socket.close();
  }, [auth, serverUrl]);

  const connectionState: ConnectionState = useMemo(
    () => ({
      serverUrl: serverUrl.trim().replace(/\/$/, ""),
      playerName: playerName.trim() || "Jugador",
      roomCode: roomCode.trim().toUpperCase(),
    }),
    [playerName, roomCode, serverUrl],
  );

  async function withLoading<T>(work: () => Promise<T>) {
    setLoading(true);
    setError(null);
    try {
      return await work();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Algo salio mal.");
      throw nextError;
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom() {
    const result = await withLoading(() => createRoom(connectionState.serverUrl, connectionState.playerName));
    setAuth(result);
    setSession(result.session);
    setRoomCode(result.roomCode);
  }

  async function handleJoinRoom() {
    const result = await withLoading(() =>
      joinRoom(connectionState.serverUrl, connectionState.roomCode, connectionState.playerName),
    );
    setAuth(result);
    setSession(result.session);
  }

  async function handleAction(action: Parameters<typeof sendAction>[4]) {
    if (!auth) {
      return;
    }

    const nextSession = await withLoading(() =>
      sendAction(connectionState.serverUrl, auth.roomCode, auth.playerId, auth.playerToken, action),
    );
    setSession(nextSession);
  }

  if (!session || !auth) {
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.hero}>Mazo de Cartas</Text>
        <Text style={styles.subtitle}>
          Baraja española compartida en tiempo real para arrancar una mesa rápido entre amigos.
        </Text>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Conexion</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setServerUrl}
            style={styles.input}
            value={serverUrl}
          />
          <TextInput onChangeText={setPlayerName} style={styles.input} value={playerName} />
          <TextInput
            autoCapitalize="characters"
            onChangeText={setRoomCode}
            placeholder="Codigo de sala"
            style={styles.input}
            value={roomCode}
          />

          <View style={styles.actionsRow}>
            <Pressable disabled={loading} onPress={handleCreateRoom} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Crear mesa</Text>
            </Pressable>
            <Pressable disabled={loading || !roomCode.trim()} onPress={handleJoinRoom} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Unirse</Text>
            </Pressable>
          </View>

          {loading ? <ActivityIndicator color="#8c3b1a" /> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.roomCode}>Sala {session.roomCode}</Text>
      <Text style={styles.subtitle}>Mazo restante: {session.deckCount} cartas</Text>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Jugadores</Text>
        {session.players.map((player) => (
          <PlayerBadge key={player.id} {...player} />
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Mesa</Text>
        <View style={styles.cardRow}>
          {session.tableCards.length > 0 ? (
            session.tableCards.map((card) => <CardPill key={card.id} accent="#8c3b1a" card={card} />)
          ) : (
            <Text style={styles.emptyText}>Todavia no hay cartas sobre la mesa.</Text>
          )}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Descarte</Text>
        <View style={styles.cardRow}>
          {session.discardCards.length > 0 ? (
            session.discardCards.map((card) => <CardPill key={card.id} accent="#5a6d3b" card={card} />)
          ) : (
            <Text style={styles.emptyText}>Sin cartas descartadas.</Text>
          )}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Mi mano</Text>
        <View style={styles.cardRow}>
          {session.handCards.map((card) => (
            <View key={card.id} style={styles.handCard}>
              <CardPill accent="#20405c" card={card} />
              <View style={styles.actionsRow}>
                <Pressable onPress={() => handleAction({ type: "play-card", cardId: card.id })} style={styles.inlineButton}>
                  <Text style={styles.inlineButtonText}>Bajar</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleAction({ type: "discard-card", cardId: card.id })}
                  style={styles.inlineButton}
                >
                  <Text style={styles.inlineButtonText}>Descartar</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {session.handCards.length === 0 ? <Text style={styles.emptyText}>No tenes cartas en la mano.</Text> : null}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        <View style={styles.actionsRow}>
          <Pressable onPress={() => handleAction({ type: "draw" })} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Robar</Text>
          </Pressable>
          {session.canManageTable ? (
            <>
              <Pressable onPress={() => handleAction({ type: "shuffle" })} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Mezclar</Text>
              </Pressable>
              <Pressable onPress={() => handleAction({ type: "reset" })} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        {session.canManageTable ? (
          <View style={styles.actionsRow}>
            <TextInput keyboardType="number-pad" onChangeText={setDealCount} style={styles.countInput} value={dealCount} />
            <Pressable
              onPress={() => handleAction({ type: "deal", count: Number.parseInt(dealCount, 10) || 1 })}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Repartir</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? <ActivityIndicator color="#8c3b1a" /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    gap: 18,
    backgroundColor: "#efe3c7",
  },
  hero: {
    fontSize: 38,
    fontWeight: "800",
    color: "#8c3b1a",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#4f463f",
    lineHeight: 22,
  },
  roomCode: {
    fontSize: 30,
    fontWeight: "800",
    color: "#20405c",
    marginTop: 16,
  },
  panel: {
    backgroundColor: "#fff9ee",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#d9c8a9",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c241f",
  },
  input: {
    borderWidth: 1,
    borderColor: "#b69f7a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fffef9",
  },
  countInput: {
    width: 72,
    borderWidth: 1,
    borderColor: "#b69f7a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fffef9",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#8c3b1a",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#fff7f0",
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#e9dcc2",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  secondaryButtonText: {
    color: "#3c332d",
    fontWeight: "700",
  },
  inlineButton: {
    backgroundColor: "#ede3cf",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  inlineButtonText: {
    color: "#3c332d",
    fontWeight: "700",
  },
  errorText: {
    color: "#a12723",
    fontWeight: "600",
  },
  playerBadge: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f6eddc",
    gap: 4,
  },
  playerName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#2c241f",
  },
  playerMeta: {
    color: "#6c5a4e",
  },
  cardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cardPill: {
    minWidth: 120,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#fffef9",
  },
  cardLabel: {
    fontWeight: "700",
    color: "#2c241f",
  },
  handCard: {
    gap: 8,
  },
  emptyText: {
    color: "#6c5a4e",
  },
});
