// Bloxd Game - Main Entry Point
// Multiplayer Parkour Browser Game

// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [PreloadScene, MenuScene, LevelScene, GameScene]
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 游戏初始化完成后
game.events.on('READY', () => {
    console.log('Bloxd Game Initialized');
});

// 暴露到全局
window.game = game;
