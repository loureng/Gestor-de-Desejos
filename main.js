const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron');
const path = require('path');
// const winston = require('winston'); // Winston is now managed in logger.js
const cron = require('node-cron');

// Import logger module
const logger = require('./src/utils/logger');

// Import database module (adjust path if necessary)
const dbModule = require('./src/database/db'); // Renamed to dbModule

// Import scraper modules
const amazonScraper = require('./src/scraper/amazonScraper');
const mercadoLivreScraper = require('./src/scraper/mercadoLivreScraper');

// --- Main Window Creation ---
/**
 * Main application window instance.
 * @type {BrowserWindow | null}
 */
let mainWindow;

/**
 * Creates and loads the main application window.
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Recommended for security
            nodeIntegration: false, // Recommended for security
        },
    });

    mainWindow.loadFile('index.html');

    // Open DevTools - Remove for production
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    logger.info('MainWindow created and loaded index.html');
}

// --- Electron App Lifecycle ---
app.whenReady().then(() => {
    logger.info('App is ready.');

    // Initialize database with the correct path
    try {
        const dbPath = path.join(app.getPath('userData'), 'gestor_desejos.db');
        dbModule.initDb(dbPath); // Call the exported initDb function
        logger.info(`Database initialized at ${dbPath}`);
    } catch (error) {
        logger.error(`Failed to initialize database in main.js: ${error.message}`);
        // This is a critical error. The application might not function correctly without the database.
        // Future improvements could include showing a user-friendly error dialog and possibly quitting the app.
        // For now, the error is logged, and the app attempts to continue, which might lead to issues later.
        // Example for future:
        // const { dialog } = require('electron');
        // dialog.showErrorBox('Erro Crítico de Banco de Dados', `Não foi possível iniciar o banco de dados: ${error.message}\nO aplicativo será encerrado.`);
        // app.quit();
        // return; // Important to prevent further execution if quitting
    }

    logger.info('Creating window...');
    createWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- IPC Handlers ---

// Desejos
/**
 * Handles adding a new desire.
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {object} desejo - The desire object to add.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} Result of the operation.
 */
ipcMain.handle('db-desejo-add', async (event, desejo) => {
    try {
        logger.info(`Handling db-desejo-add: ${JSON.stringify(desejo)}`);
        const result = dbModule.addDesejo(desejo);
        return { success: true, data: result };
    } catch (error) {
        logger.error(`Error in db-desejo-add: ${error.message}`);
        return { success: false, error: error.message };
    }
});

/**
 * Handles fetching all desires.
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>} Result of the operation.
 */
ipcMain.handle('db-desejos-get', async () => {
    try {
        logger.info('Handling db-desejos-get');
        const desejos = dbModule.getDesejos();
        return { success: true, data: desejos };
    } catch (error) {
        logger.error(`Error in db-desejos-get: ${error.message}`);
        return { success: false, error: error.message };
    }
});

/**
 * Handles removing a desire by its ID.
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {number} id - The ID of the desire to remove.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} Result of the operation.
 */
ipcMain.handle('db-desejo-remove', async (event, id) => {
    try {
        logger.info(`Handling db-desejo-remove: id=${id}`);
        const result = dbModule.removeDesejo(id);
        return { success: true, data: result };
    } catch (error) {
        logger.error(`Error in db-desejo-remove: ${error.message}`);
        return { success: false, error: error.message };
    }
});

// Parcelamentos
/**
 * Handles adding a new installment plan.
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {object} parcelamento - The installment plan object to add.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} Result of the operation.
 */
ipcMain.handle('db-parcelamento-add', async (event, parcelamento) => {
    try {
        logger.info(`Handling db-parcelamento-add: ${JSON.stringify(parcelamento)}`);
        const result = dbModule.addParcelamento(parcelamento);
        return { success: true, data: result };
    } catch (error) {
        logger.error(`Error in db-parcelamento-add: ${error.message}`);
        return { success: false, error: error.message };
    }
});

/**
 * Handles fetching all installment plans.
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>} Result of the operation.
 */
ipcMain.handle('db-parcelamentos-get', async () => {
    try {
        logger.info('Handling db-parcelamentos-get');
        const parcelamentos = dbModule.getParcelamentos();
        return { success: true, data: parcelamentos };
    } catch (error) {
        logger.error(`Error in db-parcelamentos-get: ${error.message}`);
        return { success: false, error: error.message };
    }
});

