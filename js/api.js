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
 * Also validates that images exist and removes broken ones.
 */
async function loadLocalImages() {
    try {
        const response = await fetch('assets/images.json');
        if (!response.ok) throw new Error("Failed to load images.json");
        let loadedImages = await response.json();

        // Validate each image exists by trying to load it
        allImages = await validateImages(loadedImages);

        resetAvailableImages();
        console.log(`Loaded ${allImages.length} validated images from local assets.`);
    } catch (error) {
        console.error("Error loading local images:", error);
        allImages = [];
    }
}

/**
 * Validates that images actually exist and can be loaded.
 * Filters out any broken/missing images.
 */
async function validateImages(images) {
    const validatedImages = [];

    for (const img of images) {
        const exists = await checkImageExists(img.image);
        if (exists) {
            validatedImages.push(img);
        } else {
            console.warn(`⚠️ Image not found, skipping: ${img.name} (${img.image})`);
        }
    }

    return validatedImages;
}

/**
 * Checks if an image URL can be loaded
 */
function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;

        // Timeout after 3 seconds
        setTimeout(() => resolve(false), 3000);
    });
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
    availableImages = allImages.filter(item => {
        const topicMatch = activeFilters.topic.length === 0 || activeFilters.topic.includes(item.topic);
        const locationMatch = activeFilters.location.length === 0 || activeFilters.location.includes(item.location);
        const genderMatch = activeFilters.gender.length === 0 || activeFilters.gender.includes(item.gender);

        return topicMatch && locationMatch && genderMatch;
    });

    console.log(`Filters applied. Available images: ${availableImages.length}`);
}

/**
 * Formats a name to Title Case
 */
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

/**
 * Fetches a single random celebrity from the local pool.
 * Returns an array of 1 item to maintain compatibility.
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