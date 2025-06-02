const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron');
const path = require('path');
const winston = require('winston');
const cron = require('node-cron');

// Import database module (adjust path if necessary)
const dbModule = require('./src/database/db'); // Renamed to dbModule

// Import scraper modules
const amazonScraper = require('./src/scraper/amazonScraper');
const mercadoLivreScraper = require('./src/scraper/mercadoLivreScraper');

// --- Logger Setup (Winston) ---
const logsDir = path.join(app.getPath('userData'), 'logs');
// Ensure logs directory exists (Winston doesn't always create it)
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: path.join(logsDir, 'app.log'), level: 'info' }),
        new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log'), level: 'error', handleExceptions: true })
    ]
});

// --- Main Window Creation ---
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Recommended for security
            nodeIntegration: false  // Recommended for security
        }
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
        // Handle critical error: maybe show an error dialog and quit
        // For now, just log and attempt to continue; app might not work correctly.
        // Consider displaying an error to the user before quitting or attempting to run in a degraded mode.
        // Example:
        // dialog.showErrorBox('Erro Crítico de Banco de Dados', `Não foi possível iniciar o banco de dados: ${error.message}\nO aplicativo será encerrado.`);
        // app.quit();
        // return; // Important to prevent further execution if quitting
    }

    logger.info('Creating window...');
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- IPC Handlers ---

