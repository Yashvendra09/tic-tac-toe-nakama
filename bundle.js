const fs = require('fs');
const path = require('path');
const files = [
  'tic-tac-toe-backend/src/main.ts',
  'tic-tac-toe-backend/src/match_handler.ts',
  'tic-tac-toe-backend/docker-compose.yml',
  'tic-tac-toe-backend/package.json',
  'tic-tac-toe-backend/tsconfig.json',
  'tic-tac-toe-backend/rollup.config.js',
  'tic-tac-toe-frontend/src/App.tsx',
  'tic-tac-toe-frontend/src/index.css',
  'tic-tac-toe-frontend/src/lib/nakama.ts',
  'tic-tac-toe-frontend/package.json',
  'README.md',
  'assignment_explanation.txt'
];

let out = '';
for(let f of files) {
  try {
    const fullPath = path.join('c:/Users/yash2/lila', f);
    out += '==================================================\nFile: ' + f + '\n==================================================\n' + fs.readFileSync(fullPath, 'utf8') + '\n\n';
  } catch (e) {
    console.log("Could not read " + f);
  }
}
fs.writeFileSync('c:/Users/yash2/lila/codebase_01.txt', out);
console.log("Created codebase_01.txt!");
