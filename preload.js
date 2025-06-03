const { contextBridge, ipcRenderer } = require('electron');

/**
 * @file Preload script for Electron's renderer process.
 * Exposes specific IPC channels to the renderer process for secure communication
 * with the main process.
 */

contextBridge.exposeInMainWorld('electronAPI', {
    // Desejos
    /**
     * Sends a request to add a new desire to the database.
     * @param {object} desejo - The desire object to add.
     * @param {string} desejo.nome - Name of the desire.
     * @param {string} [desejo.url] - Optional URL for the desire.
     * @param {string} desejo.prioridade - Priority of the desire.
     * @returns {Promise<object>} A promise that resolves with the result of the add operation.
     *                           Expected to be {success: boolean, data?: any, error?: string}.
     */
    addDesejo: (desejo) => ipcRenderer.invoke('db-desejo-add', desejo),

    /**
     * Sends a request to retrieve all desires from the database.
     * @returns {Promise<object>} A promise that resolves with an array of desire objects.
     *                           Expected to be {success: boolean, data?: Array<object>, error?: string}.
     */
    getDesejos: () => ipcRenderer.invoke('db-desejos-get'),

    /**
     * Sends a request to remove a desire by its ID.
     * @param {number} id - The ID of the desire to remove.
     * @returns {Promise<object>} A promise that resolves with the result of the remove operation.
     *                           Expected to be {success: boolean, data?: any, error?: string}.
     */
    removeDesejo: (id) => ipcRenderer.invoke('db-desejo-remove', id),

    // Parcelamentos
    /**
     * Sends a request to add a new installment plan to the database.
     * @param {object} parcelamento - The installment plan object.
     * @param {string} parcelamento.nome_item - Name of the item.
     * @param {number} parcelamento.valor_total - Total value of the item.
     * @param {number} parcelamento.total_parcelas - Total number of installments.
     * @param {number} parcelamento.parcelas_pagas - Number of installments already paid.
     * @param {string} parcelamento.data_inicio - Start date of the installment plan.
     * @returns {Promise<object>} A promise that resolves with the result of the add operation.
     */
    addParcelamento: (parcelamento) => ipcRenderer.invoke('db-parcelamento-add', parcelamento),

    /**
     * Sends a request to retrieve all installment plans from the database.
     * @returns {Promise<object>} A promise that resolves with an array of installment plan objects.
     */
    getParcelamentos: () => ipcRenderer.invoke('db-parcelamentos-get'),

    /**
     * Sends a request to remove an installment plan by its ID.
     * @param {number} id - The ID of the installment plan to remove.
     * @returns {Promise<object>} A promise that resolves with the result of the remove operation.
     */
    removeParcelamento: (id) => ipcRenderer.invoke('db-parcelamento-remove', id),

    // Consulta e Histórico
    /**
     * Sends a request to manually search for offers for a given list of desires.
     * @param {Array<object>} listaDesejos - An array of desire objects to search offers for.
     * @returns {Promise<object>} A promise that resolves with the search results.
     *                           Expected to be {success: boolean, data?: Array<object>, error?: string}.
     */
    buscarOfertasManualmente: (listaDesejos) => ipcRenderer.invoke('app-buscar-ofertas', listaDesejos),

    /**
     * Sends a request to retrieve the quotation history.
     * @param {object} [filtro] - Optional filter criteria for the history.
     * @returns {Promise<object>} A promise that resolves with an array of history records.
     */
    getHistorico: (filtro) => ipcRenderer.invoke('db-historico-get', filtro),

    // Configurações
    /**
     * Sends a request to retrieve application configurations.
     * @returns {Promise<object>} A promise that resolves with the configuration object.
     */
    getConfiguracoes: () => ipcRenderer.invoke('db-config-get'),

    /**
     * Sends a request to save application configurations.
     * @param {object} configs - The configuration object to save.
     * @returns {Promise<object>} A promise that resolves with the result of the save operation.
     */
    saveConfiguracoes: (configs) => ipcRenderer.invoke('db-config-save', configs),

    // Notificações do Main para Renderer
    /**
     * Registers a callback function to be executed when an 'app-notification' event is received from the main process.
     * @param {Function} callback - The function to call with the notification data.
     *                             The callback will receive arguments like (event, ...args) from ipcRenderer.on,
     *                             but here we simplify to just pass ...args to the provided callback.
     */
    onNotification: (callback) => ipcRenderer.on('app-notification', (event, ...args) => callback(...args)),

    // Utility to open external links
    /**
     * Sends a request to the main process to open a URL in the default external browser.
     * @param {string} url - The URL to open.
     */
    openExternalLink: (url) => ipcRenderer.send('app-open-external-link', url),
});

console.log('preload.js loaded and electronAPI exposed.');
