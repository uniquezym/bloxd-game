// 共享常量
const CONSTANTS = {
  // 游戏配置
  TILE_SIZE: 32,
  GRAVITY: 800,
  PLAYER_SPEED: 200,
  JUMP_FORCE: 400,

  // 物理配置
  PLAYER_WIDTH: 28,
  PLAYER_HEIGHT: 28,

  // 房间配置
  MAX_PLAYERS_PER_ROOM: 8,
  ROOM_CODE_LENGTH: 6,

  // 网络配置
  TICK_RATE: 60,
  SYNC_INTERVAL: 1000 / 60,

  // 消息类型
  MSG_TYPES: {
    // 客户端 -> 服务器
    CREATE_ROOM: 'create_room',
    JOIN_ROOM: 'join_room',
    LEAVE_ROOM: 'leave_room',
    PLAYER_INPUT: 'player_input',
    PLAYER_READY: 'player_ready',
    KICK_PLAYER: 'kick_player',
    CHAT_MESSAGE: 'chat_message',

    // 服务器 -> 客户端
    ROOM_CREATED: 'room_created',
    ROOM_JOINED: 'room_joined',
    PLAYER_JOINED: 'player_joined',
    PLAYER_LEFT: 'player_left',
    PLAYER_READY_STATE: 'player_ready_state',
    PLAYER_KICKED: 'player_kicked',
    GAME_STATE: 'game_state',
    GAME_START: 'game_start',
    GAME_OVER: 'game_over',
    ERROR: 'error'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTS;
}
