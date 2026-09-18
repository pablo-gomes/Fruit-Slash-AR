import React, { useState } from 'react';
import { Smartphone, Copy, Check, Terminal, Code, Cpu, ExternalLink, X } from 'lucide-react';

interface ExpoGuideModalProps {
  onClose: () => void;
}

export const ExpoGuideModal: React.FC<ExpoGuideModalProps> = ({ onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const terminalCmd = `npx create-expo-app fruit-slash-ar --template blank-typescript
cd fruit-slash-ar
npx expo install expo-camera expo-gl react-native-reanimated nativewind tailwindcss
npx expo start`;

  const expoAppSnippet = `import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GLView } from 'expo-gl';

// Fruit Slash AR - Expo Go Main Component
export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [score, setScore] = useState(0);

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Fruit Slash AR requer acesso à câmera.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.btnText}>Permitir Câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="front" />
      {/* O motor de física e corte de Fruit Slash AR roda sobre a visualização */}
      <View style={styles.hud}>
        <Text style={styles.score}>Pontos: {score}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B12', justifyContent: 'center' },
  text: { color: '#FFF', textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#FF3D71', padding: 16, borderRadius: 12, marginHorizontal: 40 },
  btnText: { color: '#FFF', fontWeight: 'bold', textAlign: 'center' },
  hud: { position: 'absolute', top: 40, left: 20, zIndex: 10 },
  score: { color: '#FFD23F', fontSize: 24, fontWeight: '900' },
});`;

  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#12121E] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h2 className="font-arcade text-lg font-bold text-white tracking-wider">
              EXPO GO & FRAMEWORK INTEGRATION
            </h2>
          </div>
          <button
            id="btn-close-expo-guide"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-white/70 mb-4 leading-relaxed">
          Este projeto foi totalmente construído em <strong>React + TypeScript + Tailwind CSS</strong> seguindo a arquitetura oficial do <strong>Fruit Slash AR</strong> (Seção 49 da especificação). Toda a lógica modular dos sistemas (<code className="text-cyan-300">HandTracker.ts</code>, <code className="text-cyan-300">GameEngine.ts</code>, <code className="text-cyan-300">SoundEngine.ts</code>) foi projetada para execução direta no navegador e transposição imediata para o <strong>Expo Go</strong> em Android e iOS.
        </p>

        {/* Expo CLI Setup Commands */}
        <div className="bg-[#181828] border border-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" /> 1. Inicializar no Expo Go
            </span>
            <button
              onClick={() => copyToClipboard(terminalCmd, 1)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 1 ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="bg-black/50 p-3 rounded-lg text-[11px] font-mono text-cyan-200 overflow-x-auto select-all">
            {terminalCmd}
          </pre>
        </div>

        {/* Architecture Highlights */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#181828] border border-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-[#FF3D71]" />
              <span className="text-xs font-bold text-white">Visão Separada</span>
            </div>
            <p className="text-[11px] text-white/50">
              Conforme Seção 3 da especificação, o motor de visão é desacoplado da física, pronto para módulos nativos caso necessário.
            </p>
          </div>

          <div className="bg-[#181828] border border-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Code className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Tailwind CSS</span>
            </div>
            <p className="text-[11px] text-white/50">
              Suporte com NativeWind no Expo Go e Tailwind v4 no ambiente de testes em tempo real.
            </p>
          </div>
        </div>

        {/* Expo Native Component Code Snippet */}
        <div className="bg-[#181828] border border-white/5 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-emerald-400" /> Código Base para Expo Go
            </span>
            <button
              onClick={() => copyToClipboard(expoAppSnippet, 2)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedIndex === 2 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 2 ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="bg-black/50 p-3 rounded-lg text-[10px] font-mono text-emerald-200 overflow-x-auto max-h-40 select-all">
            {expoAppSnippet}
          </pre>
        </div>

        <button
          id="btn-close-expo-guide-bottom"
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-[#FF3D71] to-[#FF8811] hover:brightness-110 active:scale-98 rounded-xl font-arcade text-xs font-black text-white shadow-[0_0_15px_rgba(255,61,113,0.4)] transition-all cursor-pointer"
        >
          ENTENDIDO & CONTINUAR JOGANDO
        </button>
      </div>
    </div>
  );
};
