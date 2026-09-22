const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Restringir a resolução de módulos apenas ao node_modules deste projeto.
// Isso evita que o Metro suba para o diretório pai (Fruit-Slash-AR)
// e encontre o 'expo' instalado lá, que causa o erro "Unable to resolve ../../App".
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// Definir explicitamente o root do projeto
config.projectRoot = __dirname;

module.exports = config;
