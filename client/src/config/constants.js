// 客户端配置常量
const CONFIG = {
    // 游戏配置
    TILE_SIZE: 32,
    GRAVITY: 800,
    PLAYER_SPEED: 200,
    JUMP_FORCE: 380,

    // 物理配置
    PLAYER_WIDTH: 28,
    PLAYER_HEIGHT: 28,

    // 颜色
    COLORS: {
        SKY: 0x87CEEB,
        GROUND: 0x4a7c59,
        PLAYER: 0x7c7cff,
        PLATFORM: 0x8B4513,
        FINISH: 0xFFD700,
        DANGER: 0xff4444
    },

    // 服务器地址（留空则使用局域网自动发现）
    SERVER_URL: '',
    SERVER_PORT: 3000
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
