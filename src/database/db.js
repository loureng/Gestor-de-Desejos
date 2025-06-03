const Database = require('better-sqlite3');
/**
 * Database instance. Initialized by initDb.
 * @type {Database.Database | undefined}
 */
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
    rodarAgendada: true,
};

/**
 * Initializes the SQLite database connection and sets up tables.
 * @param {string} databasePath - The path to the SQLite database file.
 * @throws {Error} If database initialization or setup fails.
 */
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

/**
 * Sets up the database schema by creating tables if they don't exist.
 * Requires `db` instance to be initialized.
 * @throws {Error} If database is not initialized or schema setup fails.
 */
function setupDatabase() {
    if (!db) {
        console.error('Database not initialized. Call initDb first.');
        // This case should ideally not be reached if initDb is always called first.
        throw new Error('DB not initialized for setup.');
    }
    // SQL schema definition for all application tables.
    // Uses 'CREATE TABLE IF NOT EXISTS' to prevent errors on subsequent runs.
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
        db.exec(schema); // Executes all schema statements
        console.log('Database tables checked/created.');
    } catch (error) {
        console.error('Error setting up database schema:', error);
        throw error; // Propagate error
    }
}

// --- CRUD Functions ---

// Desejos
/**
 * Adds a new desire to the 'desejos' table.
 * @param {object} desejo - The desire object.
 * @param {string} desejo.nome - The name of the desire.
 * @param {string} [desejo.url] - The URL of the desire (optional).
 * @param {string} [desejo.prioridade='Média'] - The priority of the desire.
 * @returns {Database.RunResult} Result of the insert operation.
 * @throws {Error} If database is not initialized or insert fails.
 */
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

/**
 * Retrieves all desires from the 'desejos' table, ordered by addition date.
 * @returns {Array<object>} An array of desire objects.
 * @throws {Error} If database is not initialized or query fails.
 */
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

/**
 * Removes a desire from the 'desejos' table by its ID.
 * @param {number} id - The ID of the desire to remove.
 * @returns {Database.RunResult} Result of the delete operation.
 * @throws {Error} If database is not initialized or delete fails.
 */
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
/**
 * Adds a new installment plan to the 'parcelamentos' table.
 * @param {object} parcelamento - The installment plan object.
 * @param {string} parcelamento.nome_item - Name of the item.
 * @param {number} parcelamento.valor_total - Total value of the item.
 * @param {number} parcelamento.total_parcelas - Total number of installments.
 * @param {number} parcelamento.parcelas_pagas - Number of installments already paid.
 * @param {string} parcelamento.data_inicio - Start date of the installment plan (e.g., 'YYYY-MM-DD').
 * @returns {Database.RunResult} Result of the insert operation.
 * @throws {Error} If database is not initialized or insert fails.
 */
function addParcelamento({ nome_item, valor_total, total_parcelas, parcelas_pagas, data_inicio }) {
    if (!db) throw new Error('DB not initialized');
    try {
        const stmt = db.prepare(
            'INSERT INTO parcelamentos (nome_item, valor_total, total_parcelas, parcelas_pagas, data_inicio) VALUES (?, ?, ?, ?, ?)'
        );
        return stmt.run(nome_item, valor_total, total_parcelas, parcelas_pagas, data_inicio);
    } catch (error) {
        console.error('Error adding parcelamento:', error);
        throw error;
    }
}

/**
 * Retrieves all installment plans from the 'parcelamentos' table, ordered by start date.
 * @returns {Array<object>} An array of installment plan objects.
 * @throws {Error} If database is not initialized or query fails.
 */
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

/**
 * Removes an installment plan from the 'parcelamentos' table by its ID.
 * @param {number} id - The ID of the installment plan to remove.
 * @returns {Database.RunResult} Result of the delete operation.
 * @throws {Error} If database is not initialized or delete fails.
 */
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
/**
 * Adds a new quotation history record to the 'historico_cotacoes' table.
 * @param {object} cotacao - The quotation object.
 * @param {string} cotacao.desejo_nome - The name of the associated desire.
 * @param {string} cotacao.site - The website where the quotation was found.
 * @param {number} cotacao.preco - The price found.
 * @param {string} [cotacao.url_oferta] - The URL of the offer (optional).
 * @param {string} [cotacao.detalhes_parcelamento_se_houver] - Installment details, if any (optional).
 * @returns {Database.RunResult} Result of the insert operation.
 * @throws {Error} If database is not initialized or insert fails.
 */
