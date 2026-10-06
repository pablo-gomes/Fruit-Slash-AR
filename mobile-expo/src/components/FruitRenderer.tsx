import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SpawnedObject, JuiceParticle, FloatingText } from '../types';

interface FruitRendererProps {
  objects: SpawnedObject[];
  particles: JuiceParticle[];
  floatingTexts: FloatingText[];
  freezeActive: boolean;
  frenzyActive: boolean;
  width: number;
  height: number;
}

export const FruitRenderer: React.FC<FruitRendererProps> = ({
  objects,
  particles,
  floatingTexts,
  freezeActive,
  frenzyActive,
  width,
  height,
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Freeze Blue Tint Overlay */}
      {freezeActive && (
        <View 
          style={[
            StyleSheet.absoluteFill, 
            { backgroundColor: 'rgba(0, 210, 252, 0.18)' }
          ]} 
        />
      )}

      {/* Frenzy Border Glow */}
      {frenzyActive && (
        <View 
          style={[
            StyleSheet.absoluteFill, 
            { 
              borderWidth: 6, 
              borderColor: 'rgba(255, 215, 0, 0.5)', 
              backgroundColor: 'rgba(255, 61, 113, 0.08)' 
            }
          ]} 
        />
      )}

      {/* 1. Juice Splatter Particles */}
      {particles.map(p => (
        <View
          key={p.id}
          style={[
            styles.particle,
            {
              left: p.x - p.radius,
              top: p.y - p.radius,
              width: p.radius * 2,
              height: p.radius * 2,
              borderRadius: p.radius,
              backgroundColor: p.color,
              opacity: p.alpha,
            },
          ]}
        />
      ))}

      {/* 2. Spawned Fruits & Halves */}
      {objects.map(obj => {
        if (!obj.sliced) {
          // Whole intact fruit
          const size = obj.radius * 2.2;
          return (
            <View
              key={obj.id}
              style={[
                styles.fruitContainer,
                {
                  left: obj.x - size / 2,
                  top: obj.y - size / 2,
                  width: size,
                  height: size,
                  transform: [{ rotate: `${obj.rotation}rad` }],
                },
              ]}
            >
              {/* Special Aura for Golden, Freeze, Heart */}
              {obj.type === 'golden' && (
                <View style={[styles.aura, { backgroundColor: 'rgba(255, 215, 0, 0.4)' }]} />
              )}
              {obj.type === 'freeze' && (
                <View style={[styles.aura, { backgroundColor: 'rgba(0, 210, 252, 0.45)' }]} />
              )}
              {obj.type === 'heart' && (
                <View style={[styles.aura, { backgroundColor: 'rgba(255, 20, 147, 0.45)' }]} />
              )}
              {obj.isBomb && (
                <View style={[styles.aura, { backgroundColor: 'rgba(255, 60, 60, 0.35)' }]} />
              )}

              <Text style={{ fontSize: size * 0.72 }}>
                {obj.emoji}
              </Text>
            </View>
          );
        } else if (obj.halves) {
          // Sliced into two halves flying apart
          const size = obj.radius * 2.2;
          const h = obj.halves;

          return (
            <React.Fragment key={obj.id}>
              {/* Half 1 */}
              <View
                style={[
                  styles.fruitContainer,
                  styles.halfWrapper,
                  {
                    left: h.x1 - size / 2,
                    top: h.y1 - size / 2,
                    width: size,
                    height: size,
                    transform: [{ rotate: `${h.rot1}rad` }, { scale: 0.95 }],
                  },
                ]}
              >
                <Text style={{ fontSize: size * 0.72, opacity: 0.9 }}>
                  {obj.emoji}
                </Text>
              </View>

              {/* Half 2 */}
              <View
                style={[
                  styles.fruitContainer,
                  styles.halfWrapper,
                  {
                    left: h.x2 - size / 2,
                    top: h.y2 - size / 2,
                    width: size,
                    height: size,
                    transform: [{ rotate: `${h.rot2}rad` }, { scale: 0.95 }],
                  },
                ]}
              >
                <Text style={{ fontSize: size * 0.72, opacity: 0.9 }}>
                  {obj.emoji}
                </Text>
              </View>
            </React.Fragment>
          );
        }
        return null;
      })}

      {/* 3. Floating Score / Combo Texts */}
      {floatingTexts.map(ft => (
        <View
          key={ft.id}
          style={[
            styles.floatingTextContainer,
            {
              left: ft.x - 70,
              top: ft.y - 20,
              opacity: ft.alpha,
            },
          ]}
        >
          <Text
            style={[
              styles.floatingText,
              {
                color: ft.color,
                textShadowColor: 'rgba(0, 0, 0, 0.9)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              },
            ]}
          >
            {ft.text}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
  fruitContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfWrapper: {
    overflow: 'hidden',
  },
  aura: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  floatingTextContainer: {
    position: 'absolute',
    width: 140,
    alignItems: 'center',
  },
  floatingText: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
});