/**
 * Handles removing an installment plan by its ID.
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {number} id - The ID of the installment plan to remove.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} Result of the operation.
 */
ipcMain.handle('db-parcelamento-remove', async (event, id) => {
    try {
        logger.info(`Handling db-parcelamento-remove: id=${id}`);
        const result = dbModule.removeParcelamento(id);
        return { success: true, data: result };
    } catch (error) {
        logger.error(`Error in db-parcelamento-remove: ${error.message}`);
        return { success: false, error: error.message };
    }
});

// Histórico
/**
 * Handles fetching quotation history.
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {object} filtro - Filter criteria (currently not implemented in db.js).
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>} Result of the operation.
 */
ipcMain.handle('db-historico-get', async (event, filtro) => {
    try {
        logger.info(`Handling db-historico-get: ${JSON.stringify(filtro)}`);
        const historico = dbModule.getHistorico(filtro);
        return { success: true, data: historico };
    } catch (error) {
        logger.error(`Error in db-historico-get: ${error.message}`);
        return { success: false, error: error.message };
    }
});

// Configurações
/**
 * Handles fetching application configurations.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} Result of the operation.
 */
ipcMain.handle('db-config-get', async () => {
    try {
        logger.info('Handling db-config-get');
        const configs = dbModule.getConfiguracoes();
        return { success: true, data: configs };
    } catch (error) {
        logger.error(`Error in db-config-get: ${error.message}`);
        // It's important getConfiguracoes returns defaults on error in db.js
        return { success: false, error: error.message, data: dbModule.getConfiguracoes() };
    }
});

/**
 * Handles saving application configurations.
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {object} configs - The configuration object to save.
 * @returns {Promise<{success: boolean, error?: string}>} Result of the operation.
 */
ipcMain.handle('db-config-save', async (event, configs) => {
    try {
        logger.info(`Handling db-config-save: ${JSON.stringify(configs)}`);
        dbModule.saveConfiguracoes(configs);
        if (mainWindow) {
            mainWindow.webContents.send('app-notification', {
                type: 'success',
                message: 'Configurações salvas com sucesso!',
            });
        }
        return { success: true };
    } catch (error) {
        logger.error(`Error in db-config-save: ${error.message}`);
        if (mainWindow) {
            mainWindow.webContents.send('app-notification', {
                type: 'error',
                message: `Erro ao salvar configurações: ${error.message}`,
            });
        }
        return { success: false, error: error.message };
    }
});

// Consulta Manual de Ofertas
/**
 * Handles manual fetching of offers for a list of desires.
 * It calls scraper modules and saves results to history.
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event.
 * @param {Array<object>} listaDesejos - An array of desire objects to search offers for.
 * @returns {Promise<{success: boolean, data?: Array<object>, error?: string}>} Object containing success status, array of found offers, or error message.
 */
