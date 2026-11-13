
import React, { useEffect, useMemo, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabase = createClient(
  "https://sgpbkamcfviwysfoayui.supabase.co",
  "sb_publishable_iA-uqsk7PoEuZY0Z2quAAA_WiTmOjS4"
);

type Listing = {
  id: number;
  title: string;
  price: string;
  city: string;
  category: string;
  emoji: string;
  time: string;
};

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

const cities = [
  "Все города",
  "Астана",
  "Алматы",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Тараз",
  "Павлодар",
  "Атырау",
  "Актау",
  "Костанай",
  "Семей",
  "Туркестан",
];

const getEmoji = (category: string) => {
  const emojis: Record<string, string> = {
    "Недвижимость": "🏠",
    "Транспорт": "🚘",
    "Электроника": "📱",
    "Работа": "💼",
    "Для дома": "🛋️",
    "Услуги": "🛠️",
    "Одежда": "👕",
    "Животные": "🐾",
  };
  return emojis[category] || "📦";
};

const formatTime = (date: string) => {
  const created = new Date(date);
  const now = new Date();

  if (created.toDateString() === now.toDateString()) {
    return "Сегодня";
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (created.toDateString() === yesterday.toDateString()) {
    return "Вчера";
  }

  return created.toLocaleDateString("ru-RU");
};

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [tab, setTab] = useState("Главная");
  const [selectedCity, setSelectedCity] = useState("Все города");
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adPrice, setAdPrice] = useState("");
  const [adCity, setAdCity] = useState("Астана");
  const [adCategory, setAdCategory] = useState("Недвижимость");
  const [adPhone, setAdPhone] = useState("");
  const [savingAd, setSavingAd] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    loadListings();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const loadListings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("ads")
      .select("id, title, price, city, category, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert(
        "Ошибка загрузки",
        "Не удалось загрузить объявления. Проверьте подключение к интернету."
      );
      setLoading(false);
      return;
    }

    const formatted: Listing[] = (data || []).map((item) => ({
      id: Number(item.id),
      title: item.title || "Без названия",
      price:
        item.price !== null
          ? Number(item.price).toLocaleString("ru-RU") + " ₸"
          : "Цена не указана",
      city: item.city || "Казахстан",
      category: item.category || "",
      emoji: getEmoji(item.category || ""),
      time: formatTime(item.created_at),
    }));

    setListings(formatted);
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setAuthBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://sat-kz.vercel.app/" },
    });
    if (error) {
      setAuthBusy(false);
      Alert.alert("Ошибка входа", error.message);
    }
  };

  const signInWithEmail = async () => {
    const email = authEmail.trim();
    if (!email || !email.includes("@")) {
      Alert.alert("Проверьте почту", "Введите корректный адрес электронной почты.");
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "https://sat-kz.vercel.app/" },
    });
    setAuthBusy(false);
    if (error) {
      Alert.alert("Не удалось отправить письмо", error.message);
      return;
    }
    Alert.alert("Письмо отправлено", "Откройте письмо от SAT KZ и перейдите по ссылке для входа.");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Ошибка", error.message);
    else Alert.alert("Вы вышли", "Вы вышли из аккаунта SAT KZ.");
  };

  const submitAd = async () => {
    if (!session?.user?.id) {
      Alert.alert("Нужен вход", "Войдите в аккаунт через раздел «Профиль», чтобы опубликовать объявление.");
      setTab("Профиль");
      return;
    }

    const cleanTitle = adTitle.trim();
    const cleanPhone = adPhone.trim();

    if (!cleanTitle || !adDescription.trim() || !adPrice.trim() || !cleanPhone) {
      Alert.alert("Заполните форму", "Укажите название, описание, цену и номер телефона.");
      return;
    }

    const numericPrice = Number(adPrice.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      Alert.alert("Неверная цена", "Введите цену числом, например 15000.");
      return;
    }

    setSavingAd(true);
    const { error } = await supabase.from("ads").insert({
      user_id: session.user.id,
      title: cleanTitle,
      description: adDescription.trim(),
      price: numericPrice,
      city: adCity,
      category: adCategory,
      phone: cleanPhone,
    });

    setSavingAd(false);
    if (error) {
      Alert.alert(
        "Не удалось опубликовать",
        error.code === "42501"
          ? "База данных пока запрещает публикацию объявлений. Следующим шагом настроим безопасный доступ."
          : error.message
      );
      return;
    }

    setAdTitle("");
    setAdDescription("");
    setAdPrice("");
    setAdPhone("");
    await loadListings();
    setTab("Главная");
    Alert.alert("Готово", "Объявление опубликовано.");
  };

  const chooseCity = () =>
    Alert.alert(
      "Выберите город",
      "Показывать объявления из выбранного города",
      cities
        .map((city) => ({
          text: city === selectedCity ? "✓ " + city : city,
          onPress: () => setSelectedCity(city),
        }))
        .concat([{ text: "Отмена", style: "cancel" as const }])
    );

  const filtered = useMemo(
    () =>
      listings.filter((item) => {
        const matchesQuery = (item.title + " " + item.city)
          .toLowerCase()
          .includes(query.toLowerCase());

        const matchesCategory =
          activeCategory === "Все" || item.category === activeCategory;

        const matchesCity =
          selectedCity === "Все города" || item.city === selectedCity;

        return matchesQuery && matchesCategory && matchesCity;
      }),
    [listings, query, activeCategory, selectedCity]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            SAT<Text style={styles.logoAccent}> KZ</Text>
          </Text>
          <Text style={styles.subtitle}>Покупай. Продавай. Просто.</Text>
        </View>

        <Pressable style={styles.cityButton} onPress={chooseCity}>
          <Ionicons name="location-outline" size={17} color="#20242B" />
          <Text style={styles.cityText}>{selectedCity}</Text>
          <Ionicons name="chevron-down" size={14} color="#20242B" />
        </Pressable>
      </View>

      {tab === "Главная" ? (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
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
            <Text style={styles.bannerEyebrow}>
              ДОБРО ПОЖАЛОВАТЬ В SAT KZ
            </Text>
            <Text style={styles.bannerTitle}>
              Найди то,{"\n"}что ищешь
            </Text>
            <Text style={styles.bannerSub}>
              Объявления со всего Казахстана
            </Text>
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
              <View
                style={[
                  styles.categoryIcon,
                  activeCategory === category.name &&
                    styles.categoryIconActive,
                ]}
              >
                <Ionicons
                  name={category.icon}
                  size={23}
                  color={
                    activeCategory === category.name ? "#FFFFFF" : "#20242B"
                  }
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Свежие объявления</Text>
          <Text style={styles.countText}>
            {loading ? "Загрузка..." : `${filtered.length} найдено`}
          </Text>
        </View>

        <View style={styles.listings}>
          {loading ? (
            <ActivityIndicator size="large" color="#F36B32" />
          ) : filtered.length === 0 ? (
            <Text style={styles.empty}>
              Объявлений пока нет. Попробуйте другой запрос.
            </Text>
          ) : (
            filtered.map((item) => (
              <Pressable
                key={item.id}
                style={styles.listingCard}
                onPress={() => {}}
              >
                <View style={styles.listingImage}>
                  <Text style={styles.listingEmoji}>{item.emoji}</Text>
                </View>

                <View style={styles.listingInfo}>
                  <Text style={styles.listingPrice}>{item.price}</Text>
                  <Text style={styles.listingTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.listingMeta}>
                    {item.city} · {item.time}
                  </Text>
                </View>

                <Pressable
                  style={styles.favorite}
                  onPress={() => {}}
                >
                  <Ionicons
                    name="heart-outline"
                    size={21}
                    color="#68707C"
                  />
                </Pressable>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
      ) : tab === "Добавить" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.formTitle}>Новое объявление</Text>
          <Text style={styles.formHint}>Расскажите покупателям, что вы продаёте</Text>

          <Text style={styles.fieldLabel}>Название *</Text>
          <TextInput
            value={adTitle}
            onChangeText={setAdTitle}
            placeholder="Например, iPhone 13"
            placeholderTextColor="#9AA1AC"
            style={styles.formInput}
            maxLength={90}
          />

          <Text style={styles.fieldLabel}>Описание *</Text>
          <TextInput
            value={adDescription}
            onChangeText={setAdDescription}
            placeholder="Состояние, характеристики и подробности"
            placeholderTextColor="#9AA1AC"
            style={[styles.formInput, styles.descriptionInput]}
            multiline
            textAlignVertical="top"
            maxLength={1500}
          />

          <Text style={styles.fieldLabel}>Цена, ₸ *</Text>
          <TextInput
            value={adPrice}
            onChangeText={setAdPrice}
            placeholder="Например, 15000"
            placeholderTextColor="#9AA1AC"
            style={styles.formInput}
            keyboardType="decimal-pad"
          />

          <Text style={styles.fieldLabel}>Категория *</Text>
          <View style={styles.choiceWrap}>
            {categories.map((item) => (
              <Pressable
                key={item.name}
                onPress={() => setAdCategory(item.name)}
                style={[styles.choiceChip, adCategory === item.name && styles.choiceChipActive]}
              >
                <Text style={[styles.choiceText, adCategory === item.name && styles.choiceTextActive]}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Город *</Text>
          <View style={styles.choiceWrap}>
            {cities.filter((city) => city !== "Все города").map((city) => (
              <Pressable
                key={city}
                onPress={() => setAdCity(city)}
                style={[styles.choiceChip, adCity === city && styles.choiceChipActive]}
              >
                <Text style={[styles.choiceText, adCity === city && styles.choiceTextActive]}>
                  {city}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Номер телефона *</Text>
          <TextInput
            value={adPhone}
            onChangeText={setAdPhone}
            placeholder="+7 777 000 00 00"
            placeholderTextColor="#9AA1AC"
            style={styles.formInput}
            keyboardType="phone-pad"
          />

          <Pressable
            style={[styles.publishButton, savingAd && styles.publishButtonDisabled]}
            onPress={submitAd}
            disabled={savingAd}
          >
            {savingAd ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.publishButtonText}>Опубликовать объявление</Text>
            )}
          </Pressable>
          <Text style={styles.formFootnote}>Поля со звёздочкой обязательны. Не указывайте пароли и коды из SMS.</Text>
        </ScrollView>
      ) : tab === "Профиль" ? (
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>Мой профиль</Text>
          {session?.user ? (
            <>
              <View style={styles.profileCard}>
                <Ionicons name="person-circle-outline" size={48} color="#F36B32" />
                <Text style={styles.profileEmail}>{session.user.email || session.user.phone || "Пользователь SAT KZ"}</Text>
                <Text style={styles.formHint}>Вы вошли в свой аккаунт.</Text>
              </View>
              <Pressable style={styles.publishButton} onPress={signOut}>
                <Text style={styles.publishButtonText}>Выйти из аккаунта</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.formHint}>Войдите, чтобы пользоваться возможностями SAT KZ.</Text>
              <Pressable
                style={[styles.publishButton, authBusy && styles.publishButtonDisabled]}
                onPress={signInWithGoogle}
                disabled={authBusy}
              >
                {authBusy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishButtonText}>Продолжить с Google</Text>}
              </Pressable>
              <Text style={styles.fieldLabel}>Или войдите по электронной почте</Text>
              <TextInput
                value={authEmail}
                onChangeText={setAuthEmail}
                placeholder="example@gmail.com"
                placeholderTextColor="#9AA1AC"
                style={styles.formInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={[styles.publishButton, authBusy && styles.publishButtonDisabled]}
                onPress={signInWithEmail}
                disabled={authBusy}
              >
                <Text style={styles.publishButtonText}>Получить ссылку для входа</Text>
              </Pressable>
              <Text style={styles.formFootnote}>Мы отправим ссылку на почту. Пароль вводить не нужно.</Text>
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.placeholderContent}>
          <Ionicons
            name={tab === "Избранное" ? "heart-outline" : "chatbubble-ellipses-outline"}
            size={42}
            color="#F36B32"
          />
          <Text style={styles.formTitle}>{tab}</Text>
          <Text style={styles.formHint}>Этот раздел пока в разработке.</Text>
          <Pressable style={styles.publishButton} onPress={() => setTab("Добавить")}>
            <Text style={styles.publishButtonText}>Разместить объявление</Text>
          </Pressable>
        </ScrollView>
      )}

      <View style={styles.bottomBar}>
        {(
          [
            ["Главная", "home-outline"],
            ["Избранное", "heart-outline"],
            ["Добавить", "add-circle"],
            ["Сообщения", "chatbubble-ellipses-outline"],
            ["Профиль", "person-outline"],
          ] as const
        ).map(([label, icon]) => (
          <Pressable
            key={label}
            style={styles.tabItem}
            onPress={() => setTab(label)}
          >
            <Ionicons
              name={icon}
              size={label === "Добавить" ? 29 : 22}
              color={tab === label ? "#F36B32" : "#8B929D"}
            />
            <Text
              style={[
                styles.tabLabel,
                tab === label && styles.tabLabelActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: 29,
    fontWeight: "900",
    color: "#20242B",
    letterSpacing: -1.2,
  },
  logoAccent: { color: "#F36B32" },
  subtitle: { color: "#8B929D", fontSize: 11, marginTop: 1 },
  cityButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F5F6F8",
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 12,
  },
  cityText: { fontSize: 12, fontWeight: "700", color: "#20242B" },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  formContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },
  placeholderContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  formTitle: { color: "#20242B", fontSize: 23, fontWeight: "900", marginBottom: 6 },
  profileCard: { alignItems: "center", backgroundColor: "#F7F8FA", borderRadius: 16, padding: 22, marginTop: 16 },
  profileEmail: { color: "#20242B", fontSize: 15, fontWeight: "800", marginTop: 10, marginBottom: 6, textAlign: "center" },
  formHint: { color: "#8B929D", fontSize: 13, lineHeight: 19, marginBottom: 20 },
  fieldLabel: { color: "#20242B", fontSize: 13, fontWeight: "800", marginTop: 14, marginBottom: 8 },
  formInput: { minHeight: 48, borderWidth: 1, borderColor: "#E5E8EC", borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, color: "#20242B", fontSize: 14, backgroundColor: "#FFFFFF" },
  descriptionInput: { minHeight: 110 },
  choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choiceChip: { borderWidth: 1, borderColor: "#E5E8EC", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#FFFFFF" },
  choiceChipActive: { borderColor: "#F36B32", backgroundColor: "#FFF0E9" },
  choiceText: { color: "#555D68", fontSize: 11, fontWeight: "600" },
  choiceTextActive: { color: "#D95722" },
  publishButton: { minHeight: 50, borderRadius: 13, backgroundColor: "#F36B32", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, marginTop: 24 },
  publishButtonDisabled: { opacity: 0.65 },
  publishButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  formFootnote: { color: "#9AA1AC", fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 12 },
  searchBox: {
    height: 50,
    backgroundColor: "#F4F5F7",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#20242B" },
  banner: {
    backgroundColor: "#20242B",
    borderRadius: 20,
    padding: 19,
    minHeight: 150,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  bannerTextWrap: { flex: 1 },
  bannerEyebrow: {
    color: "#F7A17D",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 31,
    marginTop: 8,
  },
  bannerSub: { color: "#C8CBD0", fontSize: 11, marginTop: 7 },
  bannerEmoji: { fontSize: 65, marginRight: 2 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#20242B" },
  seeAll: { color: "#F36B32", fontSize: 11, fontWeight: "700" },
  countText: { color: "#9AA1AC", fontSize: 11 },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryItem: {
    width: "23%",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryIcon: {
    width: 57,
    height: 57,
    borderRadius: 17,
    backgroundColor: "#F4F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconActive: { backgroundColor: "#F36B32" },
  categoryName: {
    color: "#555D68",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 7,
  },
  listings: { gap: 10 },
  listingCard: {
    borderWidth: 1,
    borderColor: "#EEF0F2",
    borderRadius: 15,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  listingImage: {
    width: 83,
    height: 83,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  listingEmoji: { fontSize: 35 },
  listingInfo: { flex: 1 },
  listingPrice: {
    color: "#20242B",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 5,
  },
  listingTitle: { color: "#4D5560", fontSize: 12, lineHeight: 17 },
  listingMeta: { color: "#9AA1AC", fontSize: 10, marginTop: 7 },
  favorite: { alignSelf: "flex-start", padding: 3 },
  empty: {
    color: "#8B929D",
    textAlign: "center",
    padding: 24,
    fontSize: 13,
  },
  bottomBar: {
    height: 67,
    borderTopWidth: 1,
    borderTopColor: "#F0F1F3",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabLabel: { color: "#9299A3", fontSize: 9, fontWeight: "600" },
  tabLabelActive: { color: "#F36B32" },
});
