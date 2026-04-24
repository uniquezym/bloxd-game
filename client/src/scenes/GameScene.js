// 游戏场景
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.isOnline = data.isOnline || false;
        this.roomCode = data.roomCode || null;
        this.network = data.network || null;
        this.playerId = data.playerId || 'local';
        this.otherPlayers = new Map();
        this.coins = new Map();
        this.hazards = [];
        this.bouncePads = [];
        this.movingPlatforms = [];
        this.collectedCoins = 0;
        this.score = 0;
        this.isShowingResult = false;
        this.currentRank = null;
        this.touchInput = { left: false, right: false, jump: false };
        this._touchHandler = (e) => {
            const { key, value } = e.detail;
            if (key === 'left') this.touchInput.left = value;
            if (key === 'right') this.touchInput.right = value;
            if (key === 'jump') this.touchInput.jump = value;
        };
        window.addEventListener('touch-input', this._touchHandler);
    }

    shutdown() {
        window.removeEventListener('touch-input', this._touchHandler);
    }

    saveScore(score, coins) {
        const date = new Date().toLocaleDateString();
        const newRecord = { score, coins, date };

        let topScores = this.getTopScores();
        topScores.push(newRecord);
        topScores.sort((a, b) => b.score - a.score);
        topScores = topScores.slice(0, 10);

        localStorage.setItem('bloxd_top_scores', JSON.stringify(topScores));

        this.currentRank = topScores.findIndex(r => r === newRecord) + 1;
        return this.currentRank;
    }

    getTopScores() {
        const data = localStorage.getItem('bloxd_top_scores');
        return data ? JSON.parse(data) : [];
    }

    create() {
        this.gameStarted = false;
        this.createWorld();
        this.createPlayer();
        this.createLevel();
        this.setupControls();
        this.setupNetworkEvents();
        this.updateUI();

        // 物理世界边界
        this.physics.world.setBounds(0, 0, 2000, 1000);

        // 相机跟随
        this.cameras.main.setBounds(0, 0, 2000, 1000);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // 开始倒计时
        this.showCountdown(3);
    }

    showCountdown(count) {
        const cam = this.cameras.main;
        const cx = cam.scrollX + cam.width / 2;
        const cy = cam.scrollY + cam.height / 2;

        if (count > 0) {
            const text = this.add.text(cx, cy, count.toString(), {
                fontSize: '96px',
                color: '#ffffff',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

            this.tweens.add({
                targets: text,
                scale: { from: 0.5, to: 1.5 },
                alpha: { from: 1, to: 0 },
                duration: 800,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    text.destroy();
                    this.time.delayedCall(200, () => this.showCountdown(count - 1));
                }
            });
        } else {
            const goText = this.add.text(cx, cy, 'GO!', {
                fontSize: '72px',
                color: '#7cff7c',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

            this.tweens.add({
                targets: goText,
                scale: { from: 0.5, to: 2 },
                alpha: { from: 1, to: 0 },
                duration: 600,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    goText.destroy();
                    this.gameStarted = true;
                }
            });
        }
    }

    createWorld() {
        // 背景色
        this.cameras.main.setBackgroundColor(0x87CEEB);

        // 创建地面组
        this.platforms = this.physics.add.staticGroup();
        this.grounds = this.physics.add.staticGroup();

        // 边界墙
        const worldWidth = 2000;
        const worldHeight = 1000;

        // 底部
        this.grounds.create(worldWidth / 2, worldHeight - 16, 'ground').setScale(worldWidth / 32, 1).refreshBody();
        // 左侧
        this.grounds.create(16, worldHeight / 2, 'ground').setScale(1, worldHeight / 32).refreshBody();
        // 右侧
        this.grounds.create(worldWidth - 16, worldHeight / 2, 'ground').setScale(1, worldHeight / 32).refreshBody();
    }

    createPlayer() {
        // 创建玩家精灵
        this.player = this.physics.add.sprite(100, 500, 'player');

        // 玩家物理属性
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);
        this.player.setDrag(800, 0);
        this.player.body.setSize(28, 28);
        this.player.body.setOffset(2, 2);

        // 玩家标签
        this.playerLabel = this.add.text(100, 480, this.isOnline ? `P1` : 'Solo', {
            fontSize: '12px',
            color: '#fff',
            backgroundColor: '#7c7cff',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        // 碰撞
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.grounds);
    }

    createLevel() {
        const T = 32;

        this.movingPlatformGroup = this.physics.add.group();

        // 起点平台
        this.createPlatform(0, 700, 6);

        // 阶梯式平台
        for (let i = 0; i < 5; i++) {
            this.createPlatform(200 + i * 150, 650 - i * 50, 3);
            if (i % 2 === 0) {
                this.createCoin(200 + i * 150 + 32, 620 - i * 50);
            }
        }

        // 危险区域 - 钉子
        this.createHazard(800, 700 - 16, 4);

        // 间隔跳跃平台
        this.createPlatform(950, 400, 4);
        this.createCoin(970, 370);
        this.createCoin(1010, 370);

        this.createPlatform(1150, 350, 3);

        // 移动平台
        this.createMovingPlatform(1350, 450, 5, 'horizontal', 100, 2);
        this.createCoin(1400, 420);

        // 弹跳垫
        this.createBouncePad(1500, 380);

        this.createPlatform(1650, 320, 3);
        this.createCoin(1666, 290);

        // 危险平台
        this.createPlatform(1750, 280, 4);
        this.createHazard(1766, 248, 2);

        // 移动平台 - 垂直
        this.createMovingPlatform(1850, 350, 3, 'vertical', 80, 2);

        // 终点平台
        this.createFinishPlatform(1950, 250, 4);
        this.createCoin(1970, 220);
        this.createCoin(2010, 220);

        // 装饰物 - 树
        this.createTree(50, 680);
        this.createTree(150, 680);
    }

    createMovingPlatform(x, y, width, direction, distance, speed) {
        const T = 32;
        const platform = this.physics.add.sprite(x + (width * T) / 2, y, 'moving_platform');

        platform.setOrigin(0.5, 0.5);
        platform.body.setSize(width * T - 4, T - 4);
        platform.setImmovable(true);
        platform.body.allowGravity = false;
        platform.setCollideWorldBounds(true);

        platform.moveData = {
            direction: direction,
            distance: distance,
            speed: speed,
            startX: platform.x,
            startY: platform.y,
            progress: 0
        };

        this.movingPlatformGroup.add(platform);
        this.movingPlatforms.push(platform);

        this.physics.add.collider(this.player, platform);
    }

    createCoin(x, y) {
        const coin = this.physics.add.sprite(x, y, 'coin');
        coin.body.setAllowGravity(false);
        coin.body.setSize(24, 24);
        coin.setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: coin,
            y: y - 8,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.physics.add.overlap(this.player, coin, () => this.collectCoin(coin));
        this.coins.set(coin, { x, y, collected: false });
    }

    collectCoin(coin) {
        if (this.coins.get(coin)?.collected) return;

        this.coins.get(coin).collected = true;
        this.collectedCoins++;

        this.tweens.add({
            targets: coin,
            y: coin.y - 30,
            alpha: 0,
            scale: 0,
            duration: 300,
            onComplete: () => coin.destroy()
        });

        this.score += 100;
        this.updateUI();
    }

    createHazard(x, y, count) {
        for (let i = 0; i < count; i++) {
            const hazard = this.physics.add.sprite(x + i * 32, y, 'danger');
            hazard.body.setAllowGravity(false);
            hazard.body.setSize(28, 28);
            hazard.setOrigin(0.5, 0.5);
            hazard.setImmovable(true);

            this.physics.add.collider(this.player, hazard, () => this.hitHazard());
            this.hazards.push(hazard);
        }
    }

    hitHazard() {
        if (this.isRespawning) return;

        this.isRespawning = true;
        this.cameras.main.shake(200, 0.02);

        this.tweens.add({
            targets: this.player,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.player.setPosition(100, 500);
                this.player.setVelocity(0, 0);
                this.player.setAlpha(1);
                this.isRespawning = false;
            }
        });
    }

    createBouncePad(x, y) {
        const pad = this.physics.add.sprite(x, y, 'bounce');
        pad.body.setAllowGravity(false);
        pad.body.setSize(48, 16);
        pad.setOrigin(0.5, 0.5);
        pad.setImmovable(true);

        this.physics.add.collider(this.player, pad, () => this.bounce(pad));
        this.bouncePads.push(pad);
    }

    bounce(pad) {
        if (this.player.body.touching.down) {
            this.player.setVelocityY(-600);
            pad.setScale(1.3, 0.7);
            this.time.delayedCall(100, () => pad.setScale(1, 1));
        }
    }

    createPlatform(x, y, width) {
        const T = 32;
        for (let i = 0; i < width; i++) {
            const block = this.platforms.create(x + i * T, y, 'platform');
            block.setOrigin(0.5, 0.5);
            block.body.setSize(T - 2, T - 2);
            block.refreshBody();
        }
    }

    createFinishPlatform(x, y, width) {
        const T = 32;
        for (let i = 0; i < width; i++) {
            const block = this.platforms.create(x + i * T, y, 'finish');
            block.setOrigin(0.5, 0.5);
            block.body.setSize(T - 2, T - 2);
            block.refreshBody();
        }
    }

    createTree(x, y) {
        // 树干
        this.add.rectangle(x, y + 20, 16, 40, 0x8B4513);
        // 树冠
        this.add.rectangle(x, y - 10, 40, 40, 0x228B22);
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D')
        };
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // 用于平滑输入
        this.inputState = {
            left: false,
            right: false,
            jump: false
        };
    }

    setupNetworkEvents() {
        if (this.isOnline && this.network) {
            this.network.events.on('player_joined', (data) => {
                this.addRemotePlayer(data);
            });

            this.network.events.on('player_left', (data) => {
                this.removeRemotePlayer(data.playerId);
            });

            this.network.events.on('game_state', (data) => {
                this.updateRemotePlayers(data);
            });

            // 发送本地玩家位置
            this.time.addEvent({
                delay: 50,
                callback: () => this.sendPosition(),
                loop: true
            });
        }
    }

    addRemotePlayer(data) {
        if (data.playerId === this.playerId) return;

        const remote = this.physics.add.sprite(data.x || 100, data.y || 500, 'player');
        remote.setTint(0xff7c7c); // 不同颜色区分
        remote.setCollideWorldBounds(true);
        remote.body.setSize(28, 28);

        // 标签
        const label = this.add.text(data.x || 100, (data.y || 500) - 20, data.playerName || 'P2', {
            fontSize: '12px',
            color: '#fff',
            backgroundColor: '#ff7c7c',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.otherPlayers.set(data.playerId, { sprite: remote, label });
    }

    removeRemotePlayer(playerId) {
        const player = this.otherPlayers.get(playerId);
        if (player) {
            player.sprite.destroy();
            player.label.destroy();
            this.otherPlayers.delete(playerId);
        }
    }

    updateRemotePlayers(gameState) {
        // 更新其他玩家位置
        if (gameState.players) {
            for (const [id, data] of Object.entries(gameState.players)) {
                if (id === this.playerId) continue;
                let player = this.otherPlayers.get(id);
                if (!player) {
                    this.addRemotePlayer({ playerId: id, ...data });
                    player = this.otherPlayers.get(id);
                }
                if (player && data.x !== undefined) {
                    player.sprite.x = data.x;
                    player.sprite.y = data.y;
                    player.label.x = data.x;
                    player.label.y = data.y - 20;
                }
            }
        }
    }

    sendPosition() {
        if (this.isOnline && this.network) {
            this.network.sendPosition({
                x: this.player.x,
                y: this.player.y,
                vx: this.player.body.velocity.x,
                vy: this.player.body.velocity.y
            });
        }
    }

    update(time, delta) {
        if (!this.gameStarted) return;
        this.handleInput();
        this.updatePlayerLabel();
        this.updateMovingPlatforms(delta);
        this.checkWinCondition();
        this.checkFailCondition();
    }

    checkFailCondition() {
        if (this.player.y > 850) {
            this.showFailScreen();
        }
    }

    showFailScreen() {
        if (this.isShowingResult) return;
        this.isShowingResult = true;

        const rank = this.saveScore(this.score, this.collectedCoins);

        const cam = this.cameras.main;
        cam.fadeOut(300, 0, 0, 0);

        this.time.delayedCall(300, () => {
            cam.fadeIn(300, 0, 0, 0);

            this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 - 120,
                'GAME OVER', {
                fontSize: '56px',
                color: '#ff4444',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5).setScrollFactor(0);

            this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 - 60,
                `本次得分: ${this.score}  |  金币: ${this.collectedCoins}`, {
                fontSize: '22px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);

            this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 - 20,
                `排名: 第 ${rank} 名`, {
                fontSize: '20px',
                color: rank <= 3 ? '#FFD700' : '#aaaaaa',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);

            this.showScoreBoard(cam);

            // 返回菜单按钮
            const menuBtnFail = this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 + 180,
                '🏠 返回菜单', {
                fontSize: '22px',
                color: '#ffffff',
                fontFamily: 'Arial',
                backgroundColor: '#7c7cff',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });

            menuBtnFail.on('pointerover', () => menuBtnFail.setAlpha(0.8));
            menuBtnFail.on('pointerout', () => menuBtnFail.setAlpha(1));
            menuBtnFail.on('pointerdown', () => {
                if (this.isOnline && this.network) {
                    this.network.leaveRoom();
                }
                this.scene.start('MenuScene');
            });

            this.time.delayedCall(5000, () => {
                if (menuBtnFail) menuBtnFail.destroy();
                this.scene.restart();
            });
        });
    }

    updateMovingPlatforms(delta) {
        const dt = delta ? delta / 1000 : 0.016;
        for (const platform of this.movingPlatforms) {
            const data = platform.moveData;
            if (!data) continue;

            data.progress += data.speed * dt;

            const t = Math.sin(data.progress);

            if (data.direction === 'horizontal') {
                platform.x = data.startX + t * data.distance;
            } else if (data.direction === 'vertical') {
                platform.y = data.startY + t * data.distance;
            }
        }
    }

    handleInput() {
        const onGround = this.player.body.blocked.down;

        // 水平移动（键盘 + 触摸）
        if (this.cursors.left.isDown || this.wasd.left.isDown || this.touchInput.left) {
            this.player.setVelocityX(-200);
            this.inputState.left = true;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown || this.touchInput.right) {
            this.player.setVelocityX(200);
            this.inputState.right = true;
        } else {
            this.inputState.left = false;
            this.inputState.right = false;
        }

        // 跳跃（键盘 + 触摸）
        if ((this.cursors.up.isDown || this.wasd.up.isDown || this.spaceKey.isDown || this.touchInput.jump) && onGround) {
            this.player.setVelocityY(-380);
            this.inputState.jump = true;
            this.touchInput.jump = false; // 触摸跳跃后重置
        } else {
            this.inputState.jump = false;
        }

        // 发送输入状态（在线模式）
        if (this.isOnline && this.network) {
            this.network.sendInput(this.inputState);
        }
    }

    updatePlayerLabel() {
        this.playerLabel.x = this.player.x;
        this.playerLabel.y = this.player.y - 24;
    }

    updateUI() {
        const roomEl = document.getElementById('room-code');
        if (roomEl) {
            roomEl.textContent = this.isOnline ? `Room: ${this.roomCode}` : 'Room: Solo';
        }

        const playerCountEl = document.getElementById('player-count');
        if (playerCountEl) {
            playerCountEl.textContent = `Coins: ${this.collectedCoins} | Score: ${this.score}`;
        }
    }

    checkWinCondition() {
        // 检测是否到达终点
        if (this.player.y < 280 && this.player.x > 1850) {
            this.showWinScreen();
        }
    }

    showWinScreen() {
        if (this.isShowingResult) return;
        this.isShowingResult = true;

        const rank = this.saveScore(this.score, this.collectedCoins);
        const title = this.isOnline ? 'YOU WIN!' : 'LEVEL COMPLETE!';

        const cam = this.cameras.main;
        cam.fadeOut(300, 0, 0, 0);

        this.time.delayedCall(300, () => {
            cam.fadeIn(300, 0, 0, 0);

            this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 - 120,
                title, {
                fontSize: '56px',
                color: '#FFD700',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5).setScrollFactor(0);

            this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 - 60,
                `本次得分: ${this.score}  |  金币: ${this.collectedCoins}`, {
                fontSize: '22px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);

            this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 - 20,
                `排名: 第 ${rank} 名`, {
                fontSize: '20px',
                color: rank <= 3 ? '#FFD700' : '#aaaaaa',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);

            this.showScoreBoard(cam);

            // 返回菜单按钮
            const menuBtnWin = this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 + 180,
                '🏠 返回菜单', {
                fontSize: '22px',
                color: '#ffffff',
                fontFamily: 'Arial',
                backgroundColor: '#FFD700',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });

            menuBtnWin.on('pointerover', () => menuBtnWin.setAlpha(0.8));
            menuBtnWin.on('pointerout', () => menuBtnWin.setAlpha(1));
            menuBtnWin.on('pointerdown', () => {
                if (this.isOnline && this.network) {
                    this.network.leaveRoom();
                }
                this.scene.start('MenuScene');
            });

            this.time.delayedCall(5000, () => {
                if (menuBtnWin) menuBtnWin.destroy();
                this.scene.restart();
            });
        });
    }

    showScoreBoard(cam) {
        const topScores = this.getTopScores();

        this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 + 20,
            '🏆 历史排行榜 🏆', {
            fontSize: '18px',
            color: '#FFD700',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setScrollFactor(0);

        const startY = cam.scrollY + cam.height / 2 + 50;
        const displayCount = Math.min(topScores.length, 5);

        for (let i = 0; i < displayCount; i++) {
            const record = topScores[i];
            const isCurrent = i + 1 === this.currentRank;
            const y = startY + i * 24;

            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            const text = isCurrent ? `▶ ${medal} ${record.score}分 (${record.coins}金币)` : `${medal} ${record.score}分 (${record.coins}金币)`;

            this.add.text(cam.scrollX + cam.width / 2, y, text, {
                fontSize: '16px',
                color: isCurrent ? '#7cff7c' : '#cccccc',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);
        }

        if (topScores.length === 0) {
            this.add.text(cam.scrollX + cam.width / 2, startY, '暂无记录', {
                fontSize: '14px',
                color: '#888888',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);
        }
    }
}