ipcMain.handle('app-buscar-ofertas', async (event, listaDesejos) => {
    logger.info(`Handling app-buscar-ofertas for ${listaDesejos.length} desejos.`);
    if (mainWindow) {
        mainWindow.webContents.send('app-notification', {
            type: 'info',
            message: 'Iniciando busca de ofertas nos sites (simulação)...',
        });
    }

    let allResults = [];
    try {
        // Iterate over each desire item to perform scraping
        for (const desejo of listaDesejos) {
            const searchTerm = desejo.nome;
            logger.info(`Scraping for: ${searchTerm} (Desejo ID: ${desejo.id})`);

            // Concurrently execute scrapers for Amazon and Mercado Livre for the current desire.
            // This is more efficient than running them sequentially.
            const amazonPromise = amazonScraper.searchAmazon(searchTerm);
            const mercadoLivrePromise = mercadoLivreScraper.searchMercadoLivre(searchTerm);

            // Promise.allSettled waits for all promises to settle (either resolve or reject).
            // This ensures that even if one scraper fails, others can still complete.
            const resultsSettled = await Promise.allSettled([amazonPromise, mercadoLivrePromise]);

            // Process Amazon results
            const amazonResults = resultsSettled[0].status === 'fulfilled' ? resultsSettled[0].value : [];
            if (resultsSettled[0].status === 'rejected') {
                logger.error(`Amazon scraper failed for "${searchTerm}": ${resultsSettled[0].reason}`);
            }
            // Process Mercado Livre results
            const mercadoLivreResults = resultsSettled[1].status === 'fulfilled' ? resultsSettled[1].value : [];
            if (resultsSettled[1].status === 'rejected') {
                logger.error(`Mercado Livre scraper failed for "${searchTerm}": ${resultsSettled[1].reason}`);
            }

            // Combine results from all scrapers for the current desire
            const currentItemResults = [...amazonResults, ...mercadoLivreResults];
            allResults = allResults.concat(currentItemResults); // Aggregate all results

            // Save each found offer to the quotation history database.
            currentItemResults.forEach((oferta) => {
                try {
                    dbModule.addHistoricoCotacao({
                        desejo_nome: desejo.nome, // Link to the original desire name
                        site: oferta.site,
                        preco: oferta.price,
                        url_oferta: oferta.urlOffer,
                        detalhes_parcelamento_se_houver: oferta.detailsParcelamento,
                    });
                } catch (dbError) {
                    logger.error(
                        `Error saving offer to history (desejo: ${desejo.nome}, site: ${oferta.site}): ${dbError.message}`
                    );
                }
            });
        }

        logger.info(`Scraping simulation complete. Found ${allResults.length} total offers.`);
        if (mainWindow) {
            mainWindow.webContents.send('app-notification', {
                type: 'success',
                message: `Busca de ofertas (simulada) concluída! ${allResults.length} ofertas encontradas.`,
            });
            // Show a native system notification
            new Notification({
                title: 'Busca de Ofertas Concluída',
                body: `${allResults.length} ofertas (simuladas) encontradas.`,
            }).show();
        }

        return { success: true, data: allResults };
    } catch (error) {
        logger.error(`Error during app-buscar-ofertas: ${error.message}`);
        if (mainWindow) {
            mainWindow.webContents.send('app-notification', {
                type: 'error',
                message: `Erro ao buscar ofertas: ${error.message}`,
            });
        }
        return { success: false, error: error.message, data: [] };
    }
});

// Utility: Open External Link
/**
 * Handles opening an external link in the default browser.
 * @param {Electron.IpcMainEvent} event - The IPC event.
 * @param {string} url - The URL to open.
 */
ipcMain.on('app-open-external-link', (event, url) => {
    logger.info(`Opening external link: ${url}`);
    shell.openExternal(url); // shell.openExternal is the secure way to open web links
});

// --- Scheduled Tasks (node-cron) ---
// Placeholder for a scheduled task, e.g., daily automated scraping.
// The cron pattern '0 3 * * *' means "run at 3:00 AM every day".
cron.schedule(
    '0 3 * * *',
    () => {
        logger.info('Executando tarefa agendada de busca de ofertas (simulação)...');
        // In a real application, this would trigger a comprehensive scraping process.
        // For example, it might fetch all desires or desires meeting certain criteria,
        // then invoke the scraper functions for them, similar to 'app-buscar-ofertas'.
        // Notifications are sent to the UI if it's open, and native notifications are used.

        if (mainWindow) {
            // Check if UI is available
            mainWindow.webContents.send('app-notification', {
                type: 'info',
                message: 'Tarefa agendada iniciada (simulação).',
            });
        }
        new Notification({ title: 'Busca Agendada', body: 'Busca noturna de ofertas iniciada (simulação).' }).show();

        // Simulate a delay for the task completion
        setTimeout(() => {
            logger.info('Tarefa agendada de busca de ofertas (simulação) concluída.');
            if (mainWindow) {
                mainWindow.webContents.send('app-notification', {
                    type: 'success',
                    message: 'Tarefa agendada concluída (simulação).',
                });
            }
            new Notification({
                title: 'Busca Agendada Concluída',
                body: 'Busca noturna de ofertas finalizada (simulação).',
            }).show();
        }, 10000); // Simulate 10 seconds of work
    },
    {
        scheduled: true,
        timezone: 'America/Sao_Paulo', // Important to set a timezone for cron tasks
    }
);

logger.info('main.js loaded and IPC handlers registered.');
