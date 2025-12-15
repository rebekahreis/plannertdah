// VARIÁVEIS DO DOM
const body = document.getElementById('app-body');
const timerDisplay = document.getElementById('timer-display');
const statusText = document.getElementById('status-text');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const progressBar = document.getElementById('progress-bar');
const categorySelect = document.getElementById('category-select'); 

const tabNavigation = document.querySelector('.tab-navigation');
const tabContents = document.querySelectorAll('.tab-content');
const taskList = document.getElementById('task-list');
const newTaskInput = document.getElementById('new-task-input');
const brainDumpArea = document.getElementById('brain-dump-area');

// Water Tracker DOM
const waterDisplay = document.getElementById('water-display'); 
const decreaseWaterBtn = document.getElementById('decrease-water-btn'); 
const increaseWaterBtn = document.getElementById('increase-water-btn'); 
const resetWaterBtn = document.getElementById('reset-water-btn'); 

// Calendar DOM
const calendarView = document.getElementById('calendar-view'); 
const selectedDayDisplay = document.getElementById('selected-day-display'); 
const habitButtonsContainer = document.getElementById('habit-buttons-container'); 

// Matriz DOM (NOVO INPUT)
const newMatrixTaskInput = document.getElementById('new-matrix-task-input'); 

const quadrants = document.querySelectorAll('.quadrant');
const quadrantContainers = {
    q1: document.getElementById('q1'),
    q2: document.getElementById('q2'),
    q3: document.getElementById('q3'),
    q4: document.getElementById('q4'),
};

// CONFIGURAÇÕES
const FOCUS_DURATION = 25 * 60; 
const BREAK_DURATION = 5 * 60;
const WATER_INCREMENT = 200; 

const HABITS = { 
    estudo: 'Estudo', 
    pos: 'Pós', 
    leitura: 'Leitura', 
    gym: 'Academia'
};

// ESTADO DO APLICATIVO
let timerInterval = null;
let isRunning = false;
let isFocusMode = true;
let timeLeft = FOCUS_DURATION;
let currentCategory = categorySelect.value; 
let tasks = []; 

let waterIntake = 0;
let waterLastResetDate = new Date().toDateString(); 
let habitTrackerData = {}; 
let selectedDateKey = null; 


// --- FUNÇÕES DE UTILIDADE ---

/** Cria uma chave de data YYYY-MM-DD segura para navegadores antigos */
function createDateKey(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Padding manual para máxima compatibilidade
    const monthStr = month < 10 ? '0' + month : String(month);
    const dayStr = day < 10 ? '0' + day : String(day);
    
    return `${year}-${monthStr}-${dayStr}`;
}

function getTodayDateKey() {
    return createDateKey(new Date());
}


// --- FUNÇÕES DE NAVEGAÇÃO (ABAS) ---

function switchTab(targetTab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === targetTab) {
            btn.classList.add('active');
        }
    });

    tabContents.forEach(content => {
        if (content.id === `${targetTab}-tab`) { 
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
    
    // Ações ao mudar de aba
    if (targetTab === 'matrix') {
        renderMatrixTasks();
    } else if (targetTab === 'calendar') {
        renderCalendar();
    } else {
        renderTasks();
    }
}


// --- FUNÇÕES DE TEMPORIZADOR (Mantidas) ---

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateStatusText() {
    const categoryName = categorySelect.options[categorySelect.selectedIndex].text;
    if (isRunning) {
        statusText.textContent = isFocusMode ? `FOCO EM ${categoryName.toUpperCase()}` : 'PAUSA CURTA';
    } else {
        statusText.textContent = isFocusMode ? `PRONTO PARA ${categoryName.toUpperCase()}` : 'PRONTO PARA PAUSA';
    }
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timeLeft);
    
    let total;
    if (isFocusMode) {
        total = FOCUS_DURATION;
        progressBar.style.backgroundColor = 'var(--color-focus)';
    } else {
        total = BREAK_DURATION;
        progressBar.style.backgroundColor = 'var(--color-break)';
    }
    const percent = (timeLeft / total) * 100;
    progressBar.style.width = `${percent}%`;
    
    updateStatusText(); 
}

function tick() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        clearInterval(timerInterval);
        isRunning = false;
        
        if (isFocusMode && HABITS.hasOwnProperty(currentCategory)) {
            toggleHabit(currentCategory, true, getTodayDateKey());
            renderCalendar(); // Força a atualização após o foco
        }
        
        toggleMode();
    }
}

