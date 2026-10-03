const { BrowserWindow } = require("electron");

const LOGIN_SESSTION_NAME = 'loginsession';
const baseUrl = 'https://account.nicovideo.jp/spa';
const loginUrl = `${baseUrl}/login/index.html`;
const logoutUrl = `${baseUrl}/logout/index.html`;

const showLoginWindow = () => {
    const win = createWindow(loginUrl);
    win.loadURL(loginUrl);
};

const showLogoutWindow = () => {
    const win = createWindow(logoutUrl);
    win.loadURL(logoutUrl);
};

const createWindow = (url) => {
    const win = new BrowserWindow({
        width: 600,
        height: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: false,
            spellcheck: false,
            sandbox: false,
            webviewTag: true,
            partition: LOGIN_SESSTION_NAME
        }
    });

    win.webContents.on('will-navigate', (event, url) => {
        event.preventDefault(); 
        win.close();
    });
    return win;
};

module.exports = {
    LOGIN_SESSTION_NAME,
    showLoginWindow,
    showLogoutWindow,
};