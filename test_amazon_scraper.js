const { searchAmazon } = require('./src/scraper/amazonScraper');

async function testScraper() {
    const searchTerm = "cadeira gamer"; // Example search term
    console.log(`[TestScript] Starting test for Amazon scraper with term: "${searchTerm}"`);

    try {
        const offers = await searchAmazon(searchTerm);

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
    } finally {
        console.log("[TestScript] Test finished.");
    }
}

testScraper();
