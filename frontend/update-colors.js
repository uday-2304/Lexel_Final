/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'board');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Panel.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace colors
  content = content.replace(/indigo-/g, 'blue-');
  content = content.replace(/sky-/g, 'blue-');
  
  // Replace backgrounds
  content = content.replace(/bg-\[#1C1E3A\]/g, 'bg-[#10182A]'); // Repository Analyzer
  content = content.replace(/bg-\[#16273A\]/g, 'bg-[#10182A]'); // Development Studio

  // Ensure button is white/blue
  content = content.replace(
    /className="w-full py-3\.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"/g,
    'className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-200 text-blue-600 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"'
  );

  // Add fill="currentColor" to the Play icon if it's there
  content = content.replace(
    /<(Play|Check|Search) className={`w-4 h-4 \${isProcessing \? 'animate-pulse' : ''}`} \/>/g,
    '<$1 className={`w-4 h-4 ${isProcessing ? \'animate-pulse\' : \'\'}`} fill="currentColor" />'
  );

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Done replacing colors in panels');
