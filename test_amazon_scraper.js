const { searchAmazon } = require('./src/scraper/amazonScraper');
const assert = require('assert');

// Simple sanity test for the Amazon scraper using Node's assert module.

async function testScraper() {
    const searchTerm = "cadeira gamer"; // Example search term
    console.log(`[TestScript] Starting test for Amazon scraper with term: "${searchTerm}"`);

    try {
        const offers = await searchAmazon(searchTerm);

        // Basic assertions to validate scraper output structure
        assert(Array.isArray(offers), 'Result should be an array');
        offers.forEach((offer, index) => {
            assert.strictEqual(typeof offer, 'object', `Offer at index ${index} should be an object`);
            ['name', 'price', 'urlOffer', 'site'].forEach((key) => {
                assert.ok(Object.prototype.hasOwnProperty.call(offer, key), `Offer at index ${index} missing key: ${key}`);
            });
        });

        console.log(`[TestScript] Received ${offers.length} offers:`);
        if (offers.length > 0) {
            offers.forEach((offer, index) => {
                console.log(`\n--- Offer ${index + 1} ---`);
                console.log(`Name: ${offer.name}`);
                console.log(`Price: R$ ${offer.price}`);
                console.log(`URL: ${offer.urlOffer}`);
                console.log(`Site: ${offer.site}`);
                console.log(`Installment: ${offer.detailsParcelamento}`);
            });
        } else {
            console.log("[TestScript] No offers found.");
        }

    } catch (error) {
        console.error("[TestScript] An error occurred during the test:", error);
        // Ensure a non-zero exit code when an assertion or runtime error occurs
        process.exitCode = 1;
    } finally {
        console.log("[TestScript] Test finished.");
    }
}

testScraper();
