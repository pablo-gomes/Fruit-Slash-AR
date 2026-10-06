import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameMode } from '../types';

interface GameHUDProps {
  score: number;
  lives: number;
  maxLives: number;
  combo: number;
  mode: GameMode;
  timeRemaining: number;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  lives,
  maxLives,
  combo,
  mode,
  timeRemaining,
  isCameraActive,
  onToggleCamera,
  onPause,
}) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top Bar */}
      <View style={styles.topRow} pointerEvents="box-none">
        {/* Pause Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onPause} activeOpacity={0.7}>
          <Ionicons name="pause" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Center Score */}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>PONTOS</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        {/* AR Camera Toggle Button */}
        <TouchableOpacity 
          style={[styles.iconButton, isCameraActive && styles.cameraActiveBtn]} 
          onPress={onToggleCamera}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isCameraActive ? "videocam" : "videocam-outline"} 
            size={22} 
            color={isCameraActive ? "#42E8FF" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Secondary Status Row (Lives / Timer / Combo) */}
      <View style={styles.statusRow} pointerEvents="none">
        {/* Lives (Classic & Bomb Rush) */}
        {mode !== 'zen' && mode !== 'time_attack' && (
          <View style={styles.livesRow}>
            {Array.from({ length: maxLives }).map((_, i) => (
              <Text key={i} style={[styles.heartText, i >= lives && styles.lostHeart]}>
                {i < lives ? '❤️' : '🖤'}
              </Text>
            ))}
          </View>
        )}

        {/* Timer (Time Attack & Zen) */}
        {(mode === 'time_attack' || mode === 'zen') && (
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={16} color="#FFD23F" />
            <Text style={styles.timerText}>{Math.ceil(timeRemaining)}s</Text>
          </View>
        )}

        {/* Combo Badge */}
        {combo > 1 && (
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>COMBO x{combo} 🔥</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 20, 35, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraActiveBtn: {
    borderColor: '#42E8FF',
    backgroundColor: 'rgba(66, 232, 255, 0.25)',
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 26, 0.82)',
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1.5,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  livesRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(15, 15, 26, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  heartText: {
    fontSize: 18,
  },
  lostHeart: {
    opacity: 0.35,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 15, 26, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 210, 63, 0.4)',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFD23F',
  },
  comboBadge: {
    backgroundColor: '#FF3D71',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#FF3D71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  comboText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
