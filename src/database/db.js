const Database = require('better-sqlite3');
let db; // Declare db at module scope

// Default configurations - keep them defined here for getConfiguracoes
const defaultConfigs = {
    cep: '',
    limiteParcela: 500,
    gatilhoFinalizar: 1,
    agendamentoCron: '0 3 * * *',
    criterioRanking: 'custo',
    concurrency: 2,
    rodarGatilho: true,
    rodarAgendada: true
};

// Function to initialize the database
function initDb(databasePath) {
    if (db) {
        console.log('Database already initialized.');
        return;
    }
    try {
        db = new Database(databasePath, { verbose: console.log });
        console.log(`Database connected successfully at ${databasePath}`);
        setupDatabase(); // Call table creation after db is initialized
    } catch (error) {
        console.error('Failed to initialize database:', error);
        // If using logger in the future, logger.error(...)
        throw error; // Rethrow to be caught by main.js
    }
}

function setupDatabase() {
    if (!db) {
        console.error('Database not initialized. Call initDb first.');
        // This case should ideally not be reached if initDb is always called first.
        throw new Error('DB not initialized for setup.');
    }
    const schema = `
        CREATE TABLE IF NOT EXISTS desejos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            url TEXT,
            prioridade TEXT DEFAULT 'Média',
            data_adicao DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS parcelamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_item TEXT NOT NULL,
            valor_total REAL NOT NULL,
            total_parcelas INTEGER NOT NULL,
            parcelas_pagas INTEGER NOT NULL,
            data_inicio DATE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS historico_cotacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            desejo_nome TEXT NOT NULL,
            site TEXT NOT NULL,
            preco REAL NOT NULL,
            data_busca DATETIME DEFAULT CURRENT_TIMESTAMP,
            url_oferta TEXT,
            detalhes_parcelamento_se_houver TEXT
        );

        CREATE TABLE IF NOT EXISTS configuracoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chave TEXT UNIQUE NOT NULL,
            valor TEXT
        );
    `;
    try {
        db.exec(schema);
        console.log('Database tables checked/created.');
    } catch (error) {
        console.error('Error setting up database schema:', error);
        throw error; // Propagate error
    }
}

// --- CRUD Functions ---

// Desejos
function addDesejo({ nome, url, prioridade }) {
    if (!db) throw new Error('DB not initialized');
    try {
        const stmt = db.prepare('INSERT INTO desejos (nome, url, prioridade) VALUES (?, ?, ?)');
        return stmt.run(nome, url, prioridade);
    } catch (error) {
        console.error('Error adding desejo:', error);
        throw error;
    }
}

function getDesejos() {
    if (!db) throw new Error('DB not initialized');
    try {
        const stmt = db.prepare('SELECT * FROM desejos ORDER BY data_adicao DESC');
        return stmt.all();
    } catch (error) {
        console.error('Error getting desejos:', error);
        throw error;
    }
}

function removeDesejo(id) {
    if (!db) throw new Error('DB not initialized');
    try {
        const stmt = db.prepare('DELETE FROM desejos WHERE id = ?');
        return stmt.run(id);
    } catch (error) {
        console.error('Error removing desejo:', error);
        throw error;
    }
}

// Parcelamentos
function addParcelamento({ nome_item, valor_total, total_parcelas, parcelas_pagas, data_inicio }) {
    if (!db) throw new Error('DB not initialized');
    try {
        const stmt = db.prepare('INSERT INTO parcelamentos (nome_item, valor_total, total_parcelas, parcelas_pagas, data_inicio) VALUES (?, ?, ?, ?, ?)');
        return stmt.run(nome_item, valor_total, total_parcelas, parcelas_pagas, data_inicio);
    } catch (error) {
        console.error('Error adding parcelamento:', error);
        throw error;
    }
}

