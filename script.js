// SafeMate Password Generator Script
// This script handles password generation, UI interactions, localStorage for history and theme, and accessibility.

// DOM Elements
const lengthSlider = document.getElementById('length-slider');
const lengthValue = document.getElementById('length-value');
const uppercaseToggle = document.getElementById('uppercase-toggle');
const lowercaseToggle = document.getElementById('lowercase-toggle');
const numbersToggle = document.getElementById('numbers-toggle');
const symbolsToggle = document.getElementById('symbols-toggle');
const excludeSimilarToggle = document.getElementById('exclude-similar-toggle');
const excludeAmbiguousToggle = document.getElementById('exclude-ambiguous-toggle');
const passwordDisplay = document.getElementById('password-display');
const strengthBar = document.getElementById('strength-bar');
const strengthLabel = document.getElementById('strength-label');
const entropyValue = document.getElementById('entropy-value');
const copyBtn = document.getElementById('copy-btn');
const regenerateBtn = document.getElementById('regenerate-btn');
const saveBtn = document.getElementById('save-btn');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const themeToggle = document.getElementById('theme-toggle');
const toast = document.getElementById('toast');

// Constants for charsets
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Exclusions
const SIMILAR_CHARS = '0Ool1I'; // Exclude similar characters
const AMBIGUOUS_CHARS = '"\'`;'; // Exclude ambiguous characters

// State variables
let history = JSON.parse(localStorage.getItem('passwordHistory')) || [];
let isDarkTheme = localStorage.getItem('theme') === 'dark';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateTheme();
    updateLengthValue();
    generatePassword();
    renderHistory();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    lengthSlider.addEventListener('input', () => {
        updateLengthValue();
        generatePassword();
    });

    [uppercaseToggle, lowercaseToggle, numbersToggle, symbolsToggle, excludeSimilarToggle, excludeAmbiguousToggle].forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.setAttribute('aria-pressed', toggle.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
            generatePassword();
        });
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click();
            }
        });
    });

    regenerateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyPassword);
    saveBtn.addEventListener('click', saveToHistory);
    clearHistoryBtn.addEventListener('click', clearHistory);
    exportCsvBtn.addEventListener('click', exportCSV);
    themeToggle.addEventListener('click', toggleTheme);
}

// Update length display
function updateLengthValue() {
    lengthValue.textContent = lengthSlider.value;
}

// Build charset based on toggles
function buildCharset() {
    let charset = '';
    if (uppercaseToggle.getAttribute('aria-pressed') === 'true') charset += UPPERCASE;
    if (lowercaseToggle.getAttribute('aria-pressed') === 'true') charset += LOWERCASE;
    if (numbersToggle.getAttribute('aria-pressed') === 'true') charset += NUMBERS;
    if (symbolsToggle.getAttribute('aria-pressed') === 'true') charset += SYMBOLS;

    if (excludeSimilarToggle.getAttribute('aria-pressed') === 'true') {
        charset = charset.split('').filter(char => !SIMILAR_CHARS.includes(char)).join('');
    }
    if (excludeAmbiguousToggle.getAttribute('aria-pressed') === 'true') {
        charset = charset.split('').filter(char => !AMBIGUOUS_CHARS.includes(char)).join('');
    }

    return charset;
}

// Generate password using crypto.getRandomValues
function generatePassword() {
    const length = parseInt(lengthSlider.value);
    const charset = buildCharset();
    if (charset.length === 0) {
        passwordDisplay.textContent = 'Select at least one character type';
        updateStrength(0, 0);
        return;
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length];
    }
    passwordDisplay.textContent = password;
    updateStrength(length, charset.length);
}

// Calculate and update strength meter
function updateStrength(length, charsetSize) {
    const entropy = length * Math.log2(charsetSize);
    entropyValue.textContent = `Entropy: ${entropy.toFixed(1)} bits`;

    let strength, color, width;
    if (entropy < 40) {
        strength = 'Weak';
        color = 'var(--weak)';
        width = '25%';
    } else if (entropy < 60) {
        strength = 'Fair';
        color = 'var(--fair)';
        width = '50%';
    } else if (entropy < 80) {
        strength = 'Good';
        color = 'var(--good)';
        width = '75%';
    } else {
        strength = 'Very Strong';
        color = 'var(--strong)';
        width = '100%';
    }

    strengthLabel.textContent = strength;
    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
}

// Copy password to clipboard
function copyPassword() {
    const password = passwordDisplay.textContent;
    if (password) {
        navigator.clipboard.writeText(password).then(() => {
            showToast('Password copied to clipboard!');
        });
    }
}

// Show toast notification
function showToast(message) {
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Save to history in localStorage
function saveToHistory() {
    const password = passwordDisplay.textContent;
    if (password && password !== 'Select at least one character type') {
        const timestamp = new Date().toLocaleString();
        history.unshift({ password, timestamp });
        if (history.length > 20) history = history.slice(0, 20);
        localStorage.setItem('passwordHistory', JSON.stringify(history));
        renderHistory();
        showToast('Password saved to history!');
    }
}

// Render history list
function renderHistory() {
    historyList.innerHTML = '';
    history.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="password">${item.password}</span>
            <span class="timestamp">${item.timestamp}</span>
            <button aria-label="Copy this password" onclick="copyFromHistory('${item.password}')">Copy</button>
            <button aria-label="Delete this entry" onclick="deleteFromHistory(${index})">Delete</button>
        `;
        historyList.appendChild(li);
    });
}

// Copy from history
function copyFromHistory(password) {
    navigator.clipboard.writeText(password).then(() => {
        showToast('Password copied!');
    });
}

// Delete from history
function deleteFromHistory(index) {
    history.splice(index, 1);
    localStorage.setItem('passwordHistory', JSON.stringify(history));
    renderHistory();
}

// Clear all history
function clearHistory() {
    history = [];
    localStorage.removeItem('passwordHistory');
    renderHistory();
    showToast('History cleared!');
}

// Export history as CSV
function exportCSV() {
    if (history.length === 0) {
        showToast('No history to export!');
        return;
    }
    let csv = 'Password,Timestamp\n';
    history.forEach(item => {
        csv += `"${item.password}","${item.timestamp}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'password_history.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('History exported as CSV!');
}

// Toggle theme
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    updateTheme();
}

// Update theme
function updateTheme() {
    document.body.classList.toggle('dark', isDarkTheme);
    themeToggle.textContent = isDarkTheme ? '☀️' : '🌙';
}