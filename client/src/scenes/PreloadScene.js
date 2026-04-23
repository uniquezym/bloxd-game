// 预加载场景 - 创建游戏所需纹理
class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        this.createTextures();
    }

    create() {
        this.scene.start('MenuScene');
    }

    createTextures() {
        const T = 32; // TILE_SIZE

        // 创建玩家纹理
        const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        playerGraphics.fillStyle(0x7c7cff);
        playerGraphics.fillRoundedRect(0, 0, 28, 28, 4);
        playerGraphics.fillStyle(0x5a5acc);
        playerGraphics.fillRoundedRect(4, 4, 8, 8, 2); // 眼睛
        playerGraphics.fillRoundedRect(16, 4, 8, 8, 2);
        playerGraphics.generateTexture('player', 28, 28);
        playerGraphics.destroy();

        // 创建地面纹理
        const groundGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        groundGraphics.fillStyle(0x4a7c59);
        groundGraphics.fillRect(0, 0, T, T);
        groundGraphics.fillStyle(0x3a6c49);
        groundGraphics.fillRect(2, 2, T - 4, T - 4);
        // 草地纹理
        groundGraphics.fillStyle(0x5a8c69);
        for (let i = 0; i < 3; i++) {
            groundGraphics.fillRect(i * 10 + 3, 4, 4, 6);
        }
        groundGraphics.generateTexture('ground', T, T);
        groundGraphics.destroy();

        // 创建平台纹理 (木头)
        const platformGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        platformGraphics.fillStyle(0x8B4513);
        platformGraphics.fillRect(0, 0, T, T);
        // 木纹
        platformGraphics.fillStyle(0x6B3513);
        platformGraphics.fillRect(0, T/3, T, 2);
        platformGraphics.fillRect(0, 2*T/3, T, 2);
        platformGraphics.generateTexture('platform', T, T);
        platformGraphics.destroy();

        // 创建终点纹理
        const finishGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        finishGraphics.fillStyle(0xFFD700);
        finishGraphics.fillRect(0, 0, T, T);
        finishGraphics.fillStyle(0xFFA500);
        finishGraphics.fillRect(4, 4, T - 8, T - 8);
        // 星星图案
        finishGraphics.fillStyle(0xFFFF00);
        finishGraphics.fillCircle(T/2, T/2, 6);
        finishGraphics.generateTexture('finish', T, T);
        finishGraphics.destroy();

        // 创建危险物纹理 (钉子)
        const dangerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        dangerGraphics.fillStyle(0xff4444);
        dangerGraphics.fillRect(0, 0, T, T);
        dangerGraphics.fillStyle(0xcc0000);
        dangerGraphics.fillTriangle(T/2, 4, 4, T-4, T-4, T-4);
        dangerGraphics.generateTexture('danger', T, T);
        dangerGraphics.destroy();

        // 创建金币纹理
        const coinGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        coinGraphics.fillStyle(0xFFD700);
        coinGraphics.fillCircle(12, 12, 10);
        coinGraphics.fillStyle(0xFFA500);
        coinGraphics.fillCircle(12, 12, 6);
        coinGraphics.fillStyle(0xFFFF00);
        coinGraphics.fillCircle(10, 10, 3);
        coinGraphics.generateTexture('coin', 24, 24);
        coinGraphics.destroy();

        // 创建移动平台纹理
        const movingPlatformGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        movingPlatformGraphics.fillStyle(0x6a5acd);
        movingPlatformGraphics.fillRect(0, 0, T, T);
        movingPlatformGraphics.fillStyle(0x5a4abd);
        movingPlatformGraphics.fillRect(2, 2, T - 4, T - 4);
        movingPlatformGraphics.fillStyle(0x8a7aed);
        movingPlatformGraphics.fillRect(4, T/2 - 1, T - 8, 2);
        movingPlatformGraphics.generateTexture('moving_platform', T, T);
        movingPlatformGraphics.destroy();

        // 创建弹跳垫纹理
        const bounceGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        bounceGraphics.fillStyle(0x00cc00);
        bounceGraphics.fillRoundedRect(0, 0, 48, 16, 4);
        bounceGraphics.fillStyle(0x00ff00);
        bounceGraphics.fillRoundedRect(4, 2, 40, 8, 2);
        bounceGraphics.fillStyle(0xffff00);
        bounceGraphics.fillRect(16, 4, 4, 4);
        bounceGraphics.fillRect(28, 4, 4, 4);
        bounceGraphics.generateTexture('bounce', 48, 16);
        bounceGraphics.destroy();
    }
}

// 更新 game.js 以使用预加载场景
