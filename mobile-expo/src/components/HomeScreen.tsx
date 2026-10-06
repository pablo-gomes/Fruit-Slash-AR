import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameMode } from '../types';

interface HomeScreenProps {
  onStartGame: (mode: GameMode) => void;
  onOpenShop: () => void;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  highScore: number;
  coins: number;
  isCameraActive: boolean;
  onToggleCamera: () => void;
}

const MODES: { id: GameMode; title: string; desc: string; icon: string; color: string }[] = [
  {
    id: 'classic',
    title: 'Clássico',
    desc: '3 Vidas. Corte todas as frutas e evite as bombas!',
    icon: 'flame-outline',
    color: '#FF3D71',
  },
  {
    id: 'time_attack',
    title: 'Contra o Relógio',
    desc: '60 segundos de pura adrenalina e combos.',
    icon: 'stopwatch-outline',
    color: '#FFD23F',
  },
  {
    id: 'bomb_rush',
    title: 'Chuva de Bombas',
    desc: '1 Vida! Reflexos extremos para evitar o perigo.',
    icon: 'skull-outline',
    color: '#FF5722',
  },
  {
    id: 'zen',
    title: 'Modo Zen',
    desc: 'Sem bombas ou vidas perdidas. Apenas corte!',
    icon: 'leaf-outline',
    color: '#00E676',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartGame,
  onOpenShop,
  selectedMode,
  onSelectMode,
  highScore,
  coins,
  isCameraActive,
  onToggleCamera,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Bar Stats */}
      <View style={styles.topStats}>
        <View style={styles.statPill}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.statValue}>{coins}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.arButton, isCameraActive && styles.arButtonActive]}
          onPress={onToggleCamera}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isCameraActive ? "videocam" : "videocam-outline"} 
            size={18} 
            color={isCameraActive ? "#42E8FF" : "#AAAAAA"} 
          />
          <Text style={[styles.arButtonText, isCameraActive && styles.arButtonTextActive]}>
            AR Câmera: {isCameraActive ? 'LIGADA' : 'DESLIGADA'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hero Title */}
      <View style={styles.heroSection}>
        <Text style={styles.emojiRow}>🍉 ⚔️ 🍊</Text>
        <Text style={styles.title}>FRUIT SLASH</Text>
        <Text style={styles.subtitle}>REALIDADE AUMENTADA</Text>
        <View style={styles.highScoreBadge}>
          <Text style={styles.highScoreLabel}>🏆 RECORDE</Text>
          <Text style={styles.highScoreValue}>{highScore} pts</Text>
        </View>
      </View>

      {/* Mode Selector */}
      <Text style={styles.sectionHeader}>ESCOLHA O MODO DE JOGO</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeScroll}
      >
        {MODES.map(m => {
          const isSelected = selectedMode === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.modeCard,
                isSelected && { borderColor: m.color, backgroundColor: 'rgba(30, 25, 55, 0.9)' },
              ]}
              onPress={() => onSelectMode(m.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.modeIconCircle, { backgroundColor: m.color }]}>
                <Ionicons name={m.icon as any} size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.modeTitle}>{m.title}</Text>
              <Text style={styles.modeDesc}>{m.desc}</Text>
              {isSelected && (
                <View style={[styles.selectedPill, { backgroundColor: m.color }]}>
                  <Text style={styles.selectedPillText}>SELECIONADO</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={() => onStartGame(selectedMode)}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={26} color="#FFFFFF" />
          <Text style={styles.playButtonText}>JOGAR AGORA</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.shopButton} 
          onPress={onOpenShop}
          activeOpacity={0.75}
        >
          <Ionicons name="color-wand-outline" size={22} color="#42E8FF" />
          <Text style={styles.shopButtonText}>LOJA DE LÂMINAS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  topStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 35, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 6,
  },
  coinIcon: {
    fontSize: 16,
  },
  statValue: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 16,
  },
  arButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 20, 35, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  arButtonActive: {
    borderColor: '#42E8FF',
    backgroundColor: 'rgba(66, 232, 255, 0.2)',
  },
  arButtonText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '700',
  },
  arButtonTextActive: {
    color: '#42E8FF',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  emojiRow: {
    fontSize: 42,
    marginBottom: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 61, 113, 0.75)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#42E8FF',
    letterSpacing: 4,
    marginTop: 4,
  },
  highScoreBadge: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  highScoreLabel: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 12,
  },
  highScoreValue: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  sectionHeader: {
    color: '#8E8EA8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  modeScroll: {
    gap: 12,
    paddingVertical: 6,
  },
  modeCard: {
    width: 170,
    backgroundColor: 'rgba(20, 20, 35, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
  },
  modeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modeTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  modeDesc: {
    color: '#A0A0B8',
    fontSize: 11,
    lineHeight: 15,
  },
  selectedPill: {
    marginTop: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bottomActions: {
    gap: 12,
    marginTop: 10,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FF3D71',
    paddingVertical: 18,
    borderRadius: 22,
    shadowColor: '#FF3D71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 20, 35, 0.85)',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#42E8FF',
  },
  shopButtonText: {
    color: '#42E8FF',
    fontSize: 15,
    fontWeight: '800',
  },
});
