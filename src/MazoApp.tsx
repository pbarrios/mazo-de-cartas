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

const COLORS = {
  parchment: "#e8d9c0",
  darkBrown: "#2c1a0e",
  terraCotta: "#c1502a",
  teal: "#2e7d71",
  darkTeal: "#2e6b5e",
  felt: "#1e4d3a",
  feltBorder: "#c9a84c",
  cream: "#f5ead3",
  muted: "#6c5a4e",
  error: "#a12723",
  white: "#fffef9",
};

const AVATAR_COLORS = ["#3a7d44", "#2a7d8e", "#c1502a", "#6b7d2a", "#7d4e2a", "#5c2a7d"];

type ConnectionState = {
  serverUrl: string;
  playerName: string;
  roomCode: string;
};

const DEFAULT_SERVER_URL = "http://10.0.2.2:4000";

function getSuitSymbol(label: string): string {
  if (label.includes("espada")) return "🗡️";
  if (label.includes("copa")) return "🏆";
  if (label.includes("oro")) return "⭕";
  if (label.includes("basto")) return "🪵";
  return "🃏";
}

function MiniCardBack() {
  return <View style={styles.miniCardBack} />;
}

function CardView({
  card,
  accent,
  onPress,
  selected,
}: {
  card: VisibleCard;
  accent?: string;
  onPress?: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.cardView, selected && styles.cardViewSelected, accent ? { borderColor: accent } : null]}
    >
      <Text style={styles.cardSuit}>{getSuitSymbol(card.label)}</Text>
      <Text style={styles.cardLabel}>{card.label}</Text>
    </Pressable>
  );
}

function PlayerCard({
  name,
  handCount,
  isHost,
  connected,
  avatarColor,
}: SessionView["players"][number] & { avatarColor: string }) {
  return (
    <View style={styles.playerCard}>
      <View style={styles.playerAvatarRow}>
        {isHost ? <Text style={styles.crownIcon}>👑</Text> : null}
        <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.playerCardName}>
        {name}
      </Text>
      <View style={styles.miniCardRow}>
        {Array.from({ length: Math.min(handCount, 5) }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative list
          <MiniCardBack key={i} />
        ))}
      </View>
      {!connected ? <Text style={styles.offlineDot}>●</Text> : null}
    </View>
  );
}

