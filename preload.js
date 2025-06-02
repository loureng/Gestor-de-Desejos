const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Desejos
    addDesejo: (desejo) => ipcRenderer.invoke('db-desejo-add', desejo),
    getDesejos: () => ipcRenderer.invoke('db-desejos-get'),
    removeDesejo: (id) => ipcRenderer.invoke('db-desejo-remove', id),

    // Parcelamentos
    addParcelamento: (parcelamento) => ipcRenderer.invoke('db-parcelamento-add', parcelamento),
    getParcelamentos: () => ipcRenderer.invoke('db-parcelamentos-get'),
    removeParcelamento: (id) => ipcRenderer.invoke('db-parcelamento-remove', id),

    // Consulta e Histórico
    buscarOfertasManualmente: (listaDesejos) => ipcRenderer.invoke('app-buscar-ofertas', listaDesejos),
    getHistorico: (filtro) => ipcRenderer.invoke('db-historico-get', filtro), // 'filtro' might be unused initially

    // Configurações
    getConfiguracoes: () => ipcRenderer.invoke('db-config-get'),
    saveConfiguracoes: (configs) => ipcRenderer.invoke('db-config-save', configs),

    // Notificações do Main para Renderer
    onNotification: (callback) => ipcRenderer.on('app-notification', (event, ...args) => callback(...args)),
    
    // Utility to open external links
    openExternalLink: (url) => ipcRenderer.send('app-open-external-link', url)
});

console.log('preload.js loaded and electronAPI exposed.');
