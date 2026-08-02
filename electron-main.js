const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // Load the frontend (handled by Vite during dev, but in production we can serve it from backend or load index.html)
  // For simplicity, we assume the backend serves the frontend from the root '/'
  win.loadURL('http://localhost:3001');
}

app.whenReady().then(() => {
  // Start the backend server
  const backendPath = path.join(__dirname, 'backend', 'server.js');
  backendProcess = spawn('node', [backendPath], { cwd: path.join(__dirname) });
  
  backendProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`));
  backendProcess.stderr.on('data', (data) => console.error(`Backend Error: ${data}`));

  // Give the backend a second to start before opening the window
  setTimeout(createWindow, 1500);
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) backendProcess.kill();
});
