const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const treeKill = require('tree-kill');
const fs = require('fs');
const os = require('os');
const http = require('http'); // Restore http

const logFile = path.join(app.getPath('userData'), 'app-debug.log');

// Global variables
let mainWindow;
let djangoProcess;

const DJANGO_PORT = 8000;
const REACT_DEV_URL = 'http://localhost:3000'; 
const IS_DEV = process.env.NODE_ENV === 'development';

function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `${timestamp}: ${message}\n`);
}

function createWindow() {
    logToFile('Creating window...');
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    // En producción cargamos el build de React, en dev podemos usar localhost si queremos
    // Por ahora asumimos producción: cargar index.html local
    // O podemos cargar la URL del backend si Django sirve el frontend, 
    // pero lo ideal en electron es cargar el archivo local.

    // ESTRATEGIA: Cargar index.html estático de React.
    // React se comunicará con http://localhost:8000 (Django).

    if (IS_DEV) {
        mainWindow.loadURL(REACT_DEV_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../frontend/build/index.html'));
    }

    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startDjango() {
    let backendExecutable;
    let backendArgs = [];
    let backendCwd;

    if (IS_DEV) {
        // Development: python manage.py runserver
        const backendPath = path.join(__dirname, '../backend');
        const isWin = process.platform === "win32";
        const pythonExec = path.join(backendPath, 'venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');
        const scriptPath = path.join(backendPath, 'src/manage.py');
        
        backendExecutable = pythonExec;
        backendArgs = [scriptPath, 'runserver', '0.0.0.0:' + DJANGO_PORT, '--noreload'];
        backendCwd = backendPath;
        console.log(`Starting Django (DEV) from ${scriptPath}...`);
    } else {
        // Production: backend/backend.exe runserver ...
        // Path relative to resources/app/electron/main.js -> resources/backend/backend.exe ??
        // In electron-builder, extraFiles are usually at root or resources.
        // Let's assume we copy backend/dist/backend to resources/backend
        
        // If we use 'files' in package.json to include 'backend/dist/backend', 
        // it will be inside app.asar (if asar=true) or app/backend/dist/backend.
        // Executables inside ASAR cannot be executed directly easily. 
        // Best practice: use extraResources to put it outside ASAR.
        
        const isWin = process.platform === "win32";
        const exeName = isWin ? 'backend.exe' : 'backend';
        
        // In production (bundled), __dirname is .../resources/app/electron
        // We will configure electron-builder to put backend in .../resources/backend
        const resourcesPath = process.resourcesPath; // .../resources
        const backendDir = path.join(resourcesPath, 'backend');
        backendExecutable = path.join(backendDir, exeName);
        
        backendArgs = ['runserver', '0.0.0.0:' + DJANGO_PORT, '--noreload'];
        backendCwd = backendDir;
        console.log(`Starting Django (PROD) from ${backendExecutable}...`);
        logToFile(`Starting Django (PROD) from ${backendExecutable} with CWD ${backendCwd}`);
    }

    try {
        djangoProcess = spawn(backendExecutable, backendArgs, {
            cwd: backendCwd,
            shell: false, 
        });

        djangoProcess.stdout.on('data', (data) => {
            console.log(`Django stdout: ${data}`);
            logToFile(`Django stdout: ${data}`);
        });

        djangoProcess.stderr.on('data', (data) => {
            console.error(`Django stderr: ${data}`);
            logToFile(`Django stderr: ${data}`);
        });

        djangoProcess.on('close', (code) => {
            console.log(`Django child process exited with code ${code}`);
            logToFile(`Django exited with code ${code}`);
        });

        djangoProcess.on('error', (err) => {
            console.error(`Django spawn error: ${err}`);
            logToFile(`Django spawn error: ${err}`);
        });
    } catch (e) {
        logToFile(`Exception spawning Django: ${e.message}`);
    }
}

function waitForDjango(callback) {
    const retryInterval = 500;
    let retries = 0;
    const maxRetries = 20;

    const check = () => {
        http.get(`http://127.0.0.1:${DJANGO_PORT}/admin/`, (res) => {
            console.log('Django is ready!');
            callback();
        }).on('error', (err) => {
            console.log('Waiting for Django...');
            retries++;
            if (retries < maxRetries) {
                setTimeout(check, retryInterval);
            } else {
                console.error('Timed out waiting for Django.');
                // Podríamos mostrar un error en la UI de Electron
            }
        });
    };
    check();
}

app.on('ready', () => {
    logToFile('App ready event triggered');
    startDjango();
    waitForDjango(() => {
        createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (djangoProcess) {
        console.log('Killing Django process...');
        treeKill(djangoProcess.pid);
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC handler example for Cash Drawer
ipcMain.handle('open-cash-drawer', async (event, arg) => {
    const fs = require('fs');
    const os = require('os');
    const { exec } = require('child_process');

    console.log('IPC: open-cash-drawer triggered');

    // ESC/POS Command to kick drawer (Pin 2, 50ms/500ms)
    // Decimal: 27 112 0 25 250
    const buffer = Buffer.from([27, 112, 0, 25, 250]);
    const tempFile = path.join(os.tmpdir(), 'drawer_kick.bin');

    try {
        fs.writeFileSync(tempFile, buffer);
        console.log(`Kick file created at ${tempFile}`);

        // Intento 1: Enviar a la impresora por defecto usando Powershell (Más compatible)
        // Nota: Esto asume que hay una impresora por defecto definida.
        const cmd = `powershell -Command "Start-Process -FilePath '${tempFile}' -Verb Print"`;

        // Intento 2 (Más directo para POS): Copiar a COM1 o LPT1 si estuviera definido
        // exec('copy /b ' + tempFile + ' LPT1'); // Uncomment if needed

        exec(cmd, (error, stdout, stderr) => {
            if (error) console.error(`Exec error: ${error}`);
            // console.log(`Stdout: ${stdout}`);
        });

        return { success: true, message: "Signal sent to default printer" };
    } catch (e) {
        console.error("Error opening drawer:", e);
        return { success: false, error: e.message };
    }
});
