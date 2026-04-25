// 菜单场景
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.createBackground();
        this.setupUI();
        this.setupNetworkEvents();
    }

    createBackground() {
        const { width, height } = this.scale;

        // 渐变背景
        for (let i = 0; i < height; i += 4) {
            const alpha = 0.1 + (i / height) * 0.1;
            const y = i;
            this.add.rectangle(width / 2, y, width, 4, 0x1a1a2e, alpha);
        }

        // 装饰方块
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(20, 60);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.3);
            const rect = this.add.rectangle(x, y, size, size, 0x4a4a6a, alpha);
            rect.setAngle(Phaser.Math.Between(0, 4) * 45);
        }

        // 标题
        this.add.text(width / 2, height * 0.25, 'BLOXD', {
            fontSize: '72px',
            fontFamily: 'Arial Black, Arial',
            color: '#7c7cff',
            stroke: '#4a4a6a',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.33, 'Multiplayer Parkour', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#aaa'
        }).setOrigin(0.5);
    }

    setupUI() {
        const { width, height } = this.scale;
        const centerY = height * 0.55;

        // 名字输入框
        this.nameInput = this.add.dom(width / 2, height * 0.25 + 80).createFromHTML(`
            <input type="text" id="menu-name-input" placeholder="Enter your name"
                   maxlength="12" value="${this.getSavedName()}" style="
                padding: 12px 20px; font-size: 18px; border: 2px solid #4a4a6a;
                border-radius: 8px; background: #2a2a4a; color: #fff;
                text-align: center; width: 220px;
            ">
        `);

        // 按钮样式
        const buttonStyle = {
            padding: '15px 40px',
            fontSize: '20px',
            borderRadius: '8px',
            cursor: 'pointer'
        };

        // 创建房间按钮
        this.createButton(width / 2, centerY + 20, 'Create Room', '#7c7cff', () => {
            const name = this.getPlayerName();
            this.network.createRoom(name);
            try { localStorage.setItem('bloxd_player_name', name); } catch (e) {}
        });

        // 加入房间按钮
        this.createButton(width / 2, centerY + 80, 'Join Room', '#4a7c59', () => {
            this.showJoinForm();
        });

        // 关卡选择按钮
        this.createButton(width / 2, centerY + 150, '关卡模式', '#ff7c7c', () => {
            this.scene.start('LevelScene');
        });

        // 输入框
        this.roomInput = this.add.dom(width / 2, centerY + 60).createFromHTML(`
            <input type="text" id="menu-room-input" placeholder="ROOM CODE"
                   maxlength="6" style="
                padding: 12px 20px; font-size: 18px; border: 2px solid #4a4a6a;
                border-radius: 8px; background: #2a2a4a; color: #fff;
                text-align: center; width: 180px; display: none;
            ">
        `);

        this.joinConfirmBtn = this.add.dom(width / 2, centerY + 110).createFromHTML(`
            <button id="menu-join-confirm" style="
                padding: 12px 30px; font-size: 16px; border: none; border-radius: 8px;
                background: #4a7c59; color: #fff; cursor: pointer; display: none;
            ">Join</button>
        `);

        // 错误提示
        this.errorText = this.add.text(width / 2, height * 0.85, '', {
            fontSize: '16px',
            color: '#ff6b6b'
        }).setOrigin(0.5);

        // 状态文本
        this.statusText = this.add.text(width / 2, height * 0.78, '', {
            fontSize: '14px',
            color: '#888'
        }).setOrigin(0.5);
    }

    createButton(x, y, text, color, callback) {
        const btn = this.add.text(x, y, text, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#fff',
            backgroundColor: color,
            padding: { x: 30, y: 15 },
            borderRadius: 8
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setAlpha(0.8));
        btn.on('pointerout', () => btn.setAlpha(1));
        btn.on('pointerdown', callback);

        return btn;
    }

    getPlayerName() {
        const input = document.getElementById('menu-name-input');
        return input ? (input.value.trim() || `Player${Math.floor(Math.random() * 9999)}`) : 'Anonymous';
    }

    getSavedName() {
        try {
            const saved = localStorage.getItem('bloxd_player_name');
            return saved || '';
        } catch (e) {
            return '';
        }
    }

    showJoinForm() {
        const input = document.getElementById('menu-room-input');
        const btn = document.getElementById('menu-join-confirm');

        input.style.display = 'block';
        btn.style.display = 'block';
        input.focus();

        btn.onclick = () => {
            const code = input.value.trim().toUpperCase();
            if (code.length === 6) {
                this.network.joinRoom(code, this.getPlayerName());
                // 保存名字
                try {
                    localStorage.setItem('bloxd_player_name', this.getPlayerName());
                } catch (e) {}
            } else {
                this.showError('Please enter a 6-character room code');
            }
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') btn.click();
        };
    }

    setupNetworkEvents() {
        // 连接到本地服务器
        this.network = new NetworkManager(this.game);
        this.network.connect('localhost', 3000)
            .then(() => {
                this.statusText.setText('Connected to server');
                this.statusText.setColor('#4a7c59');
            })
            .catch(() => {
                this.statusText.setText('Server not found - Solo mode available');
                this.statusText.setColor('#ff7c7c');
            });

        this.network.events.on('room_created', (data) => {
            this.scene.start('LobbyScene', {
                isOnline: true,
                roomCode: data.roomCode,
                playerId: data.playerId,
                isHost: true,
                network: this.network
            });
        });

        this.network.events.on('room_joined', (data) => {
            this.scene.start('LobbyScene', {
                isOnline: true,
                roomCode: data.roomCode,
                playerId: data.playerId,
                isHost: data.isHost || false,
                network: this.network
            });
        });

        this.network.events.on('error', (data) => {
            this.showError(data.message);
        });
    }

    showError(message) {
        this.errorText.setText(message);
        this.time.delayedCall(3000, () => this.errorText.setText(''));
    }
}
