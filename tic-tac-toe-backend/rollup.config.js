const resolve = require('@rollup/plugin-node-resolve');
const commonJS = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: './src/main.ts',
  output: {
    file: 'build/index.js',
    format: 'cjs',
    strict: false,
  },
  plugins: [
    resolve(),
    commonJS(),
    typescript()
  ],
};
