import { gameState, MULTIPLIERS_DATA } from '../core/GameState';

export default class UIManager {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.initElements();
    this.setupListeners();
  }

  initElements() {
    this.elements = {
      balance: document.getElementById('balance'),
      betAmount: document.getElementById('betAmount'),
      multipliersContainer: document.getElementById('multipliersContainer'),
      launchBtn: document.getElementById('launchBtn'),
      modeManual: document.getElementById('modeManual'),
      modeAuto: document.getElementById('modeAuto'),
      autoCountSelect: document.getElementById('autoCountSelect'),
      stopAutoplay: document.getElementById('stopAutoplay'),
      increaseBet: document.getElementById('increaseBet'),
      decreaseBet: document.getElementById('decreaseBet'),
      minBetBtn: document.getElementById('minBetBtn'),
      maxBetBtn: document.getElementById('maxBetBtn'),
      resetBalance: document.getElementById('resetBalance'),
      soundToggle: document.getElementById('soundToggle'),
      lineBtns: document.querySelectorAll('.line-btn')
    };
  }

  setupListeners() {
    this.elements.launchBtn.addEventListener('click', () => this.callbacks.onLaunch());
    this.elements.modeManual.addEventListener('click', () => this.callbacks.onToggleMode(false));
    this.elements.modeAuto.addEventListener('click', () => this.callbacks.onToggleMode(true));
    this.elements.stopAutoplay.addEventListener('click', () => this.callbacks.onStopAuto());

    this.elements.increaseBet.addEventListener('click', () => this.callbacks.onAdjustBet(1));
    this.elements.decreaseBet.addEventListener('click', () => this.callbacks.onAdjustBet(-1));

    if (this.elements.minBetBtn) {
      this.elements.minBetBtn.addEventListener('click', () => this.callbacks.onSetMinMaxBet(true));
    }
    if (this.elements.maxBetBtn) {
      this.elements.maxBetBtn.addEventListener('click', () => this.callbacks.onSetMinMaxBet(false));
    }

    this.elements.resetBalance.addEventListener('click', () => this.callbacks.onResetBalance());
    this.elements.soundToggle.addEventListener('click', (e) => this.callbacks.onToggleSound(e));

    this.elements.lineBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.elements.lineBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.callbacks.onChangeRows(parseInt(e.target.dataset.rows));
      });
    });

    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.callbacks.onResize(), 200);
    });
  }

  updateBalance() {
    this.elements.balance.textContent = gameState.balance.toFixed(0) + '€';
  }

  updateBet() {
    this.elements.betAmount.textContent = gameState.currentBet + '€';
  }

  renderMultipliers() {
    this.elements.multipliersContainer.innerHTML = '';
    const multipliers = MULTIPLIERS_DATA[gameState.rows];

    multipliers.forEach((m, i) => {
      const div = document.createElement('div');
      div.className = 'multiplier';
      if (m >= 100) div.classList.add('jackpot');
      else if (m >= 10) div.classList.add('high');
      else if (m < 1) div.classList.add('lose');

      div.textContent = m + 'x';
      div.dataset.index = i;
      this.elements.multipliersContainer.appendChild(div);
    });
  }

  highlightSlot(index) {
    const slots = this.elements.multipliersContainer.querySelectorAll('.multiplier');
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

  showFloatingPrize(profit, multiplier) {
    const rect = this.elements.balance.getBoundingClientRect();
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-prize';

    if (multiplier >= 1) {
      floatEl.textContent = `+${profit.toFixed(1)}€`;
      floatEl.classList.add('win');
    } else {
      floatEl.textContent = `+${profit.toFixed(1)}€`;
      floatEl.classList.add('lose');
    }

    floatEl.style.left = (rect.left - 70) + 'px';
    floatEl.style.top = (rect.top - 10) + 'px';

    document.body.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1500);
  }

  toggleAutoUI(isAuto) {
    if (isAuto) {
      this.elements.modeManual.classList.remove('active');
      this.elements.modeAuto.classList.add('active');
      this.elements.autoCountSelect.classList.remove('hidden');
    } else {
      this.elements.modeAuto.classList.remove('active');
      this.elements.modeManual.classList.add('active');
      this.elements.autoCountSelect.classList.add('hidden');
      this.elements.stopAutoplay.classList.add('hidden');
      this.setControlsDisabled(false);
    }
  }

  setControlsDisabled(disabled) {
    const controls = [
      this.elements.increaseBet,
      this.elements.decreaseBet,
      this.elements.modeManual,
      this.elements.modeAuto
    ];

    controls.forEach(el => {
      if (el) {
        if (disabled) el.classList.add('disabled-control');
        else el.classList.remove('disabled-control');
      }
    });

    this.elements.lineBtns.forEach(btn => {
      if (disabled) btn.classList.add('disabled-control');
      else btn.classList.remove('disabled-control');
    });
  }

  showStopBtn() {
    this.elements.stopAutoplay.classList.remove('hidden');
  }

  hideStopBtn() {
    this.elements.stopAutoplay.classList.add('hidden');
  }

  getAutoCount() {
    return parseInt(this.elements.autoCountSelect.value);
  }
}
