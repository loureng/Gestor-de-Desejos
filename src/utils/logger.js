const winston = require('winston');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

// Determine the logs directory within the app's user data path
const logsDir = path.join(app.getPath('userData'), 'logs');

// Ensure the logs directory exists. Winston might create it, but it's safer to ensure.
if (!fs.existsSync(logsDir)) {
    try {
        fs.mkdirSync(logsDir, { recursive: true });
    } catch (error) {
        // Fallback to console if directory creation fails, though this is unlikely.
        console.error('Failed to create logs directory:', error);
    }
}

/**
 * Configured Winston logger instance for the application.
 * Logs to console and to files in the application's user data directory.
 * - app.log: General info, warn, error.
 * - exceptions.log: Uncaught exceptions and unhandled promise rejections.
 */
const logger = winston.createLogger({
    level: 'info', // Default minimum level to log
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // Log the full stack trace for errors
        winston.format.splat(),
        winston.format.json(), // Alternative: winston.format.printf for custom string format
        winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`)
    ),
    transports: [
        // Console transport: for development and immediate feedback
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(), // Add colors to console output
                winston.format.printf(
                    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
                )
            ),
            level: 'debug', // Log debug messages and above to the console
        }),
        // File transport for general application logs
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            level: 'info', // Log info, warn, error to app.log
        }),
        // File transport for unhandled exceptions and rejections
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            level: 'error', // Only errors
            handleExceptions: true, // Catch and log uncaught exceptions
            handleRejections: true, // Catch and log unhandled promise rejections
        }),
    ],
    exitOnError: false, // Do not exit on handled exceptions
});

module.exports = logger;