function addHistoricoCotacao({ desejo_nome, site, preco, url_oferta, detalhes_parcelamento_se_houver }) {
    if (!db) throw new Error('DB not initialized');
    try {
        const stmt = db.prepare(
            'INSERT INTO historico_cotacoes (desejo_nome, site, preco, url_oferta, detalhes_parcelamento_se_houver) VALUES (?, ?, ?, ?, ?)'
        );
        return stmt.run(desejo_nome, site, preco, url_oferta, detalhes_parcelamento_se_houver);
    } catch (error) {
        console.error('Error adding historico cotacao:', error);
        throw error;
    }
}

/**
 * Retrieves quotation history records from 'historico_cotacoes', ordered by search date.
 * Filtering is not yet implemented.
 * @param {object} [filtro] - Placeholder for filter criteria (currently unused).
 * @returns {Array<object>} An array of quotation history objects.
 * @throws {Error} If database is not initialized or query fails.
 */
function getHistorico(filtro) {
    // Placeholder for filtro
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
/**
 * Retrieves application configurations from the 'configuracoes' table.
 * Merges stored configurations with defaults to ensure all keys are present and have correct types.
 * @returns {object} The application configuration object. Returns defaults if DB error or not initialized.
 */
function getConfiguracoes() {
    if (!db) {
        // This can happen if main process calls it before db is ready or if db init failed.
        console.warn('getConfiguracoes called before DB initialized or on DB error. Returning defaults.');
        return { ...defaultConfigs };
    }
    try {
        const stmt = db.prepare('SELECT chave, valor FROM configuracoes');
        const rows = stmt.all();
        // Convert rows from [{chave: 'key', valor: 'value'}, ...] to {key: value, ...}
        const configsFromDb = rows.reduce((acc, row) => {
            try {
                // Attempt to parse JSON for complex types (numbers, booleans, objects)
                acc[row.chave] = JSON.parse(row.valor);
            } catch (e) {
                // If not valid JSON, keep it as a string (e.g., for 'cep' or 'agendamentoCron')
                acc[row.chave] = row.valor;
            }
            return acc;
        }, {});

        // Merge database configurations with default configurations.
        // This ensures that all expected configuration keys are present in the returned object,
        // even if some are not yet saved in the database. Defaults also provide correct data types.
        const finalConfigs = { ...defaultConfigs, ...configsFromDb };

        // Type coercion: Ensure that numeric and boolean values retrieved from the database
        // (which might be stored as strings) are converted back to their correct types
        // based on the `defaultConfigs` object.
        for (const key in defaultConfigs) {
            if (typeof defaultConfigs[key] === 'number' && typeof finalConfigs[key] === 'string') {
                finalConfigs[key] = parseFloat(finalConfigs[key]);
                // If parsing results in NaN (e.g., empty string), revert to default to avoid issues.
                if (isNaN(finalConfigs[key])) finalConfigs[key] = defaultConfigs[key];
            } else if (typeof defaultConfigs[key] === 'boolean' && typeof finalConfigs[key] === 'string') {
                // Convert string 'true' or 'false' to boolean
                finalConfigs[key] = finalConfigs[key] === 'true';
            }
        }
        return finalConfigs;
    } catch (error) {
        console.error('Error fetching configuracoes from DB:', error);
        // Fallback to default configurations if there's an error reading from the database.
        return { ...defaultConfigs };
    }
}

/**
 * Saves application configurations to the 'configuracoes' table.
 * Uses a transaction to save all key-value pairs efficiently and atomically.
 * @param {object} configsObject - The configuration object to save.
 * @returns {{changes: number}} Object indicating the number of configuration keys processed.
 * @throws {Error} If database is not initialized or save operation fails.
 */
function saveConfiguracoes(configsObject) {
    if (!db) throw new Error('DB not initialized');
    // SQL statement for inserting or updating a configuration key.
    // 'ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor' handles UPSERT functionality.
    const stmt = db.prepare(`
        INSERT INTO configuracoes (chave, valor) 
        VALUES (?, ?) 
        ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
    `);
    try {
        // Use a database transaction to ensure all configurations are saved or none are.
        // This is important for data integrity.
        const transaction = db.transaction((configs) => {
            for (const chave in configs) {
                // Ensure we are only processing own properties of the object
                if (Object.prototype.hasOwnProperty.call(configs, chave)) {
                    // Values are stringified to be stored as TEXT in SQLite.
                    // Complex objects or arrays will be stored as JSON strings.
                    stmt.run(chave, JSON.stringify(configs[chave]));
                }
            }
        });
        transaction(configsObject); // Execute the transaction
        return { changes: Object.keys(configsObject).length }; // Return number of keys processed
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
