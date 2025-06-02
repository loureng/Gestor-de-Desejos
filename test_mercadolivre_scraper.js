const { searchMercadoLivre } = require('./src/scraper/mercadoLivreScraper');

async function testScraper() {
    const searchTerm = "fone de ouvido bluetooth"; // Example search term
    console.log(`[TestScriptML] Starting test for Mercado Livre scraper with term: "${searchTerm}"`);

    try {
        const offers = await searchMercadoLivre(searchTerm);

        console.log(`[TestScriptML] Received ${offers.length} offers:`);
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
            console.log("[TestScriptML] No offers found.");
        }

    } catch (error) {
        console.error("[TestScriptML] An error occurred during the test:", error);
    } finally {
        console.log("[TestScriptML] Test finished.");
    }
}

testScraper();
