const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

// Ξεκινάμε από την αρχή (0). 
// Κάθε φορά που ζητάμε δεδομένα, αυτό θα αυξάνεται.
let currentOffset = 0; 

async function fetchCelebrityBatch() {
    
    console.log(`Ζητάμε Έλληνες από τη θέση ${currentOffset} έως ${currentOffset + 20}...`);

    // Το Query είναι πλέον πανάλαφρο:
    // "Δώσε μου Ανθρώπους (Q5), Έλληνες (Q41), με Εικόνα (P18)"
    // Ταξινόμηση με βάση τα Sitelinks για να έχει μια σειρά και να μην φέρνει διπλά.
    const query = `
    SELECT DISTINCT ?item ?itemLabel ?pic WHERE {
      ?item wdt:P31 wd:Q5;        # Είναι άνθρωπος
            wdt:P27 wd:Q41;       # Είναι Έλληνας
            wdt:P18 ?pic;         # Έχει φωτογραφία
            wikibase:sitelinks ?sitelinks.
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "el,en". }
    }
    ORDER BY DESC(?sitelinks)     # Από τους πιο γνωστούς στους λιγότερο
    LIMIT 20
    OFFSET ${currentOffset}
    `;

    const url = WIKIDATA_ENDPOINT + "?query=" + encodeURIComponent(query) + "&format=json";

    try {
        const response = await fetch(url);
        const data = await response.json();
        const items = data.results.bindings;

        // ΑΥΞΗΣΗ ΤΟΥ OFFSET ΓΙΑ ΤΗΝ ΕΠΟΜΕΝΗ ΦΟΡΑ
        // Την επόμενη φορά που θα κληθεί η συνάρτηση, θα φέρει τους επόμενους 20
        currentOffset += 20;

        return items.map(entry => ({
            name: entry.itemLabel.value,
            image: entry.pic.value.replace("http://", "https://")
        }));

    } catch (error) {
        console.error("API Error:", error);
        return [];
    }
}