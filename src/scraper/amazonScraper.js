// src/scraper/amazonScraper.js
const playwright = require('playwright');
const fs = require('fs'); // For saving screenshots
const path = require('path'); // For path joining

/**
 * Scrapes Amazon Brazil for a given search term.
 * 
 * @param {string} searchTermOrUrl The product name to search for.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of offer objects.
 */
async function searchAmazon(searchTermOrUrl) {
    console.log(`[AmazonScraper] Received search term: ${searchTermOrUrl}`);
    
    const offers = [];
    let browser = null;
    let page; 
    const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots_debug');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    try {
        browser = await playwright.chromium.launch({
            // headless: false 
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36', // Updated UA
            viewport: { width: 1920, height: 1080 },
            locale: 'pt-BR',
        });
        page = await context.newPage();

        const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(searchTermOrUrl)}`;
        console.log(`[AmazonScraper] Navigating to search URL: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        console.log(`[AmazonScraper] Waiting for search results for: ${searchTermOrUrl}`);
        
        try {
            // Try waiting for the first product item itself as a sign that results are loaded
            await page.waitForSelector('div[data-component-type="s-search-result"]', { timeout: 20000 }); // Increased timeout slightly
        } catch (e) {
            console.warn(`[AmazonScraper] Initial attempt to find search results (first item) failed: ${e.message}`);
            const screenshotPath = path.join(screenshotsDir, `amazon_error_search_results_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath });
            console.log(`[AmazonScraper] Screenshot taken: ${screenshotPath}`);

            // Check for common CAPTCHA indicators
            const captchaInput = await page.$('input#captchacharacters'); // Standard Amazon CAPTCHA input field
            const captchaImage = await page.$('img[src*="/captcha/"]'); // Image used in CAPTCHA
            
            if (captchaInput || captchaImage) {
                console.error('[AmazonScraper] CAPTCHA detected. Unable to proceed with scraping.');
                const captchaScreenshotPath = path.join(screenshotsDir, `amazon_captcha_detected_${Date.now()}.png`);
                await page.screenshot({ path: captchaScreenshotPath });
                console.log(`[AmazonScraper] CAPTCHA screenshot taken: ${captchaScreenshotPath}`);
            } else {
                console.error('[AmazonScraper] Search results container not found, and no clear CAPTCHA detected. The page structure might have changed or another issue occurred.');
            }
            throw new Error('Search results not found, potentially due to CAPTCHA or page structure change.');
        }

        const productItems = await page.$$('div[data-component-type="s-search-result"]');
        console.log(`[AmazonScraper] Found ${productItems.length} potential product items.`);

        if (productItems.length === 0) {
            console.log(`[AmazonScraper] No products found for: ${searchTermOrUrl}`);
             const screenshotPath = path.join(screenshotsDir, `amazon_no_products_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath });
            console.log(`[AmazonScraper] Screenshot taken for no products page: ${screenshotPath}`);
            return [];
        }

        for (const item of productItems) {
            try {
                let name = null;
                let price = null;
                let urlOffer = null;
                let detailsParcelamento = "Não informado";

                // Updated URL selector: Look for a common link structure within product items
                const urlElement = await item.$('a.a-link-normal.s-underline-text.s-link-style.a-text-normal'); // Combined and simplified
                if (urlElement) {
                    let rawUrl = await urlElement.getAttribute('href');
                    if (rawUrl) {
                        if (!rawUrl.startsWith('http')) {
                            urlOffer = `https://www.amazon.com.br${rawUrl}`;
                        } else {
                            urlOffer = rawUrl;
                        }
                        urlOffer = urlOffer.split('?')[0];
                        urlOffer = urlOffer.split('/ref=')[0];
                    }

                    // 2. Extract Name - Prefer a specific span inside the link for cleaner text
                    const nameSpanInsideLink = await urlElement.$('span.a-size-medium.a-color-base.a-text-normal, span.a-size-base-plus.a-color-base.a-text-normal');
                    if (nameSpanInsideLink) {
                        name = await nameSpanInsideLink.textContent();
                    } else {
                        // Fallback to the direct text content of the link if specific span isn't found
                        // This might include extra text like prices, so it's less ideal
                        name = await urlElement.textContent();
                    }
                    if (name) {
                        name = name.replace(/\s+/g, ' ').trim(); // Clean whitespace
                        // Attempt to remove price string artifacts from name
                        name = name.replace(/R\$\s*[\d.,]+/g, '').replace(/\s*De:\s*R\$\s*[\d.,]+/gi, '').replace(/\s+/g, ' ').trim();
                    }
                }

                // If name is still not found (e.g. different link structure), try a broader search for title-like spans
                if (!name) {
                    const fallbackNameElement = await item.$('span.a-size-medium.a-color-base.a-text-normal, span.a-size-base-plus.a-color-base.a-text-normal');
                    if (fallbackNameElement) {
                        name = await fallbackNameElement.textContent();
                        if (name) {
                            name = name.replace(/\s+/g, ' ').trim();
                             // Attempt to remove price string artifacts from name
                            name = name.replace(/R\$\s*[\d.,]+/g, '').replace(/\s*De:\s*R\$\s*[\d.,]+/gi, '').replace(/\s+/g, ' ').trim();
                        }
                    }
                }
                // As a final generic fallback for name, try any h2 element's text content if all else fails
                if (!name) {
                    const h2NameElement = await item.$('h2');
                    if (h2NameElement) {
                        name = await h2NameElement.textContent();
                        if (name) {
                            name = name.replace(/\s+/g, ' ').trim();
                             // Attempt to remove price string artifacts from name
                            name = name.replace(/R\$\s*[\d.,]+/g, '').replace(/\s*De:\s*R\$\s*[\d.,]+/gi, '').replace(/\s+/g, ' ').trim();
                        }
                    }
                }

                // Price selector (remains relatively stable)
                const priceElement = await item.$('span.a-price > span.a-offscreen');
                if (priceElement) {
                    let priceText = await priceElement.textContent();
                    priceText = priceText.replace(/[^\d,.]/g, '').replace(/\./g, (match, offset, fullText) => offset < fullText.lastIndexOf(',') ? '' : '.').replace(',', '.').trim();
                    if (priceText) {
                        price = parseFloat(priceText);
                    }
                }
                
                // Fallback for URL if name and price were found but URL wasn't from the primary productLinkElement
                // This might happen if the primary link selector failed but fallbacks for name/price succeeded.
                if (!urlOffer && name && price) {
                    const fallbackUrlElement = await item.$('h2 a.a-link-normal');
                    if (fallbackUrlElement) {
                       let rawUrl = await fallbackUrlElement.getAttribute('href');
                       if (rawUrl) {
                            if (!rawUrl.startsWith('http')) {
                                urlOffer = `https://www.amazon.com.br${rawUrl}`;
                            } else {
                                urlOffer = rawUrl;
                            }
                            urlOffer = urlOffer.split('?')[0];
                            urlOffer = urlOffer.split('/ref=')[0];
                        }
                    }
                }

                const installmentElement = await item.$('.a-row .a-size-base.a-color-secondary, .a-row .a-size-base.a-color-base');
                if (installmentElement) {
                    const installmentText = await installmentElement.textContent();
                    if (installmentText && (installmentText.includes('x de R$') || installmentText.includes('parcelas'))) {
                        detailsParcelamento = installmentText.trim().replace(/\s+/g, ' ');
                    }
                }
                
                if (name && price && urlOffer) {
                    offers.push({
                        name,
                        price,
                        urlOffer,
                        site: "Amazon BR",
                        detailsParcelamento
                    });
                } else {
                    if (!name) console.warn(`[AmazonScraper] Could not extract name for an item with URL ${urlOffer || 'N/A'}`);
                    if (!price) console.warn(`[AmazonScraper] Could not extract price for: ${name || 'Unknown item'}`);
                    if (!urlOffer) console.warn(`[AmazonScraper] Could not extract URL for: ${name || 'Unknown item'}`);
                }

            } catch (e) {
                console.warn(`[AmazonScraper] Error extracting details for one product item: ${e.message}`);
            }
        }

        console.log(`[AmazonScraper] Successfully extracted ${offers.length} offers for: ${searchTermOrUrl}`);

    } catch (error) {
        console.error(`[AmazonScraper] An error occurred during scraping for "${searchTermOrUrl}": ${error.message}`);
        if (typeof page !== 'undefined' && page && !page.isClosed()) { 
            const screenshotPath = path.join(screenshotsDir, `amazon_fatal_error_${Date.now()}.png`);
            try {
                await page.screenshot({ path: screenshotPath });
                console.log(`[AmazonScraper] Screenshot taken on fatal error: ${screenshotPath}`);
            } catch (ssError) {
                console.error(`[AmazonScraper] Could not take screenshot on fatal error: ${ssError.message}`);
            }
        }
        return [];
    } finally {
        if (browser) {
            await browser.close();
            console.log("[AmazonScraper] Browser closed.");
        }
    }

    return offers;
}

module.exports = {
    searchAmazon
};
