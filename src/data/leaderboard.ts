import { LeaderboardEntry, GameMode } from '../types';

export const STORAGE_KEYS = {
  USERNAME: 'fruit_slash_ar_username',
  LEADERBOARD: 'fruit_slash_ar_leaderboard',
};

export const DEFAULT_USERNAME = 'Ninja Fruta 🍉';

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'hall-1',
    username: 'Sensei Ryu 🥋',
    score: 3450,
    mode: 'classic',
    maxCombo: 16,
    cutsCount: 154,
    accuracy: 96,
    bladeName: 'Katana Clássica',
    date: '2026-09-20',
    isPlayer: false,
  },
  {
    id: 'hall-2',
    username: 'Mestre Fruta 🍉',
    score: 2980,
    mode: 'fruit_rain',
    maxCombo: 18,
    cutsCount: 168,
    accuracy: 94,
    bladeName: 'Laser Ciberpunk',
    date: '2026-09-21',
    isPlayer: false,
  },
  {
    id: 'hall-3',
    username: 'Sakura Blade 🌸',
    score: 2540,
    mode: 'time_attack',
    maxCombo: 14,
    cutsCount: 112,
    accuracy: 92,
    bladeName: 'Lâmina de Fogo',
    date: '2026-09-22',
    isPlayer: false,
  },
  {
    id: 'hall-4',
    username: 'Shadow Shinobi 🥷',
    score: 2210,
    mode: 'zen',
    maxCombo: 15,
    cutsCount: 120,
    accuracy: 98,
    bladeName: 'Lâmina Sombria',
    date: '2026-09-23',
    isPlayer: false,
  },
  {
    id: 'hall-5',
    username: 'Bomb Defuser 💣',
    score: 1950,
    mode: 'bomb_rush',
    maxCombo: 10,
    cutsCount: 88,
    accuracy: 91,
    bladeName: 'Katana Clássica',
    date: '2026-09-24',
    isPlayer: false,
  },
  {
    id: 'hall-6',
    username: 'Cyber Ronin ⚡',
    score: 1620,
    mode: 'classic',
    maxCombo: 9,
    cutsCount: 80,
    accuracy: 89,
    bladeName: 'Laser Ciberpunk',
    date: '2026-09-24',
    isPlayer: false,
  },
  {
    id: 'hall-7',
    username: 'Kitsune Speed 🦊',
    score: 1480,
    mode: 'fruit_rain',
    maxCombo: 11,
    cutsCount: 76,
    accuracy: 88,
    bladeName: 'Lâmina Dourada',
    date: '2026-09-25',
    isPlayer: false,
  },
  {
    id: 'hall-8',
    username: 'Zen Monk 🍵',
    score: 1250,
    mode: 'zen',
    maxCombo: 8,
    cutsCount: 65,
    accuracy: 95,
    bladeName: 'Katana Clássica',
    date: '2026-09-25',
    isPlayer: false,
  },
];

export function getStoredUsername(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USERNAME);
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
  } catch (err) {
    console.warn('Erro ao carregar nome de usuário do localStorage', err);
  }
  return DEFAULT_USERNAME;
}

export function setStoredUsername(name: string): string {
  const cleanName = (name && name.trim().length > 0 ? name.trim() : DEFAULT_USERNAME).slice(0, 24);
  try {
    localStorage.setItem(STORAGE_KEYS.USERNAME, cleanName);
  } catch (err) {
    console.warn('Erro ao salvar nome de usuário no localStorage', err);
  }
  return cleanName;
}

export function getStoredLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar leaderboard do localStorage', err);
  }
  return [...INITIAL_LEADERBOARD];
}

export function saveStoredLeaderboard(entries: LeaderboardEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(entries));
  } catch (err) {
    console.warn('Erro ao salvar leaderboard no localStorage', err);
  }
}

export function recordScoreInLeaderboard(entry: {
  username: string;
  score: number;
  mode: GameMode;
  maxCombo: number;
  cutsCount: number;
  accuracy: number;
  bladeName: string;
}): { updatedList: LeaderboardEntry[]; rankPosition: number } {
  const current = getStoredLeaderboard();
  const dateFormatted = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const newEntry: LeaderboardEntry = {
    id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    username: entry.username || DEFAULT_USERNAME,
    score: entry.score,
    mode: entry.mode,
    maxCombo: entry.maxCombo,
    cutsCount: entry.cutsCount,
    accuracy: entry.accuracy,
    bladeName: entry.bladeName,
    date: dateFormatted,
    isPlayer: true,
  };

  // Combine and sort by score descending
  const combined = [...current, newEntry].sort((a, b) => b.score - a.score);

  // Keep top 50 global records to keep localStorage lightweight
  const trimmed = combined.slice(0, 50);
  saveStoredLeaderboard(trimmed);

  // Calculate rank position in this specific mode
  const modeRankList = trimmed.filter((item) => item.mode === entry.mode);
  const modeRankIndex = modeRankList.findIndex((item) => item.id === newEntry.id);
  const rankPosition = modeRankIndex !== -1 ? modeRankIndex + 1 : trimmed.findIndex((item) => item.id === newEntry.id) + 1;

  return {
    updatedList: trimmed,
    rankPosition: Math.max(1, rankPosition),
  };
}

export function resetStoredLeaderboard(): LeaderboardEntry[] {
  const defaults = [...INITIAL_LEADERBOARD];
  saveStoredLeaderboard(defaults);
  return defaults;
}