function toggleMode() {
    isFocusMode = !isFocusMode;
    
    if (isFocusMode) {
        timeLeft = FOCUS_DURATION;
        body.classList.remove('break-mode');
        body.classList.add('focus-mode');
        startPauseBtn.className = 'main-btn play';
        startPauseBtn.textContent = 'INICIAR FOCO';
    } else {
        timeLeft = BREAK_DURATION;
        body.classList.remove('focus-mode');
        body.classList.add('break-mode');
        startPauseBtn.className = 'main-btn play break';
        startPauseBtn.textContent = 'INICIAR PAUSA';
    }
    
    updateTimerDisplay();
}

function startPauseTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        startPauseBtn.textContent = 'CONTINUAR';
        startPauseBtn.className = 'main-btn play';
    } else {
        timerInterval = setInterval(tick, 1000);
        
        if (isFocusMode) {
            startPauseBtn.className = 'main-btn focus';
            startPauseBtn.textContent = 'PAUSAR FOCO';
        } else {
            startPauseBtn.className = 'main-btn break';
            startPauseBtn.textContent = 'PAUSAR PAUSA';
        }
    }
    isRunning = !isRunning;
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    
    if (isFocusMode) {
        timeLeft = FOCUS_DURATION;
    } else {
        timeLeft = BREAK_DURATION;
    }
    
    startPauseBtn.textContent = isFocusMode ? 'INICIAR FOCO' : 'INICIAR PAUSA';
    startPauseBtn.className = 'main-btn play';
    updateTimerDisplay();
}


// --- FUNÇÕES DE RASTREADOR DE ÁGUA (Mantidas) ---

function updateWaterDisplay() {
    waterDisplay.textContent = `${waterIntake} ml`;
    saveState();
}

function addWater(amount) {
    waterIntake = Math.max(0, waterIntake + amount);
    updateWaterDisplay();
}

function checkAndResetDailyWater() {
    const today = new Date().toDateString();
    if (waterLastResetDate !== today) {
        waterIntake = 0;
        waterLastResetDate = today;
    }
}

function resetDailyWater() {
    waterIntake = 0;
    waterLastResetDate = new Date().toDateString();
    updateWaterDisplay();
    alert("Contagem de água resetada para hoje!");
}


// --- FUNÇÕES DE CALENDÁRIO E HÁBITOS (Corrigidas) ---

function renderCalendar() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Domingo, 1=Segunda

    // Nomes dos dias da semana (PT-BR)
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Mês/Ano para o cabeçalho
    const monthYearStr = lastDayOfMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    let html = `<div class="month-year">${monthYearStr}</div>`;
    html += `<div class="days-of-week">${dayNames.map(d => `<span>${d}</span>`).join('')}</div>`;
    html += `<div class="calendar-grid">`;

    // Células vazias para preenchimento inicial
    for (let i = 0; i < startDayOfWeek; i++) {
        html += `<div class="day-cell inactive"></div>`;
    }

    // Células do mês
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        
        const dateKey = createDateKey(date);
        
        const isSelected = dateKey === selectedDateKey;
        const habits = habitTrackerData[dateKey] || {};

        let markers = '';
        // CORREÇÃO: Usando Object.keys(HABITS) para iterar com segurança
        Object.keys(HABITS).forEach(habitKey => {
            if (habits[habitKey]) {
                markers += `<div class="marker ${habitKey}"></div>`;
            }
        });

        html += `
            <div class="day-cell ${isSelected ? 'selected' : ''}" data-date-key="${dateKey}">
                <span class="day-number">${day}</span>
                <div class="habit-markers">${markers}</div>
            </div>
        `;
    }

    html += `</div>`;
    calendarView.innerHTML = html;
    
    renderHabitButtons();
    saveState();
}

function renderHabitButtons() {
    // Garante que o selectedDateKey tem o formato correto (YYYY/MM/DD)
    const safeDateKey = selectedDateKey.replace(/-/g, '/'); 
    // CORREÇÃO: Novo objeto Date mais robusto
    const selectedDate = new Date(safeDateKey); 
    
    // Verifica se a data é válida antes de tentar formatar
    if (!isNaN(selectedDate.getTime())) {
        selectedDayDisplay.textContent = selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    } else {
        selectedDayDisplay.textContent = "Dia Inválido";
    }
    
    const habits = habitTrackerData[selectedDateKey] || {};
    
    let html = '';
    Object.keys(HABITS).forEach(habitKey => {
        const isActive = habits[habitKey] ? 'active' : '';
        const name = HABITS[habitKey];
        
        html += `
            <button class="habit-btn ${habitKey} ${isActive}" data-habit-key="${habitKey}">
                ${name}
            </button>
        `;
    });
    
    habitButtonsContainer.innerHTML = html;
}

