import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameStats } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  isNewHighScore: boolean;
  onRestart: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewHighScore,
  onRestart,
  onGoHome,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Banner */}
        <Text style={styles.emojiBanner}>{isNewHighScore ? '👑' : '⚔️'}</Text>
        <Text style={styles.title}>{isNewHighScore ? 'NOVO RECORDE!' : 'FIM DE JOGO'}</Text>
        <Text style={styles.scoreText}>{stats.score} PTS</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>COMBO MÁXIMO</Text>
            <Text style={styles.statVal}>x{stats.maxCombo}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>FRUTAS CORTADAS</Text>
            <Text style={styles.statVal}>{stats.cutsCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>BOMBAS ACERTADAS</Text>
            <Text style={[styles.statVal, { color: '#FF3D71' }]}>{stats.bombsHit}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MOEDAS GANHAS</Text>
            <Text style={[styles.statVal, { color: '#FFD700' }]}>+{stats.coinsEarned} 🪙</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.8}>
            <Ionicons name="home-outline" size={22} color="#FFFFFF" />
            <Text style={styles.homeBtnText}>MENU</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.restartBtn} onPress={onRestart} activeOpacity={0.85}>
            <Ionicons name="reload" size={22} color="#FFFFFF" />
            <Text style={styles.restartBtnText}>JOGAR NOVAMENTE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 12, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 250,
  },
  card: {
    width: '100%',
    backgroundColor: '#141424',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 61, 113, 0.4)',
    padding: 24,
    alignItems: 'center',
  },
  emojiBanner: {
    fontSize: 48,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  scoreText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFD23F',
    marginVertical: 12,
    textShadowColor: 'rgba(255, 210, 63, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  statsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 14,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(22, 22, 40, 0.85)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statLabel: {
    fontSize: 10,
    color: '#8E8EA8',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  homeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 16,
    borderRadius: 18,
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  restartBtn: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF3D71',
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#FF3D71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  restartBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
});
