# Project Status: Gestor de Desejos e Parcelamentos

## 1. Overview

This document summarizes the work done by the AI agent to set up the initial project structure and core Electron functionalities for the "Gestor de Desejos e Parcelamentos" application. The setup is based on the provided requirements and aims to provide a solid foundation for further development.

## 2. What has been implemented

*   **Electron Project Structure**: Core files including `main.js` for the main process, `preload.js` for secure IPC, `index.html` as the single-page UI, and a configured `package.json`.
*   **Database Module (`src/database/db.js`)**: 
    *   Uses `better-sqlite3` for SQLite database operations.
    *   Includes schema definition and table creation (desejos, parcelamentos, historico_cotacoes, configuracoes).
    *   Provides CRUD functions for managing desires, installments, quotation history, and application settings.
    *   The database file (`gestor_desejos.db`) is correctly initialized to be stored in the application's user data directory (e.g., `app.getPath('userData')`).
*   **IPC Communication**: Secure communication between the main process (`main.js`) and the renderer process (`index.html`'s JavaScript) is established via `contextBridge` in `preload.js`. All frontend operations now interact with the backend through defined IPC channels.
*   **Frontend Integration**: The JavaScript within `index.html` has been refactored to:
    *   Remove all mock/client-side data management.
    *   Fetch and display data from the backend (desires, installments, history, configurations).
    *   Send data to the backend for creation/updates/deletion.
    *   Use a simple notification system for user feedback.
*   **Placeholder Scraper Modules**:
    *   Created `src/scraper/amazonScraper.js` and `src/scraper/mercadoLivreScraper.js`.
    *   These files contain placeholder `async` functions that simulate scraper behavior by returning mock offer data.
    *   `main.js` has been updated to call these placeholder scrapers when the "Buscar Ofertas Manualmente" feature is used.
*   **Logging**: Implemented using Winston, with logs output to:
    *   The console (with colorization).
    *   Files within the user's application data directory (`userData/logs/app.log` for general info, `userData/logs/exceptions.log` for errors).
*   **Native Notifications**: Basic desktop notifications are implemented (e.g., when a manual search is complete).
*   **Scheduled Tasks**: A placeholder for scheduled tasks using `node-cron` is included in `main.js` (currently logs a message and shows a notification).
*   **Build Configuration**: `package.json` includes an `electron-builder` configuration (`build` section) with basic settings for creating a Windows (NSIS) installer, including file selection and output directory.

## 3. Key Files and Structure

*   **`main.js`**: The heart of the Electron application. Manages window creation, application lifecycle, and all IPC handlers that orchestrate backend logic (database, scrapers).
*   **`preload.js`**: Acts as a bridge between the Electron main process and the renderer process, securely exposing specific backend functions to `index.html` via `window.electronAPI`.
*   **`index.html`**: The single HTML file that serves as the application's user interface. Contains all frontend JavaScript for rendering data and interacting with the exposed `electronAPI`.
*   **`src/database/db.js`**: Handles all database interactions. Exports functions to initialize the database and perform CRUD operations.
*   **`src/scraper/`**: This directory contains the placeholder scraper modules (e.g., `amazonScraper.js`, `mercadoLivreScraper.js`).
*   **`package.json`**: Defines project metadata, dependencies (`electron`, `better-sqlite3`, `winston`, `node-cron`, `playwright`, `electron-builder`), and scripts (`npm start` to run, `npm run dist` to build).
*   **`assets/`**: Intended for static assets like application icons. The `electron-builder` configuration currently points to `assets/icon.png` (this icon file needs to be created by the user).
*   **`logs/`**: Located within the `app.getPath('userData')` directory (not in the project source tree). This is where Winston will store `app.log` and `exceptions.log`.

## 4. How to Run the Application

1.  **Install Dependencies**:
    Open a terminal in the project root directory and run:
    ```bash
    npm install
    ```
    (or `yarn install` if you prefer Yarn).
2.  **Run in Development Mode**:
    After dependencies are installed, run:
    ```bash
    npm start
    ```
    (or `yarn start`). This will launch the Electron application.

## 5. Next Steps for the User

1.  **Implement Scraper Logic**: This is the most significant piece of custom development remaining.
    *   Open `src/scraper/amazonScraper.js` and `src/scraper/mercadoLivreScraper.js`.
    *   Replace the placeholder/mock logic with actual web scraping code using a library like Playwright (which is already a dependency).
    *   The functions should aim to extract product name, price, offer URL, site name, and any installment details.
    *   Ensure the returned data structure from your scrapers matches what `main.js` (specifically the `app-buscar-ofertas` handler and `dbModule.addHistoricoCotacao`) expects.
2.  **Test Thoroughly**:
    *   Once scrapers have some initial implementation, test all application functionalities:
        *   Adding, viewing, and removing items from "Lista de Desejos".
        *   Adding, viewing, and removing "Parcelamentos".
        *   Using the "Consulta Manual" and verifying that history is updated.
        *   Saving and loading "Configurações".
        *   Checking if notifications (both in-app and native) work as expected.
3.  **Refine UI/UX**:
    *   The current UI is functional, based on Tailwind CSS. Further refine the styles, layout, and user interaction flows as desired.
    *   Improve the in-app notification system for better user feedback.
4.  **Application Icon**:
    *   Create an application icon (e.g., a 256x256 PNG) and save it as `assets/icon.png`.
    *   Alternatively, update the `win.icon` path in the `build` section of `package.json` if you use a different name or location.
5.  **Build the Application**:
    *   Once you are satisfied with the application and have tested it, you can build an installer using:
        ```bash
        npm run dist
        ```
        (or `yarn dist`). This will create installers in the `dist_electron` directory (as configured in `package.json`).
6.  **Review Logs**:
    *   During testing or if you encounter issues, check the application logs. These are located in the `logs` subdirectory within your user data path.
    *   To find your specific `userData` path, you can temporarily add `console.log(app.getPath('userData'));` to your `main.js` in the `app.whenReady()` block.
7.  **Database Location**:
    *   The SQLite database file (`gestor_desejos.db`) is stored within the `userData` directory. This means it persists between application runs and is specific to the user.

## 6. Important Note on `node_modules` in AI Development Environment

During the development of this project structure with the AI agent, there were intermittent difficulties related to the `node_modules` directory (specifically for the `better-sqlite3` package, which has native components) persisting correctly or being accessible within the sandboxed cloud environment used by the agent. These issues manifested as "module not found" errors even after `npm install` reported success.

**This should not be an issue in your local development environment.** Once you clone the repository and run `npm install` locally, Node.js and Electron will be able to resolve modules from the local `node_modules` directory as expected. The `.gitignore` file is set up to correctly exclude `node_modules` from the repository.

---

This project provides a strong starting point. Happy developing!
