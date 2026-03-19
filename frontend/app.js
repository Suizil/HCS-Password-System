const emojis = [
    '😂', '🙈', '👌', '🍕', '💩', '⚽', '🚗', '💕', '🍔', '🍺', 
    '🎸', '🎮', '☀️', '👶', '🔫', '🚲', '🌹', '💪', '🎶', '🐷'
];
const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']; 

let currentPassword = [];
const maxLen = 4;
let currentCondition = "Emoji_Password";
const userId = "user_" + Math.random().toString(36).substr(2, 9);

// --- Timer-related variables ---
let startTime = null;
let finalTime = 0;
let isTiming = false;
let timerInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    renderEmojiKeyboard();
    renderNumericKeyboard();
    setKeyboardEnabled(false); // Disable keyboard in initial state
});

// --- Timer Control Function ---
function startTimer() {
    isTiming = true;
    startTime = performance.now(); // Get high-precision time
    
    document.getElementById("startTimerBtn").disabled = true;
    setKeyboardEnabled(true); // Unlock keyboard
    
    // Real-time UI time display update
    timerInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        document.getElementById("timerDisplay").innerText = elapsed.toFixed(2) + " 秒";
    }, 50);
}

function stopTimer() {
    if (!isTiming) return;
    isTiming = false;
    clearInterval(timerInterval);
    finalTime = (performance.now() - startTime) / 1000;
    document.getElementById("timerDisplay").innerText = finalTime.toFixed(2) + " 秒 (已完成)";
    setKeyboardEnabled(false); // Input complete, lock keyboard again
}

function resetTimer() {
    isTiming = false;
    clearInterval(timerInterval);
    startTime = null;
    finalTime = 0;
    document.getElementById("timerDisplay").innerText = "0.00 秒";
    document.getElementById("startTimerBtn").disabled = false;
    setKeyboardEnabled(false);
}

// Helper function: Enable/disable keyboard buttons uniformly
function setKeyboardEnabled(enabled) {
    const btns = document.querySelectorAll('.key-btn:not(.empty)');
    btns.forEach(btn => {
        btn.disabled = !enabled;
        btn.style.opacity = enabled ? "1" : "0.5";
        btn.style.cursor = enabled ? "pointer" : "not-allowed";
    });
}
// ------------------------

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
            '', shuffled[9], '' 
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
    if (currentPassword.length >= maxLen || !isTiming) return;

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

    // Stop timing if the input reaches 4 digits.
    if (currentPassword.length === maxLen) {
        stopTimer();
    }
    checkSubmitStatus();
}

function switchTab(condition) {
    currentCondition = condition;
    clearPassword();
    resetTimer(); // Reset timer when switching keyboards

    document.getElementById("tabEmoji").classList.toggle("active", condition === "Emoji_Password");
    document.getElementById("tabNumeric").classList.toggle("active", condition === "Numeric_PIN");
    
    document.getElementById("emojiKeyboard").style.display = condition === "Emoji_Password" ? "grid" : "none";
    document.getElementById("numericKeyboard").style.display = condition === "Numeric_PIN" ? "grid" : "none";
    
    document.getElementById("titleText").innerText = condition === "Emoji_Password" ? "Select your Emoji Password" : "Enter your Numeric PIN";
}

function clearPassword() {
    currentPassword = [];
    for (let i = 0; i < maxLen; i++) {
        const slot = document.getElementById(`slot-${i}`);
        slot.innerText = "";
        slot.className = "slot"; 
    }
    if (isRandomKeyboard) {
        currentCondition === "Emoji_Password" ? renderEmojiKeyboard() : renderNumericKeyboard();
    }
    
    if (typeof resetTimer === 'function') resetTimer(); // Reset the timer in app.js
    checkSubmitStatus();
}
function checkSubmitStatus() {
    document.getElementById("submitBtn").disabled = currentPassword.length !== maxLen;
}

async function submitPassword() {
    if (currentPassword.length !== maxLen) return;

    const passwordData = currentCondition === "Emoji_Password" 
        ? currentPassword.join(",") 
        : currentPassword.join("");

    const payload = {
        user_id: userId,
        condition: currentCondition,
        password_data: passwordData,
        selection_time: parseFloat(finalTime.toFixed(3)) 
    };

    try {
        const response = await fetch("http://127.0.0.1:8000/api/save_password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok) {
            alert(`Submit Successful!\n\n[IMPORTANT] Please remember your Study ID: ${result.record_id}\n\nTime: ${payload.selection_time} s`);
            clearPassword();
        } else {
            alert("Submit Failed: " + result.detail);
        }
    } catch (error) {
        console.error("Network Error:", error);
        alert("Network request failed, please check the backend API service.");
    }
}
