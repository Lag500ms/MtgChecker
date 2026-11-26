import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'en' | 'vi';
const LANGUAGE_STORAGE_KEY = 'mtgchecker.language.v1';

const translations = {
  en: {
    language: 'Language', english: 'English', vietnamese: 'Tiếng Việt',
    gameControl: 'Game Control', players: 'Players', startingLife: 'Starting life',
    firstPlayer: 'Roll for first player', firstPlayerHint: 'Each player sees a D20 result',
    diceCoin: 'Dice / Coin', undo: 'Undo', restart: 'Restart',
    exitTable: 'Exit table (match saved)', confirmReset: 'Start a new match?',
    resetDescription: 'This resets life, counters, commander damage, and history.',
    startNewMatch: 'Start new match', cancel: 'Cancel',
    player: 'Player', life: 'Life', counters: 'Counters', commanderDamage: 'Commander damage',
    poison: 'Poison', monarch: 'Monarch', initiative: 'Initiative',
    energy: 'Energy', experience: 'Experience', commanderTax: 'Commander tax',
    partnerTax: 'Partner tax', from: 'From', first: 'FIRST PLAYER', rollResult: 'D20 ROLL',
    defeated: 'ELIMINATED', settings: 'Player settings', name: 'Name',
    color: 'Player color', twoCommanders: 'Two commanders / Partner',
    save: 'Save', mainCommander: 'Commander', partner: 'Partner',
    lifeTracker: 'Life Tracker', matchHistory: 'Match history',
    poisonLoss: 'POISON 10+', commanderLoss: 'COMMANDER 21+',
    lifeLoss: 'LIFE 0', currentLife: 'Life total',
    back: 'Back', more: 'More', changeLife: 'Tap left − / right +. Hold for ±5.',
    configure: 'Settings', reset: 'Reset', noHistory: 'No changes yet',
    rollD20: 'Roll D20', rollD6: 'Roll D6', flipCoin: 'Flip coin',
    heads: 'Heads', tails: 'Tails', tapToRoll: 'Tap to roll',
    changePlayerCount: 'Switch player count?', safeToClose: 'Saved locally',
    miscTools: 'Table tools', currentLanguage: 'Current language',
  },
  vi: {
    language: 'Ngôn ngữ', english: 'English', vietnamese: 'Tiếng Việt',
    gameControl: 'Điều khiển bàn', players: 'Số người chơi', startingLife: 'Máu khởi đầu',
    firstPlayer: 'Chọn người đi trước', firstPlayerHint: 'Mỗi người hiện một kết quả D20',
    diceCoin: 'Xúc xắc / Xu', undo: 'Hoàn tác', restart: 'Chơi lại',
    exitTable: 'Thoát bàn (đã lưu ván)', confirmReset: 'Bắt đầu ván mới?',
    resetDescription: 'Sẽ đặt lại máu, counter, sát thương chỉ huy và nhật ký.',
    startNewMatch: 'Bắt đầu ván mới', cancel: 'Hủy',
    player: 'Người chơi', life: 'Máu', counters: 'Bộ đếm', commanderDamage: 'Sát thương chỉ huy',
    poison: 'Độc', monarch: 'Quân chủ', initiative: 'Chủ động',
    energy: 'Năng lượng', experience: 'Kinh nghiệm', commanderTax: 'Thuế chỉ huy',
    partnerTax: 'Thuế Partner', from: 'Từ', first: 'ĐI TRƯỚC', rollResult: 'KẾT QUẢ D20',
    defeated: 'BỊ LOẠI', settings: 'Thiết lập người chơi', name: 'Tên',
    color: 'Màu người chơi', twoCommanders: 'Hai chỉ huy / Partner',
    save: 'Lưu', mainCommander: 'Chỉ huy', partner: 'Partner',
    lifeTracker: 'Bảng tính máu', matchHistory: 'Nhật ký ván đấu',
    poisonLoss: 'ĐỘC 10+', commanderLoss: 'CHỈ HUY 21+',
    lifeLoss: 'HẾT MÁU', currentLife: 'Máu hiện tại',
    back: 'Quay lại', more: 'Thêm', changeLife: 'Chạm trái − / phải +. Giữ để ±5.',
    configure: 'Thiết lập', reset: 'Đặt lại', noHistory: 'Chưa có thay đổi',
    rollD20: 'Tung D20', rollD6: 'Tung D6', flipCoin: 'Tung đồng xu',
    heads: 'Ngửa', tails: 'Sấp', tapToRoll: 'Chạm để tung',
    changePlayerCount: 'Đổi số người chơi?', safeToClose: 'Đã lưu trên máy',
    miscTools: 'Công cụ bàn đấu', currentLanguage: 'Ngôn ngữ hiện tại',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (value: AppLanguage) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((value) => {
      if (mounted && (value === 'en' || value === 'vi')) setLanguageState(value);
    }).catch(() => {}).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (ready) {
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language).catch(() => {});
    }
  }, [language, ready]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (key) => translations[language][key],
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
