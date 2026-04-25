// 联机房间大厅场景
class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
        this.players = new Map();
        this.isHost = false;
        this.isReady = false;
        this.roomCode = null;
        this.playerId = null;
    }

    init(data) {
        this.network = data.network;
        this.roomCode = data.roomCode;
        this.playerId = data.playerId;
        this.isHost = data.isHost || false;
    }

    create() {
        this.createBackground();
        this.setupUI();
        this.setupNetworkEvents();
        this.updatePlayerCount();
    }

    createBackground() {
        const { width, height } = this.scale;

        // 渐变背景
        for (let i = 0; i < height; i += 4) {
            const alpha = 0.1 + (i / height) * 0.1;
            this.add.rectangle(width / 2, i, width, 4, 0x1a1a2e, alpha);
        }

        // 装饰方块
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(20, 50);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.25);
            const rect = this.add.rectangle(x, y, size, size, 0x4a4a6a, alpha);
            rect.setAngle(Phaser.Math.Between(0, 4) * 45);
        }

        // 标题
        this.add.text(this.scale.width / 2, 50, 'Game Lobby', {
            fontSize: '48px',
            fontFamily: 'Arial Black, Arial',
            color: '#7c7cff',
            stroke: '#4a4a6a',
            strokeThickness: 6
        }).setOrigin(0.5);
    }

    setupUI() {
        const { width, height } = this.scale;
        const centerX = width / 2;

        // 返回菜单按钮 (左上角)
        this.backButton = this.add.text(20, 20, '🏠 Return', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fff',
            backgroundColor: '#4a4a6a',
            padding: { x: 15, y: 8 }
        }).setInteractive({ useHandCursor: true });

        this.backButton.on('pointerover', () => this.backButton.setAlpha(0.8));
        this.backButton.on('pointerout', () => this.backButton.setAlpha(1));
        this.backButton.on('pointerdown', () => this.returnToMenu());

        // 房间码显示 (右上角)
        this.roomCodeText = this.add.text(width - 20, 20, `Room: ${this.roomCode || '----'}`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#fff',
            backgroundColor: '#2a2a4a',
            padding: { x: 15, y: 8 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        this.roomCodeText.on('pointerover', () => this.roomCodeText.setAlpha(0.8));
        this.roomCodeText.on('pointerout', () => this.roomCodeText.setAlpha(1));
        this.roomCodeText.on('pointerdown', () => this.copyRoomCode());

        this.copyHint = this.add.text(width - 20, 55, 'Click to copy', {
            fontSize: '12px',
            color: '#888'
        }).setOrigin(1, 0);

        // 玩家列表容器
        this.playerListContainer = this.add.container(centerX, 150);
        this.playerListBg = this.add.rectangle(0, 0, 500, 280, 0x2a2a4a, 0.8);
        this.playerListContainer.add(this.playerListBg);

        // 玩家列表标题
        this.add.text(centerX, 115, 'Players', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#aaa'
        }).setOrigin(0.5);

        // 底部按钮区域
        const buttonY = height - 120;

        // 准备/取消准备按钮
        this.readyButton = this.createButton(centerX - 100, buttonY, '✅ Ready', '#4a7c59', () => this.toggleReady());
        this.unreadyButton = this.createButton(centerX - 100, buttonY, '❌ Cancel', '#ff7c7c', () => this.toggleReady());

        // 开始游戏按钮 (房主可见)
        this.startButton = this.createButton(centerX + 100, buttonY, '🎮 Start Game', '#7c7cff', () => this.startGame());
        this.startButton.setVisible(false);

        // 等待提示 (非房主)
        this.waitingText = this.add.text(centerX + 100, buttonY, 'Waiting for host...', {
            fontSize: '18px',
            color: '#888'
        }).setOrigin(0.5);
        this.waitingText.setVisible(false);

        // 玩家数量
        this.playerCountText = this.add.text(centerX, height - 50, '0/6 players', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#aaa'
        }).setOrigin(0.5);

        // 初始化按钮状态
        this.updateReadyButton();

        // 复制成功提示
        this.copiedText = this.add.text(width / 2, 90, 'Copied!', {
            fontSize: '16px',
            color: '#4a7c59'
        }).setOrigin(0.5).setVisible(false);
    }

    createButton(x, y, text, color, callback) {
        const btn = this.add.text(x, y, text, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fff',
            backgroundColor: color,
            padding: { x: 25, y: 12 },
            borderRadius: 8
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setAlpha(0.8));
        btn.on('pointerout', () => btn.setAlpha(1));
        btn.on('pointerdown', callback);

        return btn;
    }

    setupNetworkEvents() {
        const network = this.network;

        // 监听房间加入
        network.events.on('room_joined', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = data.playerId;
            this.isHost = data.isHost || false;
            this.updateHostUI();
            this.clearPlayers();
            if (data.players) {
                data.players.forEach(p => this.addPlayer(p));
            }
            this.updatePlayerCount();
        });

        // 监听玩家加入
        network.events.on('player_joined', (data) => {
            this.addPlayer(data);
            this.updatePlayerCount();
        });

        // 监听玩家离开
        network.events.on('player_left', (data) => {
            this.removePlayer(data.playerId);
            this.updatePlayerCount();
        });

        // 监听玩家准备状态变化
        network.events.on('player_ready_state', (data) => {
            this.updatePlayerReadyState(data.playerId, data.isReady);
        });

        // 监听玩家被踢
        network.events.on('player_kicked', () => {
            this.showKickedMessage();
        });

        // 监听游戏开始
        network.events.on('game_start', () => {
            this.scene.start('GameScene', {
                isOnline: true,
                roomCode: this.roomCode,
                playerId: this.playerId,
                network: this.network
            });
        });

        // 监听玩家断线（其他人）
        network.events.on('player_disconnected', (data) => {
            this.updatePlayerStatus(data.playerId, 'disconnected');
        });

        // 监听玩家重连（其他人）
        network.events.on('player_rejoined', (data) => {
            this.updatePlayerStatus(data.playerId, 'reconnected');
        });

        // 监听自己重连成功
        network.events.on('room_rejoined', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = data.playerId;
            this.isHost = data.isHost || false;
            this.updateHostUI();
            this.clearPlayers();
            if (data.players) {
                data.players.forEach(p => this.addPlayer(p));
            }
            this.updatePlayerCount();
        });

        // 监听重连状态
        network.events.on('reconnecting', (data) => {
            this.statusText.setText(`重连中... ${data.attempt}/5`);
            this.statusText.setColor('#ffaa00');
        });

        network.events.on('reconnect_failed', () => {
            this.statusText.setText('重连失败，请重新创建房间');
            this.statusText.setColor('#ff6b6b');
        });

        network.events.on('rejoin_attempt', (data) => {
            this.statusText.setText(`正在恢复会话...`);
            this.statusText.setColor('#aaa');
        });
    }

    addPlayer(data) {
        this.players.set(data.playerId, data);
        this.renderPlayerList();
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        this.renderPlayerList();
    }

    clearPlayers() {
        this.players.clear();
        this.renderPlayerList();
    }

    renderPlayerList() {
        // 清除旧的玩家显示
        const container = this.playerListContainer;
        container.each(child => {
            if (child !== this.playerListBg) child.destroy();
        });

        const playerIds = Array.from(this.players.keys());
        const startY = -120;

        playerIds.forEach((playerId, index) => {
            const player = this.players.get(playerId);
            const y = startY + index * 50;
            const isLocalPlayer = playerId === this.playerId;
            const isPlayerHost = player.isHost || false;

            // 玩家行背景
            const rowBg = this.add.rectangle(0, y, 460, 40, 0x3a3a5a, 0.5);
            rowBg.setOrigin(0.5);
            container.add(rowBg);

            // 玩家图标
            const icon = isPlayerHost ? '👑' : '👤';
            const iconText = this.add.text(-200, y, icon, {
                fontSize: '20px'
            }).setOrigin(0.5);
            container.add(iconText);

            // 玩家名称
            const nameColor = isLocalPlayer ? '#7c7cff' : '#fff';
            const nameText = this.add.text(-150, y, player.playerName || player.name || `Player ${playerId.slice(0, 4)}`, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: nameColor
            }).setOrigin(0, 0.5);
            container.add(nameText);

            // Host标签
            if (isPlayerHost) {
                const hostTag = this.add.text(60, y, '(host)', {
                    fontSize: '12px',
                    color: '#ffaa00'
                }).setOrigin(0, 0.5);
                container.add(hostTag);
            }

            // 准备状态
            const readyText = player.isReady ? '✅ Ready' : '⏳ Waiting';
            const readyColor = player.isReady ? '#4a7c59' : '#888';
            const readyLabel = this.add.text(160, y, readyText, {
                fontSize: '14px',
                color: readyColor
            }).setOrigin(0, 0.5);
            container.add(readyLabel);

            // 连接状态标签
            if (player.connectionStatus === 'disconnected') {
                const dcTag = this.add.text(220, y, '🔌 断线', {
                    fontSize: '12px',
                    color: '#ff6b6b'
                }).setOrigin(0, 0.5);
                container.add(dcTag);
            } else if (player.connectionStatus === 'reconnected') {
                const rcTag = this.add.text(220, y, '✅ 已恢复', {
                    fontSize: '12px',
                    color: '#4a7c59'
                }).setOrigin(0, 0.5);
                container.add(rcTag);
                this.time.delayedCall(3000, () => {
                    if (player) player.connectionStatus = null;
                    this.renderPlayerList();
                });
            }

            // 踢人按钮 (仅房主可见，且不是自己)
            if (this.isHost && !isLocalPlayer && !isPlayerHost) {
                const kickBtn = this.add.text(220, y, '✕', {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: '#ff6b6b',
                    backgroundColor: '#3a2a2a',
                    padding: { x: 8, y: 2 }
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });

                kickBtn.on('pointerover', () => kickBtn.setAlpha(0.7));
                kickBtn.on('pointerout', () => kickBtn.setAlpha(1));
                kickBtn.on('pointerdown', () => this.kickPlayer(playerId));
                container.add(kickBtn);
            }
        });
    }

    updatePlayerReadyState(playerId, isReady) {
        const player = this.players.get(playerId);
        if (player) {
            player.isReady = isReady;
            this.renderPlayerList();
        }
    }

    updatePlayerCount() {
        const count = this.players.size;
        this.playerCountText.setText(`${count}/6 players`);
    }

    updateReadyButton() {
        if (this.isReady) {
            this.readyButton.setVisible(false);
            this.unreadyButton.setVisible(true);
        } else {
            this.readyButton.setVisible(true);
            this.unreadyButton.setVisible(false);
        }
    }

    updateHostUI() {
        if (this.isHost) {
            this.startButton.setVisible(true);
            this.waitingText.setVisible(false);
        } else {
            this.startButton.setVisible(false);
            this.waitingText.setVisible(true);
        }
    }

    toggleReady() {
        this.isReady = !this.isReady;
        this.updateReadyButton();

        // 发送准备状态到服务器
        if (this.network && this.network.socket) {
            this.network.socket.emit('player_ready', {
                roomCode: this.roomCode,
                isReady: this.isReady
            });
        }
    }

    startGame() {
        // 检查是否所有玩家都准备了
        const allReady = Array.from(this.players.values()).every(p => p.isReady || p.isHost);

        if (this.players.size < 1) {
            return;
        }

        // 发送开始游戏请求
        if (this.network && this.network.socket) {
            this.network.socket.emit('start_game', {
                roomCode: this.roomCode
            });
        }
    }

    kickPlayer(playerId) {
        if (this.network && this.network.socket) {
            this.network.socket.emit('kick_player', {
                roomCode: this.roomCode,
                playerId: playerId
            });
        }
    }

    copyRoomCode() {
        if (this.roomCode) {
            navigator.clipboard.writeText(this.roomCode).then(() => {
                this.copiedText.setVisible(true);
                this.time.delayedCall(1500, () => this.copiedText.setVisible(false));
            });
        }
    }

    showKickedMessage() {
        const { width, height } = this.scale;

        // 显示被踢出提示
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        overlay.setDepth(100);

        const kickedText = this.add.text(width / 2, height / 2 - 20, 'You have been removed from the room', {
            fontSize: '24px',
            color: '#ff6b6b'
        }).setOrigin(0.5).setDepth(101);

        const redirectText = this.add.text(width / 2, height / 2 + 20, 'Returning to menu...', {
            fontSize: '16px',
            color: '#888'
        }).setOrigin(0.5).setDepth(101);

        this.time.delayedCall(3000, () => {
            this.scene.start('MenuScene');
        });
    }

    updatePlayerStatus(playerId, status) {
        const player = this.players.get(playerId);
        if (player) {
            player.connectionStatus = status;
            this.renderPlayerList();
        }
    }

    returnToMenu() {
        if (this.network && this.network.socket) {
            this.network.leaveRoom();
        }
        this.scene.start('MenuScene');
    }

    update() {
        // 隐藏复制提示
        if (this.copyHint) {
            this.copyHint.setVisible(this.roomCodeText.getBounds().contains(
                this.input.activePointer.x,
                this.input.activePointer.y
            ) === false);
        }
    }
}
