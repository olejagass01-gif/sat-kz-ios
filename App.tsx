import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Listing = {
  id: number;
  title: string;
  price: string;
  city: string;
  category: string;
  emoji: string;
  time: string;
};
const supabase = createClient(
  "https://sgpbkamcfviwysfoayui.supabase.co",
  "sb_publishable_iA-uqsk7PoEuZY0Z2quAAA_WiTmOjS4"
);
const categories = [
  { name: "Недвижимость", icon: "home-outline" as const },
  { name: "Транспорт", icon: "car-outline" as const },
  { name: "Электроника", icon: "phone-portrait-outline" as const },
  { name: "Работа", icon: "briefcase-outline" as const },
  { name: "Для дома", icon: "bed-outline" as const },
  { name: "Услуги", icon: "construct-outline" as const },
  { name: "Одежда", icon: "shirt-outline" as const },
  { name: "Животные", icon: "paw-outline" as const },
];

const listings: Listing[] = [
  { id: 1, title: "iPhone 14 Pro, 256 GB", price: "280 000 ₸", city: "Астана", category: "Электроника", emoji: "📱", time: "Сегодня, 14:32" },
  { id: 2, title: "Уютная 2-комнатная квартира", price: "25 000 000 ₸", city: "Алматы", category: "Недвижимость", emoji: "🏠", time: "Сегодня, 12:10" },
  { id: 3, title: "Toyota Camry 2018", price: "10 500 000 ₸", city: "Караганда", category: "Транспорт", emoji: "🚘", time: "Вчера" },
  { id: 4, title: "Игровой ноутбук ASUS", price: "350 000 ₸", city: "Астана", category: "Электроника", emoji: "💻", time: "Вчера" },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [tab, setTab] = useState("Главная");
  const [selectedCity, setSelectedCity] = useState("Все города");
  const cities = ["Все города", "Астана", "Алматы", "Шымкент", "Караганда", "Актобе", "Тараз", "Павлодар", "Атырау", "Актау", "Костанай", "Семей", "Туркестан"];
  const chooseCity = () => Alert.alert("Выберите город", "Показывать объявления из выбранного города", cities.map((city) => ({ text: city === selectedCity ? "✓ " + city : city, onPress: () => setSelectedCity(city) })).concat([{ text: "Отмена", style: "cancel" as const }]));

  const filtered = useMemo(() => listings.filter((item) => {
    const matchesQuery = (item.title + " " + item.city).toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === "Все" || item.category === activeCategory;
    const matchesCity = selectedCity === "Все города" || item.city === selectedCity;
    return matchesQuery && matchesCategory && matchesCity;
  }), [query, activeCategory, selectedCity]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>SAT<Text style={styles.logoAccent}> KZ</Text></Text>
          <Text style={styles.subtitle}>Покупай. Продавай. Просто.</Text>
        </View>
        <Pressable style={styles.cityButton} onPress={chooseCity}>
          <Ionicons name="location-outline" size={17} color="#20242B" />
          <Text style={styles.cityText}>{selectedCity}</Text>
          <Ionicons name="chevron-down" size={14} color="#20242B" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={21} color="#8B929D" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Что хотите найти?"
            placeholderTextColor="#9AA1AC"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={19} color="#9AA1AC" />
            </Pressable>
          )}
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerEyebrow}>ДОБРО ПОЖАЛОВАТЬ В SAT KZ</Text>
            <Text style={styles.bannerTitle}>Найди то,{"\n"}что ищешь</Text>
            <Text style={styles.bannerSub}>Объявления со всего Казахстана</Text>
          </View>
          <Text style={styles.bannerEmoji}>🛍️</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Категории</Text>
          <Pressable onPress={() => setActiveCategory("Все")}>
            <Text style={styles.seeAll}>Все объявления</Text>
          </Pressable>
        </View>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <Pressable
              key={category.name}
              style={styles.categoryItem}
              onPress={() => setActiveCategory(category.name)}
            >
              <View style={[styles.categoryIcon, activeCategory === category.name && styles.categoryIconActive]}>
                <Ionicons name={category.icon} size={23} color={activeCategory === category.name ? "#FFFFFF" : "#20242B"} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Свежие объявления</Text>
          <Text style={styles.countText}>{filtered.length} найдено</Text>
        </View>
        <View style={styles.listings}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>Ничего не найдено. Попробуйте другой запрос.</Text>
          ) : filtered.map((item) => (
            <Pressable key={item.id} style={styles.listingCard} onPress={() => {}}>
              <View style={styles.listingImage}>
                <Text style={styles.listingEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.listingInfo}>
                <Text style={styles.listingPrice}>{item.price}</Text>
                <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.listingMeta}>{item.city} · {item.time}</Text>
              </View>
              <Pressable style={styles.favorite} onPress={() => {}}>
                <Ionicons name="heart-outline" size={21} color="#68707C" />
              </Pressable>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {([
          ["Главная", "home-outline"],
          ["Избранное", "heart-outline"],
          ["Добавить", "add-circle"],
          ["Сообщения", "chatbubble-ellipses-outline"],
          ["Профиль", "person-outline"],
        ] as const).map(([label, icon]) => (
          <Pressable key={label} style={styles.tabItem} onPress={() => setTab(label)}>
            <Ionicons name={icon} size={label === "Добавить" ? 29 : 22} color={tab === label ? "#F36B32" : "#8B929D"} />
            <Text style={[styles.tabLabel, tab === label && styles.tabLabelActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 29, fontWeight: "900", color: "#20242B", letterSpacing: -1.2 },
  logoAccent: { color: "#F36B32" },
  subtitle: { color: "#8B929D", fontSize: 11, marginTop: 1 },
  cityButton: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F5F6F8", paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12 },
  cityText: { fontSize: 12, fontWeight: "700", color: "#20242B" },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  searchBox: { height: 50, backgroundColor: "#F4F5F7", borderRadius: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  searchInput: { flex: 1, fontSize: 14, color: "#20242B" },
  banner: { backgroundColor: "#20242B", borderRadius: 20, padding: 19, minHeight: 150, flexDirection: "row", alignItems: "center", justifyContent: "space-between", overflow: "hidden" },
  bannerTextWrap: { flex: 1 },
  bannerEyebrow: { color: "#F7A17D", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  bannerTitle: { color: "#FFFFFF", fontSize: 27, fontWeight: "900", lineHeight: 31, marginTop: 8 },
  bannerSub: { color: "#C8CBD0", fontSize: 11, marginTop: 7 },
  bannerEmoji: { fontSize: 65, marginRight: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#20242B" },
  seeAll: { color: "#F36B32", fontSize: 11, fontWeight: "700" },
  countText: { color: "#9AA1AC", fontSize: 11 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  categoryItem: { width: "23%", alignItems: "center", marginBottom: 16 },
  categoryIcon: { width: 57, height: 57, borderRadius: 17, backgroundColor: "#F4F5F7", alignItems: "center", justifyContent: "center" },
  categoryIconActive: { backgroundColor: "#F36B32" },
  categoryName: { color: "#555D68", fontSize: 10, fontWeight: "600", textAlign: "center", marginTop: 7 },
  listings: { gap: 10 },
  listingCard: { borderWidth: 1, borderColor: "#EEF0F2", borderRadius: 15, padding: 10, flexDirection: "row", alignItems: "center", gap: 11 },
  listingImage: { width: 83, height: 83, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  listingEmoji: { fontSize: 35 },
  listingInfo: { flex: 1 },
  listingPrice: { color: "#20242B", fontWeight: "900", fontSize: 15, marginBottom: 5 },
  listingTitle: { color: "#4D5560", fontSize: 12, lineHeight: 17 },
  listingMeta: { color: "#9AA1AC", fontSize: 10, marginTop: 7 },
  favorite: { alignSelf: "flex-start", padding: 3 },
  empty: { color: "#8B929D", textAlign: "center", padding: 24, fontSize: 13 },
  bottomBar: { height: 67, borderTopWidth: 1, borderTopColor: "#F0F1F3", flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: "#FFFFFF" },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  tabLabel: { color: "#9299A3", fontSize: 9, fontWeight: "600" },
  tabLabelActive: { color: "#F36B32" },
});