function toggleHabit(habitKey, forceActive = false, dateKey = selectedDateKey) {
    if (!habitTrackerData[dateKey]) {
        habitTrackerData[dateKey] = {};
    }
    
    if (forceActive) {
        habitTrackerData[dateKey][habitKey] = true;
    } else {
        // Toggle (inverte o estado) se não estiver forçando a ativação
        habitTrackerData[dateKey][habitKey] = !habitTrackerData[dateKey][habitKey];
    }
    
    renderCalendar(); 
}


// --- FUNÇÕES DE TAREFAS (Chunking - Corrigidas/Aprimoradas) ---

function createSubTaskElement(subtask, taskIndex, subIndex) {
    const subtaskItem = document.createElement('div');
    subtaskItem.className = `subtask-item ${subtask.completed ? 'task-completed' : ''}`;
    subtaskItem.innerHTML = `
        <input type="checkbox" data-task-index="${taskIndex}" data-sub-index="${subIndex}" ${subtask.completed ? 'checked' : ''}>
        <span class="task-text">${subtask.text}</span>
    `;
    return subtaskItem;
}

function createTaskElement(task, index) {
    if (task.priority !== 'none') return document.createElement('div'); 

    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'task-completed' : ''}`;
    taskItem.setAttribute('data-index', index);

    // Adicionado um contêiner principal para melhor manipulação do clique
    taskItem.innerHTML = `
        <div class="task-main-row" style="display: flex; align-items: center;">
            <input type="checkbox" data-index="${index}" ${task.completed ? 'checked' : ''}>
            <span class="task-text" data-index="${index}" style="flex-grow: 1; cursor: pointer;">${task.text}</span>
            <button class="toggle-btn" data-index="${index}">&#9660;</button> 
        </div>
        <div class="task-details task-details-hidden" id="details-${index}">
            <h4 style="margin: 0 0 5px 0; font-size: 0.9em; color: #777;">Passos Concretos (Chunking):</h4>
            <div class="subtask-list" id="subtask-list-${index}">
                </div>
            <input type="text" class="subtask-input" data-task-index="${index}" placeholder="Adicionar sub-passo (Enter)">
        </div>
    `;

    const subtaskListContainer = taskItem.querySelector(`#subtask-list-${index}`);
    task.subtasks.forEach((subtask, subIndex) => {
        subtaskListContainer.appendChild(createSubTaskElement(subtask, index, subIndex));
    });

    return taskItem;
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        taskList.appendChild(createTaskElement(task, index));
    });
}

function addTask() {
    const text = newTaskInput.value.trim();
    if (text) {
        tasks.push({ text: text, completed: false, subtasks: [], priority: 'none' }); 
        newTaskInput.value = '';
        renderTasks();
        saveState();
    }
}

// NOVO: Adicionar tarefa diretamente da Matriz (cai em Q2 por padrão)
function addMatrixTask() {
    const text = newMatrixTaskInput.value.trim();
    if (text) {
        // Adiciona diretamente com prioridade Q2 (Agendar/Focar)
        tasks.push({ text: text, completed: false, subtasks: [], priority: 'q2' }); 
        newMatrixTaskInput.value = '';
        renderMatrixTasks(); // Atualiza a matriz
        saveState();
    }
}

function addSubTask(taskIndex, text) {
    if (!tasks[taskIndex].subtasks) {
        tasks[taskIndex].subtasks = [];
    }
    tasks[taskIndex].subtasks.push({ text: text, completed: false });
    renderTasks();
    saveState();
    toggleTaskDetails(taskIndex, true); 
}

function toggleTaskDetails(index, forceOpen = false) {
    const detailsDiv = document.getElementById(`details-${index}`);
    const toggleBtn = taskList.querySelector(`.task-item[data-index="${index}"] .toggle-btn`);
    
    if (detailsDiv) {
        if (forceOpen) {
             detailsDiv.classList.remove('task-details-hidden');
        } else {
             detailsDiv.classList.toggle('task-details-hidden');
        }
       
        if (toggleBtn) {
             if (detailsDiv.classList.contains('task-details-hidden')) {
                toggleBtn.innerHTML = '&#9660;'; 
            } else {
                toggleBtn.innerHTML = '&#9650;'; 
            }
        }
    }
}


