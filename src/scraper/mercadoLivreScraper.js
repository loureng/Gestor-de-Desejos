// src/scraper/mercadoLivreScraper.js
const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Scrapes Mercado Livre Brazil for a given search term.
 * 
 * @param {string} searchTermOrUrl The product name to search for.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of offer objects.
 */
async function searchMercadoLivre(searchTermOrUrl) {
    console.log(`[MercadoLivreScraper] Received search term: ${searchTermOrUrl}`);
    
    const offers = [];
    let browser = null;
    let page;
    const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots_debug');
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
            locale: 'pt-BR',
        });
        page = await context.newPage();

        const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(searchTermOrUrl.replace(/\s+/g, '-'))}`;
        console.log(`[MercadoLivreScraper] Navigating to search URL: ${searchUrl}`);
        
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }); 
        
        console.log(`[MercadoLivreScraper] Waiting for search results for: ${searchTermOrUrl}`);
        
        const resultsContainerSelector = 'ol.ui-search-layout'; 
        try {
            await page.waitForSelector(resultsContainerSelector, { timeout: 30000 });
            await page.waitForSelector(`${resultsContainerSelector} li.ui-search-layout__item`, { timeout: 15000 });
        } catch (e) {
            console.warn(`[MercadoLivreScraper] Error waiting for search results: ${e.message}`);
            const screenshotPath = path.join(screenshotsDir, `mercadolivre_error_results_container_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath });
            console.log(`[MercadoLivreScraper] Screenshot taken: ${screenshotPath}`);

            const humanCheckTitle = await page.locator('h1', { hasText: /Parece que você não é um robô/i }).count() > 0;
            const unusualActivity = await page.locator('h1', { hasText: /Detectamos atividade incomum/i }).count() > 0;
            
            if (humanCheckTitle || unusualActivity) {
                console.error('[MercadoLivreScraper] CAPTCHA or security block detected.');
                const captchaScreenshotPath = path.join(screenshotsDir, `mercadolivre_captcha_detected_${Date.now()}.png`);
                await page.screenshot({ path: captchaScreenshotPath });
                console.log(`[MercadoLivreScraper] CAPTCHA/Block screenshot taken: ${captchaScreenshotPath}`);
            } else {
                console.error('[MercadoLivreScraper] Search results not found/loaded, and no clear CAPTCHA/block detected.');
            }
            throw new Error('Search results not found or page load issue, potentially due to CAPTCHA/block or page structure change.');
        }

        const productItems = await page.locator('li.ui-search-layout__item').all(); // Use locator().all()
        console.log(`[MercadoLivreScraper] Found ${productItems.length} potential product items.`);

        if (productItems.length === 0) {
            console.log(`[MercadoLivreScraper] No products found for: ${searchTermOrUrl}`);
            const screenshotPath = path.join(screenshotsDir, `mercadolivre_no_products_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath });
            console.log(`[MercadoLivreScraper] Screenshot taken for no products page: ${screenshotPath}`);
            return [];
        }

        for (const item of productItems.slice(0, 10)) { 
            try {
                let name = null;
                let price = null;
                let urlOffer = null;
                let detailsParcelamento = "Não informado";

                // Extremely simplified attempt: Find a link that looks like a product link by its href
                const productLink = await item.locator('a[href*="/MLB-"], a[href*="/p/MLA-"]').first(); // MLA for Argentina, but /p/ is common

                if (await productLink.count() > 0) {
                    urlOffer = await productLink.getAttribute('href');
                    name = await productLink.getAttribute('title'); // Hope title attribute exists

                    if (!name) { // If title attribute is missing, try to get text from a known title class inside the link
                        const titleSpan = await productLink.locator('.ui-search-item__title').first();
                        if (await titleSpan.count() > 0) {
                            name = await titleSpan.textContent();
                        } else { // Else, just get any text from the link
                            name = await productLink.textContent();
                        }
                    }

                    if (name) name = name.replace(/\s+/g, ' ').trim();
                    if (urlOffer) urlOffer = urlOffer.split('#')[0];

                    console.log(`[MercadoLivreScraper] Name: ${name}, URL: ${urlOffer}`);
                } else {
                    console.log('[MercadoLivreScraper] Product-like link (href*="/MLB-", href*="/p/") not found.');
                }

                // Price (current logic seems to work, keeping it)
                const priceFractionElement = await item.locator('span.andes-money-amount__fraction').first();
                const priceCentsElement = await item.locator('span.andes-money-amount__cents').first();

                if (await priceFractionElement.count() > 0) {
                    let priceString = (await priceFractionElement.textContent()).replace(/\D/g, '');
                    if (await priceCentsElement.count() > 0) {
                        const centsStr = (await priceCentsElement.textContent()).replace(/\D/g, '');
                        priceString += `.${centsStr}`;
                    }
                    price = parseFloat(priceString);
                    console.log(`[MercadoLivreScraper] Price found: ${price}`);
                } else {
                    console.log('[MercadoLivreScraper] Price fraction element not found.');
                }
                                
                // 3. Installments:
                const installmentElement = await item.locator('span.ui-search-installments').first(); 
                if (await installmentElement.count()) {
                    let installmentText = await installmentElement.textContent();
                    installmentText = installmentText.replace(/\s+/g, ' ').trim(); 
                    if (installmentText && (installmentText.includes('x R$') || installmentText.includes('sem juros'))) {
                        detailsParcelamento = installmentText;
                    }
                }
                
                if (name && price && urlOffer) {
                    offers.push({
                        name,
                        price,
                        urlOffer,
                        site: "Mercado Livre",
                        detailsParcelamento
                    });
                } else {
                    if (!name) console.warn(`[MercadoLivreScraper] Could not extract name. Item HTML (approx): ${await item.locator('a.ui-search-link[title]').count() ? await item.locator('a.ui-search-link[title]').getAttribute('title') : 'N/A Title'}`);
                    if (!price) console.warn(`[MercadoLivreScraper] Could not extract price for: ${name || 'Unknown item'}`);
                    if (!urlOffer) console.warn(`[MercadoLivreScraper] Could not extract URL for: ${name || 'Unknown item'}`);
                }

            } catch (e) {
                console.warn(`[MercadoLivreScraper] Error extracting details for one product item: ${e.message}. Item HTML structure might be different.`);
                // console.warn(await item.innerHTML()); // Log item HTML for debugging, can be very verbose
            }
        }

        console.log(`[MercadoLivreScraper] Successfully extracted ${offers.length} offers for: ${searchTermOrUrl}`);

    } catch (error) {
        console.error(`[MercadoLivreScraper] An error occurred during scraping for "${searchTermOrUrl}": ${error.message}`);
        if (typeof page !== 'undefined' && page && !page.isClosed()) { 
            const screenshotPath = path.join(screenshotsDir, `mercadolivre_fatal_error_${Date.now()}.png`);
            try {
                await page.screenshot({ path: screenshotPath });
                console.log(`[MercadoLivreScraper] Screenshot taken on fatal error: ${screenshotPath}`);
            } catch (ssError) {
                console.error(`[MercadoLivreScraper] Could not take screenshot on fatal error: ${ssError.message}`);
            }
        }
        return [];
    } finally {
        if (browser) {
            await browser.close();
            console.log("[MercadoLivreScraper] Browser closed.");
        }
    }

    return offers;
}

module.exports = {
    searchMercadoLivre
};
