// === STATE ===
let celebrityQueue = [];
let currentIndex = 0;
let isFetching = false;

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
    loading: document.getElementById('loading-msg')
};

// === DATA BUFFERING LOGIC ===
async function loadMoreData() {
    if (isFetching) return;
    isFetching = true;

    console.log("--- Requesting next batch... ---");

    try {
        const newBatch = await fetchCelebrityBatch();

        if (newBatch.length === 0) {
            console.log("No data received via API.");
            isFetching = false;
            return;
        }

        const shuffledBatch = shuffleArray(newBatch);
        celebrityQueue.push(...shuffledBatch);

        console.log(`Added ${newBatch.length} items. Queue Size: ${celebrityQueue.length}`);
    } catch (err) {
        console.error("Failed to load more data", err);
    } finally {
        isFetching = false;
    }
}

// === INITIALIZATION ===
async function init() {
    try {
        els.btnGenerate.disabled = true;
        els.btnGenerate.textContent = "ΦΟΡΤΩΣΗ...";

        // Φορτώνουμε ΜΙΑ φορά στην αρχή
        await loadMoreData();

        // Αν για κάποιο λόγο δεν έφερε τίποτα (πχ error), ξαναδοκιμάζουμε μια φορά
        if (celebrityQueue.length === 0) await loadMoreData();

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
    // Αν έχουν τελειώσει οι κάρτες, ξεκινάμε από την αρχή
    if (currentIndex >= celebrityQueue.length) {
        currentIndex = 0;
        // celebrityQueue = shuffleArray(celebrityQueue); // Δεν χρειάζεται πλέον, το api.js το χειρίζεται
    }

    // Αν η ουρά είναι άδεια (πχ λόγω φίλτρων), ξαναπροσπαθούμε να φορτώσουμε
    if (celebrityQueue.length === 0) {
        loadMoreData().then(() => {
            if (celebrityQueue.length > 0) {
                startCountdown();
            } else {
                alert("Δεν βρέθηκαν πρόσωπα με αυτά τα φίλτρα!");
            }
        });
    } else {
        startCountdown();
    }
});

function startCountdown() {
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
}

function startGame() {
    showNextPhoto();
    showScreen('game');
}

function showNextPhoto() {
    // Προστασία αν η ουρά είναι άδεια
    if (celebrityQueue.length === 0) {
        alert("Δεν βρέθηκαν πρόσωπα! Κάνε refresh ή άλλαξε φίλτρα.");
        return;
    }

    // 1. Εμφάνιση φωτογραφίας
    // Χρησιμοποιούμε το modulo για να μην κρασάρει αν ξεπεράσουμε το μήκος (looping safe)
    const safeIndex = currentIndex % celebrityQueue.length;
    const celeb = celebrityQueue[safeIndex];

    let imageUrl = celeb.image;
    if (!imageUrl.includes("width=")) imageUrl += "?width=500";
    els.img.src = imageUrl;

    console.log(`Showing #${currentIndex}: ${celeb.name}`);

    // 2. Αύξηση δείκτη
    currentIndex++;

    // 3. === Η ΛΟΓΙΚΗ ΠΟΥ ΖΗΤΗΣΕΣ ===
    // 2. Εμφάνιση Ονόματος (Ζητούμενο 2)
    els.name.textContent = celeb.name;
    els.name.classList.remove('hidden'); // Εμφάνιση του ονόματος

    console.log(`Showing: ${celeb.name}`);
    // Ελέγχουμε πόσες κάρτες απομένουν ΣΤΗΝ ΟΥΡΑ (όχι συνολικά, αλλά μπροστά μας)
    const remainingItems = celebrityQueue.length - currentIndex;

    // Αν μένουν λιγότερες από 2 κάρτες, ΤΟΤΕ ζήτα την επόμενη παρτίδα.
    // Έτσι, όταν ο χρήστης βλέπει την προτελευταία, εμείς φέρνουμε τις επόμενες 20.
    if (remainingItems < 2) {
        console.log("Φτάνουμε στο τέλος του batch, φόρτωση επόμενων...");
        loadMoreData();
    }
}

els.btnNext.addEventListener('click', showNextPhoto);

els.btnReset.addEventListener('click', () => {
    showScreen('start');
});


// === FILTER LOGIC ===
const filterBtn = document.getElementById('filter-btn');
const filterModal = document.getElementById('filter-modal');
const applyFiltersBtn = document.getElementById('apply-filters-btn');

if (filterBtn) {
    filterBtn.addEventListener('click', () => {
        filterModal.classList.remove('hidden');
    });
}

if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
        // 1. Collect selected filters
        const topics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        const locations = Array.from(document.querySelectorAll('input[name="location"]:checked')).map(cb => cb.value);
        const genders = Array.from(document.querySelectorAll('input[name="gender"]:checked')).map(cb => cb.value);

        const newFilters = {
            topic: topics,
            location: locations,
            gender: genders
        };

        console.log("Applying filters:", newFilters);

        // 2. Update API state
        setFilters(newFilters);

        // 3. Reset Game Queue
        celebrityQueue = [];
        currentIndex = 0;

        // 4. Reload data
        loadMoreData();

        // 5. Close modal
        filterModal.classList.add('hidden');
    });
}

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