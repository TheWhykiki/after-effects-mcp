// install-bridge.js
// Script to install the After Effects MCP Bridge to the ScriptUI Panels folder
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES Modules replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cross-platform After Effects installation paths
function getPossibleAfterEffectsPaths() {
  if (process.platform === 'win32') {
    return [
      'C:\\Program Files\\Adobe\\Adobe After Effects 2025',
      'C:\\Program Files\\Adobe\\Adobe After Effects 2024',
      'C:\\Program Files\\Adobe\\Adobe After Effects 2023',
      'C:\\Program Files\\Adobe\\Adobe After Effects 2022',
      'C:\\Program Files\\Adobe\\Adobe After Effects 2021'
    ];
  } else if (process.platform === 'darwin') {
    return [
      '/Applications/Adobe After Effects 2025',
      '/Applications/Adobe After Effects 2024',
      '/Applications/Adobe After Effects 2023',
      '/Applications/Adobe After Effects 2022',
      '/Applications/Adobe After Effects 2021'
    ];
  } else {
    // Linux or other platforms - After Effects is not officially supported
    return [];
  }
}

const possiblePaths = getPossibleAfterEffectsPaths();

// Check if After Effects is supported on this platform
if (possiblePaths.length === 0) {
  console.error('Error: After Effects is not officially supported on this platform.');
  console.error('After Effects is only available on Windows and macOS.');
  process.exit(1);
}

// Find valid After Effects installation
let afterEffectsPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    afterEffectsPath = testPath;
    break;
  }
}

if (!afterEffectsPath) {
  console.error('Error: Could not find After Effects installation.');
  console.error('Please manually copy the bridge script to your After Effects ScriptUI Panels folder.');
  console.error('Source: build/scripts/mcp-bridge-auto.jsx');
  if (process.platform === 'win32') {
    console.error('Target: C:\\Program Files\\Adobe\\Adobe After Effects [VERSION]\\Support Files\\Scripts\\ScriptUI Panels\\');
  } else if (process.platform === 'darwin') {
    console.error('Target: /Applications/Adobe After Effects [VERSION]/Scripts/ScriptUI Panels/');
  }
  process.exit(1);
}

// Define source and destination paths (cross-platform)
const sourceScript = path.join(__dirname, 'build', 'scripts', 'mcp-bridge-auto.jsx');
let destinationFolder;
if (process.platform === 'win32') {
  destinationFolder = path.join(afterEffectsPath, 'Support Files', 'Scripts', 'ScriptUI Panels');
} else if (process.platform === 'darwin') {
  destinationFolder = path.join(afterEffectsPath, 'Scripts', 'ScriptUI Panels');
}
const destinationScript = path.join(destinationFolder, 'mcp-bridge-auto.jsx');

// Ensure source script exists
if (!fs.existsSync(sourceScript)) {
  console.error(`Error: Source script not found at ${sourceScript}`);
  console.error('Please run "npm run build" first to generate the script.');
  process.exit(1);
}

// Create destination folder if it doesn't exist
if (!fs.existsSync(destinationFolder)) {
  try {
    fs.mkdirSync(destinationFolder, { recursive: true });
  } catch (error) {
    console.error(`Error creating destination folder: ${error.message}`);
    console.error('You may need administrative privileges to install the script.');
    process.exit(1);
  }
}

// Copy the script (cross-platform)
try {
  console.log(`Installing bridge script to ${destinationScript}...`);
  
  if (process.platform === 'win32') {
    // Windows: Try to use PowerShell with elevated privileges
    try {
      const command = `
        Start-Process PowerShell -Verb RunAs -ArgumentList "-Command Copy-Item -Path '${sourceScript.replace(/\\/g, '\\\\')}' -Destination '${destinationScript.replace(/\\/g, '\\\\')}' -Force"
      `;
      execSync(`powershell -Command "${command}"`, { stdio: 'inherit' });
    } catch (elevatedError) {
      // If elevated copy fails, try normal copy
      console.log('Elevated copy failed, trying normal copy...');
      fs.copyFileSync(sourceScript, destinationScript);
    }
  } else if (process.platform === 'darwin') {
    // macOS: Simple file copy (may need sudo for system directories)
    try {
      fs.copyFileSync(sourceScript, destinationScript);
    } catch (copyError) {
      // If normal copy fails, suggest using sudo
      console.error('Normal copy failed. Trying with elevated privileges...');
      execSync(`sudo cp "${sourceScript}" "${destinationScript}"`, { stdio: 'inherit' });
    }
  }
  
  console.log('Bridge script installed successfully!');
  console.log('\nImportant next steps:');
  console.log('1. Open After Effects');
  if (process.platform === 'win32') {
    console.log('2. Go to Edit > Preferences > Scripting & Expressions');
  } else if (process.platform === 'darwin') {
    console.log('2. Go to Adobe After Effects > Preferences > Scripting & Expressions');
  }
  console.log('3. Enable "Allow Scripts to Write Files and Access Network"');
  console.log('4. Restart After Effects');
  console.log('5. Open the bridge panel: Window > mcp-bridge-auto.jsx');
} catch (error) {
  console.error(`Error installing script: ${error.message}`);
  console.error('\nPlease try manual installation:');
  console.error(`1. Copy: ${sourceScript}`);
  console.error(`2. To: ${destinationScript}`);
  if (process.platform === 'win32') {
    console.error('3. You may need to run as administrator or use File Explorer with admin rights');
  } else if (process.platform === 'darwin') {
    console.error('3. You may need to use sudo or run with administrator privileges');
  }
  process.exit(1);
} 