// Desejos
ipcMain.handle('db-desejo-add', async (event, desejo) => {
    try {
        logger.info(`Handling db-desejo-add: ${JSON.stringify(desejo)}`);
        const result = dbModule.addDesejo(desejo); // Use dbModule
        // Send notification to renderer if needed (e.g., for UI update beyond direct response)
        // mainWindow.webContents.send('app-notification', { type: 'success', message: 'Desejo adicionado!' });
        return { success: true, data: result };
    } catch (error) {
        logger.error(`Error in db-desejo-add: ${error.message}`);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('db-desejos-get', async () => {
    try {
        logger.info('Handling db-desejos-get');
        const desejos = dbModule.getDesejos(); // Use dbModule
        return { success: true, data: desejos };
    } catch (error) {
        logger.error(`Error in db-desejos-get: ${error.message}`);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('db-desejo-remove', async (event, id) => {
    try {
        logger.info(`Handling db-desejo-remove: id=${id}`);
        const result = dbModule.removeDesejo(id); // Use dbModule
        return { success: true, data: result };
    } catch (error) {
        logger.error(`Error in db-desejo-remove: ${error.message}`);
        return { success: false, error: error.message };
    }
});

// Parcelamentos
ipcMain.handle('db-parcelamento-add', async (event, parcelamento) => {
    try {
        logger.info(`Handling db-parcelamento-add: ${JSON.stringify(parcelamento)}`);
        const result = dbModule.addParcelamento(parcelamento); // Use dbModule
        return { success: true, data: result };
    } catch (error) {
        logger.error(`Error in db-parcelamento-add: ${error.message}`);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('db-parcelamentos-get', async () => {
    try {
        logger.info('Handling db-parcelamentos-get');
        const parcelamentos = dbModule.getParcelamentos(); // Use dbModule
        return { success: true, data: parcelamentos };
    } catch (error) {
        logger.error(`Error in db-parcelamentos-get: ${error.message}`);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('db-parcelamento-remove', async (event, id) => {
    try {
        logger.info(`Handling db-parcelamento-remove: id=${id}`);
        const result = dbModule.removeParcelamento(id); // Use dbModule
        return { success: true, data: result };
    } catch (error) {
        logger.error(`Error in db-parcelamento-remove: ${error.message}`);
        return { success: false, error: error.message };
    }
});

// Histórico
ipcMain.handle('db-historico-get', async (event, filtro) => {
    try {
        logger.info(`Handling db-historico-get: ${JSON.stringify(filtro)}`);
        const historico = dbModule.getHistorico(filtro); // Filtro not implemented yet in db.js // Use dbModule
        return { success: true, data: historico };
    } catch (error) {
        logger.error(`Error in db-historico-get: ${error.message}`);
        return { success: false, error: error.message };
    }
});

// Configurações
ipcMain.handle('db-config-get', async () => {
    try {
        logger.info('Handling db-config-get');
        const configs = dbModule.getConfiguracoes(); // Use dbModule
        return { success: true, data: configs };
    } catch (error) {
        logger.error(`Error in db-config-get: ${error.message}`);
        // It's important getConfiguracoes returns defaults on error in db.js
        return { success: false, error: error.message, data: dbModule.getConfiguracoes() }; // Ensure frontend gets defaults // Use dbModule
    }
});

ipcMain.handle('db-config-save', async (event, configs) => {
    try {
        logger.info(`Handling db-config-save: ${JSON.stringify(configs)}`);
        dbModule.saveConfiguracoes(configs); // Use dbModule
        // Optionally, send a notification back to the renderer
        if (mainWindow) {
            mainWindow.webContents.send('app-notification', { type: 'success', message: 'Configurações salvas com sucesso!' });
        }
        return { success: true };
    } catch (error) {
        logger.error(`Error in db-config-save: ${error.message}`);
        if (mainWindow) {
            mainWindow.webContents.send('app-notification', { type: 'error', message: `Erro ao salvar configurações: ${error.message}` });
        }
        return { success: false, error: error.message };
    }
});

// Consulta Manual de Ofertas
ipcMain.handle('app-buscar-ofertas', async (event, listaDesejos) => {
    logger.info(`Handling app-buscar-ofertas for ${listaDesejos.length} desejos.`);
    if (mainWindow) {
        mainWindow.webContents.send('app-notification', { type: 'info', message: 'Iniciando busca de ofertas nos sites (simulação)...' });
    }

    let allResults = [];
    try {
        for (const desejo of listaDesejos) {
            const searchTerm = desejo.nome; // Or use desejo.url if available and preferred
            
            logger.info(`Scraping for: ${searchTerm} (Desejo ID: ${desejo.id})`);

            // Run scrapers in parallel for each item for efficiency
            const amazonPromise = amazonScraper.searchAmazon(searchTerm);
            const mercadoLivrePromise = mercadoLivreScraper.searchMercadoLivre(searchTerm);

            // Await all promises for the current desire item
            // Use Promise.allSettled to ensure all scrapers attempt to run even if one fails
            const resultsSettled = await Promise.allSettled([amazonPromise, mercadoLivrePromise]);
            
            const amazonResults = resultsSettled[0].status === 'fulfilled' ? resultsSettled[0].value : [];
            if (resultsSettled[0].status === 'rejected') {
                logger.error(`Amazon scraper failed for "${searchTerm}": ${resultsSettled[0].reason}`);
            }
            const mercadoLivreResults = resultsSettled[1].status === 'fulfilled' ? resultsSettled[1].value : [];
            if (resultsSettled[1].status === 'rejected') {
                logger.error(`Mercado Livre scraper failed for "${searchTerm}": ${resultsSettled[1].reason}`);
            }

            const currentItemResults = [...amazonResults, ...mercadoLivreResults];
            allResults = allResults.concat(currentItemResults);

            // Save to history
            currentItemResults.forEach(oferta => {
                try {
                    dbModule.addHistoricoCotacao({ 
                        desejo_nome: desejo.nome, // Use the original name from the wish list for consistency in history
                        site: oferta.site, 
                        preco: oferta.price, 
                        url_oferta: oferta.urlOffer, 
                        detalhes_parcelamento_se_houver: oferta.detailsParcelamento 
                    });
                } catch (dbError) {
                    logger.error(`Error saving offer to history (desejo: ${desejo.nome}, site: ${oferta.site}): ${dbError.message}`);
                }
            });
        }

        logger.info(`Scraping simulation complete. Found ${allResults.length} total offers.`);
        if (mainWindow) {
            mainWindow.webContents.send('app-notification', { type: 'success', message: `Busca de ofertas (simulada) concluída! ${allResults.length} ofertas encontradas.` });
            new Notification({ title: 'Busca de Ofertas Concluída', body: `${allResults.length} ofertas (simuladas) encontradas.` }).show();
        }
        
        return { success: true, data: allResults };

    } catch (error) {
        logger.error(`Error during app-buscar-ofertas: ${error.message}`);
        if (mainWindow) {
            mainWindow.webContents.send('app-notification', { type: 'error', message: `Erro ao buscar ofertas: ${error.message}` });
        }
        return { success: false, error: error.message, data: [] };
    }
});

// Utility: Open External Link
ipcMain.on('app-open-external-link', (event, url) => {
    logger.info(`Opening external link: ${url}`);
    shell.openExternal(url);
});


// --- Scheduled Tasks (node-cron) ---
// Placeholder for scheduled scraping
// Example: Run every day at 3 AM
cron.schedule('0 3 * * *', () => {
    logger.info('Executando tarefa agendada de busca de ofertas (simulação)...');
    // In a real app, call a function similar to 'app-buscar-ofertas' but for all relevant items
    // e.g., getDesejos(), then call scraper for each.
    // For now, just a log message and a native notification.
    if (mainWindow) {
         mainWindow.webContents.send('app-notification', { type: 'info', message: 'Tarefa agendada iniciada (simulação).' });
    }
    new Notification({ title: 'Busca Agendada', body: 'Busca noturna de ofertas iniciada (simulação).' }).show();

    // Simulate work for scheduled task
    setTimeout(() => {
        logger.info('Tarefa agendada de busca de ofertas (simulação) concluída.');
        if (mainWindow) {
            mainWindow.webContents.send('app-notification', { type: 'success', message: 'Tarefa agendada concluída (simulação).' });
        }
         new Notification({ title: 'Busca Agendada Concluída', body: 'Busca noturna de ofertas finalizada (simulação).' }).show();
    }, 10000); // Simulate 10s
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo" // Adjust to your timezone or make configurable
});

logger.info('main.js loaded and IPC handlers registered.');
