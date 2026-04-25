// 网络管理器
class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.roomCode = null;
        this.playerId = null;
        this.players = new Map();
        
        // 重连相关
        this._savedPlayerId = null;
        this._savedRoomCode = null;
        this._reconnectAttempts = 0;
        this._maxReconnectAttempts = 5;
        this._reconnectDelay = 1000;
        this._reconnectTimer = null;
        this._isReconnecting = false;
        
        // Ping相关
        this._pingInterval = null;
        this._lastPingTime = 0;
        this._ping = null;
    }

    // 提供 events 接口以兼容 this.network.events.on()
    get events() {
        return this._events || (this._events = new Map());
    }

    _emit(event, data) {
        const handlers = this.events.get(event) || [];
        handlers.forEach(h => h(data));
    }
    
    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(handler);
    }

    off(event, handler) {
        const handlers = this.events.get(event) || [];
        const idx = handlers.indexOf(handler);
        if (idx > -1) handlers.splice(idx, 1);
    }

    connect(serverUrl, port) {
        return new Promise((resolve, reject) => {
            const url = serverUrl || `http://localhost:${port}`;
            
            // 清除旧socket
            if (this.socket) {
                this.socket.removeAllListeners();
                if (this.socket.connected) {
                    this.socket.disconnect();
                }
            }

            this.socket = io(url, {
                transports: ['websocket', 'polling'],
                reconnection: false  // 我们自己控制重连
            });

            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.connected = true;
                this._reconnectAttempts = 0;
                this.setupListeners();
                
                // 如果之前有保存的会话信息，尝试恢复
                if (this._savedPlayerId && this._savedRoomCode && this._isReconnecting) {
                    this._attemptRejoin();
                } else {
                    this._startPingLoop();
                    resolve();
                }
            });

            this.socket.on('connect_error', (err) => {
                console.error('Connection error:', err);
                this.connected = false;
                this._isReconnecting = true;
                this._scheduleReconnect(serverUrl, port, reject);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Disconnected from server:', reason);
                this.connected = false;
                this._stopPingLoop();
                
                // 保留会话信息，准备重连
                if (this.playerId) {
                    this._savedPlayerId = this.playerId;
                    this._savedRoomCode = this.roomCode;
                }
                
                this._emit('disconnected', { reason });
                
                // 如果是正常离开，不重连
                if (reason === 'io client disconnect') {
                    return;
                }
                
                // 自动重连
                this._isReconnecting = true;
                this._scheduleReconnect(url.replace(/:\d+$/, ''), port, null);
            });
        });
    }
    
    _scheduleReconnect(url, port, originalReject) {
        if (this._reconnectAttempts >= this._maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            this._isReconnecting = false;
            this._emit('reconnect_failed', {});
            if (originalReject) originalReject(new Error('Max reconnect attempts'));
            return;
        }
        
        const delay = this._reconnectDelay * Math.pow(2, this._reconnectAttempts);
        console.log(`Reconnecting in ${delay}ms... (attempt ${this._reconnectAttempts + 1}/${this._maxReconnectAttempts})`);
        this._emit('reconnecting', { attempt: this._reconnectAttempts + 1, delay });
        
        this._reconnectTimer = setTimeout(() => {
            this._reconnectAttempts++;
            this.connect(url, port).catch(() => {
                // 重连失败，等待下一次
            });
        }, delay);
    }
    
    _attemptRejoin() {
        if (!this._savedPlayerId || !this._savedRoomCode) {
            this._startPingLoop();
            return;
        }
        
        console.log(`Attempting to rejoin as ${this._savedPlayerId} in room ${this._savedRoomCode}`);
        this._emit('rejoin_attempt', { playerId: this._savedPlayerId, roomCode: this._savedRoomCode });
        
        this.socket.emit('rejoin_room', {
            playerId: this._savedPlayerId,
            roomCode: this._savedRoomCode
        });
    }
    
    _startPingLoop() {
        this._stopPingLoop();
        this._pingInterval = setInterval(() => {
            if (this.connected && this.socket) {
                this._lastPingTime = Date.now();
                this.socket.emit('ping', this._lastPingTime);
            }
        }, 3000);
    }
    
    _stopPingLoop() {
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
            this._pingInterval = null;
        }
    }

    setupListeners() {
        const socket = this.socket;

        socket.on('room_created', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = data.playerId;
            this._savedPlayerId = data.playerId;
            this._savedRoomCode = data.roomCode;
            this._isReconnecting = false;
            this._emit('room_created', data);
        });

        socket.on('room_joined', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = data.playerId;
            this._savedPlayerId = data.playerId;
            this._savedRoomCode = data.roomCode;
            this._isReconnecting = false;
            this._emit('room_joined', data);
        });
        
        // 重连成功
        socket.on('room_rejoined', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = data.playerId;
            this._savedPlayerId = data.playerId;
            this._savedRoomCode = data.roomCode;
            this._isReconnecting = false;
            this._reconnectAttempts = 0;
            this._emit('room_rejoined', data);
        });

        socket.on('player_joined', (data) => {
            this.players.set(data.playerId, data);
            this._emit('player_joined', data);
        });

        socket.on('player_left', (data) => {
            this.players.delete(data.playerId);
            this._emit('player_left', data);
        });
        
        // 玩家断线（其他人）
        socket.on('player_disconnected', (data) => {
            this._emit('player_disconnected', data);
        });
        
        // 玩家重连成功（其他人）
        socket.on('player_rejoined', (data) => {
            this._emit('player_rejoined', data);
        });

        socket.on('game_state', (data) => {
            this._emit('game_state', data);
        });

        socket.on('game_start', (data) => {
            this._emit('game_start', data);
        });
        
        // Pong响应
        socket.on('pong', (data) => {
            if (this._lastPingTime > 0) {
                this._ping = Date.now() - this._lastPingTime;
                this._emit('ping_update', { ping: this._ping });
            }
        });

        socket.on('error', (data) => {
            // 重连时如果房间已不存在，不算错误
            if (data.message === 'No session to rejoin') {
                this._savedPlayerId = null;
                this._savedRoomCode = null;
                this._isReconnecting = false;
            }
            this._emit('error', data);
        });
    }

    createRoom(playerName) {
        if (this.connected) {
            this._savedPlayerId = null;
            this._savedRoomCode = null;
            this._isReconnecting = false;
            this.socket.emit('create_room', { playerName });
            // 保存名字
            try { localStorage.setItem('bloxd_player_name', playerName || 'Anonymous'); } catch (e) {}
        }
    }

    joinRoom(roomCode, playerName) {
        if (this.connected) {
            this._savedPlayerId = null;
            this._savedRoomCode = null;
            this._isReconnecting = false;
            this.socket.emit('join_room', { roomCode: roomCode.toUpperCase(), playerName });
            try { localStorage.setItem('bloxd_player_name', playerName || 'Anonymous'); } catch (e) {}
        }
    }

    leaveRoom() {
        if (this.connected) {
            this.socket.emit('leave_room');
            this.roomCode = null;
            this.playerId = null;
            this.players.clear();
            this._savedPlayerId = null;
            this._savedRoomCode = null;
            this._isReconnecting = false;
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
    
    getPing() {
        return this._ping;
    }
    
    get isReconnecting() {
        return this._isReconnecting;
    }
    
    get savedSession() {
        return {
            playerId: this._savedPlayerId,
            roomCode: this._savedRoomCode
        };
    }
}

// 导出给全局使用
window.NetworkManager = NetworkManager;