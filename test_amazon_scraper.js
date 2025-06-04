const { searchAmazon } = require('./src/scraper/amazonScraper');
const assert = require('assert');

async function testScraper() {
    const searchTerm = "cadeira gamer"; // Example search term
    console.log(`[TestScript] Starting test for Amazon scraper with term: "${searchTerm}"`);

    try {
        const offers = await searchAmazon(searchTerm);

        assert.ok(Array.isArray(offers), 'The scraper should return an array');
        console.log(`[TestScript] Received ${offers.length} offers:`);
        if (offers.length > 0) {
            offers.forEach((offer, index) => {
                console.log(`\n--- Offer ${index + 1} ---`);
                console.log(`Name: ${offer.name}`);
                console.log(`Price: R$ ${offer.price}`);
                console.log(`URL: ${offer.urlOffer}`);
                console.log(`Site: ${offer.site}`);
                console.log(`Installment: ${offer.detailsParcelamento}`);

                assert.ok(offer.name, 'Offer must contain a name');
                assert.strictEqual(typeof offer.price, 'number', 'Price must be a number');
                assert.ok(offer.urlOffer, 'Offer must contain urlOffer');
            });
        } else {
            console.log("[TestScript] No offers found.");
        }

    } catch (error) {
        console.error("[TestScript] An error occurred during the test:", error);
    } finally {
        console.log("[TestScript] Test finished.");
    }
}

testScraper();
