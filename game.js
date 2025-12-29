// Configuración de Multiplicadores - Distribución Gaussiana (más difícil ganar)
const MULTIPLIERS_DATA = {
    10: [25, 5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5, 25],
    11: [50, 10, 3, 1.5, 0.5, 0.2, 0.2, 0.5, 1.5, 3, 10, 50],
    12: [100, 20, 5, 2, 1, 0.3, 0.2, 0.3, 1, 2, 5, 20, 100],
    13: [150, 30, 8, 3, 1.2, 0.5, 0.2, 0.2, 0.5, 1.2, 3, 8, 30, 150],
    14: [200, 50, 12, 4, 1.5, 0.5, 0.2, 0.2, 0.2, 0.5, 1.5, 4, 12, 50, 200],
    15: [300, 80, 20, 6, 2, 0.8, 0.2, 0.2, 0.2, 0.8, 2, 6, 20, 80, 300],
    16: [500, 120, 30, 10, 3, 1, 0.4, 0.2, 0.2, 0.2, 0.4, 1, 3, 10, 30, 120, 500]
};

const config = {
    initialBalance: 1000,
    minBet: 5,
    maxBet: 1000,
    betStep: 5,
    launchCooldown: 400,
    autoPlaySpeed: 300
};

// --- Gestor de Sonido ---
const SoundManager = {
    ctx: null,
    enabled: true,
    init() {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { console.error("Web Audio error"); }
    },
    playTone(freq, type, duration) {
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    playHit() { this.playTone(800 + Math.random() * 200, 'sine', 0.1); },
    playSlot() { this.playTone(150, 'square', 0.2); },
    playWin() {
        if (!this.ctx || !this.enabled) return;
        [440, 554, 659].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 0.3), i * 100);
        });
    }
};

// --- Estado del Juego ---
let gameState = {
    balance: config.initialBalance,
    currentBet: 10,
    rows: 16,
    activeBalls: new Set(),
    lastLaunchTime: 0,
    isAutoMode: false,
    autoplayRemaining: 0,
    autoplayInterval: null
};

// --- Matter.js Setup ---
const { Engine, Render, Runner, World, Bodies, Events, Body } = Matter;
const engine = Engine.create();
const world = engine.world;
world.gravity.y = 1.2;

const canvas = document.getElementById('gameCanvas');
// IMPORTANTE: Render inicial se ajustará al crear elementos
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: 100, height: 100, // Placeholder
        wireframes: false,
        background: 'transparent'
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

let width, height;

function createGameElements() {
    World.clear(world);

    // Obtener dimensiones del contenedor padre (.main-game-area)
    // Ahora el padre está restringido a max 480px por CSS, así que usamos su ancho real
    const container = canvas.parentElement;
    width = container.offsetWidth;
    height = container.offsetHeight;

    // Ajustar render a las nuevas dimensiones
    render.canvas.width = width;
    render.canvas.height = height;
    render.options.width = width;
    render.options.height = height;

    // Paredes invisibles
    const wallOptions = { isStatic: true, render: { visible: false } };
    World.add(world, [
        Bodies.rectangle(-20, height / 2, 40, height * 2, wallOptions),
        Bodies.rectangle(width + 20, height / 2, 40, height * 2, wallOptions)
    ]);

    // Generación de Pirámide Optimizada para Móvil
    const rows = gameState.rows;
    // Pines ajustados al tamaño móvil (serán pequeños, ~2-3px)
    const pinRadius = Math.max(2, width / 140);

    // Calcular geometría piramidal
    // Queremos que ocupe casi todo el ancho disponible abajo
    const bottomWidth = width * 0.95;
    const topWidth = width * 0.05; // Solo un punto arriba

    // Espaciado vertical: Pirámide más achatada para favorecer extremos
    const pyramidHeight = height * 0.65; // Antes 0.85
    const startY = height * 0.15; // Antes 0.10, bajarla un poco
    const spacingY = pyramidHeight / rows;

    for (let i = 0; i < rows; i++) {
        const rowPins = 3 + i;
        // Calcular ancho de esta fila específica
        const currentRowWidth = (rowPins - 1) * (bottomWidth / (rows + 2));
        const startX = (width - currentRowWidth) / 2;
        const spacingX = currentRowWidth / (rowPins - 1 || 1);

        for (let j = 0; j < rowPins; j++) {
            const x = startX + j * spacingX;
            const y = startY + i * spacingY;

            const pin = Bodies.circle(x, y, pinRadius, {
                isStatic: true,
                label: 'pin',
                render: { fillStyle: '#06ffa5', strokeStyle: '#fff', lineWidth: 1 },
                restitution: 0.5,
                friction: 0.05
            });
            World.add(world, pin);
        }
    }

    renderMultipliers();
}

