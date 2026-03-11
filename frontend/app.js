const emojis = [
    '😂', '🙈', '👌', '🍕', '💩', '⚽', '🚗', '💕', '🍔', '🍺', 
    '🎸', '🎮', '☀️', '👶', '🔫', '🚲', '🌹', '💪', '🎶', '🐷'
];
// 数字键盘布局 (包含空白键占位)
const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']; 

let currentPassword = [];
const maxLen = 4;
let currentCondition = "Emoji_Password"; // 默认组别
const userId = "user_" + Math.random().toString(36).substr(2, 9);

document.addEventListener("DOMContentLoaded", () => {
    renderEmojiKeyboard();
    renderNumericKeyboard();
});

// 渲染表情键盘
function renderEmojiKeyboard() {
    const keyboard = document.getElementById("emojiKeyboard");
    emojis.forEach(emoji => {
        const btn = document.createElement("button");
        btn.className = "key-btn emoji-btn";
        btn.innerText = emoji;
        btn.onclick = () => handleInput(emoji);
        keyboard.appendChild(btn);
    });
}

// 渲染数字键盘
function renderNumericKeyboard() {
    const keyboard = document.getElementById("numericKeyboard");
    numbers.forEach(num => {
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

// 处理键盘输入 (通用)
function handleInput(value) {
    if (currentPassword.length >= maxLen) return;

    const currentIndex = currentPassword.length;
    currentPassword.push(value);

    const slot = document.getElementById(`slot-${currentIndex}`);
    slot.innerText = value;
    slot.className = "slot"; // 移除之前的掩码样式

    // 0.5秒后执行掩码隐藏
    setTimeout(() => {
        if (currentPassword.length > currentIndex && currentPassword[currentIndex] === value) {
            if (currentCondition === "Emoji_Password") {
                slot.innerText = "✓"; // 表情使用白色勾号
                slot.classList.add("masked-emoji"); // 绿色背景
            } else {
                slot.innerText = "•"; // 数字PIN使用通用圆点
                slot.classList.add("masked-pin");
            }
        }
    }, 500);

    checkSubmitStatus();
}

// 切换实验组别 (Tab)
function switchTab(condition) {
    currentCondition = condition;
    clearPassword(); // 切换时清空当前输入

    // 更新 UI 状态
    document.getElementById("tabEmoji").classList.toggle("active", condition === "Emoji_Password");
    document.getElementById("tabNumeric").classList.toggle("active", condition === "Numeric_PIN");
    
    document.getElementById("emojiKeyboard").style.display = condition === "Emoji_Password" ? "grid" : "none";
    document.getElementById("numericKeyboard").style.display = condition === "Numeric_PIN" ? "grid" : "none";
    
    document.getElementById("titleText").innerText = condition === "Emoji_Password" ? "请选择您的表情密码" : "请输入您的数字 PIN";
}

// 清除输入
function clearPassword() {
    currentPassword = [];
    for (let i = 0; i < maxLen; i++) {
        const slot = document.getElementById(`slot-${i}`);
        slot.innerText = "";
        slot.className = "slot"; // 重置样式
    }
    checkSubmitStatus();
}

function checkSubmitStatus() {
    document.getElementById("submitBtn").disabled = currentPassword.length !== maxLen;
}

// 提交到后端
async function submitPassword() {
    if (currentPassword.length !== maxLen) return;

    // 格式化：表情用逗号隔开，数字直接拼成字符串 (如 "1234")
    const passwordData = currentCondition === "Emoji_Password" 
        ? currentPassword.join(",") 
        : currentPassword.join("");

    const payload = {
        user_id: userId,
        condition: currentCondition, // 动态传递组别
        password_data: passwordData
    };

    try {
        const response = await fetch("http://127.0.0.1:8000/api/save_password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok) {
            alert(`(${currentCondition}) 密码已记录！`);
            clearPassword();
        } else {
            alert("提交失败：" + result.detail);
        }
    } catch (error) {
        console.error("网络错误:", error);
        alert("网络请求失败，请检查后端 API 服务。");
    }
}