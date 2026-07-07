const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
};

const replacements = [
  // App.jsx backgrounds
  { from: /\bfrom-blue-50\b/g, to: 'from-neutral-50' },
  { from: /\bvia-white\b/g, to: 'via-white' },
  { from: /\bto-indigo-50\b/g, to: 'to-gray-200' },
  { from: /\bdark:from-gray-900\b/g, to: 'dark:from-[#121212]' },
  { from: /\bdark:via-gray-900\b/g, to: 'dark:via-[#121212]' },
  { from: /\bdark:to-indigo-950\b/g, to: 'dark:to-[#121212]' },
  
  // Gradients for header/icons
  { from: /\bfrom-blue-500\b/g, to: 'from-violet-600 dark:from-indigo-500' },
  { from: /\bto-indigo-600\b/g, to: 'to-purple-500 dark:to-violet-500' },
  
  // Primary Buttons & Highlights (bg)
  { from: /\bbg-blue-600\b/g, to: 'bg-violet-600 dark:bg-indigo-500' },
  { from: /\bhover:bg-blue-700\b/g, to: 'hover:bg-violet-700 dark:hover:bg-indigo-600' },
  { from: /\bbg-blue-500\b/g, to: 'bg-violet-600 dark:bg-indigo-500' },
  
  // Primary Text & Focus Highlights
  { from: /\btext-blue-600\b/g, to: 'text-violet-600' },
  { from: /\bdark:text-blue-400\b/g, to: 'dark:text-indigo-500' },
  { from: /\bhover:text-blue-600\b/g, to: 'hover:text-violet-600' },
  { from: /\bdark:hover:text-blue-400\b/g, to: 'dark:hover:text-indigo-500' },
  { from: /\bfocus:ring-blue-500\b/g, to: 'focus:ring-violet-600 dark:focus:ring-indigo-500' },
  { from: /\bfocus:border-blue-500\b/g, to: 'focus:border-violet-600 dark:focus:border-indigo-500' },
  { from: /\btext-blue-500\b/g, to: 'text-violet-600 dark:text-indigo-500' },
  
  // General Backgrounds
  { from: /\bbg-gray-50\b/g, to: 'bg-neutral-50' },
  { from: /\bdark:bg-gray-900\b/g, to: 'dark:bg-[#121212]' },
  { from: /\bdark:bg-gray-800\b/g, to: 'dark:bg-[#1E1E1E]' },
  { from: /\bdark:bg-gray-700\b/g, to: 'dark:bg-[#2A2A2A]' },
  
  // Text Colors
  { from: /\btext-gray-900\b/g, to: 'text-gray-800' },
  { from: /\bdark:text-white\b/g, to: 'dark:text-gray-50' },
  { from: /\bdark:text-gray-100\b/g, to: 'dark:text-gray-50' },
  { from: /\bdark:text-gray-200\b/g, to: 'dark:text-gray-50' },
  { from: /\bdark:text-gray-400\b/g, to: 'dark:text-slate-300' },
  { from: /\bdark:text-gray-300\b/g, to: 'dark:text-slate-300' },
  { from: /\btext-gray-400\b/g, to: 'text-gray-500' }, // Map some light gray text closer to requested secondary
  
  // Borders
  { from: /\bborder-gray-300\b/g, to: 'border-gray-200' },
  { from: /\bdark:border-gray-600\b/g, to: 'dark:border-gray-700' },
  
  // Purple Specific
  { from: /\btext-purple-500\b/g, to: 'text-purple-500 dark:text-violet-500' },
  { from: /\bfocus:ring-purple-500\b/g, to: 'focus:ring-purple-500 dark:focus:ring-violet-500' },
  { from: /\bbg-purple-50\b/g, to: 'bg-purple-50 dark:bg-[#1E1E1E]' }, // Adjust if used
  
  // Attendance Status Overrides
  // We need to match the specific green, red, yellow, purple classes
  { from: /\btext-yellow-500\b/g, to: 'text-yellow-400' },
  { from: /\btext-yellow-600\b/g, to: 'text-yellow-400' },
  { from: /\btext-yellow-700\b/g, to: 'text-yellow-400' },
  { from: /\bdark:text-yellow-400\b/g, to: 'dark:text-amber-400' },
  { from: /\bborder-yellow-500\b/g, to: 'border-yellow-400 dark:border-amber-400' },
  { from: /\bbg-yellow-100\b/g, to: 'bg-yellow-100 dark:bg-amber-900/30' },
  { from: /\bhover:text-yellow-600\b/g, to: 'hover:text-yellow-400 dark:hover:text-amber-400' },
  { from: /\bhover:bg-yellow-50\b/g, to: 'hover:bg-yellow-50 dark:hover:bg-amber-900/20' },
  
  { from: /\btext-purple-400\b/g, to: 'text-violet-500' },
  { from: /\btext-purple-700\b/g, to: 'text-violet-500' },
  { from: /\bdark:text-purple-400\b/g, to: 'dark:text-violet-400' },
  { from: /\bborder-purple-500\b/g, to: 'border-violet-500 dark:border-violet-400' },
  { from: /\bbg-purple-100\b/g, to: 'bg-violet-100 dark:bg-violet-900/30' },
  { from: /\bhover:text-purple-600\b/g, to: 'hover:text-violet-500 dark:hover:text-violet-400' },
  { from: /\bhover:bg-purple-50\b/g, to: 'hover:bg-violet-50 dark:hover:bg-violet-900/20' },

  { from: /\bbg-green-100\b/g, to: 'bg-green-100 dark:bg-green-900/30' },
  { from: /\bborder-green-500\b/g, to: 'border-green-500 dark:border-green-400' },
  { from: /\btext-green-600\b/g, to: 'text-green-500' },
  { from: /\btext-green-700\b/g, to: 'text-green-500' },
  { from: /\bhover:text-green-600\b/g, to: 'hover:text-green-500 dark:hover:text-green-400' },
  { from: /\bhover:bg-green-50\b/g, to: 'hover:bg-green-50 dark:hover:bg-green-900/20' },

  { from: /\bbg-red-100\b/g, to: 'bg-red-100 dark:bg-red-900/30' },
  { from: /\bborder-red-500\b/g, to: 'border-red-500 dark:border-red-400' },
  { from: /\btext-red-600\b/g, to: 'text-red-500' },
  { from: /\btext-red-700\b/g, to: 'text-red-500' },
  { from: /\bhover:text-red-600\b/g, to: 'hover:text-red-500 dark:hover:text-red-400' },
  { from: /\bhover:bg-red-50\b/g, to: 'hover:bg-red-50 dark:hover:bg-red-900/20' }
];

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  // Clean up any duplicated dark prefixes if they happened
  content = content.replace(/\bdark:dark:/g, 'dark:');
  fs.writeFileSync(file, content);
});

// Also update index.css glass styles
let css = fs.readFileSync('./src/index.css', 'utf8');
css = css.replace(/bg-white\/70/g, 'bg-[#FFFFFF]/70');
css = css.replace(/dark:bg-gray-900\/70/g, 'dark:bg-[#121212]/70');
css = css.replace(/bg-white\/80/g, 'bg-[#FFFFFF]/80');
css = css.replace(/dark:bg-gray-800\/80/g, 'dark:bg-[#1E1E1E]/80');
css = css.replace(/text-gray-900/g, 'text-[#1F2937] dark:text-[#F9FAFB]');
fs.writeFileSync('./src/index.css', css);

console.log("Precise replacement completed.");
