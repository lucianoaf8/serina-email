// Electron main process
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let pythonProcess = null;

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200, // Increased width for better layout
    height: 800, // Increased height
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false, // Important for security
      devTools: process.env.NODE_ENV !== 'production', // Enable DevTools only in development
    },
    frame: false, // Optional: if you want custom window controls via HTML/JS
    icon: path.join(__dirname, 'assets/icon.png') // Optional: if you have an icon
  });

  // Load the index.html of the app.
  // Assuming Vite dev server runs on 5173 or you build to renderer/dist/index.html
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173'); // For Vite dev server
    mainWindow.webContents.openDevTools(); // Open DevTools automatically in dev
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/dist/index.html'));
  }

  // IPC listeners for window controls
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('close-window', () => {
    mainWindow.close();
  });

  return mainWindow; // Return for potential further use
}

function startPythonBackend() {
  const pythonExecutable = process.platform === 'win32' 
    ? path.join(__dirname, 'backend', 'venv', 'Scripts', 'python.exe') 
    : path.join(__dirname, 'backend', 'venv', 'bin', 'python');
  
  const scriptArgs = ['-m', 'uvicorn', 'services.ipc_server:app', '--host', '127.0.0.1', '--port', '8000'];
  const CWD = path.join(__dirname, 'backend');

  console.log(`Starting Python backend: ${pythonExecutable} ${scriptArgs.join(' ')} in ${CWD}`);

  pythonProcess = spawn(pythonExecutable, scriptArgs, { cwd: CWD, stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
    // TODO: Check for a specific message indicating the server is ready
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on('error', (error) => {
    console.error(`Failed to start Python backend: ${error}`);
    pythonProcess = null;
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python backend process exited with code ${code}`);
    pythonProcess = null;
  });
}

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  if (pythonProcess) {
    console.log('Attempting to kill Python backend process...');
    pythonProcess.kill();
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Optional: Handle certificate errors for local development if needed
// app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
//   // Logic to trust specific certificates in development
//   event.preventDefault();
//   callback(true);
// });