function getParcelamentos() {
    if (!db) throw new Error('DB not initialized');
    try {
        const stmt = db.prepare('SELECT * FROM parcelamentos ORDER BY data_inicio DESC');
        return stmt.all();
    } catch (error) {
        console.error('Error getting parcelamentos:', error);
        throw error;
    }
}

function removeParcelamento(id) {
    if (!db) throw new Error('DB not initialized');
    try {
        const stmt = db.prepare('DELETE FROM parcelamentos WHERE id = ?');
        return stmt.run(id);
    } catch (error) {
        console.error('Error removing parcelamento:', error);
        throw error;
    }
}

// Histórico de Cotações
function addHistoricoCotacao({ desejo_nome, site, preco, url_oferta, detalhes_parcelamento_se_houver }) {
    if (!db) throw new Error('DB not initialized');
    try {
        const stmt = db.prepare('INSERT INTO historico_cotacoes (desejo_nome, site, preco, url_oferta, detalhes_parcelamento_se_houver) VALUES (?, ?, ?, ?, ?)');
        return stmt.run(desejo_nome, site, preco, url_oferta, detalhes_parcelamento_se_houver);
    } catch (error) {
        console.error('Error adding historico cotacao:', error);
        throw error;
    }
}

function getHistorico(filtro) { // Placeholder for filtro
    if (!db) throw new Error('DB not initialized');
    // Filtering will be implemented later based on 'filtro' object
    try {
        const stmt = db.prepare('SELECT * FROM historico_cotacoes ORDER BY data_busca DESC');
        return stmt.all();
    } catch (error) {
        console.error('Error getting historico:', error);
        throw error;
    }
}

// Configurações
function getConfiguracoes() {
    if (!db) {
        console.warn('getConfiguracoes called before DB initialized or on DB error. Returning defaults.');
        return { ...defaultConfigs };
    }
    try {
        const stmt = db.prepare('SELECT chave, valor FROM configuracoes');
        const rows = stmt.all();
        const configsFromDb = rows.reduce((acc, row) => {
            try {
                acc[row.chave] = JSON.parse(row.valor);
            } catch (e) {
                acc[row.chave] = row.valor; // Keep as string if not valid JSON
            }
            return acc;
        }, {});
        
        // Merge with defaults to ensure all keys are present and types are correct
        const finalConfigs = { ...defaultConfigs, ...configsFromDb };
        // Ensure numeric/boolean types from defaults if they were stored as strings incorrectly
        for (const key in defaultConfigs) {
            if (typeof defaultConfigs[key] === 'number' && typeof finalConfigs[key] === 'string') {
                finalConfigs[key] = parseFloat(finalConfigs[key]);
            } else if (typeof defaultConfigs[key] === 'boolean' && typeof finalConfigs[key] === 'string') {
                finalConfigs[key] = finalConfigs[key] === 'true';
            }
        }
        return finalConfigs;

    } catch (error) {
        console.error('Error fetching configuracoes from DB:', error);
        return { ...defaultConfigs }; // Return defaults on error
    }
}

function saveConfiguracoes(configsObject) {
    if (!db) throw new Error('DB not initialized');
    const stmt = db.prepare(`
        INSERT INTO configuracoes (chave, valor) 
        VALUES (?, ?) 
        ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
    `);
    try {
        const transaction = db.transaction((configs) => {
            for (const chave in configs) {
                if (Object.prototype.hasOwnProperty.call(configs, chave)) {
                    stmt.run(chave, JSON.stringify(configs[chave]));
                }
            }
        });
        transaction(configsObject);
        return { changes: Object.keys(configsObject).length };
    } catch (error) {
        console.error('Error saving configuracoes:', error);
        throw error;
    }
}

module.exports = {
    initDb,
    addDesejo,
    getDesejos,
    removeDesejo,
    addParcelamento,
    getParcelamentos,
    removeParcelamento,
    addHistoricoCotacao,
    getHistorico,
    getConfiguracoes,
    saveConfiguracoes,
};
