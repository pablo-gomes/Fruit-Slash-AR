# 🍉 Fruit Slash AR (Mobile - Expo) ⚔️

Versão nativa mobile desenvolvida em **React Native + Expo** com suporte a **Realidade Aumentada (AR)** através da câmera, cortes por gestos táteis e feedback háptico.

---

## ✨ Funcionalidades Mobile

- **📸 Modo AR com Câmera Real:** As frutas voam pelo ambiente real da sua sala usando `expo-camera` (`CameraView`), com opção de alternar para fundo Dojo escuro a qualquer momento.
- **⚔️ Cortes Fluidos por Toque (Swipe):** Rastro de lâmina neon brilhante desenhado em tempo real com `react-native-svg` acompanhando seus dedos.
- **📳 Vibração e Feedback Háptico:** Resposta tátil ao cortar frutas, fazer combos e estourar bombas com `expo-haptics`.
- **4 Modos de Jogo:**
  - **Clássico:** 3 vidas, bombas ocasionais e frutas especiais.
  - **Contra o Relógio:** 60 segundos de pontuação acelerada.
  - **Chuva de Bombas:** 1 vida e reflexos afiados.
  - **Modo Zen:** Sem bombas, 90 segundos para relaxar cortando frutas.
- **🌟 Frutas Especiais:**
  - 🌟 **Fruta Dourada:** Ativa o modo Frenesi com chuva de frutas e bônus.
  - ❄️ **Fruta Gelo:** Câmera lenta temporária.
  - ❤️ **Fruta Vida:** Recupera um coração perdido.
- **🗡️ Loja de Lâminas:** Desbloqueie novos estilos (Katana, Plasma Neon, Lâmina de Fogo, Raio Elétrico, Corte Aquático e Prisma Cósmico) usando as moedas acumuladas.
- **💾 Salvamento Automático:** Recordes, moedas e lâminas salvas com `@react-native-async-storage/async-storage`.

---

## 🚀 Como Executar

### 1. Iniciar o servidor Expo

Na pasta raiz do projeto:
```bash
npm run mobile
```

Ou diretamente dentro de `mobile-expo/`:
```bash
cd mobile-expo
npm start
```

### 2. Abrir no Celular com Expo Go

1. Instale o app **Expo Go** no seu smartphone (disponível na Google Play Store ou App Store).
2. Escaneie o **QR Code** gerado no terminal com a câmera do celular (iOS) ou com o app Expo Go (Android).
3. Conceda a permissão de câmera quando solicitada para ativar a Realidade Aumentada (AR).
