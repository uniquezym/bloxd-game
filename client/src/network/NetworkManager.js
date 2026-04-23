// 网络管理器
class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.roomCode = null;
        this.playerId = null;
        this.players = new Map();
    }

    // 提供 events 接口以兼容 this.network.events.on()
    get events() {
        return this.game.events;
    }

    connect(serverUrl, port) {
        return new Promise((resolve, reject) => {
            const url = serverUrl || `http://localhost:${port}`;
            this.socket = io(url, {
                transports: ['websocket', 'polling']
            });

            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.connected = true;
                this.setupListeners();
                resolve();
            });

            this.socket.on('connect_error', (err) => {
                console.error('Connection error:', err);
                this.connected = false;
                reject(err);
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.connected = false;
                this.game.events.emit('disconnected');
            });
        });
    }

    setupListeners() {
        const socket = this.socket;

        socket.on('room_created', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = data.playerId;
            this.game.events.emit('room_created', data);
        });

        socket.on('room_joined', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = data.playerId;
            this.game.events.emit('room_joined', data);
        });

        socket.on('player_joined', (data) => {
            this.players.set(data.playerId, data);
            this.game.events.emit('player_joined', data);
        });

        socket.on('player_left', (data) => {
            this.players.delete(data.playerId);
            this.game.events.emit('player_left', data);
        });

        socket.on('game_state', (data) => {
            this.game.events.emit('game_state', data);
        });

        socket.on('game_start', (data) => {
            this.game.events.emit('game_start', data);
        });

        socket.on('error', (data) => {
            this.game.events.emit('error', data);
        });
    }

    createRoom() {
        if (this.connected) {
            this.socket.emit('create_room');
        }
    }

    joinRoom(roomCode) {
        if (this.connected) {
            this.socket.emit('join_room', { roomCode: roomCode.toUpperCase() });
        }
    }

    leaveRoom() {
        if (this.connected) {
            this.socket.emit('leave_room');
            this.roomCode = null;
            this.players.clear();
        }
    }

    sendInput(inputState) {
        if (this.connected && this.roomCode) {
            this.socket.emit('player_input', {
                roomCode: this.roomCode,
                ...inputState
            });
        }
    }

    sendPosition(position) {
        if (this.connected && this.roomCode) {
            this.socket.emit('player_position', {
                roomCode: this.roomCode,
                x: position.x,
                y: position.y,
                vx: position.vx,
                vy: position.vy
            });
        }
    }

    getPlayers() {
        return Array.from(this.players.values());
    }
}

// 导出给全局使用
window.NetworkManager = NetworkManager;
