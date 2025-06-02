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

                // Product title: Often in a specific class within an <a> tag or an <h2>
                const nameElement = await item.locator('h2.ui-search-item__title').first(); // .first() to ensure we get one if multiple match
                if (await nameElement.count()) {
                    name = await nameElement.textContent();
                } else { // Fallback: title might be in an <a> tag's title attribute or text
                    const altNameElement = await item.locator('a.ui-search-link[title]').first();
                    if (await altNameElement.count()) {
                         name = await altNameElement.getAttribute('title');
                    } else { // Another fallback for text content of a link
                         const linkTextElement = await item.locator('a.ui-search-link').first();
                         if(await linkTextElement.count()) name = await linkTextElement.textContent();
                    }
                }
                name = name ? name.trim() : null;


                // Price: Look for the main price container, then fraction and cents.
                // Common structure: .ui-search-price__second-line .andes-money-amount
                const priceContainer = await item.locator('div.ui-search-price__second-line .andes-money-amount').first();
                if (await priceContainer.count()) {
                    const fraction = await priceContainer.locator('.andes-money-amount__fraction').textContent();
                    const cents = await priceContainer.locator('.andes-money-amount__cents').first(); // Use .first() and check count
                    let priceString = fraction.replace(/\D/g, '');
                    if (await cents.count()) {
                        priceString += `.${(await cents.textContent()).replace(/\D/g, '')}`;
                    }
                    price = parseFloat(priceString);
                } else { // Fallback: sometimes price is directly in .ui-search-price__part
                    const fallbackPriceElement = await item.locator('span.ui-search-price__part .andes-money-amount__fraction').first();
                     if (await fallbackPriceElement.count()) {
                        let priceString = (await fallbackPriceElement.textContent()).replace(/\D/g, '');
                        const fallbackCentsElement = await item.locator('span.ui-search-price__part .andes-money-amount__cents').first();
                        if(await fallbackCentsElement.count()){
                            priceString += `.${(await fallbackCentsElement.textContent()).replace(/\D/g, '')}`;
                        }
                        price = parseFloat(priceString);
                     }
                }
                                
                // URL: Usually the href of a prominent link covering the item image or title.
                const urlElement = await item.locator('a.ui-search-link').first();
                if (await urlElement.count()) {
                    urlOffer = await urlElement.getAttribute('href');
                    urlOffer = urlOffer ? urlOffer.split('#')[0] : null; 
                }

                // Installments:
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
