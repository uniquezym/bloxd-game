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
        this.levelId = data.levelId || 1;
        this.level = LEVELS[this.levelId - 1] || LEVELS[0];
        this.otherPlayers = new Map();
        this.coins = new Map();
        this.hazards = [];
        this.fires = [];
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
        // 清理其他玩家sprites
        if (this.otherPlayerSprites) {
            for (const [playerId, spriteData] of this.otherPlayerSprites) {
                if (spriteData.sprite) spriteData.sprite.destroy();
                if (spriteData.label) spriteData.label.destroy();
            }
            this.otherPlayerSprites.clear();
        }
    }

    saveLevelScore(levelId, score, coins) {
        try {
            let allScores = {};
            const existing = localStorage.getItem('bloxd_level_scores');
            if (existing) allScores = JSON.parse(existing);

            if (!allScores[levelId] || score > allScores[levelId].score) {
                allScores[levelId] = { score, coins, date: new Date().toLocaleDateString() };
                localStorage.setItem('bloxd_level_scores', JSON.stringify(allScores));
            }
        } catch (e) {}
    }

    saveScore(score, coins) {
        this.saveLevelScore(this.levelId, score, coins);

        const date = new Date().toLocaleDateString();
        const newRecord = { score, coins, date, levelId: this.levelId };

        let topScores = this.getTopScores();
        topScores.push(newRecord);
        topScores.sort((a, b) => b.score - a.score);
        topScores = topScores.slice(0, 20);

        localStorage.setItem('bloxd_top_scores', JSON.stringify(topScores));

        this.currentRank = topScores.findIndex(r => r === newRecord) + 1;
        return this.currentRank;
    }

    getTopScores() {
        const data = localStorage.getItem('bloxd_top_scores');
        return data ? JSON.parse(data) : [];
    }

    unlockNextLevel() {
        try {
            let unlocked = [];
            const existing = localStorage.getItem('bloxd_unlocked_levels');
            if (existing) unlocked = JSON.parse(existing);
            const nextId = this.levelId + 1;
            if (!unlocked.includes(nextId) && nextId <= LEVEL_COUNT) {
                unlocked.push(nextId);
                localStorage.setItem('bloxd_unlocked_levels', JSON.stringify(unlocked));
            }
        } catch (e) {}
    }

    create() {
        this.gameStarted = false;
        this.isInCountdown = false;
        this.canMove = false;
        this.countdownText = null;
        this.otherPlayerSprites = new Map();

        const { bgColor, worldWidth, worldHeight, startX, startY } = this.level;

        // 背景
        this.cameras.main.setBackgroundColor(bgColor);

        // 物理世界边界
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // 相机跟随
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

        // 静态平台组
        this.platforms = this.physics.add.staticGroup();
        this.grounds = this.physics.add.staticGroup();

        // 边界
        this.grounds.create(worldWidth / 2, worldHeight - 16, 'ground').setScale(worldWidth / 32, 1).refreshBody();
        this.grounds.create(16, worldHeight / 2, 'ground').setScale(1, worldHeight / 32).refreshBody();
        this.grounds.create(worldWidth - 16, worldHeight / 2, 'ground').setScale(1, worldHeight / 32).refreshBody();

        // 创建玩家
        this.createPlayer(startX, startY);

        // 创建关卡
        this.createLevel(this.level);

        // 相机跟随
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.setupControls();
        this.setupNetworkEvents();
        this.updateUI();

        // 显示关卡名称
        this.showLevelIntro();

        // 联机模式等待 game_start 事件触发倒计时，单机模式直接开始
        if (this.isOnline) {
            // 等待服务器下发 game_start
        } else {
            this.time.delayedCall(1500, () => this.countdownStart());
        }
    }

    showLevelIntro() {
        const cam = this.cameras.main;
        const cx = cam.scrollX + cam.width / 2;
        const cy = cam.scrollY + cam.height / 2;

        const intro = this.add.container(cx, cy);
        intro.setDepth(200);

        const bg = this.add.rectangle(0, 0, 400, 150, 0x000000, 0.85);
        bg.setOrigin(0.5);
        intro.add(bg);

        const title = this.add.text(0, -40, `关卡 ${this.level.id}: ${this.level.name}`, {
            fontSize: '32px',
            fontFamily: 'Arial Black, Arial',
            color: '#7c7cff'
        }).setOrigin(0.5);
        intro.add(title);

        const desc = this.add.text(0, 10, this.level.description, {
            fontSize: '16px',
            color: '#aaa',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        intro.add(desc);

        this.tweens.add({
            targets: intro,
            alpha: { from: 1, to: 0 },
            delay: 1500,
            duration: 500,
            onComplete: () => intro.destroy()
        });
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

    countdownStart() {
        if (this.isInCountdown) return;
        this.isInCountdown = true;
        this.canMove = false;

        const cam = this.cameras.main;
        const cx = cam.scrollX + cam.width / 2;
        const cy = cam.scrollY + cam.height / 2;

        // 显示"游戏即将开始..."
        const hintText = this.add.text(cx, cy - 100, '游戏即将开始...', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(99);

        const colors = { 3: '#ff4444', 2: '#ffff44', 1: '#44ff44' };
        let currentCount = 3;

        const showNumber = (num) => {
            if (this.countdownText) this.countdownText.destroy();

            const color = colors[num] || '#FFD700';
            const text = num === 0 ? 'GO!' : num.toString();

            this.countdownText = this.add.text(cx, cy, text, {
                fontSize: '120px',
                color: color,
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

            this.tweens.add({
                targets: this.countdownText,
                scale: { from: 0.3, to: 1.2 },
                alpha: { from: 1, to: 0.8 },
                duration: 400,
                ease: 'Cubic.easeOut'
            });
        };

        // 链式延迟调用显示 3-2-1-GO!
        this.time.delayedCall(800, () => {
            hintText.destroy();
            showNumber(3);
        });
        this.time.delayedCall(800 + 800, () => showNumber(2));
        this.time.delayedCall(800 + 800 + 800, () => showNumber(1));
        this.time.delayedCall(800 + 800 + 800 + 800, () => {
            showNumber(0);
            this.time.delayedCall(600, () => this.countdownEnd());
        });
    }

    countdownEnd() {
        this.isInCountdown = false;
        this.gameStarted = true;
        this.canMove = true;
        if (this.countdownText) {
            this.countdownText.destroy();
            this.countdownText = null;
        }
    }

    createPlayer(x, y) {
        this.player = this.physics.add.sprite(x, y, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);
        this.player.setDrag(this.level.iceMode ? 100 : 800, 0);
        this.player.body.setSize(28, 28);
        this.player.body.setOffset(2, 2);

        const labelText = this.isOnline ? `P1` : `${this.level.id}-Solo`;
        this.playerLabel = this.add.text(x, y - 20, labelText, {
            fontSize: '12px',
            color: '#fff',
            backgroundColor: '#7c7cff',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.grounds);
    }

    createLevel(levelData) {
        this.movingPlatformGroup = this.physics.add.group();

        for (const el of levelData.elements) {
            switch (el.type) {
                case 'platform':
                    this.createPlatform(el.x, el.y, el.w);
                    break;
                case 'finish':
                    this.createFinishPlatform(el.x, el.y, el.w);
                    break;
                case 'coin':
                    this.createCoin(el.x, el.y);
                    break;
                case 'hazard':
                    this.createHazard(el.x, el.y, el.count);
                    break;
                case 'bounce':
                    this.createBouncePad(el.x, el.y);
                    break;
                case 'moving':
                    this.createMovingPlatform(el.x, el.y, el.w, el.dir === 'h' ? 'horizontal' : 'vertical', el.dist, el.speed);
                    break;
                case 'ice':
                    this.createIcePlatform(el.x, el.y, el.w);
                    break;
                case 'fire':
                    this.createFire(el.x, el.y, el.w, el.dir === 'h' ? 'horizontal' : 'vertical', el.dist, el.speed);
                    break;
            }
        }

        // 装饰
        this.createTree(50, levelData.worldHeight - 96);
        this.createTree(150, levelData.worldHeight - 96);
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

    createIcePlatform(x, y, width) {
        // 冰面视觉上用普通platform但不同颜色
        const T = 32;
        for (let i = 0; i < width; i++) {
            const block = this.platforms.create(x + i * T, y, 'platform');
            block.setOrigin(0.5, 0.5);
            block.body.setSize(T - 2, T - 2);
            // 冰面物理：减少摩擦（通过高drag，在handleInput或createPlayer中处理）
            block.refreshBody();
        }
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

    // 移动火焰（会移动的钉子行）
    createFire(x, y, width, direction, distance, speed) {
        const T = 32;
        const fire = this.physics.add.sprite(x + (width * T) / 2, y, 'danger');
        fire.setOrigin(0.5, 0.5);
        fire.body.setSize(width * T - 4, T - 4);
        fire.body.allowGravity = false;
        fire.setImmovable(true);
        fire.setTint(0xff6600); // 橙色区分于普通钉子

        fire.moveData = {
            direction: direction,
            distance: distance,
            speed: speed,
            startX: fire.x,
            startY: fire.y,
            progress: 0
        };

        this.physics.add.collider(this.player, fire, () => this.hitHazard());
        this.fires.push(fire);
    }

    hitHazard() {
        if (this.isRespawning || !this.gameStarted || this.isInCountdown) return;

        this.isRespawning = true;
        this.cameras.main.shake(200, 0.02);

        this.tweens.add({
            targets: this.player,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.player.setPosition(this.level.startX, this.level.startY);
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

    createTree(x, y) {
        this.add.rectangle(x, y + 20, 16, 40, 0x8B4513);
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

        this.inputState = { left: false, right: false, jump: false };
    }

    setupNetworkEvents() {
        if (!this.isOnline || !this.network) return;

        this.network.events.on('room_joined', (data) => {
            // 处理已有玩家列表
            if (data.players) {
                for (const [id, playerData] of Object.entries(data.players)) {
                    if (id !== this.playerId) {
                        this.addRemotePlayer({ playerId: id, ...playerData });
                    }
                }
            }
        });

        this.network.events.on('player_joined', (data) => this.addRemotePlayer(data));
        this.network.events.on('player_left', (data) => this.removeRemotePlayer(data.playerId));
        this.network.events.on('game_state', (data) => this.updateRemotePlayers(data));

        // 监听服务器下发游戏开始倒计时
        this.network.events.on('game_start', () => {
            this.countdownStart();
        });

        this.time.addEvent({
            delay: 50,
            callback: () => this.sendPosition(),
            loop: true
        });
    }

    addRemotePlayer(data) {
        if (!this.isOnline) return;
        if (data.playerId === this.playerId) return;
        if (this.otherPlayerSprites.has(data.playerId)) return;

        const x = data.x || 100;
        const y = data.y || 500;
        const color = data.color || 0xff7c7c;

        const remote = this.physics.add.sprite(x, y, 'player');
        remote.setTint(color);
        remote.setCollideWorldBounds(true);
        remote.body.setSize(28, 28);
        remote.body.setAllowGravity(true);

        const label = this.add.text(x, y - 20, data.playerName || 'P2', {
            fontSize: '12px',
            color: '#fff',
            backgroundColor: '#' + color.toString(16).padStart(6, '0'),
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.otherPlayerSprites.set(data.playerId, {
            sprite: remote,
            label: label,
            targetX: x,
            targetY: y
        });
    }

    removeRemotePlayer(playerId) {
        const player = this.otherPlayerSprites.get(playerId);
        if (player) {
            if (player.sprite) player.sprite.destroy();
            if (player.label) player.label.destroy();
            this.otherPlayerSprites.delete(playerId);
        }
    }

    updateRemotePlayers(gameState) {
        if (!this.isOnline) return;

        if (gameState.players) {
            for (const [id, data] of Object.entries(gameState.players)) {
                if (id === this.playerId) continue;
                let spriteData = this.otherPlayerSprites.get(id);
                if (!spriteData) {
                    this.addRemotePlayer({ playerId: id, ...data });
                    spriteData = this.otherPlayerSprites.get(id);
                }
                if (spriteData && data.x !== undefined && data.y !== undefined) {
                    spriteData.targetX = data.x;
                    spriteData.targetY = data.y;
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
        if (this.isInCountdown) {
            this.canMove = false;
            return;
        }
        if (!this.gameStarted) return;

        this.handleInput();
        this.updatePlayerLabel();
        this.updateMovingPlatforms(delta);
        this.updateFires(delta);
        this.updateRemotePlayerPositions(delta);
        this.checkWinCondition();
        this.checkFailCondition();
    }

    updateRemotePlayerPositions(delta) {
        if (!this.isOnline) return;

        const LERP = 0.2;
        for (const [playerId, spriteData] of this.otherPlayerSprites) {
            if (spriteData.sprite && spriteData.targetX !== undefined) {
                spriteData.sprite.x = Phaser.Math.Linear(spriteData.sprite.x, spriteData.targetX, LERP);
                spriteData.sprite.y = Phaser.Math.Linear(spriteData.sprite.y, spriteData.targetY, LERP);
                if (spriteData.label) {
                    spriteData.label.x = spriteData.sprite.x;
                    spriteData.label.y = spriteData.sprite.y - 20;
                }
            }
        }
    }

    updateFires(delta) {
        const dt = delta ? delta / 1000 : 0.016;
        for (const fire of this.fires) {
            const data = fire.moveData;
            if (!data) continue;

            data.progress += data.speed * dt;
            const t = Math.sin(data.progress);

            if (data.direction === 'horizontal') {
                fire.x = data.startX + t * data.distance;
            } else if (data.direction === 'vertical') {
                fire.y = data.startY + t * data.distance;
            }
        }
    }

    checkFailCondition() {
        if (this.player.y > this.level.worldHeight + 50) {
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
                `得分: ${this.score}  |  金币: ${this.collectedCoins}`, {
                fontSize: '22px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);

            this.showScoreBoard(cam);
            this.addMenuButtons(cam, false);

            // 重试倒计时显示
            let retrySecs = 5;
            const retryText = this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 + 170,
                `${retrySecs}秒后自动重试...`, {
                fontSize: '16px',
                color: '#aaaaaa',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);

            const retryTimer = this.time.addEvent({
                delay: 1000,
                callback: () => {
                    retrySecs--;
                    if (retrySecs > 0) {
                        retryText.setText(`${retrySecs}秒后自动重试...`);
                    } else {
                        retryTimer.remove();
                        this.scene.restart();
                    }
                },
                repeat: 4
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
        const drag = this.level.iceMode ? 100 : 800;

        // 水平移动
        if (this.cursors.left.isDown || this.wasd.left.isDown || this.touchInput.left) {
            this.player.setVelocityX(-200);
            this.inputState.left = true;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown || this.touchInput.right) {
            this.player.setVelocityX(200);
            this.inputState.right = true;
        } else {
            this.player.setDrag(drag, 0);
            this.inputState.left = false;
            this.inputState.right = false;
        }

        // 跳跃
        if ((this.cursors.up.isDown || this.wasd.up.isDown || this.spaceKey.isDown || this.touchInput.jump) && onGround) {
            this.player.setVelocityY(-380);
            this.inputState.jump = true;
            this.touchInput.jump = false;
        } else {
            this.inputState.jump = false;
        }

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
            roomEl.textContent = this.isOnline ? `Room: ${this.roomCode}` : `关卡${this.level.id}: ${this.level.name}`;
        }

        const playerCountEl = document.getElementById('player-count');
        if (playerCountEl) {
            playerCountEl.textContent = `金币: ${this.collectedCoins} | 得分: ${this.score}`;
        }
    }

    checkWinCondition() {
        const { finishX, finishY, worldHeight } = this.level;
        if (this.player.y < finishY + 50 && this.player.x > finishX) {
            this.showWinScreen();
        }
    }

    showWinScreen() {
        if (this.isShowingResult) return;
        this.isShowingResult = true;

        // 通关奖励分
        this.score += 500;
        this.updateUI();

        const rank = this.saveScore(this.score, this.collectedCoins);
        this.unlockNextLevel();

        const cam = this.cameras.main;
        cam.fadeOut(300, 0, 0, 0);

        this.time.delayedCall(300, () => {
            cam.fadeIn(300, 0, 0, 0);

            this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 - 120,
                this.level.id >= 10 ? '🏆 全部通关！' : '通关成功！', {
                fontSize: '48px',
                color: '#FFD700',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5).setScrollFactor(0);

            this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 - 70,
                `关卡 ${this.level.id}: ${this.level.name}`, {
                fontSize: '20px',
                color: '#aaa',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);

            this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 - 30,
                `最终得分: ${this.score}  |  金币: ${this.collectedCoins}`, {
                fontSize: '22px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);

            // 新关卡解锁庆祝动画
            if (this.level.id < LEVEL_COUNT) {
                this.showLevelUnlocked(cam, this.level.id + 1);
            }

            this.showScoreBoard(cam);
            this.addMenuButtons(cam, true);

            if (this.level.id < LEVEL_COUNT) {
                this.time.delayedCall(5000, () => {
                    // 自动进入下一关
                    this.scene.start('GameScene', {
                        isOnline: false,
                        levelId: this.level.id + 1
                    });
                });
            }
        });
    }

    addMenuButtons(cam, isWin) {
        const btnColor = isWin ? '#FFD700' : '#7c7cff';
        const menuBtn = this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 + 200,
            '🏠 返回关卡选择', {
            fontSize: '22px',
            color: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: btnColor,
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setAlpha(0.8));
        menuBtn.on('pointerout', () => menuBtn.setAlpha(1));
        menuBtn.on('pointerdown', () => {
            if (this.isOnline && this.network) {
                this.network.leaveRoom();
            }
            this.scene.start('LevelScene');
        });
    }

    showScoreBoard(cam) {
        const topScores = this.getTopScores().filter(s => s.levelId === this.levelId);

        this.add.text(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2 + 40,
            '🏆 本关排行榜 🏆', {
            fontSize: '18px',
            color: '#FFD700',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setScrollFactor(0);

        const startY = cam.scrollY + cam.height / 2 + 70;
        const displayCount = Math.min(topScores.length, 5);

        if (displayCount === 0) {
            this.add.text(cam.scrollX + cam.width / 2, startY, '暂无记录', {
                fontSize: '14px',
                color: '#888888',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);
            return;
        }

        for (let i = 0; i < displayCount; i++) {
            const record = topScores[i];
            const y = startY + i * 24;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            const text = `${medal} ${record.score}分 (${record.coins}金币)`;

            this.add.text(cam.scrollX + cam.width / 2, y, text, {
                fontSize: '16px',
                color: i === 0 ? '#FFD700' : '#cccccc',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);
        }
    }

    showLevelUnlocked(cam, nextLevelId) {
        const nextLevel = LEVELS[nextLevelId - 1];
        if (!nextLevel) return;

        const unlockY = cam.scrollY + cam.height / 2 + 100;

        // 金色解锁提示
        const unlockText = this.add.text(cam.scrollX + cam.width / 2, unlockY,
            `🔓 新关卡解锁: ${nextLevel.name}`, {
            fontSize: '22px',
            color: '#FFD700',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setScrollFactor(0).setAlpha(0).setDepth(50);

        // 缩放弹出动画
        this.tweens.add({
            targets: unlockText,
            alpha: 1,
            scaleX: { from: 0.5, to: 1 },
            scaleY: { from: 0.5, to: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });

        // 闪烁动画
        this.tweens.add({
            targets: unlockText,
            alpha: { from: 1, to: 0.5 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}
