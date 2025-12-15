// VARIÁVEIS DO DOM
const body = document.getElementById('app-body');
const timerDisplay = document.getElementById('timer-display');
const statusText = document.getElementById('status-text');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const progressBar = document.getElementById('progress-bar');

const taskList = document.getElementById('task-list');
const newTaskInput = document.getElementById('new-task-input');
const brainDumpArea = document.getElementById('brain-dump-area');

// CONFIGURAÇÕES
let totalDuration = 25 * 60; // 25 minutos de FOCO
const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

// ESTADO DO APLICATIVO
let timerInterval = null;
let isRunning = false;
let isFocusMode = true;
let timeLeft = FOCUS_DURATION;
let tasks = []; // Array para armazenar tarefas

// --- FUNÇÕES DE TEMPORIZADOR ---

/** Formata segundos para MM:SS */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

/** Atualiza a exibição do timer e a barra de progresso */
function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timeLeft);
    
    // Atualiza a barra de progresso
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
}

/** Lógica principal do temporizador (chamada a cada segundo) */
function tick() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        // TEMPO ESGOTADO!
        clearInterval(timerInterval);
        isRunning = false;
        
        // Toca um som simples (compatível com iOS antigo)
        try {
            const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU1QzMgAAA... [Um trecho curto de áudio para bip]'); // Substitua por um som simples
            // Como o áudio pode ser bloqueado no iOS, uma mudança visual é crucial.
        } catch (e) {} 
        
        // Alterna entre Foco e Pausa
        toggleMode();
    }
}

/** Alterna entre o modo Foco e Pausa */
function toggleMode() {
    isFocusMode = !isFocusMode;
    
    if (isFocusMode) {
        timeLeft = FOCUS_DURATION;
        statusText.textContent = 'MODO FOCO';
        body.classList.remove('break-mode');
        body.classList.add('focus-mode');
        startPauseBtn.className = 'main-btn play';
        startPauseBtn.textContent = 'INICIAR FOCO';
    } else {
        timeLeft = BREAK_DURATION;
        statusText.textContent = 'PAUSA CURTA';
        body.classList.remove('focus-mode');
        body.classList.add('break-mode');
        startPauseBtn.className = 'main-btn play break';
        startPauseBtn.textContent = 'INICIAR PAUSA';
    }
    
    updateTimerDisplay();
}

/** Inicia ou Pausa o temporizador */
function startPauseTimer() {
    if (isRunning) {
        // PAUSAR
        clearInterval(timerInterval);
        startPauseBtn.textContent = 'CONTINUAR';
        startPauseBtn.className = 'main-btn play';
    } else {
        // INICIAR / CONTINUAR
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

/** Reinicia o temporizador para a configuração atual */
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    
    if (isFocusMode) {
        timeLeft = FOCUS_DURATION;
        statusText.textContent = 'PRONTO PARA FOCO';
    } else {
        timeLeft = BREAK_DURATION;
        statusText.textContent = 'PRONTO PARA PAUSA';
    }
    
    startPauseBtn.textContent = isFocusMode ? 'INICIAR FOCO' : 'INICIAR PAUSA';
    startPauseBtn.className = 'main-btn play';
    updateTimerDisplay();
}

// --- FUNÇÕES DE TAREFAS E DADOS (LOCALSTORAGE) ---

/** Salva as tarefas e o brain dump no LocalStorage */
function saveState() {
    try {
        localStorage.setItem('tdah_tasks', JSON.stringify(tasks));
        localStorage.setItem('tdah_brain_dump', brainDumpArea.value);
    } catch (e) {
        console.error("Erro ao salvar no LocalStorage:", e);
        alert("Seu navegador não está salvando os dados. O app pode não funcionar offline.");
    }
}

/** Carrega os dados salvos */
function loadState() {
    try {
        const savedTasks = localStorage.getItem('tdah_tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
            renderTasks();
        }
        
        const savedDump = localStorage.getItem('tdah_brain_dump');
        if (savedDump) {
            brainDumpArea.value = savedDump;
        }
    } catch (e) {
        console.error("Erro ao carregar do LocalStorage:", e);
    }
}

/** Cria o HTML de um item de tarefa */
function createTaskElement(task, index) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'task-completed' : ''}`;
    taskItem.innerHTML = `
        <input type="checkbox" data-index="${index}" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${task.text}</span>
    `;
    return taskItem;
}

/** Renderiza a lista de tarefas completa */
function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        taskList.appendChild(createTaskElement(task, index));
    });
}

/** Adiciona uma nova tarefa */
function addTask() {
    const text = newTaskInput.value.trim();
    if (text) {
        tasks.push({ text: text, completed: false });
        newTaskInput.value = '';
        renderTasks();
        saveState();
    }
}

// --- ESCUTAS DE EVENTOS ---

startPauseBtn.addEventListener('click', startPauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Adicionar tarefa ao pressionar Enter
newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Marcar tarefa como concluída
taskList.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        const index = e.target.getAttribute('data-index');
        tasks[index].completed = e.target.checked;
        
        // Re-renderiza para aplicar o estilo 'task-completed'
        renderTasks(); 
        saveState();
    }
});

// Salvar Brain Dump sempre que houver alteração (debounced)
brainDumpArea.addEventListener('input', () => {
    // Para performance em hardware antigo, podemos usar um pequeno delay para salvar
    clearTimeout(window.saveDumpTimeout);
    window.saveDumpTimeout = setTimeout(saveState, 500); 
});

// Inicialização do App
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateTimerDisplay(); // Garante que o 25:00 seja exibido no carregamento
});