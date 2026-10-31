const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron')

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Discord P2P Clone',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    win.loadURL('http://localhost:5173')
}

// Canal de comunicação: O React vai chamar isto para pedir as janelas
ipcMain.handle('obter-janelas', async () => {
    // Captura ecrãs inteiros e janelas de programas específicos
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] })

    return sources.map(source => ({
        id: source.id,
        nome: source.name,
        miniatura: source.thumbnail.toDataURL() // Converte a imagem para o React conseguir desenhar
    }))
})

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})