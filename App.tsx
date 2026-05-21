import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native";
import { MazoApp } from "./src/MazoApp";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#efe3c7" }}>
      <StatusBar style="dark" />
      <MazoApp />
    </SafeAreaView>
  );
}
