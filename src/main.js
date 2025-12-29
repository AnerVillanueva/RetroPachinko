import './styles/main.css';
import { gameState, config } from './core/GameState';
import SoundManager from './core/SoundManager';
import PhysicsEngine from './core/PhysicsEngine';
import UIManager from './ui/UIManager';

class Game {
    constructor() {
        this.ui = new UIManager({
            onLaunch: () => this.handleLaunch(),
            onToggleMode: (isAuto) => this.toggleAutoMode(isAuto),
            onStopAuto: () => this.stopAutoplay(),
            onAdjustBet: (dir) => this.adjustBet(dir),
            onSetMinMaxBet: (isMin) => this.setMinMaxBet(isMin),
            onResetBalance: () => this.resetBalance(),
            onToggleSound: (e) => this.toggleSound(e),
            onChangeRows: (rows) => this.changeRows(rows),
            onResize: () => this.physics.createPyramid()
        });

        this.physics = new PhysicsEngine(
            document.getElementById('gameCanvas'),
            (multiplier, index) => this.handleWin(multiplier, index)
        );

        this.init();
    }

    init() {
        this.ui.updateBalance();
        this.ui.updateBet();
        this.ui.renderMultipliers();
        setTimeout(() => this.physics.createPyramid(), 100);
    }

    handleLaunch() {
        SoundManager.init();
        if (gameState.isAutoMode) {
            if (!gameState.autoplayInterval) this.startAutoplay();
            else this.stopAutoplay();
        } else {
            this.launchBall();
        }
    }

    launchBall() {
        const now = Date.now();
        if (now - gameState.lastLaunchTime < config.launchCooldown) return false;

        if (gameState.balance < gameState.currentBet) {
            this.stopAutoplay();
            alert("¡Saldo insuficiente!");
            return false;
        }

        gameState.balance -= gameState.currentBet;
        this.ui.updateBalance();
        gameState.lastLaunchTime = now;

        this.physics.launchBall();
        return true;
    }

    handleWin(multiplier, index) {
        const winAmount = gameState.currentBet * multiplier;
        gameState.balance += winAmount;

        this.ui.updateBalance();
        this.ui.highlightSlot(index);

        if (multiplier >= 1) SoundManager.playWin();
        else SoundManager.playSlot();

        this.ui.showFloatingPrize(winAmount, multiplier);
    }

    toggleAutoMode(isAuto) {
        if (gameState.isAutoMode === isAuto) return;
        gameState.isAutoMode = isAuto;
        this.ui.toggleAutoUI(isAuto);
        if (!isAuto) this.stopAutoplay();
    }

    startAutoplay() {
        const count = this.ui.getAutoCount();
        gameState.autoplayRemaining = count === 0 ? Infinity : count;

        this.ui.showStopBtn();
        this.ui.setControlsDisabled(true);

        if (gameState.autoplayInterval) clearInterval(gameState.autoplayInterval);

        gameState.autoplayInterval = setInterval(() => {
            if (gameState.autoplayRemaining <= 0) {
                this.stopAutoplay();
                return;
            }
            if (this.launchBall()) {
                gameState.autoplayRemaining--;
            }
        }, config.autoPlaySpeed);
    }

    stopAutoplay() {
        if (gameState.autoplayInterval) {
            clearInterval(gameState.autoplayInterval);
            gameState.autoplayInterval = null;
        }
        this.ui.hideStopBtn();
        this.ui.setControlsDisabled(false);
    }

    adjustBet(dir) {
        if (dir > 0 && gameState.currentBet < config.maxBet) {
            gameState.currentBet += config.betStep;
        } else if (dir < 0 && gameState.currentBet > config.minBet) {
            gameState.currentBet -= config.betStep;
        }
        this.ui.updateBet();
    }

    setMinMaxBet(isMin) {
        gameState.currentBet = isMin ? config.minBet : config.maxBet;
        this.ui.updateBet();
    }

    resetBalance() {
        if (confirm("¿Reset 1000€?")) {
            gameState.balance = 1000;
            this.ui.updateBalance();
        }
    }

    toggleSound(e) {
        SoundManager.enabled = !SoundManager.enabled;
        e.target.textContent = SoundManager.enabled ? '🔊' : '🔇';
    }

    changeRows(rows) {
        gameState.rows = rows;
        this.physics.createPyramid();
        this.ui.renderMultipliers();
    }
}

// Iniciar juego
new Game();
