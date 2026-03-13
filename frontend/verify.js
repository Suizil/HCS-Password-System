const emojis = [
    '😂', '🙈', '👌', '🍕', '💩', '⚽', '🚗', '💕', '🍔', '🍺', 
    '🎸', '🎮', '☀️', '👶', '🔫', '🚲', '🌹', '💪', '🎶', '🐷'
];
const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']; 

let currentPassword = [];
const maxLen = 4;
let currentCondition = "Emoji_Password";

// --- 验证专属：尝试次数计数器 ---
let currentAttempts = 1; 

document.addEventListener("DOMContentLoaded", () => {
    renderEmojiKeyboard();
    renderNumericKeyboard();
});

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
    // 切换组别时，重置尝试次数
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
        display.innerText = `当前为第 ${currentAttempts} 次尝试`;
    } else {
        display.style.display = "none";
    }
}

// --- 核心验证逻辑 ---
async function verifyPassword() {
    if (currentPassword.length !== maxLen) return;
    const inputId = document.getElementById("userIdInput").value.trim();
    if (!inputId || isNaN(inputId)) {
        alert("请输入正确的数字 ID！");
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
            // 验证成功
            alert(`✅ ${result.message}`);
            // 成功后可重定向到感谢页面，这里仅作刷新处理
            window.location.reload();
        } else {
            // 验证失败 (401密码错误)
            alert(`❌ ${result.detail}`);
            currentAttempts++; // 尝试次数 +1
            updateAttemptsDisplay(); // 更新 UI 显示
            clearPassword(); // 清空密码槽让用户重试
        }
    } catch (error) {
        console.error("网络错误:", error);
        alert("网络请求失败，请检查后端 API 服务。");
    }
}
function exportData() {
    // 直接让浏览器访问导出接口，浏览器会自动识别并触发文件下载
    window.location.href = "http://127.0.0.1:8000/api/export_data";
}