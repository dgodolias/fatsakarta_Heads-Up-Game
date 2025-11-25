// === STATE ===
let celebrityQueue = [];
let currentIndex = 0;

// === DOM ELEMENTS ===
const screens = {
    start: document.getElementById('start-screen'),
    countdown: document.getElementById('countdown-screen'),
    game: document.getElementById('game-screen')
};

const els = {
    btnGenerate: document.getElementById('generate-btn'),
    btnNext: document.getElementById('next-btn'),
    btnReset: document.getElementById('reset-btn'),
    timer: document.getElementById('timer-number'),
    img: document.getElementById('celeb-img'),
    name: document.getElementById('celeb-name'),
    loading: document.getElementById('loading-msg'),
    filterBtn: document.getElementById('filter-btn'),
    filterModal: document.getElementById('filter-modal'),
    applyFiltersBtn: document.getElementById('apply-filters-btn')
};

// === FILTER MODAL HANDLING ===
els.filterBtn.addEventListener('click', () => {
    els.filterModal.classList.remove('hidden');
});

els.applyFiltersBtn.addEventListener('click', () => {
    // Collect selected filters
    const topicCheckboxes = document.querySelectorAll('input[name="topic"]:checked');
    const locationCheckboxes = document.querySelectorAll('input[name="location"]:checked');
    const genderCheckboxes = document.querySelectorAll('input[name="gender"]:checked');

    const filters = {
        topic: Array.from(topicCheckboxes).map(cb => cb.value),
        location: Array.from(locationCheckboxes).map(cb => cb.value),
        gender: Array.from(genderCheckboxes).map(cb => cb.value)
    };

    // Apply filters via API
    setFilters(filters);

    // Reset queue so new filters take effect immediately
    currentIndex = 0;
    celebrityQueue = [];

    // Close modal
    els.filterModal.classList.add('hidden');

    console.log('Filters applied:', filters);
});

// Close modal when clicking outside
els.filterModal.addEventListener('click', (e) => {
    if (e.target === els.filterModal) {
        els.filterModal.classList.add('hidden');
    }
});

// === INITIALIZATION ===
async function init() {
    try {
        els.btnGenerate.disabled = true;
        els.btnGenerate.textContent = "ΦΟΡΤΩΣΗ...";

        // Φορτώνουμε όλες τις εικόνες μια φορά στην αρχή
        const batch = await fetchCelebrityBatch();

        if (batch.length === 0) {
            alert("Δεν βρέθηκαν πρόσωπα! Κάνε refresh.");
            return;
        }

        // Ξεκινάμε με μια κάρτα, οι υπόλοιπες θα φορτώνονται δυναμικά
        celebrityQueue.push(...batch);

        els.loading.style.display = 'none';
        els.btnGenerate.disabled = false;
        els.btnGenerate.textContent = "ΠΑΙΞΕ ΤΩΡΑ";

    } catch (error) {
        console.error("Init Error:", error);
        alert("Κάτι πήγε στραβά. Κάνε refresh.");
    }
}

// === GAME FLOW ===
els.btnGenerate.addEventListener('click', () => {
    showScreen('countdown');
    let timeLeft = 5;
    els.timer.innerText = timeLeft;

    const interval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            els.timer.innerText = timeLeft;
        } else {
            clearInterval(interval);
            startGame();
        }
    }, 1000);
});

function startGame() {
    showNextPhoto();
    showScreen('game');
}

async function showNextPhoto() {
    // Αν τελείωσαν οι κάρτες στην ουρά, πάρε μία νέα
    if (currentIndex >= celebrityQueue.length) {
        const newBatch = await fetchCelebrityBatch();
        if (newBatch.length > 0) {
            celebrityQueue.push(...newBatch);
        } else {
            alert("Δεν υπάρχουν άλλες κάρτες με αυτά τα φίλτρα!");
            showScreen('start');
            currentIndex = 0;
            celebrityQueue = [];
            return;
        }
    }

    // Πάρε την επόμενη κάρτα
    const celeb = celebrityQueue[currentIndex];

    // Εμφάνιση εικόνας
    els.img.src = celeb.image;

    // Εμφάνιση ονόματος
    els.name.textContent = celeb.name;
    els.name.classList.remove('hidden');

    console.log(`Showing: ${celeb.name}`);

    // Αύξηση δείκτη
    currentIndex++;
}

els.btnNext.addEventListener('click', showNextPhoto);

els.btnReset.addEventListener('click', () => {
    currentIndex = 0;
    celebrityQueue = [];
    showScreen('start');
});

// === UTILS ===
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function addButtonEffects() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        const onPointerDown = (e) => {
            if (btn.disabled) return;
            btn.classList.add('pressed');
            const rect = btn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const size = Math.max(rect.width, rect.height) * 1.2;
            ripple.style.width = ripple.style.height = size + 'px';
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        };
        btn.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('pointerup', () => btn.classList.remove('pressed'));
    });
}

init();
addButtonEffects();