// --- FUNÇÕES DA MATRIZ DE EISENHOWER (Corrigidas) ---

function createMatrixTaskElement(task, index) {
    const matrixTask = document.createElement('div');
    matrixTask.className = 'matrix-task-item';
    matrixTask.setAttribute('data-index', index);
    matrixTask.setAttribute('data-priority', task.priority);
    // REMOVIDO: move-back-btn e remove-btn que estavam causando conflitos de clique
    matrixTask.innerHTML = `
        <span class="matrix-task-text">${task.text}</span>
        <div style="display: flex;">
            <button class="move-back-btn" data-index="${index}" style="background:none; border:none; color:inherit; cursor:pointer; font-size:0.9em;">&#8617;</button>
            <button class="remove-btn" data-index="${index}" style="background:none; border:none; color:inherit; cursor:pointer;">&times;</button>
        </div>
    `;
    return matrixTask;
}

function renderMatrixTasks() {
    quadrants.forEach(q => {
        // Limpa o conteúdo, mantendo apenas Títulos e Subtítulos
        const currentTitle = q.querySelector('h3').outerHTML;
        const currentSubtitle = q.querySelector('.subtitle').outerHTML;
        q.innerHTML = currentTitle + currentSubtitle; 
    });

    tasks.forEach((task, index) => {
        if (task.priority !== 'none') {
            const container = quadrantContainers[task.priority];
            if (container) {
                // CORREÇÃO: Evita erro se o container for nulo (apesar de improvável)
                container.appendChild(createMatrixTaskElement(task, index));
            }
        }
    });
}

function moveTaskToMatrix(index, priority) {
    tasks[index].priority = priority;
    renderTasks();
    renderMatrixTasks();
    saveState();
}

function moveTaskBack(index) {
    tasks[index].priority = 'none';
    renderTasks();
    renderMatrixTasks();
    saveState();
    switchTab('tasks');
}


// --- FUNÇÕES DE DADOS E SALVAMENTO (Mantidas) ---

function saveState() {
    try {
        localStorage.setItem('tdah_tasks', JSON.stringify(tasks));
        localStorage.setItem('tdah_brain_dump', brainDumpArea.value);
        localStorage.setItem('tdah_water_intake', waterIntake); 
        localStorage.setItem('tdah_water_reset_date', waterLastResetDate); 
        localStorage.setItem('tdah_habits_data', JSON.stringify(habitTrackerData)); 
        localStorage.setItem('tdah_selected_date', selectedDateKey); 
    } catch (e) {
        console.error("Erro ao salvar no LocalStorage:", e);
    }
}

function loadState() {
    try {
        const savedTasks = localStorage.getItem('tdah_tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
            tasks.forEach(t => { 
                if (!t.subtasks) t.subtasks = []; 
                if (!t.priority) t.priority = 'none';
            }); 
            renderTasks();
        }
        
        const savedDump = localStorage.getItem('tdah_brain_dump');
        if (savedDump) {
            brainDumpArea.value = savedDump;
        }

        // Carregar dados de Água
        waterIntake = parseInt(localStorage.getItem('tdah_water_intake') || 0);
        waterLastResetDate = localStorage.getItem('tdah_water_reset_date') || new Date().toDateString();
        checkAndResetDailyWater();
        updateWaterDisplay();

        // Carregar dados de Hábitos
        const savedHabits = localStorage.getItem('tdah_habits_data');
        if (savedHabits) {
            habitTrackerData = JSON.parse(savedHabits);
        }
        selectedDateKey = localStorage.getItem('tdah_selected_date') || getTodayDateKey();
        
    } catch (e) {
        console.error("Erro ao carregar do LocalStorage:", e);
    }
}


// --- ESCUTAS DE EVENTOS (Revisadas) ---

startPauseBtn.addEventListener('click', startPauseTimer);
resetBtn.addEventListener('click', resetTimer);
categorySelect.addEventListener('change', (e) => { 
    currentCategory = e.target.value;
    updateTimerDisplay(); 
});

