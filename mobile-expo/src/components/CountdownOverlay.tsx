import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number>(3);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(c => c - 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(finishTimer);
    }
  }, [count, onComplete]);

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Text style={styles.countText}>
        {count > 0 ? count : 'CORTE! ⚔️'}
      </Text>
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
    backgroundColor: 'rgba(5, 5, 12, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 150,
  },
  countText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFD23F',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 61, 113, 0.8)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 14,
  },
});