function DeckPile({ count }: { count: number }) {
  return (
    <View style={styles.deckPile}>
      <Text style={styles.deckPileCount}>{count}</Text>
      <Text style={styles.deckPileLabel}>cartas</Text>
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
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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

  // ─── Connect screen ───────────────────────────────────────────────────────
  if (!session || !auth) {
    return (
      <ScrollView contentContainerStyle={styles.connectScreen}>
        {/* Card fan hero */}
        <View style={styles.cardFanContainer}>
          <View style={[styles.fanCard, styles.fanCardLeft]}>
            <Text style={styles.fanCardSuit}>⭕</Text>
            <Text style={styles.fanCardValue}>7</Text>
          </View>
          <View style={[styles.fanCard, styles.fanCardCenter]}>
            <Text style={styles.fanCardSuit}>🗡️</Text>
            <Text style={styles.fanCardValue}>1</Text>
          </View>
          <View style={[styles.fanCard, styles.fanCardRight]}>
            <Text style={styles.fanCardSuit}>🏆</Text>
            <Text style={styles.fanCardValue}>12</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Mazo de Cartas</Text>
        <Text style={styles.heroSubtitle}>Baraja española compartida en tiempo real</Text>

        <View style={styles.inputPanel}>
          <Text style={styles.inputLabel}>🌐  Conexión</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setServerUrl}
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={serverUrl}
          />
        </View>

        <View style={styles.inputPanel}>
          <Text style={styles.inputLabel}>👤  Jugador</Text>
          <TextInput
            onChangeText={setPlayerName}
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={playerName}
          />
        </View>

        <View style={styles.inputPanel}>
          <Text style={styles.inputLabel}>#  Código de sala</Text>
          <TextInput
            autoCapitalize="characters"
            onChangeText={setRoomCode}
            placeholder="Ej: A7C9F2"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={roomCode}
          />
        </View>

        {loading ? <ActivityIndicator color={COLORS.terraCotta} style={styles.loader} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable disabled={loading} onPress={handleCreateRoom} style={styles.ctaButtonPrimary}>
          <Text style={styles.ctaButtonText}>👥  Crear mesa</Text>
        </Pressable>
        <Pressable
          disabled={loading || !roomCode.trim()}
          onPress={handleJoinRoom}
          style={[styles.ctaButtonSecondary, (loading || !roomCode.trim()) && styles.buttonDisabled]}
        >
          <Text style={styles.ctaButtonText}>→  Unirse</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ─── Game screen ──────────────────────────────────────────────────────────
  const selectedCard = session.handCards.find((c) => c.id === selectedCardId) ?? null;

  return (
    <ScrollView contentContainerStyle={styles.gameScreen}>
      {/* Header */}
      <View style={styles.gameHeader}>
        <Text style={styles.hamburger}>☰</Text>
        <Text style={styles.roomCodeTitle}>Sala {session.roomCode}</Text>
        <View style={styles.playerCountBadge}>
          <Text style={styles.playerCountText}>👥 {session.players.length}</Text>
        </View>
      </View>

      {/* Deck badge */}
      <View style={styles.deckBadge}>
        <Text style={styles.deckBadgeText}>🃏 Mazo restante: {session.deckCount} cartas</Text>
      </View>

      {/* Players */}
      <Text style={styles.sectionLabel}>Jugadores</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersScrollView}>
        <View style={styles.playersRow}>
          {session.players.map((player, index) => (
            <PlayerCard
              key={player.id}
              {...player}
              avatarColor={AVATAR_COLORS[index % AVATAR_COLORS.length]}
            />
          ))}
        </View>
      </ScrollView>

      {/* Mesa */}
      <Text style={styles.sectionLabel}>Mesa</Text>
      <View style={styles.mesaPanel}>
        <View style={styles.mesaCards}>
          {session.tableCards.length > 0 ? (
            session.tableCards.map((card) => <CardView key={card.id} card={card} accent={COLORS.feltBorder} />)
          ) : (
            <Text style={styles.emptyTextLight}>Mesa vacía</Text>
          )}
        </View>
        <DeckPile count={session.deckCount} />
      </View>

      {/* Descarte */}
      <Text style={styles.sectionLabel}>↕ Descarte</Text>
      <View style={styles.creamPanel}>
        {session.discardCards.length > 0 ? (
          <CardView
            card={session.discardCards[session.discardCards.length - 1]}
            accent={COLORS.darkTeal}
          />
        ) : (
          <Text style={styles.emptyText}>Sin cartas descartadas.</Text>
        )}
      </View>

      {/* Mi mano */}
      <Text style={styles.sectionLabel}>Mi mano</Text>
      <View style={styles.creamPanel}>
        {session.handCards.length > 0 ? (
          <View style={styles.handCardRow}>
            {session.handCards.map((card) => (
              <View key={card.id} style={styles.handCardItem}>
                <CardView
                  accent={COLORS.teal}
                  card={card}
                  onPress={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                  selected={selectedCardId === card.id}
                />
                <Text numberOfLines={2} style={styles.handCardName}>
                  {card.label}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCardSlot}>
            <Text style={styles.emptyText}>No tenés cartas en la mano.</Text>
          </View>
        )}
      </View>

      {/* Action row 1 */}
      <View style={styles.actionRow1}>
        <Pressable onPress={() => handleAction({ type: "draw" })} style={styles.actionBtn}>
          <Text style={styles.actionBtnIcon}>⬆️</Text>
          <Text style={styles.actionBtnText}>Robar</Text>
        </Pressable>
        {session.canManageTable ? (
          <>
            <Pressable onPress={() => handleAction({ type: "shuffle" })} style={styles.actionBtn}>
              <Text style={styles.actionBtnIcon}>🔀</Text>
              <Text style={styles.actionBtnText}>Mezclar</Text>
            </Pressable>
            <Pressable onPress={() => handleAction({ type: "reset" })} style={styles.actionBtn}>
              <Text style={styles.actionBtnIcon}>↺</Text>
              <Text style={styles.actionBtnText}>Reset</Text>
            </Pressable>
            <View style={styles.dealGroup}>
              <TextInput
                keyboardType="number-pad"
                onChangeText={setDealCount}
                style={styles.dealCountInput}
                value={dealCount}
              />
              <Pressable
                onPress={() => handleAction({ type: "deal", count: Number.parseInt(dealCount, 10) || 1 })}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnIcon}>🃏</Text>
                <Text style={styles.actionBtnText}>Repartir</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>

      {/* Action row 2 */}
      <View style={styles.actionRow2}>
        <Pressable
          disabled={!selectedCard}
          onPress={() => {
            if (selectedCard) {
              handleAction({ type: "play-card", cardId: selectedCard.id });
              setSelectedCardId(null);
            }
          }}
          style={[styles.actionBtnWide, styles.actionBtnBajar, !selectedCard && styles.buttonDisabled]}
        >
          <Text style={styles.actionBtnWideText}>⬇️  Bajar</Text>
        </Pressable>
        <Pressable
          disabled={!selectedCard}
          onPress={() => {
            if (selectedCard) {
              handleAction({ type: "discard-card", cardId: selectedCard.id });
              setSelectedCardId(null);
            }
          }}
          style={[styles.actionBtnWide, styles.actionBtnDescartar, !selectedCard && styles.buttonDisabled]}
        >
          <Text style={styles.actionBtnWideText}>✕  Descartar</Text>
        </Pressable>
      </View>

      {loading ? <ActivityIndicator color={COLORS.terraCotta} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ─── Screens ───────────────────────────────────────────────────────────────
  connectScreen: {
    backgroundColor: COLORS.parchment,
    padding: 24,
    paddingBottom: 48,
    gap: 14,
    alignItems: "stretch",
  },
  gameScreen: {
    backgroundColor: COLORS.parchment,
    padding: 16,
    paddingBottom: 48,
    gap: 12,
  },

  // ─── Card fan hero ─────────────────────────────────────────────────────────
  cardFanContainer: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  fanCard: {
    position: "absolute",
    width: 80,
    height: 120,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.feltBorder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fanCardLeft: {
    transform: [{ rotate: "-20deg" }, { translateX: -55 }],
    zIndex: 1,
  },
  fanCardCenter: {
    zIndex: 3,
  },
  fanCardRight: {
    transform: [{ rotate: "20deg" }, { translateX: 55 }],
    zIndex: 2,
  },
  fanCardSuit: {
    fontSize: 26,
  },
  fanCardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.darkBrown,
  },

  // ─── Connect screen text & inputs ──────────────────────────────────────────
  heroTitle: {
    fontSize: 36,
    fontFamily: "serif",
    fontWeight: "800",
    color: COLORS.darkBrown,
    textAlign: "center",
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 4,
  },
  inputPanel: {
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.darkBrown,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#b69f7a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.darkBrown,
  },
  ctaButtonPrimary: {
    backgroundColor: COLORS.terraCotta,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  ctaButtonSecondary: {
    backgroundColor: COLORS.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  loader: {
    marginTop: 4,
  },

  // ─── Game header ───────────────────────────────────────────────────────────
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 12,
  },
  hamburger: {
    fontSize: 22,
    color: COLORS.darkBrown,
  },
  roomCodeTitle: {
    flex: 1,
    fontSize: 22,
    fontFamily: "serif",
    fontWeight: "700",
    color: COLORS.darkBrown,
  },
  playerCountBadge: {
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  playerCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkBrown,
  },
  deckBadge: {
    backgroundColor: COLORS.darkTeal,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  deckBadgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // ─── Section labels ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 17,
    fontFamily: "serif",
    fontWeight: "700",
    color: COLORS.darkBrown,
    marginTop: 4,
  },

  // ─── Players row ────────────────────────────────────────────────────────────
  playersScrollView: {
    flexGrow: 0,
  },
  playersRow: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 4,
  },
  playerCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    gap: 6,
    minWidth: 80,
  },
  playerAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  crownIcon: {
    fontSize: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  playerCardName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.darkBrown,
    maxWidth: 80,
    textAlign: "center",
  },
  miniCardRow: {
    flexDirection: "row",
    gap: 2,
  },
  miniCardBack: {
    width: 10,
    height: 14,
    borderRadius: 2,
    backgroundColor: COLORS.darkTeal,
    borderWidth: 1,
    borderColor: COLORS.feltBorder,
  },
  offlineDot: {
    fontSize: 8,
    color: COLORS.muted,
  },

  // ─── Mesa panel ─────────────────────────────────────────────────────────────
  mesaPanel: {
    backgroundColor: COLORS.felt,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.feltBorder,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 100,
  },
  mesaCards: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emptyTextLight: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
  },
  deckPile: {
    width: 52,
    height: 74,
    borderRadius: 8,
    backgroundColor: COLORS.darkTeal,
    borderWidth: 2,
    borderColor: COLORS.feltBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  deckPileCount: {
    color: COLORS.feltBorder,
    fontSize: 18,
    fontWeight: "700",
  },
  deckPileLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
  },

  // ─── Cream panels ───────────────────────────────────────────────────────────
  creamPanel: {
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    padding: 14,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  emptyCardSlot: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#b69f7a",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },

  // ─── Card views ─────────────────────────────────────────────────────────────
  cardView: {
    width: 70,
    height: 96,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: "#b69f7a",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 6,
  },
  cardViewSelected: {
    borderWidth: 2.5,
    borderColor: COLORS.teal,
    backgroundColor: "#e8f5f3",
  },
  cardSuit: {
    fontSize: 20,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.darkBrown,
    textAlign: "center",
  },

  // ─── Hand cards ──────────────────────────────────────────────────────────────
  handCardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  handCardItem: {
    alignItems: "center",
    gap: 4,
    width: 70,
  },
  handCardName: {
    fontSize: 10,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 13,
  },

  // ─── Action buttons ──────────────────────────────────────────────────────────
  actionRow1: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: COLORS.darkTeal,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
    minWidth: 72,
  },
  actionBtnIcon: {
    fontSize: 18,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  dealGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dealCountInput: {
    width: 48,
    borderWidth: 1,
    borderColor: "#b69f7a",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: COLORS.white,
    textAlign: "center",
    color: COLORS.darkBrown,
  },
  actionRow2: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtnWide: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionBtnBajar: {
    backgroundColor: COLORS.darkTeal,
  },
  actionBtnDescartar: {
    backgroundColor: COLORS.terraCotta,
  },
  actionBtnWideText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // ─── Error / Loading ─────────────────────────────────────────────────────────
  errorText: {
    color: COLORS.error,
    fontWeight: "600",
    textAlign: "center",
  },
});