// Water Tracker Listeners 
decreaseWaterBtn.addEventListener('click', () => addWater(-WATER_INCREMENT));
increaseWaterBtn.addEventListener('click', () => addWater(WATER_INCREMENT));
resetWaterBtn.addEventListener('click', resetDailyWater);

// Navegação por Abas
tabNavigation.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
        switchTab(e.target.getAttribute('data-tab'));
    }
});

// Adicionar tarefa principal (aba Tasks) ao pressionar Enter
newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// NOVO: Adicionar tarefa diretamente na Matriz (aba Matrix) ao pressionar Enter
newMatrixTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addMatrixTask();
    }
});


// Listener ÚNICO para Tarefas (Chunking)
taskList.addEventListener('click', (e) => {
    // 1. Alternar Detalhes
    if (e.target.classList.contains('toggle-btn')) {
        const index = e.target.getAttribute('data-index');
        toggleTaskDetails(index);
        return;
    }
    
    // 2. Mover para Matriz ao clicar no Texto
    if (e.target.classList.contains('task-text') && !e.target.closest('.subtask-item')) {
        const index = e.target.getAttribute('data-index');
        if (tasks[index] && tasks[index].priority === 'none') {
            moveTaskToMatrix(index, 'q2'); // Move para Q2 (Agendar/Focar)
            switchTab('matrix');
        }
        return;
    }
});

taskList.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        if (!e.target.getAttribute('data-sub-index')) {
            // Tarefa principal
            const index = e.target.getAttribute('data-index');
            tasks[index].completed = e.target.checked;
        } else {
            // Sub-tarefa
            const taskIndex = e.target.getAttribute('data-task-index');
            const subIndex = e.target.getAttribute('data-sub-index');
            tasks[taskIndex].subtasks[subIndex].completed = e.target.checked;
        }
        renderTasks(); 
        saveState();
    }
});

// Adicionar Sub-tarefa ao pressionar Enter
taskList.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('subtask-input')) {
        e.preventDefault(); 
        const taskIndex = e.target.getAttribute('data-task-index');
        const text = e.target.value.trim();
        if (text) {
            addSubTask(taskIndex, text);
            e.target.value = ''; 
        }
    }
});

// Listener para interações na Matriz (Correção de eventos de clique)
quadrants.forEach(quadrant => {
    quadrant.addEventListener('click', (e) => {
        const target = e.target;
        const clickedItem = target.closest('.matrix-task-item');
        if (!clickedItem) return;

        const index = clickedItem.getAttribute('data-index');

        // 1. Mover de volta para lista de Chunking
        if (target.classList.contains('move-back-btn')) {
            moveTaskBack(index);
            return;
        }
        
        // 2. Remover a tarefa
        if (target.classList.contains('remove-btn')) {
            if (confirm("Tem certeza que deseja DELETAR esta tarefa?")) {
                tasks.splice(index, 1);
                // Necessário recarregar o estado para corrigir índices
                loadState(); 
                renderMatrixTasks();
                saveState();
            }
            return;
        }

        // 3. Clicar no texto/item para mudar de quadrante (prioridade)
        if (target.classList.contains('matrix-task-text') || target.classList.contains('matrix-task-item')) {
            const currentPriority = clickedItem.getAttribute('data-priority');
            
            const priorities = ['q1', 'q2', 'q3', 'q4'];
            const currentIndex = priorities.indexOf(currentPriority);
            const nextIndex = (currentIndex + 1) % priorities.length;
            const nextPriority = priorities[nextIndex];
            
            tasks[index].priority = nextPriority;
            renderMatrixTasks();
            saveState();
        }
    });
});

// Listener para interações no Calendário 
calendarView.addEventListener('click', (e) => {
    const dayCell = e.target.closest('.day-cell');
    if (dayCell && !dayCell.classList.contains('inactive')) {
        selectedDateKey = dayCell.getAttribute('data-date-key');
        renderCalendar(); // Redesenha o calendário e os botões de hábito
    }
});

habitButtonsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('habit-btn')) {
        const habitKey = e.target.getAttribute('data-habit-key');
        toggleHabit(habitKey);
    }
});

// Salvar Brain Dump 
brainDumpArea.addEventListener('input', () => {
    clearTimeout(window.saveDumpTimeout);
    window.saveDumpTimeout = setTimeout(saveState, 500); 
});

// Inicialização do App
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateTimerDisplay(); 
    // Garante a renderização inicial
    renderTasks();
    renderMatrixTasks();
    renderCalendar(); 
});