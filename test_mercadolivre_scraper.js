const { searchMercadoLivre } = require('./src/scraper/mercadoLivreScraper');
const assert = require('assert');

async function testScraper() {
    const searchTerm = "fone de ouvido bluetooth"; // Example search term
    console.log(`[TestScriptML] Starting test for Mercado Livre scraper with term: "${searchTerm}"`);

    try {
        const offers = await searchMercadoLivre(searchTerm);

        assert.ok(Array.isArray(offers), 'The scraper should return an array');
        console.log(`[TestScriptML] Received ${offers.length} offers:`);
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
            console.log("[TestScriptML] No offers found.");
        }

    } catch (error) {
        console.error("[TestScriptML] An error occurred during the test:", error);
    } finally {
        console.log("[TestScriptML] Test finished.");
    }
}

testScraper();