function renderMultipliers() {
    const container = document.getElementById('multipliersContainer');
    container.innerHTML = '';
    const multipliers = MULTIPLIERS_DATA[gameState.rows];

    multipliers.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = 'multiplier';
        if (m >= 100) div.classList.add('jackpot');
        else if (m >= 10) div.classList.add('high');
        else if (m < 1) div.classList.add('lose');

        div.textContent = m + 'x';
        div.dataset.index = i;
        container.appendChild(div);
    });
}

function launchBall() {
    const now = Date.now();
    if (now - gameState.lastLaunchTime < config.launchCooldown) return false;
    if (gameState.balance < gameState.currentBet) {
        stopAutoplay();
        alert("¡Saldo insuficiente!");
        return false;
    }

    gameState.balance -= gameState.currentBet;
    updateBalanceDisplay();
    gameState.lastLaunchTime = now;

    // Calcular radio: factor dinámico según filas para que quepa bien
    // Base: Ancho fondo / número de huecos
    const bottomWidth = width * 0.95;
    const gap = bottomWidth / (gameState.rows + 2);
    // Bolas pequeñas constantes
    const sizeFactor = 0.28;

    const ballRadius = gap * sizeFactor;

    // Lanzar desde arriba centro con varianza
    const x = width / 2 + (Math.random() - 0.5) * 10;
    const y = 30;

    const ball = Bodies.circle(x, y, ballRadius, {
        restitution: 0.5,
        friction: 0.01,
        frictionAir: 0.03, // Un poco mas de resistencia aire para caer suave
        density: 0.002,
        label: 'ball',
        render: { fillStyle: '#ff006e', strokeStyle: '#fff', lineWidth: 2 }
    });

    Body.setVelocity(ball, { x: (Math.random() - 0.5) * 2, y: 0 });
    World.add(world, ball);
    gameState.activeBalls.add(ball);

    return true;
}

// --- Eventos Físicos ---
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        if (pair.bodyA.label === 'pin' || pair.bodyB.label === 'pin') {
            // Rate limit sounds ligeramente
            // SoundManager.playHit(); 
        }
    });
});

Events.on(engine, 'afterUpdate', () => {
    const ballsToRemove = [];
    gameState.activeBalls.forEach(ball => {
        if (ball.position.y > render.options.height + 50) {
            // Calcular slot
            const multipliers = MULTIPLIERS_DATA[gameState.rows];
            const slotCount = multipliers.length;
            // Asumimos slots distribuidos uniformemente en 95% ancho
            const safeWidth = width * 0.95;
            const startX = (width - safeWidth) / 2;
            const relX = ball.position.x - startX;
            const slotWidth = safeWidth / slotCount;

            let index = Math.floor(relX / slotWidth);
            index = Math.max(0, Math.min(slotCount - 1, index));

            handleWin(multipliers[index], index);
            ballsToRemove.push(ball);
        }
    });

    ballsToRemove.forEach(ball => {
        World.remove(world, ball);
        gameState.activeBalls.delete(ball);
    });
});

// --- UI y Lógica Juego ---
function handleWin(multiplier, index) {
    const winAmount = gameState.currentBet * multiplier;
    gameState.balance += winAmount;
    updateBalanceDisplay();

    // Efectos
    highlightSlot(index);
    if (multiplier >= 1) SoundManager.playWin();
    else SoundManager.playSlot(); // Sonido menor

    showFloatingPrize(winAmount, multiplier);
}

function showFloatingPrize(profit, multiplier) {
    // Buscar posición (desde el footer balance)
    const balanceEl = document.getElementById('balance');
    const rect = balanceEl.getBoundingClientRect();

    const floatEl = document.createElement('div');
    floatEl.className = 'floating-prize';

    if (multiplier >= 1) {
        floatEl.textContent = `+${profit.toFixed(1)}€`;
        floatEl.classList.add('win');
    } else {
        floatEl.textContent = `+${profit.toFixed(1)}€`;
        floatEl.classList.add('lose'); // Recuperación parcial
    }

    // Posición inicial A LA IZQUIERDA del balance
    // rect.left es el borde izquierdo del "1000€". Restamos para ir a la izquierda.
    floatEl.style.left = (rect.left - 70) + 'px'; // Desplazado 70px a la izquierda
    floatEl.style.top = (rect.top - 10) + 'px'; // Un poco más alineado verticalmente

    document.body.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1500);
}

function highlightSlot(index) {
    const slots = document.querySelectorAll('.multiplier');
    if (slots[index]) {
        const el = slots[index];
        el.style.transform = 'translateY(-5px) scale(1.2)';
        el.style.backgroundColor = 'var(--neon-cyan)';
        el.style.color = 'black';
        setTimeout(() => {
            el.style.transform = '';
            el.style.backgroundColor = '';
            el.style.color = '';
        }, 300);
    }
}

