import { BrowserWindow, Menu } from 'electron';

/**
 * 
 * @param {import('electron').WebContents} sender 
 * @param {{label: string, command?: string}[]} items 
 */
export function popupContextMenu(sender, items) {
    return new Promise((resolve) => {
        /** @type {string|null} */
        let selectedCommand = null;

        /** @type {import('electron').MenuItemConstructorOptions[]} */
        const template = items.map((item => {
            if(item.label === 'separator'){
                return { type: 'separator' };
            }
            if(item.label === 'toggledevtools'){
                return { role: 'toggleDevTools'};
            }
            return {
                label: item.label,
                click: () => {
                    selectedCommand = item.command ? item.command : null;
                }
            };
        }));
        const menu = Menu.buildFromTemplate(template);
        menu.addListener('menu-will-close', () => {
            setTimeout(() => {
                resolve(selectedCommand);
            }, 50);
        });
        const win = BrowserWindow.fromWebContents(sender);
        if (win) {
            menu.popup({ window: win });
        }
    });
}
