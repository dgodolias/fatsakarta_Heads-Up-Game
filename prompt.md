Τέλεια, μου αρέσει ο τρόπος που το σκέφτεσαι. Πάμε να φτιάξουμε κάτι **μοντέρνο (sleek)**, γρήγορο και **modular** (χωρισμένο σε αρχεία) για να είναι εύκολο στη συντήρηση και στο ανέβασμα.

Για να δουλέψει **άμεσα** χωρίς να χρειάζεσαι API Key (που θέλει το TMDB), ο κώδικας που θα σου δώσω χρησιμοποιεί το **Wikidata**. Είναι ανοιχτό, δωρεάν και δεν θέλει εγγραφή.

### 1\. Πιασάρικα Ονόματα

Διάλεξε κάτι μικρό και εύηχο:

1.  **Fatsa Karta** (Το πιο αστείο/ελληνικό)
2.  **Mourh** (Σύντομο, αργκό)
3.  **Who Dis?** (Διεθνές, νεανικό)
4.  **Celeb Roulete** (Περιγραφικό)
5.  **FaceOff** (Αγωνιστικό)

-----

### 2\. Η Δομή του Repository

Έτσι πρέπει να είναι ο φάκελος σου στον υπολογιστή σου για να ανέβει σωστά στο Vercel/Netlify:

```text
/my-game-project
│
├── index.html        # Η δομή της σελίδας
├── css
│   └── style.css     # Το design (Dark mode, animations)
├── js
│   ├── api.js        # Εδώ τραβάμε τα δεδομένα (Wikidata logic)
│   └── game.js       # Η ροή του παιχνιδιού (Timer, Clicks)
└── README.md         # (Προαιρετικό)
```

-----

### 3\. Τα Αρχεία Κώδικα

Αντίγραψε τα παρακάτω και φτιάξε τα αντίστοιχα αρχεία.

#### `index.html`

Καθαρό HTML με εικονίδια και viewport για κινητά.

```html
<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Fatsa Karta Game</title>
    <link rel="stylesheet" href="css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body>

    <div class="app-container">
        <div id="start-screen" class="screen active">
            <h1>FATSA KARTA</h1>
            <p class="subtitle">Βάλε το κινητό στο μέτωπο!</p>
            <button id="generate-btn" class="primary-btn">ΠΑΙΞΕ ΤΩΡΑ</button>
            <p class="loading-text" id="loading-msg">Φόρτωση προσώπων...</p>
        </div>

        <div id="countdown-screen" class="screen">
            <div class="timer-circle">
                <span id="timer-number">5</span>
            </div>
            <p>Ετοιμάσου...</p>
        </div>

        <div id="game-screen" class="screen">
            <div class="card">
                <img id="celeb-img" src="" alt="Celebrity">
                <h2 id="celeb-name" class="hidden">Όνομα (Κρυφό)</h2>
            </div>
            <div class="controls">
                <button id="next-btn" class="secondary-btn">ΕΠΟΜΕΝΟ</button>
                <button id="reset-btn" class="text-btn">ΤΕΛΟΣ</button>
            </div>
        </div>
    </div>

    <script src="js/api.js"></script>
    <script src="js/game.js"></script>
</body>
</html>
```

#### `css/style.css`

Modern Dark Theme, optimized για κινητά (Full Height).

```css
:root {
    --bg-color: #121212;
    --card-bg: #1e1e1e;
    --primary: #00E676; /* Neon Green */
    --text: #ffffff;
    --font-main: 'Inter', sans-serif;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: var(--font-main);
    background-color: var(--bg-color);
    color: var(--text);
    height: 100vh;
    overflow: hidden; /* Όχι scroll */
    display: flex;
    justify-content: center;
    align-items: center;
}

.app-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    text-align: center;
}

.screen {
    display: none; /* Κρυμμένα όλα αρχικά */
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    animation: fadeIn 0.3s ease;
}

.screen.active {
    display: flex;
}

h1 {
    font-size: 3rem;
    font-weight: 900;
    letter-spacing: -2px;
    background: -webkit-linear-gradient(45deg, #00E676, #2979FF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 10px;
}

.subtitle {
    opacity: 0.7;
    margin-bottom: 40px;
}

/* Buttons */
.primary-btn {
    background-color: var(--primary);
    color: #000;
    border: none;
    padding: 15px 40px;
    font-size: 1.2rem;
    font-weight: 700;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 10px 20px rgba(0, 230, 118, 0.2);
    transition: transform 0.1s;
}

.primary-btn:active {
    transform: scale(0.95);
}

.secondary-btn {
    background-color: #2979FF;
    color: white;
    border: none;
    padding: 15px 30px;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 12px;
    width: 80%;
    margin-bottom: 10px;
}

.text-btn {
    background: none;
    border: none;
    color: #666;
    margin-top: 10px;
}

/* Countdown */
.timer-circle {
    font-size: 6rem;
    font-weight: 900;
    color: var(--primary);
}

/* Game Card */
.card {
    background: var(--card-bg);
    padding: 10px;
    border-radius: 20px;
    width: 100%;
    max-width: 350px;
    aspect-ratio: 3/4;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    position: relative;
}

.card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 15px;
}

.hidden {
    display: none;
}

.loading-text {
    margin-top: 20px;
    font-size: 0.8rem;
    color: #666;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
```

