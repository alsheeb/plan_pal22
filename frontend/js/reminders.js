// ==========================================
// Data Management
// ==========================================
let reminders = [];
let editingId = null;
let completedToday = JSON.parse(localStorage.getItem('completedToday') || '[]');

// Reset completed list when a new day starts
const lastDate = localStorage.getItem('lastDate');
const todayDateString = new Date().toDateString();
if (lastDate !== todayDateString) {
    completedToday = [];
    localStorage.setItem('completedToday', JSON.stringify(completedToday));
    localStorage.setItem('lastDate', todayDateString);
}

// Plant icons mapping
const plantIcons = {
    vegetables: '🥬',
    fruits: '🍎',
    flowers: '🌸',
    succulents: '🌵',
    herbs: '🌿',
    trees: '🌳',
    indoor: '🪴',
    other: '🌱',
    '': '🌱'
};

const plantTypeNames = {
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    flowers: 'Flowers',
    succulents: 'Succulents',
    herbs: 'Herbs',
    trees: 'Trees',
    indoor: 'Indoor plants',
    other: 'Other',
    '': 'Plant'
};

// For rendering dots (order is arbitrary, just consistent)
const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const shortDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// JS Date.getDay() order (0 = Sunday)
const jsDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Map day name to JS index
const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
};

// ==========================================
// Initialize
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('remindersGrid')) {
        return; // مش صفحة reminders
    }

    loadReminders();
    setupFilters();
    setupSearch();
});


function loadReminders() {
    const saved = localStorage.getItem('plantReminders');
    if (saved) {
        reminders = JSON.parse(saved);
    }
    renderReminders();
    updateStats();
}

function saveToStorage() {
    localStorage.setItem('plantReminders', JSON.stringify(reminders));
}

// ==========================================
// Stats
// ==========================================
function updateStats() {
    const total = document.getElementById('totalReminders');
    const plants = document.getElementById('totalPlants');
    const today = document.getElementById('todayReminders');
    const completed = document.getElementById('completedToday');

    if (!total || !plants || !today || !completed) return;

    const todayIndex = new Date().getDay();
    const todayName = jsDayNames[todayIndex];

    const todayRemindersCount = reminders.filter(r =>
        r.days.includes(todayName)
    ).length;

    total.textContent = reminders.length;
    plants.textContent = reminders.length;
    today.textContent = todayRemindersCount;
    completed.textContent = completedToday.length;
}


