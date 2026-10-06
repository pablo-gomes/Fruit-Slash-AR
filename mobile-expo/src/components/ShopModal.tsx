import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BladeStyle } from '../types';

interface ShopModalProps {
  blades: BladeStyle[];
  activeBladeId: string;
  coins: number;
  onSelectBlade: (bladeId: string) => void;
  onBuyBlade: (blade: BladeStyle) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  blades,
  activeBladeId,
  coins,
  onSelectBlade,
  onBuyBlade,
  onClose,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>DOJO DE LÂMINAS</Text>
            <Text style={styles.subtitle}>Desbloqueie novas lâminas e rastros de corte</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Coins display */}
        <View style={styles.coinsRow}>
          <Text style={styles.coinsLabel}>SEU SALDO:</Text>
          <View style={styles.coinsPill}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinText}>{coins}</Text>
          </View>
        </View>

        {/* Blade List */}
        <ScrollView contentContainerStyle={styles.bladeList} showsVerticalScrollIndicator={false}>
          {blades.map(blade => {
            const isEquipped = activeBladeId === blade.id;
            const canAfford = coins >= blade.price;

            return (
              <View 
                key={blade.id} 
                style={[
                  styles.bladeCard, 
                  isEquipped && { borderColor: blade.color, borderWidth: 2 }
                ]}
              >
                <View style={styles.bladeLeft}>
                  {/* Blade Color Circle Preview */}
                  <View style={[styles.bladeColorCircle, { backgroundColor: blade.color, shadowColor: blade.color }]}>
                    <Ionicons name="flash" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.bladeInfo}>
                    <Text style={styles.bladeName}>{blade.name}</Text>
                    <Text style={styles.bladeDesc}>{blade.description}</Text>
                  </View>
                </View>

                {/* Action button */}
                {blade.unlocked ? (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      isEquipped ? styles.equippedBtn : styles.equipBtn,
                    ]}
                    onPress={() => onSelectBlade(blade.id)}
                    disabled={isEquipped}
                  >
                    <Text style={[styles.actionBtnText, isEquipped && { color: '#00E676' }]}>
                      {isEquipped ? 'EQUIPADA' : 'EQUIPAR'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      canAfford ? styles.buyBtn : styles.lockedBtn,
                    ]}
                    onPress={() => onBuyBlade(blade)}
                    disabled={!canAfford}
                  >
                    <Text style={styles.coinIconSmall}>🪙</Text>
                    <Text style={styles.actionBtnText}>{blade.price}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
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
    padding: 20,
    zIndex: 200,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#131322',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8EA8',
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 38, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  coinsLabel: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '800',
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinIcon: {
    fontSize: 18,
  },
  coinText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '900',
  },
  bladeList: {
    gap: 12,
  },
  bladeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 22, 40, 0.9)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bladeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  bladeColorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  bladeInfo: {
    flex: 1,
  },
  bladeName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  bladeDesc: {
    color: '#8E8EA8',
    fontSize: 11,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 90,
  },
  equipBtn: {
    backgroundColor: '#42E8FF',
  },
  equippedBtn: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: '#00E676',
  },
  buyBtn: {
    backgroundColor: '#FFD700',
    gap: 4,
  },
  lockedBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  actionBtnText: {
    color: '#0B0B14',
    fontWeight: '900',
    fontSize: 13,
  },
  coinIconSmall: {
    fontSize: 14,
  },
});