#### `js/api.js`

Εδώ γίνεται η μαγεία με το Wikidata SPARQL. Ζητάμε 20 τυχαίους διάσημους ηθοποιούς με φωτογραφία.

```javascript
// API Logic
const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

// SPARQL Query:
// Ζητάμε ανθρώπους (Q5), που είναι ηθοποιοί (Q33999), έχουν εικόνα,
// και ταξινομούμε με βάση πόσα links έχουν (ένδειξη δημοφιλίας) για να μη φέρει άγνωστους.
const query = `
SELECT DISTINCT ?item ?itemLabel ?pic WHERE {
  ?item wdt:P31 wd:Q5;
        wdt:P106 wd:Q33999;
        wdt:P18 ?pic;
        wikibase:sitelinks ?sitelinks.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 20
`;

async function fetchCelebrities() {
    const url = WIKIDATA_ENDPOINT + "?query=" + encodeURIComponent(query) + "&format=json";
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Καθαρίζουμε τα δεδομένα σε απλή μορφή
        return data.results.bindings.map(entry => ({
            name: entry.itemLabel.value,
            image: entry.pic.value
        }));
    } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback δεδομένα αν κολλήσει το API
        return [
            { name: "Elon Musk", image: "https://upload.wikimedia.org/wikipedia/commons/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg" },
            { name: "Brad Pitt", image: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Brad_Pitt_2019_by_Glenn_Francis.jpg" }
        ];
    }
}
```

#### `js/game.js`

Η λογική του παιχνιδιού.

```javascript
// Game Logic
let celebrities = [];
let currentIndex = 0;

// DOM Elements
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
    loading: document.getElementById('loading-msg')
};

// Initialize
async function init() {
    els.btnGenerate.disabled = true;
    celebrities = await fetchCelebrities();
    
    // Ανακάτεμα της λίστας (Shuffle)
    celebrities.sort(() => Math.random() - 0.5);
    
    els.loading.style.display = 'none';
    els.btnGenerate.disabled = false;
}

// Show a specific screen
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Start Game Sequence
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

function showNextPhoto() {
    if (celebrities.length === 0) return; // Προστασία
    
    // Κυκλική επιλογή για να μην τελειώνουν ποτέ
    const celeb = celebrities[currentIndex % celebrities.length];
    
    // Χρησιμοποιούμε ειδικό URL του WikiCommons για να πάρουμε μικρότερη εικόνα (500px width)
    // για να φορτώνει σφαίρα στο κινητό.
    const optimizedImage = celeb.image.replace("http://", "https://") + "?width=500";
    
    els.img.src = optimizedImage;
    
    currentIndex++;
}

els.btnNext.addEventListener('click', showNextPhoto);

els.btnReset.addEventListener('click', () => {
    showScreen('start');
});

// Run init on load
init();
```

-----

### Τι να κάνεις τώρα (Next Steps)

1.  Φτιάξε τα αρχεία στον υπολογιστή σου.
2.  Άνοιξε το `index.html` στον browser να δεις αν δουλεύει.
3.  Θα δεις ότι πατώντας το κουμπί, θα μετρήσει 5, 4, 3... και θα βγάλει μια τυχαία φωτογραφία από το Wikidata.

**Το επόμενο βήμα σου:**
Μόλις το ανεβάσεις και δεις ότι δουλεύει, αν θέλεις μπορούμε να αλλάξουμε το `api.js` ώστε να τραβάει δεδομένα από το TMDB για πιο "Hollywood" αποτελέσματα (εκεί θα χρειαστείς ένα δωρεάν API Key).

Θες να σου πω πώς να το κάνεις drag-and-drop στο Netlify σε 1 λεπτό;