import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onGoHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onGoHome,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>JOGO PAUSADO</Text>
        <Text style={styles.subtitle}>Respire fundo antes do próximo combo!</Text>

        <View style={styles.buttonList}>
          <TouchableOpacity style={styles.resumeBtn} onPress={onResume} activeOpacity={0.85}>
            <Ionicons name="play" size={22} color="#FFFFFF" />
            <Text style={styles.resumeBtnText}>CONTINUAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onRestart} activeOpacity={0.8}>
            <Ionicons name="reload-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>REINICIAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onGoHome} activeOpacity={0.8}>
            <Ionicons name="home-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>MENU PRINCIPAL</Text>
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
    backgroundColor: 'rgba(5, 5, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 250,
  },
  card: {
    width: '100%',
    backgroundColor: '#141424',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8EA8',
    marginTop: 6,
    marginBottom: 24,
  },
  buttonList: {
    width: '100%',
    gap: 12,
  },
  resumeBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#42E8FF',
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#42E8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  resumeBtnText: {
    color: '#090914',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
