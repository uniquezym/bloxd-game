const io = require('socket.io');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);

// 加载真实server的常量
const CONSTANTS = require('./shared/constants');

// 用真实server代码逻辑测试
const rooms = new Map();

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

class Room {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = new Map();
        this.gameState = 'waiting';
    }
    
    markDisconnected(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            player.isReconnecting = true;
            player.disconnectedAt = Date.now();
        }
    }
    
    getReconnectingPlayer(playerId) {
        for (const [socketId, player] of this.players) {
            if (player.playerId === playerId && player.isReconnecting) {
                return { socketId, player };
            }
        }
        return null;
    }
    
    removePlayer(socketId) {
        this.players.delete(socketId);
    }
}

const ioObj = new io.Server(server, { cors: { origin: '*' } });

ioObj.on('connection', (socket) => {
    let currentRoom = null;
    let playerId = null;
    
    socket.on('create_room', () => {
        const roomCode = generateRoomCode();
        const room = new Room(roomCode, socket.id);
        rooms.set(roomCode, room);
        
        playerId = 'player_1';
        room.players.set(socket.id, {
            socketId: socket.id,
            playerId,
            x: 100, y: 500,
            color: '#7c7cff',
            ready: true,
            isReconnecting: false
        });
        currentRoom = roomCode;
        
        socket.emit('room_created', { roomCode, playerId, isHost: true });
        console.log('[Server] Room created:', roomCode, 'by', playerId);
    });
    
    socket.on('join_room', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        playerId = 'player_' + (room.players.size + 1);
        room.players.set(socket.id, {
            socketId: socket.id,
            playerId,
            x: 100 + room.players.size * 50,
            y: 500,
            color: ['#ff7c7c', '#7cff7c'][room.players.size - 1] || '#ffff7c',
            ready: false,
            isReconnecting: false
        });
        currentRoom = roomCode;
        
        const players = [];
        room.players.forEach(p => players.push(p));
        
        socket.emit('room_joined', { roomCode, playerId, isHost: false, players });
        console.log('[Server]', playerId, 'joined room', roomCode);
    });
    
    socket.on('disconnect', () => {
        console.log('[Server] Player disconnected:', playerId || socket.id);
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room && room.players.has(socket.id)) {
                room.markDisconnected(socket.id);
                socket.to(currentRoom).emit('player_disconnected', { socketId: socket.id, playerId });
                console.log('[Server]', playerId, 'marked as disconnected in room', currentRoom);
            }
        }
    });
    
    socket.on('rejoin_room', ({ playerId: reconnectPlayerId }) => {
        console.log('[Server] Rejoin request for', reconnectPlayerId);
        
        for (const [roomCode, room] of rooms) {
            const found = room.getReconnectingPlayer(reconnectPlayerId);
            if (found) {
                const oldSocketId = found.socketId;
                const playerData = found.player;
                
                room.removePlayer(oldSocketId);
                
                playerData.socketId = socket.id;
                playerData.isReconnecting = false;
                room.players.set(socket.id, playerData);
                
                currentRoom = roomCode;
                playerId = reconnectPlayerId;
                
                const players = [];
                room.players.forEach(p => players.push(p));
                
                socket.emit('room_rejoined', {
                    roomCode, playerId, isHost: room.hostId === socket.id,
                    players, gameState: room.gameState
                });
                socket.to(roomCode).emit('player_rejoined', { socketId: socket.id, playerId: reconnectPlayerId });
                
                console.log('[Server] ✅ Player', reconnectPlayerId, 'rejoined room', roomCode);
                return;
            }
        }
        
        socket.emit('error', { message: 'No session to rejoin' });
        console.log('[Server] ❌ No session to rejoin for', reconnectPlayerId);
    });
});

// 启动测试服务器
server.listen(3457, async () => {
    console.log('Test server running on 3457');
    
    // 等待server启动
    await new Promise(r => setTimeout(r, 300));
    
    const client1 = require('socket.io-client')('http://localhost:3457');
    const client2 = require('socket.io-client')('http://localhost:3457');
    
    let client1PlayerId = null;
    let client2PlayerId = null;
    let roomCode = null;
    
    // Client 1 创建房间
    await new Promise(res => {
        client1.on('connect', () => {
            console.log('\n[Client1] Connected');
            client1.emit('create_room');
        });
        client1.on('room_created', (data) => {
            console.log('[Client1] Room created:', data.roomCode, data.playerId);
            roomCode = data.roomCode;
            client1PlayerId = data.playerId;
            res();
        });
    });
    
    await new Promise(r => setTimeout(r, 200));
    
    // Client 2 加入房间
    await new Promise(res => {
        client2.on('connect', () => {
            console.log('[Client2] Connected');
            client2.emit('join_room', { roomCode });
        });
        client2.on('room_joined', (data) => {
            console.log('[Client2] Joined room:', data.roomCode, data.playerId);
            client2PlayerId = data.playerId;
            res();
        });
    });
    
    await new Promise(r => setTimeout(r, 200));
    console.log('\n[State] Room has 2 players:', client1PlayerId, '&', client2PlayerId);
    
    // Client 2 断开模拟掉线
    console.log('\n[Action] Client2 simulating disconnect...');
    client2.disconnect();
    await new Promise(r => setTimeout(r, 500));
    
    // Client 2 用新连接重连
    console.log('[Action] Client2 reconnecting with saved playerId:', client2PlayerId);
    const client2New = require('socket.io-client')('http://localhost:3457');
    
    await new Promise(res => {
        client2New.on('connect', () => {
            console.log('[Client2-New] Connected, attempting rejoin...');
            client2New.emit('rejoin_room', { playerId: client2PlayerId });
        });
        
        client2New.on('room_rejoined', (data) => {
            console.log('[Client2-New] ✅ Rejoin success! Room:', data.roomCode, 'Player:', data.playerId);
            res();
        });
        
        client2New.on('error', (data) => {
            console.log('[Client2-New] ❌ Rejoin failed:', data.message);
            res();
        });
    });
    
    await new Promise(r => setTimeout(r, 200));
    console.log('\n=== Test Complete ===');
    
    client1.disconnect();
    client2New.disconnect();
    server.close();
    process.exit(0);
});
