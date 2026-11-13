
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
  Linking,
  Modal,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabase = createClient(
  "https://sgpbkamcfviwysfoayui.supabase.co",
  "sb_publishable_iA-uqsk7PoEuZY0Z2quAAA_WiTmOjS4"
);

type Listing = {
  id: number;
  userId: string;
  title: string;
  price: string;
  city: string;
  category: string;
  emoji: string;
  time: string;
  description: string;
  phone: string;
  imageUrls: string[];
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

const getUnknownSenderName = (senderId: string) => {
  let hash = 0;
  for (let i = 0; i < senderId.length; i++) {
    hash = (hash * 31 + senderId.charCodeAt(i)) >>> 0;
  }
  return `Неизвестный ${100 + (hash % 900)}`;
};

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
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adPrice, setAdPrice] = useState("");
  const [adCity, setAdCity] = useState("Астана");
  const [adCategory, setAdCategory] = useState("Недвижимость");
  const [adPhone, setAdPhone] = useState("");
  const [savingAd, setSavingAd] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [myAds, setMyAds] = useState<Listing[]>([]);
  const [myAdsLoading, setMyAdsLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);
  const [adImages, setAdImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [editingAdId, setEditingAdId] = useState<number | null>(null);
  const [deleteAdId, setDeleteAdId] = useState<number | null>(null);
  const [deletingAd, setDeletingAd] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatProfiles, setChatProfiles] = useState<Record<string, string>>({});
  const [chatDraft, setChatDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadListings();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setProfileName(data.session?.user?.user_metadata?.display_name || data.session?.user?.user_metadata?.full_name || "");
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setProfileName(nextSession?.user?.user_metadata?.display_name || nextSession?.user?.user_metadata?.full_name || "");
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    supabase.from("profiles").select("display_name, phone, city, avatar_url").eq("id", session.user.id).maybeSingle().then(({ data }) => {
      if (!active || !data) return;
      if (data.display_name) setProfileName(data.display_name);
      setProfilePhone(data.phone || "");
      setProfileCity(data.city || "");
      setProfileAvatarUrl(data.avatar_url || "");
    });
    return () => { active = false; };
  }, [session?.user?.id]);

  const loadListings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("ads")
      .select("id, user_id, title, description, phone, price, city, category, image_url, created_at")
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
      userId: item.user_id || "",
      title: item.title || "Без названия",
      price:
        item.price !== null
          ? Number(item.price).toLocaleString("ru-RU") + " ₸"
          : "Цена не указана",
      city: item.city || "Казахстан",
      category: item.category || "",
      emoji: getEmoji(item.category || ""),
      time: formatTime(item.created_at),
      description: item.description || "",
      phone: item.phone || "",
      imageUrls: (() => { try { const v = JSON.parse(item.image_url || "[]"); return Array.isArray(v) ? v : item.image_url ? [item.image_url] : []; } catch { return item.image_url ? [item.image_url] : []; } })(),
    }));

    setListings(formatted);
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user?.id) loadFavorites();
    else setFavoriteIds([]);
  }, [session?.user?.id]);

  const loadFavorites = async () => {
    if (!session?.user?.id) return;
    setFavoritesLoading(true);
    const { data, error } = await supabase.from("favorites").select("ad_id").eq("user_id", session.user.id);
    setFavoritesLoading(false);
    if (error) {
      Alert.alert("Ошибка", "Не удалось загрузить избранное.");
      return;
    }
    setFavoriteIds((data || []).map((row: any) => Number(row.ad_id)));
  };

  const toggleFavorite = async (item: Listing) => {
    if (!session?.user?.id) {
      setTab("Профиль");
      Alert.alert("Нужен вход", "Войдите в аккаунт, чтобы сохранять объявления.");
      return;
    }
    const isSaved = favoriteIds.includes(item.id);
    if (isSaved) {
      const { error } = await supabase.from("favorites").delete().eq("user_id", session.user.id).eq("ad_id", item.id);
      if (error) { Alert.alert("Ошибка", "Не удалось убрать из избранного."); return; }
      setFavoriteIds((current) => current.filter((id) => id !== item.id));
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: session.user.id, ad_id: item.id });
      if (error) { Alert.alert("Ошибка", "Не удалось добавить в избранное."); return; }
      setFavoriteIds((current) => [...current, item.id]);
    }
  };

  useEffect(() => {
    let active = true;
    const loadSellerReviews = async () => {
      if (!selectedListing?.userId) {
        setSellerReviews([]);
        setSellerProfile(null);
        return;
      }
      const [profileResult, reviewsResult] = await Promise.all([
        supabase.from("profiles").select("display_name, avatar_url, city").eq("id", selectedListing.userId).maybeSingle(),
        supabase.from("seller_reviews").select("id, reviewer_id, rating, comment, created_at").eq("seller_id", selectedListing.userId).order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      setSellerProfile(profileResult.data || null);
      const reviews = reviewsResult.data || [];
      const reviewerIds = [...new Set(reviews.map((review: any) => review.reviewer_id))];
      let names: Record<string, string> = {};
      if (reviewerIds.length) {
        const { data: people } = await supabase.from("profiles").select("id, display_name").in("id", reviewerIds);
        (people || []).forEach((person: any) => { names[person.id] = person.display_name || "Пользователь SAT KZ"; });
      }
      if (!active) return;
      setSellerReviews(reviews.map((review: any) => ({ ...review, reviewerName: names[review.reviewer_id] || "Пользователь SAT KZ" })));
      const ownReview = reviews.find((review: any) => review.reviewer_id === session?.user?.id);
      setReviewRating(ownReview?.rating || 5);
      setReviewComment(ownReview?.comment || "");
    };
    loadSellerReviews();
    return () => { active = false; };
  }, [selectedListing?.userId, session?.user?.id]);

  const saveSellerReview = async () => {
    const comment = reviewComment.trim();
    if (!session?.user?.id) {
      Alert.alert("Нужен вход", "Войдите в аккаунт, чтобы оставить отзыв.");
      return;
    }
    if (!selectedListing?.userId || selectedListing.userId === session.user.id) return;
    if (comment.length < 2) {
      Alert.alert("Отзыв слишком короткий", "Напишите хотя бы 2 символа.");
      return;
    }
    setReviewSaving(true);
    const { error } = await supabase.from("seller_reviews").upsert({
      seller_id: selectedListing.userId,
      reviewer_id: session.user.id,
      rating: reviewRating,
      comment,
    }, { onConflict: "seller_id,reviewer_id" });
    setReviewSaving(false);
    if (error) {
      Alert.alert("Ошибка", "Не удалось сохранить отзыв.");
      return;
    }
    const { data } = await supabase.from("seller_reviews").select("id, reviewer_id, rating, comment, created_at").eq("seller_id", selectedListing.userId).order("created_at", { ascending: false });
    const rows = data || [];
    const ids = [...new Set(rows.map((review: any) => review.reviewer_id))];
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: people } = await supabase.from("profiles").select("id, display_name").in("id", ids);
      (people || []).forEach((person: any) => { names[person.id] = person.display_name || "Пользователь SAT KZ"; });
    }
    setSellerReviews(rows.map((review: any) => ({ ...review, reviewerName: names[review.reviewer_id] || "Пользователь SAT KZ" })));
    Alert.alert("Готово", "Ваш отзыв сохранён.");
  };

  const deleteSellerReview = async () => {
    if (!session?.user?.id || !selectedListing?.userId) return;
    const { error } = await supabase.from("seller_reviews").delete().eq("seller_id", selectedListing.userId).eq("reviewer_id", session.user.id);
    if (error) {
      Alert.alert("Ошибка", "Не удалось удалить отзыв.");
      return;
    }
    setSellerReviews((current) => current.filter((review) => review.reviewer_id !== session.user.id));
    setReviewRating(5);
    setReviewComment("");
  };

  const reportListing = async (reason: string) => {
    if (!selectedListing) return;
    if (!session?.user?.id) {
      Alert.alert("Нужен вход", "Войдите в аккаунт, чтобы пожаловаться на объявление.");
      return;
    }
    setReportSaving(true);
    const { error } = await supabase.from("ad_reports").insert({
      ad_id: selectedListing.id,
      reporter_id: session.user.id,
      reason,
    });
    setReportSaving(false);
    if (error) {
      if (error.code === "23505") {
        Alert.alert("Уже отправлено", "Вы уже жаловались на это объявление.");
      } else {
        Alert.alert("Ошибка", "Не удалось отправить жалобу. Попробуйте позже.");
      }
      return;
    }
    Alert.alert("Жалоба отправлена", "Спасибо! Мы проверим это объявление.");
  };

  const showReportOptions = () => {
    if (!selectedListing || reportSaving) return;
    Alert.alert("Пожаловаться на объявление", "Выберите причину жалобы:", [
      { text: "Мошенничество", onPress: () => reportListing("Мошенничество") },
      { text: "Неверная информация", onPress: () => reportListing("Неверная информация") },
      { text: "Запрещённый товар", onPress: () => reportListing("Запрещённый товар") },
      { text: "Спам или дубликат", onPress: () => reportListing("Спам или дубликат") },
      { text: "Другая причина", onPress: () => reportListing("Другая причина") },
      { text: "Отмена", style: "cancel" },
    ]);
  };

  const showAdDetails = (item: Listing) => setSelectedListing(item);

  const openChat = async (item: Listing) => {
    if (!session?.user?.id) {
      setSelectedListing(null);
      setTab("Профиль");
      Alert.alert("Нужен вход", "Войдите в аккаунт, чтобы написать продавцу.");
      return;
    }
    const isKnownOwnAd = item.userId === session.user.id || myAds.some((ad) => ad.id === item.id);
    if (isKnownOwnAd) {
      Alert.alert("Это ваше объявление", "Нельзя начать переписку с самим собой.");
      return;
    }
    setChatLoading(true);
    const { data: ownerAd, error: ownerError } = await supabase
      .from("ads")
      .select("user_id")
      .eq("id", item.id)
      .limit(1)
      .maybeSingle();
    if (ownerError || !ownerAd?.user_id) {
      setChatLoading(false);
      Alert.alert("Ошибка", "Не удалось проверить владельца объявления.");
      return;
    }
    if (ownerAd.user_id === session.user.id) {
      setChatLoading(false);
      Alert.alert("Это ваше объявление", "Нельзя начать переписку с самим собой.");
      return;
    }
    const sellerId = ownerAd.user_id;
    let conversationId: string | null = null;
    const { data: existing, error: findError } = await supabase
      .from("conversations")
      .select("id")
      .eq("ad_id", item.id)
      .eq("buyer_id", session.user.id)
      .eq("seller_id", sellerId)
      .maybeSingle();
    if (findError) {
      setChatLoading(false);
      Alert.alert("Ошибка", "Не удалось открыть переписку.");
      return;
    }
    if (existing?.id) {
      conversationId = existing.id;
    } else {
      const { data: created, error: createError } = await supabase
        .from("conversations")
        .insert({ ad_id: item.id, buyer_id: session.user.id, seller_id: sellerId })
        .select("id")
        .single();
      if (createError || !created?.id) {
        setChatLoading(false);
        Alert.alert("Ошибка", "Не удалось создать переписку. Попробуйте ещё раз.");
        return;
      }
      conversationId = created.id;
    }
    setSelectedListing(null);
    const { data: sellerProfile } = await supabase.from("profiles").select("display_name").eq("id", sellerId).maybeSingle();
    setActiveConversation({ id: conversationId, adId: item.id, adTitle: item.title, sellerId, otherUserId: sellerId, otherUserName: sellerProfile?.display_name || "Пользователь SAT KZ" });
    setChatDraft("");
    await loadChatMessages(conversationId);
    setChatLoading(false);
    setTab("Сообщения");
  };

  const loadChatMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      Alert.alert("Ошибка", "Не удалось загрузить сообщения.");
      return;
    }
    const messages = data || [];
    const senderIds = [...new Set(messages.map((message: any) => message.sender_id).filter(Boolean))];
    const { data: profiles } = senderIds.length
      ? await supabase.from("profiles").select("id, display_name").in("id", senderIds)
      : { data: [] };
    const names: Record<string, string> = {};
    (profiles || []).forEach((profile: any) => { names[profile.id] = profile.display_name; });
    setChatProfiles(names);
    setChatMessages(messages);
  };

  const loadUnreadCount = async () => {
    if (!session?.user?.id) { setUnreadCount(0); return; }
    const userId = session.user.id;
    const { data: chats, error: chatsError } = await supabase
      .from("conversations")
      .select("id, buyer_id, seller_id, buyer_last_read_at, seller_last_read_at");
    if (chatsError) return;
    const rows = chats || [];
    if (!rows.length) { setUnreadCount(0); return; }
    const { data: incoming, error: messagesError } = await supabase
      .from("messages")
      .select("conversation_id, sender_id, created_at")
      .in("conversation_id", rows.map((chat: any) => chat.id))
      .neq("sender_id", userId);
    if (messagesError) return;
    const chatById: Record<string, any> = {};
    rows.forEach((chat: any) => { chatById[chat.id] = chat; });
    const unread = (incoming || []).filter((message: any) => {
      const chat = chatById[message.conversation_id];
      if (!chat) return false;
      const lastRead = chat.buyer_id === userId
        ? chat.buyer_last_read_at
        : chat.seller_last_read_at;
      return !lastRead || new Date(message.created_at).getTime() > new Date(lastRead).getTime();
    }).length;
    setUnreadCount(unread);
  };

  const markConversationRead = async (conversationId: string) => {
    if (!session?.user?.id) return;
    const { data: chat, error } = await supabase
      .from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", conversationId)
      .single();
    if (error || !chat) return;
    const readField = chat.buyer_id === session.user.id
      ? "buyer_last_read_at"
      : "seller_last_read_at";
    const { error: updateError } = await supabase
      .from("conversations")
      .update({ [readField]: new Date().toISOString() })
      .eq("id", conversationId);
    if (!updateError) await loadUnreadCount();
  };

  const loadConversations = async () => {
    if (!session?.user?.id) {
      setConversations([]);
      return;
    }
    setChatLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("id, ad_id, buyer_id, seller_id, created_at, buyer_last_read_at, seller_last_read_at")
      .order("created_at", { ascending: false });
    if (error) {
      setChatLoading(false);
      Alert.alert("Ошибка", "Не удалось загрузить переписки.");
      return;
    }
    const rows = data || [];
    const adIds = [...new Set(rows.map((row: any) => Number(row.ad_id)))];
    let adsById: Record<number, any> = {};
    if (adIds.length) {
      const { data: ads } = await supabase.from("ads").select("id, title, image_url").in("id", adIds);
      (ads || []).forEach((ad: any) => { adsById[Number(ad.id)] = ad; });
    }
    const otherIds = [...new Set(rows.map((row: any) => row.buyer_id === session.user.id ? row.seller_id : row.buyer_id).filter(Boolean))];
    const { data: profileRows } = otherIds.length
      ? await supabase.from("profiles").select("id, display_name").in("id", otherIds)
      : { data: [] };
    const profileById: Record<string, string> = {};
    (profileRows || []).forEach((profile: any) => { profileById[profile.id] = profile.display_name; });
    const unreadResult = rows.length ? await supabase
      .from("messages")
      .select("conversation_id, sender_id, created_at")
      .in("conversation_id", rows.map((row: any) => row.id))
      .neq("sender_id", session.user.id) : { data: [], error: null };
    const unreadByChat: Record<string, boolean> = {};
    (unreadResult.data || []).forEach((message: any) => {
      const chat = rows.find((row: any) => row.id === message.conversation_id);
      if (!chat) return;
      const lastRead = chat.buyer_id === session.user.id
        ? chat.buyer_last_read_at
        : chat.seller_last_read_at;
      if (!lastRead || new Date(message.created_at).getTime() > new Date(lastRead).getTime()) {
        unreadByChat[message.conversation_id] = true;
      }
    });
    setConversations(rows.map((row: any) => ({
      ...row,
      adTitle: adsById[Number(row.ad_id)]?.title || "Объявление удалено",
      adImage: adsById[Number(row.ad_id)]?.image_url || "",
      otherUserId: row.buyer_id === session.user.id ? row.seller_id : row.buyer_id,
      otherUserName: profileById[row.buyer_id === session.user.id ? row.seller_id : row.buyer_id] || "Пользователь SAT KZ",
      hasUnread: !!unreadByChat[row.id],
    })));
    setChatLoading(false);
  };

  const openConversation = async (conversation: any) => {
    setActiveConversation({
      id: conversation.id,
      adId: Number(conversation.ad_id),
      adTitle: conversation.adTitle,
      sellerId: conversation.seller_id,
      otherUserId: conversation.otherUserId || (conversation.buyer_id === session?.user?.id ? conversation.seller_id : conversation.buyer_id),
      otherUserName: conversation.otherUserName || "Пользователь SAT KZ",
    });
    setChatLoading(true);
    await loadChatMessages(conversation.id);
    await markConversationRead(conversation.id);
    setChatLoading(false);
  };

  const sendChatMessage = async () => {
    const body = chatDraft.trim();
    if (!body || !activeConversation || !session?.user?.id || sendingMessage) return;
    setSendingMessage(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: activeConversation.id, sender_id: session.user.id, body })
      .select("id, sender_id, body, created_at")
      .single();
    setSendingMessage(false);
    if (error) {
      Alert.alert("Ошибка", "Не удалось отправить сообщение.");
      return;
    }
    setChatMessages((current) => [...current, data]);
    setChatDraft("");
    loadConversations();
    loadUnreadCount();
  };

  useEffect(() => {
    if (tab === "Сообщения" && session?.user?.id) loadConversations();
    if (session?.user?.id) loadUnreadCount();
  }, [tab, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const timer = setInterval(loadUnreadCount, 8000);
    return () => clearInterval(timer);
  }, [session?.user?.id]);

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

  const loadMyAds = async () => {
    if (!session?.user?.id) return;
    setMyAdsLoading(true);
    const { data, error } = await supabase
      .from("ads")
      .select("id, user_id, title, description, phone, price, city, category, image_url, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setMyAdsLoading(false);
    if (error) {
      Alert.alert("Ошибка", "Не удалось загрузить ваши объявления.");
      return;
    }
    setMyAds((data || []).map((item) => ({
      id: Number(item.id),
      userId: item.user_id || "",
      title: item.title || "Без названия",
      price: item.price !== null ? Number(item.price).toLocaleString("ru-RU") + " ₸" : "Цена не указана",
      city: item.city || "Казахстан",
      category: item.category || "",
      emoji: getEmoji(item.category || ""),
      time: formatTime(item.created_at),
      description: item.description || "",
      phone: item.phone || "",
      imageUrls: (() => { try { const v = JSON.parse(item.image_url || "[]"); return Array.isArray(v) ? v : item.image_url ? [item.image_url] : []; } catch { return item.image_url ? [item.image_url] : []; } })(),
    })));
  };

  const pickAdImages = async () => {
    const remaining = 10 - existingImages.length - adImages.length;
    if (remaining <= 0) {
      Alert.alert("Лимит фотографий", "Можно добавить не больше 10 фотографий.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled) setAdImages((current) => [...current, ...result.assets].slice(0, remaining));
  };

  const beginEditAd = (item: Listing) => {
    setEditingAdId(item.id);
    setAdTitle(item.title);
    setAdDescription(item.description);
    setAdPrice(item.price.replace(/[^0-9,]/g, "").replace(",", "."));
    setAdCity(item.city);
    setAdCategory(item.category || "Недвижимость");
    setAdPhone(item.phone);
    setExistingImages(item.imageUrls || []);
    setAdImages([]);
    setTab("Добавить");
  };

  const uploadAdImages = async () => {
    const uploaded: string[] = [];
    for (const asset of adImages) {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const ext = (asset.fileName?.split(".").pop() || "jpg").toLowerCase();
      const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("ad-images").upload(path, blob, {
        contentType: asset.mimeType || "image/jpeg",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("ad-images").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    return [...existingImages, ...uploaded].slice(0, 10);
  };

  const deleteMyAd = async () => {
    if (deleteAdId === null || !session?.user?.id) return;
    setDeletingAd(true);
    const { error } = await supabase.from("ads").delete().eq("id", deleteAdId).eq("user_id", session.user.id);
    setDeletingAd(false);
    if (error) {
      setDeleteAdId(null);
      Alert.alert("Не удалось удалить", error.message);
      return;
    }
    setMyAds((current) => current.filter((item) => item.id !== deleteAdId));
    setListings((current) => current.filter((item) => item.id !== deleteAdId));
    setDeleteAdId(null);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Ошибка", error.message);
    else Alert.alert("Вы вышли", "Вы вышли из аккаунта SAT KZ.");
  };

  const chooseProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) setProfilePhoto(result.assets[0]);
  };

  const saveProfileName = async () => {
    const cleanName = profileName.trim();
    if (!cleanName) {
      Alert.alert("Укажите имя", "Введите имя для профиля.");
      return;
    }
    if (!session?.user?.id) return;
    setProfileSaving(true);
    let nextAvatarUrl = profileAvatarUrl;
    try {
      if (profilePhoto) {
        const response = await fetch(profilePhoto.uri);
        const blob = await response.blob();
        const ext = (profilePhoto.fileName?.split(".").pop() || "jpg").toLowerCase();
        const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, blob, {
          contentType: profilePhoto.mimeType || "image/jpeg",
          upsert: true,
        });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from("profile-photos").getPublicUrl(path);
        nextAvatarUrl = publicData.publicUrl;
      }
      const { data, error } = await supabase.auth.updateUser({ data: { display_name: cleanName } });
      if (error) throw error;
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: session.user.id,
        display_name: cleanName,
        phone: profilePhone.trim() || null,
        city: profileCity.trim() || null,
        avatar_url: nextAvatarUrl || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (profileError) throw profileError;
      setProfileAvatarUrl(nextAvatarUrl);
      setProfilePhoto(null);
      setSession((current: any) => current ? { ...current, user: data.user } : current);
      setProfileEditing(false);
      Alert.alert("Готово", "Данные профиля сохранены.");
    } catch (error: any) {
      Alert.alert("Не удалось сохранить", error?.message || "Проверьте подключение и попробуйте ещё раз.");
    } finally {
      setProfileSaving(false);
    }
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
    let imageUrls: string[] = [];
    try {
      imageUrls = await uploadAdImages();
    } catch (uploadError: any) {
      setSavingAd(false);
      Alert.alert("Ошибка загрузки фото", uploadError?.message || "Не удалось загрузить фотографии.");
      return;
    }
    const adPayload = {
      user_id: session.user.id,
      title: cleanTitle,
      description: adDescription.trim(),
      price: numericPrice,
      city: adCity,
      category: adCategory,
      phone: cleanPhone,
      image_url: JSON.stringify(imageUrls),
    };
    const { error } = editingAdId
      ? await supabase.from("ads").update(adPayload).eq("id", editingAdId).eq("user_id", session.user.id)
      : await supabase.from("ads").insert(adPayload);

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
    setAdImages([]);
    setExistingImages([]);
    setEditingAdId(null);
    await loadListings();
    setTab("Главная");
    Alert.alert("Готово", "Объявление опубликовано.");
  };

  const chooseCity = () => setCityPickerVisible(true);

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
                onPress={() => showAdDetails(item)}
              >
                <View style={styles.listingImage}>
                  {item.imageUrls?.[0] ? <Image source={{ uri: item.imageUrls[0] }} style={styles.listingPhoto} /> : <Text style={styles.listingEmoji}>{item.emoji}</Text>}
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
                  style={[styles.favorite, item.userId === session?.user?.id && { opacity: 0.25 }]}
                  disabled={item.userId === session?.user?.id}
                  onPress={() => toggleFavorite(item)}
                >
                  <Ionicons
                    name={favoriteIds.includes(item.id) ? "heart" : "heart-outline"}
                    size={21}
                    color={favoriteIds.includes(item.id) ? "#F36B32" : "#68707C"}
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
          <Pressable onPress={() => { setTab(editingAdId ? "Профиль" : "Главная"); setEditingAdId(null); setAdImages([]); setExistingImages([]); }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={19} color="#20242B" />
            <Text style={styles.backButtonText}>Назад</Text>
          </Pressable>
          <Text style={styles.formTitle}>{editingAdId ? "Редактировать объявление" : "Новое объявление"}</Text>
          <Text style={styles.formHint}>Расскажите покупателям, что вы продаёте</Text>

          <Text style={styles.fieldLabel}>Фотографии (до 10)</Text>
          <Pressable style={styles.photoPicker} onPress={pickAdImages}>
            <Ionicons name="images-outline" size={22} color="#F36B32" />
            <Text style={styles.photoPickerText}>Добавить фотографии ({existingImages.length + adImages.length}/10)</Text>
          </Pressable>
          <View style={styles.photoRow}>
            {existingImages.map((uri) => <Image key={uri} source={{ uri }} style={styles.photoThumb} />)}
            {adImages.map((asset, index) => <Image key={asset.uri + index} source={{ uri: asset.uri }} style={styles.photoThumb} />)}
          </View>
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
              <Text style={styles.publishButtonText}>{editingAdId ? "Сохранить изменения" : "Опубликовать объявление"}</Text>
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
                {profilePhoto?.uri || profileAvatarUrl ? (
                  <Image source={{ uri: profilePhoto?.uri || profileAvatarUrl }} style={{ width: 88, height: 88, borderRadius: 44, marginBottom: 10 }} />
                ) : (
                  <Ionicons name="person-circle-outline" size={76} color="#F36B32" />
                )}
                <Text style={styles.profileEmail}>{profileName || "Пользователь SAT KZ"}</Text>
                <Text style={{ color: "#8B929D", fontSize: 12, marginBottom: 12 }}>{session.user.email || session.user.phone || ""}</Text>
                {profileEditing ? (
                  <>
                    <Pressable onPress={chooseProfilePhoto} style={{ alignSelf: "stretch", borderWidth: 1, borderColor: "#F36B32", borderRadius: 12, padding: 13, alignItems: "center", marginBottom: 8 }}>
                      <Text style={{ color: "#F36B32", fontWeight: "800" }}>{profilePhoto || profileAvatarUrl ? "Изменить фотографию" : "Добавить фотографию"}</Text>
                    </Pressable>
                    <Text style={[styles.fieldLabel, { alignSelf: "stretch", textAlign: "left" }]}>Имя</Text>
                    <TextInput value={profileName} onChangeText={setProfileName} placeholder="Как вас называть?" placeholderTextColor="#9AA1AC" style={[styles.formInput, { alignSelf: "stretch" }]} maxLength={40} />
                    <Text style={[styles.fieldLabel, { alignSelf: "stretch", textAlign: "left" }]}>Телефон</Text>
                    <TextInput value={profilePhone} onChangeText={setProfilePhone} placeholder="+7 700 000 00 00" placeholderTextColor="#9AA1AC" keyboardType="phone-pad" style={[styles.formInput, { alignSelf: "stretch" }]} maxLength={20} />
                    <Text style={[styles.fieldLabel, { alignSelf: "stretch", textAlign: "left" }]}>Город</Text>
                    <TextInput value={profileCity} onChangeText={setProfileCity} placeholder="Ваш город" placeholderTextColor="#9AA1AC" style={[styles.formInput, { alignSelf: "stretch" }]} maxLength={50} />
                    <Pressable style={[styles.publishButton, { alignSelf: "stretch", marginTop: 16 }]} onPress={saveProfileName} disabled={profileSaving}>
                      {profileSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishButtonText}>Сохранить профиль</Text>}
                    </Pressable>
                    <Pressable onPress={() => { setProfileEditing(false); setProfilePhoto(null); }} style={{ alignSelf: "center", padding: 10 }}>
                      <Text style={{ color: "#68707C", fontSize: 12, fontWeight: "700" }}>Отмена</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={{ color: "#20242B", fontSize: 16, fontWeight: "800", marginTop: 4 }}>{profileName || "Имя не указано"}</Text>
                    <Text style={{ color: "#68707C", fontSize: 13, marginTop: 6 }}>{profilePhone || "Телефон не указан"}</Text>
                    <Text style={{ color: "#68707C", fontSize: 13, marginTop: 4 }}>{profileCity || "Город не указан"}</Text>
                    <Pressable style={[styles.publishButton, { alignSelf: "stretch", marginTop: 14 }]} onPress={() => setProfileEditing(true)}>
                      <Text style={styles.publishButtonText}>Редактировать профиль</Text>
                    </Pressable>
                  </>
                )}
              </View>
              <Pressable style={styles.publishButton} onPress={loadMyAds}>
                <Text style={styles.publishButtonText}>Обновить мои объявления</Text>
              </Pressable>
              <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Мои объявления</Text>
              {myAdsLoading ? <ActivityIndicator color="#F36B32" /> : myAds.length === 0 ? (
                <Text style={styles.formHint}>У вас пока нет опубликованных объявлений. Нажмите «Обновить мои объявления».</Text>
              ) : myAds.map((item) => (
                <View key={item.id} style={[styles.listingCard, { marginBottom: 10 }]}>
                  <Pressable onPress={() => showAdDetails(item)} style={styles.listingImage}>{item.imageUrls?.[0] ? <Image source={{ uri: item.imageUrls[0] }} style={styles.listingPhoto} /> : <Text style={styles.listingEmoji}>{item.emoji}</Text>}</Pressable>
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingPrice}>{item.price}</Text>
                    <Text style={styles.listingTitle}>{item.title}</Text>
                    <Text style={styles.listingMeta}>{item.city} · {item.time}</Text>
                    <Pressable onPress={() => showAdDetails(item)} style={{ marginTop: 8 }}><Text style={{ color: "#F36B32", fontSize: 12, fontWeight: "800" }}>Посмотреть</Text></Pressable>
                    <Pressable onPress={() => beginEditAd(item)} style={{ marginTop: 8 }}><Text style={{ color: "#246BCE", fontSize: 12, fontWeight: "800" }}>Редактировать</Text></Pressable>
                    <Pressable onPress={() => setDeleteAdId(item.id)} style={{ marginTop: 8 }}><Text style={{ color: "#D93025", fontSize: 12, fontWeight: "800" }}>Удалить объявление</Text></Pressable>
                  </View>
                </View>
              ))}
              <Pressable style={[styles.publishButton, { backgroundColor: "#68707C" }]} onPress={signOut}>
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
      ) : tab === "Избранное" ? (
        <ScrollView contentContainerStyle={styles.formContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.formTitle}>Избранное</Text>
            <Pressable onPress={loadFavorites}><Text style={styles.seeAll}>Обновить</Text></Pressable>
          </View>
          {!session?.user?.id ? (
            <Text style={styles.formHint}>Войдите в аккаунт, чтобы сохранять объявления.</Text>
          ) : favoritesLoading ? (
            <ActivityIndicator size="large" color="#F36B32" />
          ) : listings.filter((item) => favoriteIds.includes(item.id)).length === 0 ? (
            <View style={styles.placeholderContent}>
              <Ionicons name="heart-outline" size={42} color="#F36B32" />
              <Text style={styles.formHint}>Здесь будут объявления, которые вы добавите в избранное.</Text>
            </View>
          ) : listings.filter((item) => favoriteIds.includes(item.id)).map((item) => (
            <View key={item.id} style={[styles.listingCard, { marginBottom: 10 }]}>
              <Pressable style={styles.listingImage} onPress={() => showAdDetails(item)}>
                {item.imageUrls?.[0] ? <Image source={{ uri: item.imageUrls[0] }} style={styles.listingPhoto} /> : <Text style={styles.listingEmoji}>{item.emoji}</Text>}
              </Pressable>
              <Pressable style={styles.listingInfo} onPress={() => showAdDetails(item)}>
                <Text style={styles.listingPrice}>{item.price}</Text>
                <Text style={styles.listingTitle}>{item.title}</Text>
                <Text style={styles.listingMeta}>{item.city} · {item.time}</Text>
              </Pressable>
              <Pressable style={styles.favorite} onPress={() => toggleFavorite(item)}>
                <Ionicons name="heart" size={21} color="#F36B32" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          {activeConversation ? (
            <>
              <View style={styles.sectionHeader}>
                <Pressable onPress={() => { setActiveConversation(null); loadConversations(); }}>
                  <Text style={styles.seeAll}>‹ Все переписки</Text>
                </Pressable>
                <Pressable onPress={() => loadChatMessages(activeConversation.id)}>
                  <Text style={styles.seeAll}>Обновить</Text>
                </Pressable>
              </View>
              <Text style={styles.formTitle}>{activeConversation.adTitle}</Text>
              <Text style={{ color: "#42658A", fontSize: 13, fontWeight: "700", marginTop: 5, marginBottom: 4 }}>
                Собеседник: {activeConversation.otherUserName || "Пользователь SAT KZ"}
              </Text>
              {chatLoading ? <ActivityIndicator color="#F36B32" /> : (
                <View style={{ gap: 9, marginTop: 12, marginBottom: 18 }}>
                  {chatMessages.length === 0 ? <Text style={styles.formHint}>Начните переписку — напишите первое сообщение.</Text> : chatMessages.map((message) => (
                    <View key={message.id} style={{ alignSelf: message.sender_id === session?.user?.id ? "flex-end" : "flex-start", maxWidth: "85%", backgroundColor: message.sender_id === session?.user?.id ? "#FFF0E9" : "#F2F3F5", borderRadius: 14, padding: 12 }}>
                      <Text style={{ color: message.sender_id === session?.user?.id ? "#F36B32" : "#42658A", fontSize: 11, fontWeight: "800", marginBottom: 5 }}>{message.sender_id === session?.user?.id ? "Вы отправили" : (chatProfiles[message.sender_id] || activeConversation.otherUserName || "Пользователь SAT KZ")}</Text>
                      <Text style={{ color: "#20242B", fontSize: 14 }}>{message.body}</Text>
                      <Text style={{ color: "#9299A3", fontSize: 10, marginTop: 5 }}>{new Date(message.created_at).toLocaleString("ru-RU")}</Text>
                    </View>
                  ))}
                </View>
              )}
              <TextInput value={chatDraft} onChangeText={setChatDraft} placeholder="Напишите сообщение..." placeholderTextColor="#9AA1AC" style={styles.formInput} multiline />
              <Pressable style={[styles.publishButton, (!chatDraft.trim() || sendingMessage) && styles.publishButtonDisabled]} onPress={sendChatMessage} disabled={!chatDraft.trim() || sendingMessage}>
                {sendingMessage ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishButtonText}>Отправить</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.formTitle}>Сообщения</Text>
                <Pressable onPress={loadConversations}><Text style={styles.seeAll}>Обновить</Text></Pressable>
              </View>
              {!session?.user?.id ? <Text style={styles.formHint}>Войдите в аккаунт, чтобы пользоваться сообщениями.</Text> : chatLoading ? <ActivityIndicator size="large" color="#F36B32" /> : conversations.length === 0 ? (
                <View style={styles.placeholderContent}>
                  <Ionicons name="chatbubble-ellipses-outline" size={42} color="#F36B32" />
                  <Text style={styles.formHint}>Пока нет переписок. Откройте любое объявление и нажмите «Написать продавцу».</Text>
                </View>
              ) : conversations.map((conversation) => (
                <Pressable key={conversation.id} onPress={() => openConversation(conversation)} style={[styles.listingCard, { marginBottom: 10, backgroundColor: conversation.hasUnread ? "#FFF2E9" : "#FFFFFF", borderWidth: conversation.hasUnread ? 1.5 : 1, borderColor: conversation.hasUnread ? "#F36B32" : "#E8EAED" }]}>
                  <View style={[styles.listingImage, { overflow: "hidden" }]}>
                    {conversation.adImage ? <Image source={{ uri: (() => { try { const v = JSON.parse(conversation.adImage); return Array.isArray(v) ? v[0] : conversation.adImage; } catch { return conversation.adImage; } })() }} style={styles.listingPhoto} /> : <Ionicons name="chatbubble-outline" size={28} color="#F36B32" />}
                  </View>
                  <View style={styles.listingInfo}>
                    <Text style={[styles.listingTitle, conversation.hasUnread && { fontWeight: "900", color: "#D94F1B" }]}>{conversation.adTitle}</Text>
                    <Text style={[styles.listingMeta, conversation.hasUnread && { color: "#D94F1B", fontWeight: "800" }]}>{conversation.hasUnread ? "● Новое сообщение" : conversation.otherUserName}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9299A3" />
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      )}

      <Modal visible={cityPickerVisible} transparent animationType="fade" onRequestClose={() => setCityPickerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.citySheet}>
            <View style={styles.citySheetHeader}>
              <Text style={styles.detailsTitle}>Выберите город</Text>
              <Pressable onPress={() => setCityPickerVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#20242B" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {cities.map((city) => (
                <Pressable key={city} style={styles.cityOption} onPress={() => { setSelectedCity(city); setCityPickerVisible(false); }}>
                  <Text style={[styles.cityOptionText, selectedCity === city && styles.cityOptionTextActive]}>{city}</Text>
                  {selectedCity === city ? <Ionicons name="checkmark-circle" size={21} color="#F36B32" /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteAdId !== null} transparent animationType="fade" onRequestClose={() => setDeleteAdId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmSheet}>
            <Text style={styles.detailsTitle}>Удалить объявление?</Text>
            <Text style={styles.formHint}>Это действие нельзя отменить.</Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.cancelButton} onPress={() => setDeleteAdId(null)} disabled={deletingAd}>
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={deleteMyAd} disabled={deletingAd}>
                {deletingAd ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishButtonText}>Удалить</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedListing} transparent animationType="slide" onRequestClose={() => setSelectedListing(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailsSheet}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: "88%" }} keyboardShouldPersistTaps="handled">
              <Pressable style={styles.modalClose} onPress={() => setSelectedListing(null)}>
                <Ionicons name="close" size={25} color="#20242B" />
              </Pressable>
              {selectedListing?.imageUrls?.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>{selectedListing.imageUrls.map((uri) => <Image key={uri} source={{ uri }} style={styles.detailsPhoto} />)}</ScrollView> : null}
              <Text style={styles.detailsTitle}>{selectedListing?.title}</Text>
              <Text style={styles.detailsPrice}>{selectedListing?.price}</Text>
              <Text style={styles.detailsMeta}>{selectedListing?.city} · {selectedListing?.time}</Text>
              <Text style={styles.detailsLabel}>Описание</Text>
              <Text style={styles.detailsDescription}>{selectedListing?.description || "Описание не указано"}</Text>
              <Text style={styles.detailsLabel}>Телефон продавца</Text>
              <Text style={styles.detailsDescription}>{selectedListing?.phone || "Не указан"}</Text>
              <Text style={styles.detailsLabel}>Продавец</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                {sellerProfile?.avatar_url ? <Image source={{ uri: sellerProfile.avatar_url }} style={{ width: 42, height: 42, borderRadius: 21, marginRight: 10 }} /> : <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#F1F2F4", alignItems: "center", justifyContent: "center", marginRight: 10 }}><Ionicons name="person" size={21} color="#9299A3" /></View>}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#20242B", fontWeight: "800", fontSize: 15 }}>{sellerProfile?.display_name || "Пользователь SAT KZ"}</Text>
                  <Text style={{ color: "#9299A3", fontSize: 12 }}>{sellerProfile?.city || selectedListing?.city || ""}</Text>
                </View>
              </View>
              <Text style={{ color: "#F36B32", fontWeight: "900", fontSize: 16, marginBottom: 8 }}>
                {sellerReviews.length ? "★ " + (sellerReviews.reduce((sum, review) => sum + review.rating, 0) / sellerReviews.length).toFixed(1) + " · " + sellerReviews.length + " отзыв(ов)" : "Пока нет отзывов"}
              </Text>
              {selectedListing?.userId && selectedListing.userId !== session?.user?.id ? (
                <Pressable onPress={showReportOptions} disabled={reportSaving} style={{ alignSelf: "flex-start", paddingVertical: 9, marginBottom: 4 }}>
                  <Text style={{ color: "#D94F1B", fontSize: 13, fontWeight: "700" }}>{reportSaving ? "Отправка жалобы..." : "⚑ Пожаловаться на объявление"}</Text>
                </Pressable>
              ) : null}
              <Text style={styles.detailsLabel}>Отзывы покупателей</Text>
              {sellerReviews.map((review) => (
                <View key={review.id} style={{ paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#F0F1F3" }}>
                  <Text style={{ color: "#20242B", fontWeight: "800", fontSize: 13 }}>{review.reviewerName} · <Text style={{ color: "#F36B32" }}>{"★".repeat(review.rating)}</Text></Text>
                  <Text style={styles.detailsDescription}>{review.comment}</Text>
                  {review.reviewer_id === session?.user?.id ? <Pressable onPress={deleteSellerReview} style={{ alignSelf: "flex-start", paddingVertical: 6 }}><Text style={{ color: "#D94F1B", fontSize: 12, fontWeight: "700" }}>Удалить мой отзыв</Text></Pressable> : null}
                </View>
              ))}
              {selectedListing?.userId && selectedListing.userId !== session?.user?.id ? <>
                <Text style={styles.detailsLabel}>{sellerReviews.some((review) => review.reviewer_id === session?.user?.id) ? "Изменить свой отзыв" : "Оставить отзыв"}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map((star) => <Pressable key={star} onPress={() => setReviewRating(star)}><Text style={{ fontSize: 30, color: star <= reviewRating ? "#F5A623" : "#D9DDE3" }}>★</Text></Pressable>)}
                </View>
                <TextInput value={reviewComment} onChangeText={setReviewComment} placeholder="Напишите отзыв о продавце..." multiline style={{ minHeight: 76, borderWidth: 1, borderColor: "#E3E6EA", borderRadius: 12, padding: 12, textAlignVertical: "top", color: "#20242B", marginBottom: 10 }} />
                <Pressable style={styles.publishButton} onPress={saveSellerReview} disabled={reviewSaving}>
                  {reviewSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishButtonText}>Сохранить отзыв</Text>}
                </Pressable>
              </> : null}
              {selectedListing?.userId && selectedListing.userId !== session?.user?.id ? <Pressable style={styles.publishButton} onPress={() => openChat(selectedListing)}>
                <Text style={styles.publishButtonText}>Написать продавцу</Text>
              </Pressable> : null}
              {selectedListing?.phone ? <Pressable style={[styles.publishButton, { backgroundColor: "#20242B" }]} onPress={() => Linking.openURL(`tel:${selectedListing.phone}`).catch(() => Alert.alert("Ошибка", "Не удалось открыть приложение телефона."))}>
                <Text style={styles.publishButtonText}>Позвонить продавцу</Text>
              </Pressable> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
            <View style={{ position: "relative" }}>
              <Ionicons
                name={icon}
                size={label === "Добавить" ? 29 : 22}
                color={tab === label ? "#F36B32" : "#8B929D"}
              />
              {label === "Сообщения" && unreadCount > 0 ? (
                <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View>
              ) : null}
            </View>
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
  backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 7, paddingVertical: 8, paddingHorizontal: 4, marginBottom: 10 },
  backButtonText: { color: "#20242B", fontSize: 14, fontWeight: "700" },
  citySheet: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, margin: 24, maxHeight: "75%" },
  citySheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cityOption: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: "#EEF0F2", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  cityOptionText: { color: "#343A43", fontSize: 14, fontWeight: "600" },
  cityOptionTextActive: { color: "#F36B32", fontWeight: "800" },
  confirmSheet: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 22, margin: 24 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelButton: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: "#F1F2F4", alignItems: "center", justifyContent: "center" },
  cancelButtonText: { color: "#20242B", fontSize: 14, fontWeight: "800" },
  deleteButton: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: "#D93025", alignItems: "center", justifyContent: "center" },
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
  listingPhoto: { width: "100%", height: "100%", borderRadius: 12 },
  detailsPhoto: { width: 260, height: 210, borderRadius: 14, marginRight: 10 },
  photoPicker: { minHeight: 52, borderWidth: 1, borderStyle: "dashed", borderColor: "#F36B32", borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 10 },
  photoPickerText: { color: "#F36B32", fontSize: 13, fontWeight: "800" },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoThumb: { width: 66, height: 66, borderRadius: 9 },
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
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  detailsSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34, minHeight: 300 },
  modalClose: { alignSelf: "flex-end", padding: 4, marginBottom: 8 },
  detailsTitle: { color: "#20242B", fontSize: 22, fontWeight: "900", marginBottom: 10 },
  detailsPrice: { color: "#F36B32", fontSize: 21, fontWeight: "900", marginBottom: 5 },
  detailsMeta: { color: "#9299A3", fontSize: 12, marginBottom: 20 },
  detailsLabel: { color: "#20242B", fontSize: 14, fontWeight: "800", marginBottom: 6, marginTop: 12 },
  detailsDescription: { color: "#555D68", fontSize: 14, lineHeight: 21 },
  bottomBar: {
    height: 67,
    borderTopWidth: 1,
    borderTopColor: "#F0F1F3",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  unreadBadge: { position: "absolute", top: -7, right: -12, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: "#E53935", alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 1, borderColor: "#FFFFFF" },
  unreadBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabLabel: { color: "#9299A3", fontSize: 9, fontWeight: "600" },
  tabLabelActive: { color: "#F36B32" },
});
