// 关卡选择场景
class LevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelScene' });
    }

    create() {
        this.createBackground();
        this.setupUI();
        this.loadProgress();
    }

    createBackground() {
        const { width, height } = this.scale;

        // 渐变星空背景
        for (let y = 0; y < height; y += 4) {
            const alpha = 0.05 + (y / height) * 0.1;
            this.add.rectangle(width / 2, y, width, 4, 0x0a0a1a, alpha);
        }

        // 装饰星星
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 0.8);
            this.add.circle(x, y, size, 0xffffff, alpha);
        }

        // 标题
        this.add.text(width / 2, 50, '选择关卡', {
            fontSize: '48px',
            fontFamily: 'Arial Black, Arial',
            color: '#7c7cff',
            stroke: '#4a4a6a',
            strokeThickness: 6
        }).setOrigin(0.5);
    }

    setupUI() {
        const { width, height } = this.scale;
        const cols = 5;
        const rows = 2;
        const cardW = 140;
        const cardH = 120;
        const gapX = 20;
        const gapY = 20;
        const startX = (width - (cols * cardW + (cols - 1) * gapX)) / 2;
        const startY = 120;

        this.levelCards = [];
        this.unlockedLevels = this.loadUnlockedLevels();

        for (let i = 0; i < LEVEL_COUNT; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gapX);
            const y = startY + row * (cardH + gapY);
            const level = LEVELS[i];
            const unlocked = i === 0 || this.unlockedLevels.includes(level.id);

            this.createLevelCard(x, y, cardW, cardH, level, i + 1, unlocked);
        }

        // 返回按钮
        const backBtn = this.add.text(width / 2, height - 50, '← 返回菜单', {
            fontSize: '20px',
            color: '#aaa',
            fontFamily: 'Arial',
            backgroundColor: '#2a2a4a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setAlpha(0.8));
        backBtn.on('pointerout', () => backBtn.setAlpha(1));
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    createLevelCard(x, y, w, h, level, num, unlocked) {
        const card = this.add.container(x, y);

        // 背景
        const bgColor = unlocked ? 0x2a2a4a : 0x1a1a2a;
        const bg = this.add.rectangle(w / 2, h / 2, w, h, bgColor, 1);
        bg.setStrokeStyle(2, unlocked ? 0x7c7cff : 0x4a4a6a);
        bg.setInteractive({ useHandCursor: unlocked });
        card.add(bg);

        // 关卡编号
        const numText = this.add.text(w / 2, 25, `#${num}`, {
            fontSize: '32px',
            fontFamily: 'Arial Black, Arial',
            color: unlocked ? '#7c7cff' : '#666'
        }).setOrigin(0.5);
        card.add(numText);

        // 关卡名称
        const nameText = this.add.text(w / 2, 60, unlocked ? level.name : '???', {
            fontSize: '14px',
            color: unlocked ? '#fff' : '#666',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setWordWrapWidth(w - 20);
        card.add(nameText);

        // 难度星星
        const stars = Math.min(5, Math.ceil(level.id / 2));
        const starsText = this.add.text(w / 2, 85, unlocked ? '⭐'.repeat(stars) : '🔒', {
            fontSize: '12px'
        }).setOrigin(0.5);
        card.add(starsText);

        // 最佳记录
        const best = this.getBestScore(level.id);
        const bestText = this.add.text(w / 2, 105, best ? `最高分: ${best.score}` : '', {
            fontSize: '10px',
            color: '#FFD700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        card.add(bestText);

        // 锁定遮罩
        if (!unlocked) {
            const lock = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
            card.add(lock);
        }

        // 点击事件
        if (unlocked) {
            bg.on('pointerover', () => {
                bg.setStrokeStyle(3, 0xffffff);
                this.tweens.add({
                    targets: card,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100
                });
            });
            bg.on('pointerout', () => {
                bg.setStrokeStyle(2, 0x7c7cff);
                this.tweens.add({
                    targets: card,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            });
            bg.on('pointerdown', () => this.startLevel(level));
        }

        card.setDepth(10);
    }

    loadUnlockedLevels() {
        try {
            const data = localStorage.getItem('bloxd_unlocked_levels');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    saveUnlockedLevel(levelId) {
        let unlocked = this.loadUnlockedLevels();
        if (!unlocked.includes(levelId)) {
            unlocked.push(levelId);
            localStorage.setItem('bloxd_unlocked_levels', JSON.stringify(unlocked));
        }
    }

    getBestScore(levelId) {
        try {
            const data = localStorage.getItem('bloxd_level_scores');
            if (!data) return null;
            const scores = JSON.parse(data);
            return scores[levelId - 1] || null;
        } catch {
            return null;
        }
    }

    startLevel(level) {
        this.scene.start('GameScene', {
            isOnline: false,
            roomCode: null,
            levelId: level.id
        });
    }
}
