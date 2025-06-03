// src/scraper/mercadoLivreScraper.js
const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Scrapes Mercado Livre Brazil for a given search term.
 * It launches a Playwright browser, navigates to Mercado Livre, searches for the term,
 * and attempts to extract product name, price, URL, and installment details from the search results.
 * Includes basic CAPTCHA/security block detection and error handling with screenshots.
 *
 * @async
 * @param {string} searchTermOrUrl - The product name or search query.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of offer objects.
 * Each object contains:
 *  - `name` (string): The name of the product.
 *  - `price` (number): The price of the product.
 *  - `urlOffer` (string): The URL of the product offer.
 *  - `site` (string): The site name ("Mercado Livre").
 *  - `detailsParcelamento` (string): Installment details, if available.
 * Returns an empty array if no offers are found or in case of a critical error.
 */
async function searchMercadoLivre(searchTermOrUrl) {
    console.log(`[MercadoLivreScraper] Received search term: ${searchTermOrUrl}`);

    const offers = [];
    let browser = null;
    let page;
    const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots_debug');
    // Ensure the directory for screenshots exists.
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    try {
        browser = await playwright.chromium.launch({
            // headless: false // Useful for debugging
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'pt-BR', // Set locale for Mercado Livre Brazil
        });
        page = await context.newPage();

        // Format search term for Mercado Livre URL (e.g., replace spaces with hyphens)
        const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(searchTermOrUrl.replace(/\s+/g, '-'))}`;
        console.log(`[MercadoLivreScraper] Navigating to search URL: ${searchUrl}`);

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        console.log(`[MercadoLivreScraper] Waiting for search results for: ${searchTermOrUrl}`);

        const resultsContainerSelector = 'ol.ui-search-layout';
        try {
            // Wait for the main results list and then for individual items to appear.
            await page.waitForSelector(resultsContainerSelector, { timeout: 30000 });
            await page.waitForSelector(`${resultsContainerSelector} li.ui-search-layout__item`, { timeout: 15000 });
        } catch (e) {
            // If results don't load, it could be a CAPTCHA, temporary block, or page structure change.
            console.warn(`[MercadoLivreScraper] Error waiting for search results: ${e.message}`);
            const screenshotPath = path.join(
                screenshotsDir,
                `mercadolivre_error_results_container_${Date.now()}.png`
            );
            await page.screenshot({ path: screenshotPath });
            console.log(`[MercadoLivreScraper] Screenshot taken: ${screenshotPath}`);

            // Check for known CAPTCHA or security block page titles.
            const humanCheckTitle = (await page.locator('h1', { hasText: /Parece que você não é um robô/i }).count()) > 0;
            const unusualActivity = (await page.locator('h1', { hasText: /Detectamos atividade incomum/i }).count()) > 0;

            if (humanCheckTitle || unusualActivity) {
                console.error('[MercadoLivreScraper] CAPTCHA or security block detected.');
                const captchaScreenshotPath = path.join(
                    screenshotsDir,
                    `mercadolivre_captcha_detected_${Date.now()}.png`
                );
                await page.screenshot({ path: captchaScreenshotPath });
                console.log(`[MercadoLivreScraper] CAPTCHA/Block screenshot taken: ${captchaScreenshotPath}`);
            } else {
                console.error('[MercadoLivreScraper] Search results not found/loaded, and no clear CAPTCHA/block detected.');
            }
            // Propagate error to stop further processing for this term.
            throw new Error(
                'Search results not found or page load issue, potentially due to CAPTCHA/block or page structure change.'
            );
        }

        // Get all product item elements from the page.
        const productItems = await page.locator('li.ui-search-layout__item').all();
        console.log(`[MercadoLivreScraper] Found ${productItems.length} potential product items.`);

        if (productItems.length === 0) {
            console.log(`[MercadoLivreScraper] No products found for: ${searchTermOrUrl}`);
            const screenshotPath = path.join(screenshotsDir, `mercadolivre_no_products_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath });
            console.log(`[MercadoLivreScraper] Screenshot taken for no products page: ${screenshotPath}`);
            return []; // No products found, return empty.
        }

        // Process a limited number of items (e.g., first 10) to avoid excessive scraping.
        for (const item of productItems.slice(0, 10)) {
            try {
                let name = null;
                let price = null;
                let urlOffer = null;
                let detailsParcelamento = 'Não informado'; // Default for installment details

                // Attempt to extract product name using primary selector, with fallbacks.
                const nameElement = await item.locator('h2.ui-search-item__title').first();
                if (await nameElement.count()) {
                    name = await nameElement.textContent();
                } else {
                    const altNameElement = await item.locator('a.ui-search-link[title]').first();
                    if (await altNameElement.count()) {
                        name = await altNameElement.getAttribute('title');
                    } else {
                        const linkTextElement = await item.locator('a.ui-search-link').first();
                        if (await linkTextElement.count()) name = await linkTextElement.textContent();
                    }
                }
                name = name ? name.trim() : null;

                // Attempt to extract price, looking for fraction and cents.
                const priceContainer = await item.locator('div.ui-search-price__second-line .andes-money-amount').first();
                if (await priceContainer.count()) {
                    const fraction = await priceContainer.locator('.andes-money-amount__fraction').textContent();
                    const cents = await priceContainer.locator('.andes-money-amount__cents').first();
                    let priceString = fraction.replace(/\D/g, ''); // Remove non-digits
                    if (await cents.count()) {
                        priceString += `.${(await cents.textContent()).replace(/\D/g, '')}`;
                    }
                    price = parseFloat(priceString);
                } else {
                    // Fallback for price structure if the primary one isn't found.
                    const fallbackPriceElement = await item
                        .locator('span.ui-search-price__part .andes-money-amount__fraction')
                        .first();
                    if (await fallbackPriceElement.count()) {
                        let priceString = (await fallbackPriceElement.textContent()).replace(/\D/g, '');
                        const fallbackCentsElement = await item
                            .locator('span.ui-search-price__part .andes-money-amount__cents')
                            .first();
                        if (await fallbackCentsElement.count()) {
                            priceString += `.${(await fallbackCentsElement.textContent()).replace(/\D/g, '')}`;
                        }
                        price = parseFloat(priceString);
                    }
                }

                // Extract product URL from the main link.
                const urlElement = await item.locator('a.ui-search-link').first();
                if (await urlElement.count()) {
                    urlOffer = await urlElement.getAttribute('href');
                    urlOffer = urlOffer ? urlOffer.split('#')[0] : null; // Clean URL by removing fragment
                }

                // Extract installment information if present.
                const installmentElement = await item.locator('span.ui-search-installments').first();
                if (await installmentElement.count()) {
                    let installmentText = await installmentElement.textContent();
                    installmentText = installmentText.replace(/\s+/g, ' ').trim(); // Normalize spaces
                    if (installmentText && (installmentText.includes('x R$') || installmentText.includes('sem juros'))) {
                        detailsParcelamento = installmentText;
                    }
                }

                // Add to offers list if essential data is present.
                if (name && price && urlOffer) {
                    offers.push({
                        name,
                        price,
                        urlOffer,
                        site: 'Mercado Livre',
                        detailsParcelamento,
                    });
                } else {
                    // Log warnings if key data couldn't be extracted.
                    if (!name)
                        console.warn(
                            `[MercadoLivreScraper] Could not extract name. Item title (approx): ${
                                (await item.locator('a.ui-search-link[title]').count())
                                    ? await item.locator('a.ui-search-link[title]').getAttribute('title')
                                    : 'N/A Title'
                            }`
                        );
                    if (!price) console.warn(`[MercadoLivreScraper] Could not extract price for: ${name || 'Unknown item'}`);
                    if (!urlOffer)
                        console.warn(`[MercadoLivreScraper] Could not extract URL for: ${name || 'Unknown item'}`);
                }
            } catch (e) {
                // Log error for individual item processing but continue with the list.
                console.warn(
                    `[MercadoLivreScraper] Error extracting details for one product item: ${e.message}. Item HTML structure might be different.`
                );
                // For deep debugging, one might log item.innerHTML(), but it's very verbose.
                // console.warn(await item.innerHTML());
            }
        }

        console.log(`[MercadoLivreScraper] Successfully extracted ${offers.length} offers for: ${searchTermOrUrl}`);
    } catch (error) {
        // Catch-all for major errors during the scraping process.
        console.error(`[MercadoLivreScraper] An error occurred during scraping for "${searchTermOrUrl}": ${error.message}`);
        if (typeof page !== 'undefined' && page && !page.isClosed()) {
            // Attempt to take a screenshot for debugging.
            const screenshotPath = path.join(screenshotsDir, `mercadolivre_fatal_error_${Date.now()}.png`);
            try {
                await page.screenshot({ path: screenshotPath });
                console.log(`[MercadoLivreScraper] Screenshot taken on fatal error: ${screenshotPath}`);
            } catch (ssError) {
                console.error(`[MercadoLivreScraper] Could not take screenshot on fatal error: ${ssError.message}`);
            }
        }
        return []; // Return empty array on error to allow other processes to continue.
    } finally {
        // Ensure the browser is closed to free up resources.
        if (browser) {
            await browser.close();
            console.log('[MercadoLivreScraper] Browser closed.');
        }
    }

    return offers;
}

module.exports = {
    searchMercadoLivre,
};
