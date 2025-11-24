// State for local images
let allImages = [];
let availableImages = [];
let activeFilters = {
    topic: [],
    location: [],
    gender: []
};

/**
 * Loads the images.json file and initializes the available pool.
 */
async function loadLocalImages() {
    try {
        const response = await fetch('assets/images.json');
        if (!response.ok) throw new Error("Failed to load images.json");
        allImages = await response.json();

        // Initialize filters to include everything by default if empty
        // But actually the UI will dictate filters.
        // For now, let's assume if activeFilters are empty, we show everything.

        resetAvailableImages();
        console.log(`Loaded ${allImages.length} images from local assets.`);
    } catch (error) {
        console.error("Error loading local images:", error);
        allImages = [];
    }
}

/**
 * Sets the active filters and resets the available pool.
 * @param {Object} filters - {topic: [], location: [], gender: []}
 */
function setFilters(filters) {
    activeFilters = filters;
    resetAvailableImages();
}

/**
 * Resets the available images pool based on active filters.
 */
function resetAvailableImages() {
    // Filter allImages based on activeFilters
    availableImages = allImages.filter(item => {
        // If filter array is empty, it means "all selected" (or none, but usually all in this context)
        // However, the UI sends the CHECKED values. So if empty, nothing matches?
        // Let's assume if the UI sends empty array, it means nothing selected.
        // But usually we want to start with all.

        // Let's handle the logic: Item must match ONE of the selected topics AND ONE of the selected locations AND ONE of the selected genders.

        const topicMatch = activeFilters.topic.length === 0 || activeFilters.topic.includes(item.topic);
        const locationMatch = activeFilters.location.length === 0 || activeFilters.location.includes(item.location);
        const genderMatch = activeFilters.gender.length === 0 || activeFilters.gender.includes(item.gender);

        return topicMatch && locationMatch && genderMatch;
    });

    console.log(`Filters applied. Available images: ${availableImages.length}`);
}

/**
 * Formats a name to Title Case (e.g. "LIGHT (TRAPPER)" -> "Light (Trapper)")
 */
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

/**
 * Fetches a single random celebrity from the local pool.
 * Returns an array of 1 item to maintain compatibility with game.js logic.
 */
async function fetchCelebrityBatch() {
    // Ensure data is loaded
    if (allImages.length === 0) {
        await loadLocalImages();
    }

    if (allImages.length === 0) {
        console.error("No images available even after load.");
        return [];
    }

    // If we've shown everyone, reset the pool
    if (availableImages.length === 0) {
        console.log("All filtered images shown! Resetting pool...");
        resetAvailableImages();

        // If still empty, it means filters are too restrictive
        if (availableImages.length === 0) {
            console.warn("No images match the current filters.");
            return [];
        }
    }

    // Pick a random index
    const randomIndex = Math.floor(Math.random() * availableImages.length);

    // Remove it from the available pool so it doesn't repeat immediately
    const selected = availableImages.splice(randomIndex, 1)[0];

    // Format the name
    const formattedName = toTitleCase(selected.name);

    // Return as a single-item array
    return [{
        name: formattedName,
        image: selected.image
    }];
}