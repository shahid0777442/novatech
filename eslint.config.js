const js = require('@eslint/js');
module.exports = [
  js.configs.recommended,
  {
 { ignores: ['eslint.config.js'] },
    files: ['src/**/*.js', 'test/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: { process: 'readonly', console: 'readonly', require: 'readonly', module: 'readonly', __dirname: 'readonly' } },
    rules: { 'no-unused-vars': 'error', eqeqeq: 'error', 'no-console': 'off' }
  }
];
