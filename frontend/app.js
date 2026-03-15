const emojis = [
    '😂', '🙈', '👌', '🍕', '💩', '⚽', '🚗', '💕', '🍔', '🍺', 
    '🎸', '🎮', '☀️', '👶', '🔫', '🚲', '🌹', '💪', '🎶', '🐷'
];
const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']; 

let currentPassword = [];
const maxLen = 4;
let currentCondition = "Emoji_Password";
const userId = "user_" + Math.random().toString(36).substr(2, 9);

// --- 计时器相关变量 ---
let startTime = null;
let finalTime = 0;
let isTiming = false;
let timerInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    renderEmojiKeyboard();
    renderNumericKeyboard();
    setKeyboardEnabled(false); // 初始状态禁用键盘
});

// --- 新增：计时控制功能 ---
function startTimer() {
    isTiming = true;
    startTime = performance.now(); // 获取高精度时间
    
    document.getElementById("startTimerBtn").disabled = true;
    setKeyboardEnabled(true); // 解锁键盘
    
    // 实时更新UI时间显示
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
    setKeyboardEnabled(false); // 输入完成，重新锁定键盘
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

// 辅助函数：统一启用/禁用键盘按钮
function setKeyboardEnabled(enabled) {
    const btns = document.querySelectorAll('.key-btn:not(.empty)');
    btns.forEach(btn => {
        btn.disabled = !enabled;
        btn.style.opacity = enabled ? "1" : "0.5";
        btn.style.cursor = enabled ? "pointer" : "not-allowed";
    });
}
// ------------------------

// --- 新增：随机化控制状态 ---
let isRandomKeyboard = false;

// 新增：切换开关事件
function toggleRandomKeyboard() {
    const toggle = document.getElementById("randomKeyboardToggle");
    isRandomKeyboard = toggle.checked;
    
    // 切换状态后立即重新渲染当前显示的键盘
    if (currentCondition === "Emoji_Password") {
        renderEmojiKeyboard();
    } else {
        renderNumericKeyboard();
    }
    
    // 如果是在 app.js (注册阶段) 中，需要维持键盘的锁定/解锁状态
    // 如果是在 verify.js 中，这一行可以保留，因为我们可以在 verify.js 中声明一个空的 setKeyboardEnabled 函数防错，或者简单地加上 typeof 判断
    if (typeof isTiming !== 'undefined') {
        setKeyboardEnabled(isTiming); 
    }
}

// 新增：数组打乱算法 (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- 替换：渲染表情键盘 ---
function renderEmojiKeyboard() {
    const keyboard = document.getElementById("emojiKeyboard");
    keyboard.innerHTML = '';
    
    // 根据开关状态决定是否打乱
    const displayEmojis = isRandomKeyboard ? shuffleArray([...emojis]) : [...emojis];
    
    displayEmojis.forEach(emoji => {
        const btn = document.createElement("button");
        btn.className = "key-btn emoji-btn";
        btn.innerText = emoji;
        btn.onclick = () => handleInput(emoji);
        keyboard.appendChild(btn);
    });
}

// --- 替换：渲染数字键盘 ---
function renderNumericKeyboard() {
    const keyboard = document.getElementById("numericKeyboard");
    keyboard.innerHTML = '';
    
    // 标准的 0-9 数组，用于随机打乱
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let layout = [];
    
    if (isRandomKeyboard) {
        // 如果开启随机，完全打乱 10 个数字
        const shuffled = shuffleArray([...digits]);
        layout = [
            shuffled[0], shuffled[1], shuffled[2],
            shuffled[3], shuffled[4], shuffled[5],
            shuffled[6], shuffled[7], shuffled[8],
            '', shuffled[9], '' // 保持底部两边为空
        ];
    } else {
        // 如果不开启随机，使用标准的电话拨号盘 3x4 布局
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

    // 如果输入到达 4 位，停止计时
    if (currentPassword.length === maxLen) {
        stopTimer();
    }
    checkSubmitStatus();
}

function switchTab(condition) {
    currentCondition = condition;
    clearPassword();
    resetTimer(); // 切换键盘时重置计时器

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
    
    if (typeof resetTimer === 'function') resetTimer(); // app.js 的计时器重置
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
        selection_time: parseFloat(finalTime.toFixed(3)) // 附带精确到毫秒的时间
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