function updateBalanceDisplay() {
    document.getElementById('balance').textContent = gameState.balance.toFixed(0) + '€';
}
function updateBetDisplay() {
    document.getElementById('betAmount').textContent = gameState.currentBet + '€';
}

// --- Autoplay ---
function toggleAutoMode() {
    gameState.isAutoMode = !gameState.isAutoMode;
    const btnMan = document.getElementById('modeManual');
    const btnAuto = document.getElementById('modeAuto');
    const select = document.getElementById('autoCountSelect');

    if (gameState.isAutoMode) {
        btnMan.classList.remove('active');
        btnAuto.classList.add('active');
        select.classList.remove('hidden');
    } else {
        btnAuto.classList.remove('active');
        btnMan.classList.add('active');
        select.classList.add('hidden');
        stopAutoplay();
    }
}

function startAutoplayLogic() {
    if (!gameState.isAutoMode) return;

    const count = parseInt(document.getElementById('autoCountSelect').value);
    gameState.autoplayRemaining = count === 0 ? Infinity : count; // 0 = infinito

    document.getElementById('stopAutoplay').classList.remove('hidden');
    setControlsDisabled(true);

    if (gameState.autoplayInterval) clearInterval(gameState.autoplayInterval);

    gameState.autoplayInterval = setInterval(() => {
        if (gameState.autoplayRemaining <= 0) {
            stopAutoplay();
            return;
        }
        if (launchBall()) {
            gameState.autoplayRemaining--;
        }
    }, config.autoPlaySpeed);
}

function stopAutoplay() {
    if (gameState.autoplayInterval) {
        clearInterval(gameState.autoplayInterval);
        gameState.autoplayInterval = null;
    }
    document.getElementById('stopAutoplay').classList.add('hidden');
    setControlsDisabled(false);
}

function setControlsDisabled(disabled) {
    const ids = ['increaseBet', 'decreaseBet', 'modeManual', 'modeAuto'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (disabled) el.classList.add('disabled-control');
            else el.classList.remove('disabled-control');
        }
    });
    // Bloquear filas
    document.querySelectorAll('.line-btn').forEach(btn => {
        if (disabled) btn.classList.add('disabled-control');
        else btn.classList.remove('disabled-control');
    });
}

// --- Listeners --- 
// Filas Verticales
document.querySelectorAll('.line-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Update active class
        document.querySelectorAll('.line-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        gameState.rows = parseInt(e.target.dataset.rows);
        createGameElements();
    });
});

// Botón PLAY Gigante
document.getElementById('launchBtn').addEventListener('click', () => {
    SoundManager.init();
    if (gameState.isAutoMode) {
        if (!gameState.autoplayInterval) startAutoplayLogic();
        else stopAutoplay();
    } else {
        launchBall();
    }
});

// Modos
document.getElementById('modeManual').addEventListener('click', () => { if (window.gameState.isAutoMode) toggleAutoMode(); });
document.getElementById('modeAuto').addEventListener('click', () => { if (!window.gameState.isAutoMode) toggleAutoMode(); });

// Stop flotante
document.getElementById('stopAutoplay').addEventListener('click', stopAutoplay);

// --- RESTAURAR LISTENERS MIN/MAX ---
const minBtn = document.getElementById('minBetBtn');
const maxBtn = document.getElementById('maxBetBtn');
if (minBtn) minBtn.addEventListener('click', () => { gameState.currentBet = config.minBet; updateBetDisplay(); });
if (maxBtn) maxBtn.addEventListener('click', () => { gameState.currentBet = config.maxBet; updateBetDisplay(); });

// Apuestas
document.getElementById('increaseBet').addEventListener('click', () => {
    if (gameState.currentBet < config.maxBet) {
        gameState.currentBet += config.betStep;
        updateBetDisplay();
    }
});
document.getElementById('decreaseBet').addEventListener('click', () => {
    if (gameState.currentBet > config.minBet) {
        gameState.currentBet -= config.betStep;
        updateBetDisplay();
    }
});

// Config
document.getElementById('resetBalance').addEventListener('click', () => {
    if (confirm("¿Reset 1000€?")) {
        gameState.balance = 1000;
        updateBalanceDisplay();
    }
});
document.getElementById('soundToggle').addEventListener('click', (e) => {
    SoundManager.enabled = !SoundManager.enabled;
    e.target.textContent = SoundManager.enabled ? '🔊' : '🔇';
});

window.addEventListener('resize', () => {
    // Debounce resize
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(createGameElements, 200);
});

// Init
window.gameState = gameState; // Expose for debugging
updateBalanceDisplay();
updateBetDisplay();
// Delay init creation to ensure layout paint
setTimeout(createGameElements, 100);
