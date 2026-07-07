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
    } else if (file.endsWith('.jsx') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Background Gradients (App.jsx)
  content = content.replace(/from-blue-50 via-white to-indigo-50/g, 'bg-[#FAFAFA]');
  content = content.replace(/dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/g, 'dark:bg-[#121212]');
  
  // App Bar / Global Headers / Primary Gradients
  content = content.replace(/from-blue-500 to-indigo-600/g, 'from-violet-600 to-purple-500 dark:from-indigo-500 dark:to-violet-500');
  content = content.replace(/from-gray-900 to-gray-600/g, 'from-gray-800 to-gray-500');
  
  // Text Colors
  content = content.replace(/text-gray-900/g, 'text-gray-800');
  content = content.replace(/dark:text-white/g, 'dark:text-gray-50');
  content = content.replace(/dark:text-gray-100/g, 'dark:text-gray-50');
  content = content.replace(/dark:text-gray-200/g, 'dark:text-gray-50');
  content = content.replace(/dark:text-gray-400/g, 'dark:text-slate-300');
  content = content.replace(/dark:text-gray-300/g, 'dark:text-slate-300');
  
  // Primary Buttons / Highlights
  content = content.replace(/bg-blue-600 hover:bg-blue-700/g, 'bg-violet-600 hover:bg-violet-700 dark:bg-indigo-500 dark:hover:bg-indigo-600');
  content = content.replace(/bg-blue-500/g, 'bg-violet-600 dark:bg-indigo-500');
  content = content.replace(/text-blue-600/g, 'text-violet-600');
  content = content.replace(/dark:text-blue-400/g, 'dark:text-indigo-500');
  content = content.replace(/hover:text-blue-600/g, 'hover:text-violet-600');
  content = content.replace(/dark:hover:text-blue-400/g, 'dark:hover:text-indigo-500');
  content = content.replace(/focus:ring-blue-500/g, 'focus:ring-violet-600 dark:focus:ring-indigo-500');
  content = content.replace(/focus:border-blue-500/g, 'focus:border-violet-600 dark:focus:border-indigo-500');
  content = content.replace(/text-blue-500/g, 'text-violet-600 dark:text-indigo-500');
  
  // Backgrounds and Surfaces
  content = content.replace(/bg-gray-50/g, 'bg-[#FAFAFA]');
  content = content.replace(/dark:bg-gray-900/g, 'dark:bg-[#121212]');
  content = content.replace(/dark:bg-gray-800/g, 'dark:bg-[#1E1E1E]');
  content = content.replace(/dark:bg-gray-700/g, 'dark:bg-[#2A2A2A]');
  content = content.replace(/bg-white/g, 'bg-[#FFFFFF]'); // Safe replacement for normal classes
  
  // Borders
  content = content.replace(/border-gray-200/g, 'border-gray-200');
  content = content.replace(/border-gray-300/g, 'border-gray-200');
  content = content.replace(/dark:border-gray-700/g, 'dark:border-gray-700');
  content = content.replace(/dark:border-gray-600/g, 'dark:border-gray-700');
  
  // Accents / Secondary specific changes
  content = content.replace(/text-purple-500/g, 'text-purple-500 dark:text-violet-500');
  content = content.replace(/focus:ring-purple-500/g, 'focus:ring-purple-500 dark:focus:ring-violet-500');
  
  // Fix multiple dark: classes that might have been duplicated
  content = content.replace(/dark:dark:/g, 'dark:');
  
  // Status Colors Mapping
  // Present
  content = content.replace(/text-green-500/g, 'text-green-500 dark:text-green-400');
  content = content.replace(/text-green-600/g, 'text-green-500 dark:text-green-400');
  content = content.replace(/text-green-700/g, 'text-green-500 dark:text-green-400');
  content = content.replace(/border-green-500/g, 'border-green-500 dark:border-green-400');
  content = content.replace(/bg-green-100/g, 'bg-green-100 dark:bg-green-900/40');
  content = content.replace(/hover:text-green-600/g, 'hover:text-green-500 dark:hover:text-green-400');
  
  // Absent
  content = content.replace(/text-red-500/g, 'text-red-500 dark:text-red-400');
  content = content.replace(/text-red-600/g, 'text-red-500 dark:text-red-400');
  content = content.replace(/text-red-700/g, 'text-red-500 dark:text-red-400');
  content = content.replace(/border-red-500/g, 'border-red-500 dark:border-red-400');
  content = content.replace(/bg-red-100/g, 'bg-red-100 dark:bg-red-900/40');
  content = content.replace(/hover:text-red-600/g, 'hover:text-red-500 dark:hover:text-red-400');
  
  // Late
  content = content.replace(/text-yellow-500/g, 'text-yellow-400 dark:text-amber-400');
  content = content.replace(/text-yellow-600/g, 'text-yellow-400 dark:text-amber-400');
  content = content.replace(/text-yellow-700/g, 'text-yellow-400 dark:text-amber-400');
  content = content.replace(/border-yellow-500/g, 'border-yellow-400 dark:border-amber-400');
  content = content.replace(/bg-yellow-100/g, 'bg-yellow-100 dark:bg-amber-900/40');
  content = content.replace(/hover:text-yellow-600/g, 'hover:text-yellow-400 dark:hover:text-amber-400');
  
  // Leave
  content = content.replace(/text-purple-400/g, 'text-violet-500 dark:text-violet-400');
  content = content.replace(/text-purple-700/g, 'text-violet-500 dark:text-violet-400');
  content = content.replace(/text-purple-600/g, 'text-violet-500 dark:text-violet-400');
  content = content.replace(/hover:text-purple-600/g, 'hover:text-violet-500 dark:hover:text-violet-400');
  content = content.replace(/bg-purple-100/g, 'bg-violet-100 dark:bg-violet-900/40');

  // Fix up specific issues where replace might duplicate dark classes
  content = content.replace(/dark:dark:/g, 'dark:');
  
  fs.writeFileSync(file, content);
});
console.log("Colors successfully replaced.");
