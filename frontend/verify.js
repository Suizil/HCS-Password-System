const emojis = [
    '😂', '🙈', '👌', '🍕', '💩', '⚽', '🚗', '💕', '🍔', '🍺', 
    '🎸', '🎮', '☀️', '👶', '🔫', '🚲', '🌹', '💪', '🎶', '🐷'
];
const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']; 

let currentPassword = [];
const maxLen = 4;
let currentCondition = "Emoji_Password";

// --- Verification-Specific: Attempt Count Counter ---
let currentAttempts = 1; 

document.addEventListener("DOMContentLoaded", () => {
    renderEmojiKeyboard();
    renderNumericKeyboard();
});

// --- Randomized control state ---
let isRandomKeyboard = false;

// Toggle switch event
function toggleRandomKeyboard() {
    const toggle = document.getElementById("randomKeyboardToggle");
    isRandomKeyboard = toggle.checked;
    
    // Re-render the currently displayed keyboard immediately after switching states.
    if (currentCondition === "Emoji_Password") {
        renderEmojiKeyboard();
    } else {
        renderNumericKeyboard();
    }
    
    // If it's in app.js (registration phase), you need to maintain the keyboard's locked/unlocked state.
    // If it's in verify.js, this line can be kept, because we can declare an empty setKeyboardEnabled function in verify.js to prevent errors, or simply add a typeof check.
    if (typeof isTiming !== 'undefined') {
        setKeyboardEnabled(isTiming); 
    }
}

// Array shuffling algorithm (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- Replace with: Render emoji keyboard ---
function renderEmojiKeyboard() {
    const keyboard = document.getElementById("emojiKeyboard");
    keyboard.innerHTML = '';
    
    // Whether to disrupt depends on the switch status.
    const displayEmojis = isRandomKeyboard ? shuffleArray([...emojis]) : [...emojis];
    
    displayEmojis.forEach(emoji => {
        const btn = document.createElement("button");
        btn.className = "key-btn emoji-btn";
        btn.innerText = emoji;
        btn.onclick = () => handleInput(emoji);
        keyboard.appendChild(btn);
    });
}

// --- Replace: Render numeric keypad ---
function renderNumericKeyboard() {
    const keyboard = document.getElementById("numericKeyboard");
    keyboard.innerHTML = '';
    
    // A standard 0-9 array, used for random shuffling
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let layout = [];
    
    if (isRandomKeyboard) {
        // If random selection is enabled, the 10 numbers will be completely shuffled.
        const shuffled = shuffleArray([...digits]);
        layout = [
            shuffled[0], shuffled[1], shuffled[2],
            shuffled[3], shuffled[4], shuffled[5],
            shuffled[6], shuffled[7], shuffled[8],
            '', shuffled[9], '' // Keep the bottom two sides empty
        ];
    } else {
        // If random dialing is not enabled, use the standard 3x4 telephone dial pad layout.
        layout = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];
    }
    
    layout.forEach(num => {
        const btn = document.createElement("button");
        if (num === '') {
            btn.className = "key-btn empty";
            btn.disabled = true;
        } else {
            btn.className = "key-btn numeric-btn";
            btn.innerText = num;
            btn.onclick = () => handleInput(num);
        }
        keyboard.appendChild(btn);
    });
}

function handleInput(value) {
    if (currentPassword.length >= maxLen) return;

    const currentIndex = currentPassword.length;
    currentPassword.push(value);

    const slot = document.getElementById(`slot-${currentIndex}`);
    slot.innerText = value;
    slot.className = "slot"; 

    setTimeout(() => {
        if (currentPassword.length > currentIndex && currentPassword[currentIndex] === value) {
            if (currentCondition === "Emoji_Password") {
                slot.innerText = "✓"; 
                slot.classList.add("masked-emoji"); 
            } else {
                slot.innerText = "•"; 
                slot.classList.add("masked-pin");
            }
        }
    }, 500);

    checkSubmitStatus();
}

function switchTab(condition) {
    currentCondition = condition;
    clearPassword();
    // Reset the number of attempts when switching groups
    currentAttempts = 1;
    updateAttemptsDisplay();

    document.getElementById("tabEmoji").classList.toggle("active", condition === "Emoji_Password");
    document.getElementById("tabNumeric").classList.toggle("active", condition === "Numeric_PIN");
    
    document.getElementById("emojiKeyboard").style.display = condition === "Emoji_Password" ? "grid" : "none";
    document.getElementById("numericKeyboard").style.display = condition === "Numeric_PIN" ? "grid" : "none";
}

function clearPassword() {
    currentPassword = [];
    for (let i = 0; i < maxLen; i++) {
        const slot = document.getElementById(`slot-${i}`);
        slot.innerText = "";
        slot.className = "slot"; 
    }
    checkSubmitStatus();
}

function checkSubmitStatus() {
    document.getElementById("submitBtn").disabled = currentPassword.length !== maxLen;
}

function updateAttemptsDisplay() {
    const display = document.getElementById("attemptsDisplay");
    if (currentAttempts > 1) {
        display.style.display = "block";
        display.innerText = `Attempt: ${currentAttempts}`;
    } else {
        display.style.display = "none";
    }
}

// --- Core Verification Logic ---
async function verifyPassword() {
    if (currentPassword.length !== maxLen) return;
    const inputId = document.getElementById("userIdInput").value.trim();
    if (!inputId || isNaN(inputId)) {
        alert("Please enter a valid numeric ID!");
        return;
    }

    const passwordData = currentCondition === "Emoji_Password" 
        ? currentPassword.join(",") 
        : currentPassword.join("");

    const payload = {
        record_id: parseInt(inputId), 
        condition: currentCondition,
        password_data: passwordData,
        attempts: currentAttempts
    };

    try {
        const response = await fetch("http://127.0.0.1:8000/api/verify_password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (response.ok) {
            alert(`✅ ${result.message}`);
            window.location.reload();
        } else {
            alert(`❌ ${result.detail}`);
            currentAttempts++; 
            updateAttemptsDisplay(); 
            clearPassword(); 
        }
    } catch (error) {
        console.error("Network Error:", error);
        alert("Network request failed. Please check the backend API service.");
    }
}
function exportData() {
   // Directly allow the browser to access the export interface; the browser will automatically recognize it and trigger file download.
    window.location.href = "http://127.0.0.1:8000/api/export_data";
}
