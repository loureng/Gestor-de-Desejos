// src/scraper/amazonScraper.js
const playwright = require('playwright');
const fs = require('fs'); // For saving screenshots
const path = require('path'); // For path joining

/**
 * Scrapes Amazon Brazil for a given search term or URL.
 * It launches a Playwright browser, navigates to Amazon, searches for the term,
 * and attempts to extract product name, price, URL, and installment details.
 * Includes basic CAPTCHA detection and error handling with screenshots.
 *
 * @async
 * @param {string} searchTermOrUrl - The product name or URL to search for on Amazon.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of offer objects.
 * Each object contains:
 *  - `name` (string): The name of the product.
 *  - `price` (number): The price of the product.
 *  - `urlOffer` (string): The URL of the product offer.
 *  - `site` (string): The site name ("Amazon BR").
 *  - `detailsParcelamento` (string): Installment details, if available.
 * Returns an empty array if no offers are found or in case of a critical error.
 */
async function searchAmazon(searchTermOrUrl) {
    console.log(`[AmazonScraper] Received search term: ${searchTermOrUrl}`);

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
            // headless: false // Uncomment for debugging to see the browser UI
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
            viewport: { width: 1920, height: 1080 }, // Standard desktop viewport
            locale: 'pt-BR', // Set locale for Amazon Brazil
        });
        page = await context.newPage();

        const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(searchTermOrUrl)}`;
        console.log(`[AmazonScraper] Navigating to search URL: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }); // Increased timeout for page load

        console.log(`[AmazonScraper] Waiting for search results for: ${searchTermOrUrl}`);

        try {
            // Wait for the main search results container to be present in the DOM.
            await page.waitForSelector('div[data-component-type="s-search-results"]', { timeout: 15000 });
        } catch (e) {
            // If the results container doesn't appear, it might be a CAPTCHA or other block.
            console.warn(`[AmazonScraper] Initial attempt to find search results failed: ${e.message}`);
            const screenshotPath = path.join(screenshotsDir, `amazon_error_search_results_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath });
            console.log(`[AmazonScraper] Screenshot taken: ${screenshotPath}`);

            // Attempt to detect CAPTCHA by looking for common CAPTCHA elements.
            const captchaInput = await page.$('input#captchacharacters');
            const captchaImage = await page.$('img[src*="/captcha/"]');

            if (captchaInput || captchaImage) {
                console.error('[AmazonScraper] CAPTCHA detected. Unable to proceed with scraping.');
                const captchaScreenshotPath = path.join(screenshotsDir, `amazon_captcha_detected_${Date.now()}.png`);
                await page.screenshot({ path: captchaScreenshotPath });
                console.log(`[AmazonScraper] CAPTCHA screenshot taken: ${captchaScreenshotPath}`);
            } else {
                // If no specific CAPTCHA elements are found, it might be a different issue (e.g., page structure change).
                console.error(
                    '[AmazonScraper] Search results container not found, and no clear CAPTCHA detected. The page structure might have changed or another issue occurred.'
                );
            }
            // Propagate error to stop further execution for this term.
            throw new Error('Search results not found, potentially due to CAPTCHA or page structure change.');
        }

        // Get all individual search result items.
        const productItems = await page.$$('div[data-component-type="s-search-result"]');
        console.log(`[AmazonScraper] Found ${productItems.length} potential product items.`);

        if (productItems.length === 0) {
            console.log(`[AmazonScraper] No products found for: ${searchTermOrUrl}`);
            const screenshotPath = path.join(screenshotsDir, `amazon_no_products_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath });
            console.log(`[AmazonScraper] Screenshot taken for no products page: ${screenshotPath}`);
            return []; // Return empty if no products, no need to proceed.
        }

        // Loop through each product item found on the page to extract details.
        for (const item of productItems) {
            try {
                let name = null;
                let price = null;
                let urlOffer = null;
                let detailsParcelamento = 'Não informado'; // Default value for installment details

                // Extract product name
                const nameElement = await item.$('h2 a.a-link-normal span.a-text-normal');
                if (nameElement) {
                    name = await nameElement.textContent();
                    name = name.trim();
                }

                // Extract product price
                const priceElement = await item.$('span.a-price > span.a-offscreen');
                if (priceElement) {
                    let priceText = await priceElement.textContent();
                    // Clean and parse price string (e.g., "R$ 1.234,56" to 1234.56)
                    priceText = priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
                    if (priceText) {
                        price = parseFloat(priceText);
                    }
                }

                // Extract product URL
                const urlElement = await item.$('h2 a.a-link-normal');
                if (urlElement) {
                    let rawUrl = await urlElement.getAttribute('href');
                    if (rawUrl) {
                        // Ensure URL is absolute and clean it from tracking parameters.
                        if (!rawUrl.startsWith('http')) {
                            urlOffer = `https://www.amazon.com.br${rawUrl}`;
                        } else {
                            urlOffer = rawUrl;
                        }
                        urlOffer = urlOffer.split('?')[0]; // Remove query parameters
                        urlOffer = urlOffer.split('/ref=')[0]; // Remove Amazon referral part
                    }
                }

                // Extract installment details if available
                const installmentElement = await item.$(
                    '.a-row .a-size-base.a-color-secondary, .a-row .a-size-base.a-color-base'
                );
                if (installmentElement) {
                    const installmentText = await installmentElement.textContent();
                    if (installmentText && (installmentText.includes('x de R$') || installmentText.includes('parcelas'))) {
                        detailsParcelamento = installmentText.trim().replace(/\s+/g, ' ');
                    }
                }

                // Only add the offer if essential information (name, price, URL) was found.
                if (name && price && urlOffer) {
                    offers.push({
                        name,
                        price,
                        urlOffer,
                        site: 'Amazon BR',
                        detailsParcelamento,
                    });
                } else {
                    // Log warnings if essential data is missing for an item.
                    if (!name)
                        console.warn(`[AmazonScraper] Could not extract name for an item with URL ${urlOffer || 'N/A'}`);
                    if (!price) console.warn(`[AmazonScraper] Could not extract price for: ${name || 'Unknown item'}`);
                    if (!urlOffer) console.warn(`[AmazonScraper] Could not extract URL for: ${name || 'Unknown item'}`);
                }
            } catch (e) {
                // Log error for individual item extraction but continue with other items.
                console.warn(`[AmazonScraper] Error extracting details for one product item: ${e.message}`);
            }
        }

        console.log(`[AmazonScraper] Successfully extracted ${offers.length} offers for: ${searchTermOrUrl}`);
    } catch (error) {
        // Catch-all for major errors during the scraping process (e.g., navigation, CAPTCHA).
        console.error(`[AmazonScraper] An error occurred during scraping for "${searchTermOrUrl}": ${error.message}`);
        if (typeof page !== 'undefined' && page && !page.isClosed()) {
            // Try to take a screenshot for debugging if a page object exists.
            const screenshotPath = path.join(screenshotsDir, `amazon_fatal_error_${Date.now()}.png`);
            try {
                await page.screenshot({ path: screenshotPath });
                console.log(`[AmazonScraper] Screenshot taken on fatal error: ${screenshotPath}`);
            } catch (ssError) {
                console.error(`[AmazonScraper] Could not take screenshot on fatal error: ${ssError.message}`);
            }
        }
        return []; // Return empty array on error to allow other scrapers (if any) to proceed.
    } finally {
        // Ensure browser is closed in all cases (success or error) to free resources.
        if (browser) {
            await browser.close();
            console.log('[AmazonScraper] Browser closed.');
        }
    }

    return offers;
}

module.exports = {
    searchAmazon,
};
