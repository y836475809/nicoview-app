// eslint.config.js
import riotConfig from 'eslint-config-riot';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.js', '**/*.riot'],
    rules: {
      ...riotConfig.rules,
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'indent': ['error', 4],
      'semi': ['error', 'always'],
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // globals パッケージを使わず、直接必要な変数を true (書き換え可能) / false (読み取り専用) で定義
      globals: {
        // ブラウザ（Riot.js）用
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',

        // Node.js (Electron メインプロセス) 用
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
  }
];
