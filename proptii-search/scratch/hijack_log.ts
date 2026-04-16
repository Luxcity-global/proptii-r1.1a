import fs from 'fs';
const origLog = console.log;
const origError = console.error;
const logFile = fs.createWriteStream('./scratch/backend_live.log', { flags: 'a' });
console.log = function() {
  logFile.write(Array.from(arguments).join(' ') + '\n');
  origLog.apply(console, arguments as any);
};
console.error = function() {
  logFile.write('ERROR: ' + Array.from(arguments).join(' ') + '\n');
  origError.apply(console, arguments as any);
};
