// Bloxd Game Server
// Node.js + Socket.io 多人游戏服务器

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const CONSTANTS = require('../shared/constants');

const app = express();
const path = require('path');

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client')));

// 路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// 房间管理
const rooms = new Map();

// 生成房间码
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < CONSTANTS.ROOM_CODE_LENGTH; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 房间类
class Room {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = new Map();
        this.gameState = 'waiting'; // waiting, playing, finished
        this.createdAt = Date.now();
    }

    addPlayer(socketId, playerData) {
        this.players.set(socketId, {
            socketId,
            playerId: playerData.playerId || `player_${this.players.size + 1}`,
            x: 100 + this.players.size * 50,
            y: 500,
            vx: 0,
            vy: 0,
            input: { left: false, right: false, jump: false },
            color: this.getPlayerColor(this.players.size)
        });
    }

    getPlayerColor(index) {
        const colors = ['#7c7cff', '#ff7c7c', '#7cff7c', '#ffff7c', '#ff7cff', '#7cffff'];
        return colors[index % colors.length];
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
    }

    updatePlayer(socketId, data) {
        const player = this.players.get(socketId);
        if (player) {
            if (data.x !== undefined) player.x = data.x;
            if (data.y !== undefined) player.y = data.y;
            if (data.vx !== undefined) player.vx = data.vx;
            if (data.vy !== undefined) player.vy = data.vy;
            if (data.input) player.input = data.input;
        }
    }

    getPlayersData() {
        const data = {};
        this.players.forEach((player, socketId) => {
            data[player.playerId] = {
                x: player.x,
                y: player.y,
                vx: player.vx,
                vy: player.vy
            };
        });
        return data;
    }

    isEmpty() {
        return this.players.size === 0;
    }
}

// Socket.io 连接处理
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    let currentRoom = null;
    let playerId = null;

    // 创建房间
    socket.on(CONSTANTS.MSG_TYPES.CREATE_ROOM, () => {
        const roomCode = generateRoomCode();
        const room = new Room(roomCode, socket.id);
        rooms.set(roomCode, room);

        playerId = `player_1`;
        room.addPlayer(socket.id, { playerId });
        currentRoom = roomCode;

        socket.join(roomCode);
        socket.emit(CONSTANTS.MSG_TYPES.ROOM_CREATED, {
            roomCode,
            playerId,
            isHost: true
        });

        console.log(`Room created: ${roomCode} by ${socket.id}`);
    });

    // 加入房间
    socket.on(CONSTANTS.MSG_TYPES.JOIN_ROOM, ({ roomCode }) => {
        roomCode = roomCode.toUpperCase();
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit(CONSTANTS.MSG_TYPES.ERROR, { message: 'Room not found' });
            return;
        }

        if (room.players.size >= CONSTANTS.MAX_PLAYERS_PER_ROOM) {
            socket.emit(CONSTANTS.MSG_TYPES.ERROR, { message: 'Room is full' });
            return;
        }

        playerId = `player_${room.players.size + 1}`;
        room.addPlayer(socket.id, { playerId });
        currentRoom = roomCode;

        socket.join(roomCode);
        socket.emit(CONSTANTS.MSG_TYPES.ROOM_JOINED, {
            roomCode,
            playerId,
            isHost: room.hostId === socket.id,
            players: Array.from(room.players.values())
        });

        // 通知房间内其他玩家
        socket.to(roomCode).emit(CONSTANTS.MSG_TYPES.PLAYER_JOINED, {
            playerId,
            socketId: socket.id
        });

        console.log(`Player ${playerId} joined room ${roomCode}`);
    });

    // 离开房间
    socket.on(CONSTANTS.MSG_TYPES.LEAVE_ROOM, () => {
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.removePlayer(socket.id);
                socket.to(currentRoom).emit(CONSTANTS.MSG_TYPES.PLAYER_LEFT, {
                    socketId: socket.id,
                    playerId
                });

                // 如果房间空了，删除
                if (room.isEmpty()) {
                    rooms.delete(currentRoom);
                    console.log(`Room ${currentRoom} deleted (empty)`);
                }
            }
            socket.leave(currentRoom);
            currentRoom = null;
        }
    });

    // 玩家输入
    socket.on(CONSTANTS.MSG_TYPES.PLAYER_INPUT, (input) => {
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.updatePlayer(socket.id, { input });
            }
        }
    });

    // 玩家位置更新
    socket.on('player_position', (data) => {
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.updatePlayer(socket.id, data);
            }
        }
    });

    // 断开连接
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.removePlayer(socket.id);
                socket.to(currentRoom).emit(CONSTANTS.MSG_TYPES.PLAYER_LEFT, {
                    socketId: socket.id,
                    playerId
                });

                if (room.isEmpty()) {
                    rooms.delete(currentRoom);
                    console.log(`Room ${currentRoom} deleted (empty)`);
                }
            }
        }
    });
});

// 游戏状态广播 (60fps)
setInterval(() => {
    rooms.forEach((room, roomCode) => {
        if (room.players.size > 0) {
            io.to(roomCode).emit(CONSTANTS.MSG_TYPES.GAME_STATE, {
                players: room.getPlayersData()
            });
        }
    });
}, 1000 / CONSTANTS.TICK_RATE);

// 清理空房间
setInterval(() => {
    rooms.forEach((room, code) => {
        if (room.isEmpty()) {
            rooms.delete(code);
        }
    });
}, 60000);

// 启动服务器
const PORT = process.env.PORT || process.env.SERVER_PORT || CONSTANTS.SERVER_PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║         BLOXD GAME SERVER             ║
║       Multiplayer Parkour v1.0         ║
╠═══════════════════════════════════════╣
║  Server running on port ${PORT}           ║
║  LAN access: http://<YOUR_IP>:${PORT}      ║
╚═══════════════════════════════════════╝
    `);
});
