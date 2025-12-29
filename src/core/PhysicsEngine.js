import Matter from 'matter-js';
import { MULTIPLIERS_DATA, gameState } from './GameState';

const { Engine, Render, Runner, World, Bodies, Events, Body } = Matter;

export default class PhysicsEngine {
  constructor(canvas, onWin) {
    this.canvas = canvas;
    this.onWin = onWin;
    this.engine = Engine.create();
    this.world = this.engine.world;
    this.world.gravity.y = 1.2;

    this.render = Render.create({
      canvas: this.canvas,
      engine: this.engine,
      options: {
        width: 100,
        height: 100,
        wireframes: false,
        background: 'transparent'
      }
    });

    Render.run(this.render);
    this.runner = Runner.create();
    Runner.run(this.runner, this.engine);

    this.setupEvents();
  }

  setupEvents() {
    Events.on(this.engine, 'afterUpdate', () => {
      const ballsToRemove = [];
      gameState.activeBalls.forEach(ball => {
        if (ball.position.y > this.render.options.height + 50) {
          const multipliers = MULTIPLIERS_DATA[gameState.rows];
          const slotCount = multipliers.length;
          const safeWidth = this.width * 0.95;
          const startX = (this.width - safeWidth) / 2;
          const relX = ball.position.x - startX;
          const slotWidth = safeWidth / slotCount;

          let index = Math.floor(relX / slotWidth);
          index = Math.max(0, Math.min(slotCount - 1, index));

          this.onWin(multipliers[index], index);
          ballsToRemove.push(ball);
        }
      });

      ballsToRemove.forEach(ball => {
        World.remove(this.world, ball);
        gameState.activeBalls.delete(ball);
      });
    });
  }

  createPyramid() {
    World.clear(this.world);
    const container = this.canvas.parentElement;
    this.width = container.offsetWidth;
    this.height = container.offsetHeight;

    this.render.canvas.width = this.width;
    this.render.canvas.height = this.height;
    this.render.options.width = this.width;
    this.render.options.height = this.height;

    const wallOptions = { isStatic: true, render: { visible: false } };
    World.add(this.world, [
      Bodies.rectangle(-20, this.height / 2, 40, this.height * 2, wallOptions),
      Bodies.rectangle(this.width + 20, this.height / 2, 40, this.height * 2, wallOptions)
    ]);

    const rows = gameState.rows;
    const pinRadius = Math.max(2, this.width / 140);
    const bottomWidth = this.width * 0.95;
    const pyramidHeight = this.height * 0.65;
    const startY = this.height * 0.15;
    const spacingY = pyramidHeight / rows;

    for (let i = 0; i < rows; i++) {
      const rowPins = 3 + i;
      const currentRowWidth = (rowPins - 1) * (bottomWidth / (rows + 2));
      const startX = (this.width - currentRowWidth) / 2;
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
        World.add(this.world, pin);
      }
    }
  }

  launchBall() {
    const bottomWidth = this.width * 0.95;
    const gap = bottomWidth / (gameState.rows + 2);
    const sizeFactor = 0.28;
    const ballRadius = gap * sizeFactor;

    const x = this.width / 2 + (Math.random() - 0.5) * 10;
    const y = 30;

    const ball = Bodies.circle(x, y, ballRadius, {
      restitution: 0.5,
      friction: 0.01,
      frictionAir: 0.03,
      density: 0.002,
      label: 'ball',
      render: { fillStyle: '#ff006e', strokeStyle: '#fff', lineWidth: 2 }
    });

    Body.setVelocity(ball, { x: (Math.random() - 0.5) * 2, y: 0 });
    World.add(this.world, ball);
    gameState.activeBalls.add(ball);
  }
}