// ==========================================
// Render Reminders
// ==========================================
function renderReminders(data = reminders) {
    const grid = document.getElementById('remindersGrid');

    if (!grid) {
        console.error("Element #remindersGrid not found in DOM");
        return;
    }

    if (!data || data.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🌵</div>
                <h3>No reminders yet</h3>
                <p>Add your first watering reminder for your plants.</p>
                <button class="add-btn" onclick="openModal()">
                    <i class="fas fa-plus"></i> Add reminder
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = data
        .map(reminder => createReminderCard(reminder))
        .join('');
}


function createReminderCard(reminder) {
    const nextWatering = getNextWatering(reminder);
    const nextLower = nextWatering.toLowerCase();
    const isUrgent = nextLower.includes('now') || nextLower.includes('minute');
    const isCompleted = completedToday.includes(reminder.id);
    const progress = isCompleted ? 100 : Math.floor(Math.random() * 60) + 20;

    return `
        <div class="reminder-card ${isUrgent && !isCompleted ? 'needs-water' : ''}">
            <div class="card-header">
                <div class="plant-info">
                    <div class="plant-avatar">${plantIcons[reminder.type] || '🌱'}</div>
                    <div class="plant-details">
                        <h3>${reminder.name}</h3>
                        <span class="plant-type-badge">${plantTypeNames[reminder.type] || 'Plant'}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="action-btn" onclick="editReminder(${reminder.id})" title="Edit">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteReminder(${reminder.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="schedule-grid">
                <div class="schedule-box">
                    <span class="value">${reminder.days.length}</span>
                    <span class="label">days / week</span>
                </div>
                <div class="schedule-box">
                    <span class="value">${reminder.timesPerDay}</span>
                    <span class="label">times / day</span>
                </div>
                <div class="schedule-box">
                    <span class="value">${reminder.waterAmount}</span>
                    <span class="label">ml / time</span>
                </div>
            </div>

            <div class="days-display">
                ${shortDays.map((dayShort, i) => `
                    <div class="day-dot ${reminder.days.includes(dayNames[i]) ? 'active' : ''}">
                        ${dayShort}
                    </div>
                `).join('')}
            </div>

            <div class="times-display">
                ${reminder.times.map(time => `
                    <span class="time-chip">
                        <i class="far fa-clock"></i>
                        ${formatTime(time)}
                    </span>
                `).join('')}
            </div>

            <div class="next-watering-banner ${isUrgent ? 'urgent' : ''}">
                <div class="next-info">
                    <i class="fas fa-bell"></i>
                    <span class="next-text">Next watering: <strong>${nextWatering}</strong></span>
                </div>
                <button class="water-now-btn" onclick="markAsWatered(${reminder.id})">
                    ${isCompleted ? '✓ Done' : '💧 Water now'}
                </button>
            </div>

            <div class="water-progress">
                <div class="progress-header">
                    <span class="progress-label">Weekly watering progress</span>
                    <span class="progress-value">${progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// Time Helpers
// ==========================================
function formatTime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function getNextWatering(reminder) {
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 = Sunday
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find today's name
    const todayName = jsDayNames[currentDayIndex];

    // If today is a watering day
    if (reminder.days.includes(todayName)) {
        const sortedTimes = [...reminder.times].sort();
        for (const time of sortedTimes) {
            const [h, m] = time.split(':').map(Number);
            const timeMinutes = h * 60 + m;
            if (timeMinutes > currentMinutes) {
                const diff = timeMinutes - currentMinutes;
                if (diff <= 60) {
                    return `in ${diff} minute(s)`;
                }
                return `today at ${formatTime(time)}`;
            }
        }
    }

    // Find next watering day
    for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDayName = jsDayNames[nextDayIndex];

        if (reminder.days.includes(nextDayName)) {
            if (i === 1) {
                return `tomorrow at ${formatTime(reminder.times[0])}`;
            }
            return `${nextDayName} at ${formatTime(reminder.times[0])}`;
        }
    }

    return 'Not set';
}

// ==========================================
// Modal Functions
// ==========================================
function openModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Add new reminder';
    document.getElementById('reminderForm').reset();

    // Default checked days (Mon, Wed, Fri)
    document.querySelectorAll('.day-checkbox').forEach(cb => {
        cb.checked = ['dayMon', 'dayWed', 'dayFri'].includes(cb.id);
    });

    document.getElementById('timesPerDay').value = 2;
    document.getElementById('waterAmount').value = 500;

    // Reset time inputs
    const timeContainer = document.getElementById('timeInputs');
    timeContainer.innerHTML = `
        <div class="time-input-wrapper">
            <i class="far fa-clock"></i>
            <input type="time" value="08:00">
        </div>
        <div class="time-input-wrapper">
            <i class="far fa-clock"></i>
            <input type="time" value="18:00">
            <button type="button" class="remove-time" onclick="removeTime(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <button type="button" class="add-time-btn" onclick="addTime()">
            <i class="fas fa-plus"></i> Add time
        </button>
    `;

    document.getElementById('reminderModal').classList.add('active');
}

function closeModal() {
    document.getElementById('reminderModal').classList.remove('active');
    editingId = null;
}

function editReminder(id) {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = 'Edit reminder';
    document.getElementById('plantName').value = reminder.name;
    document.getElementById('plantType').value = reminder.type;
    document.getElementById('timesPerDay').value = reminder.timesPerDay;
    document.getElementById('waterAmount').value = reminder.waterAmount;

    // Set days
    document.querySelectorAll('.day-checkbox').forEach(cb => {
        cb.checked = reminder.days.includes(cb.value);
    });

    // Set times
    const timeContainer = document.getElementById('timeInputs');
    timeContainer.innerHTML =
        reminder.times
            .map((time, i) => `
                <div class="time-input-wrapper">
                    <i class="far fa-clock"></i>
                    <input type="time" value="${time}">
                    ${i > 0
                        ? `<button type="button" class="remove-time" onclick="removeTime(this)">
                               <i class="fas fa-times"></i>
                           </button>`
                        : ''}
                </div>
            `)
            .join('') +
        `
        <button type="button" class="add-time-btn" onclick="addTime()">
            <i class="fas fa-plus"></i> Add time
        </button>
    `;

    document.getElementById('reminderModal').classList.add('active');
}

// ==========================================
// Form Helpers
// ==========================================
function adjustValue(id, delta) {
    const input = document.getElementById(id);
    const min = parseInt(input.min, 10);
    const max = parseInt(input.max, 10);
    let newVal = parseInt(input.value, 10) + delta;
    newVal = Math.max(min, Math.min(max, newVal));
    input.value = newVal;
}

function addTime() {
    const container = document.getElementById('timeInputs');
    const addBtn = container.querySelector('.add-time-btn');

    const wrapper = document.createElement('div');
    wrapper.className = 'time-input-wrapper';
    wrapper.innerHTML = `
        <i class="far fa-clock"></i>
        <input type="time" value="12:00">
        <button type="button" class="remove-time" onclick="removeTime(this)">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.insertBefore(wrapper, addBtn);
}

function removeTime(btn) {
    const wrappers = document.querySelectorAll('.time-input-wrapper');
    if (wrappers.length > 1) {
        btn.closest('.time-input-wrapper').remove();
    }
}

// ==========================================
// Save Reminder
// ==========================================
function saveReminder() {
    const name = document.getElementById('plantName').value.trim();
    const type = document.getElementById('plantType').value;
    const timesPerDay = parseInt(document.getElementById('timesPerDay').value, 10);
    const waterAmount = parseInt(document.getElementById('waterAmount').value, 10);

    // Selected days
    const days = [];
    document.querySelectorAll('.day-checkbox:checked').forEach(cb => {
        days.push(cb.value);
    });

    // Times
    const times = [];
    document.querySelectorAll('.time-input-wrapper input[type="time"]').forEach(input => {
        if (input.value) times.push(input.value);
    });

    // Validation
    if (!name) {
        showToast('Please enter a plant name', 'error');
        return;
    }

    if (days.length === 0) {
        showToast('Please select at least one day', 'error');
        return;
    }

    if (times.length === 0) {
        showToast('Please add at least one time', 'error');
        return;
    }

    const reminder = {
        id: editingId || Date.now(),
        name,
        type,
        days,
        timesPerDay,
        times: times.sort(),
        waterAmount,
        createdAt: editingId
            ? reminders.find(r => r.id === editingId)?.createdAt
            : new Date().toISOString()
    };

    if (editingId) {
        const index = reminders.findIndex(r => r.id === editingId);
        reminders[index] = reminder;
        showToast('Reminder updated successfully! ✅');
    } else {
        reminders.push(reminder);
        showToast('Reminder added successfully! 🌱');
    }

    saveToStorage();
    renderReminders();
    updateStats();
    closeModal();
}

// ==========================================
// Delete Reminder
// ==========================================
function deleteReminder(id) {
    if (confirm('Are you sure you want to delete this reminder?')) {
        reminders = reminders.filter(r => r.id !== id);
        saveToStorage();
        renderReminders();
        updateStats();
        showToast('Reminder deleted 🗑️');
    }
}

// ==========================================
// Mark as Watered
// ==========================================
function markAsWatered(id) {
    if (!completedToday.includes(id)) {
        completedToday.push(id);
        localStorage.setItem('completedToday', JSON.stringify(completedToday));
    }
    renderReminders();
    updateStats();
    showToast('Watering recorded successfully! 💧🌱');
}

// ==========================================
// Filters & Search
// ==========================================
function setupFilters() {
    const tabs = document.querySelectorAll('.filter-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.dataset.filter;
            let filtered = reminders;

            if (filter === 'today') {
                const todayIndex = new Date().getDay();
                const todayName = jsDayNames[todayIndex];
                filtered = reminders.filter(r => r.days.includes(todayName));
            } else if (filter !== 'all') {
                filtered = reminders.filter(r => r.type === filter);
            }

            renderReminders(filtered);
        });
    });
}


function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    let timeout;

    searchInput.addEventListener('input', e => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const query = e.target.value.trim().toLowerCase();
            const filtered = reminders.filter(r => {
                const nameMatch = r.name.toLowerCase().includes(query);
                const typeName = plantTypeNames[r.type] || '';
                const typeMatch = typeName.toLowerCase().includes(query);
                return nameMatch || typeMatch;
            });
            renderReminders(filtered);
        }, 300);
    });
}


function showToast(message, type = 'success') {
    // Disabled – do nothing

}

// Close modal on outside click
const reminderModal = document.getElementById('reminderModal');
if (reminderModal) {
    reminderModal.addEventListener('click', function (e) {
        if (e.target === this) closeModal();
    });
}


// Close modal on Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});