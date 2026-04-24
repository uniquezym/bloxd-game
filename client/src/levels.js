// Bloxd Game - 关卡数据定义
// 每个关卡包含：名称、描述、背景色、世界尺寸、元素数组

const LEVELS = [
    // ==================== 关卡 1：草地练习 ====================
    {
        id: 1,
        name: '草地练习',
        description: '新手入门 - 掌握基本操作',
        bgColor: 0x87CEEB,
        worldWidth: 2400,
        worldHeight: 1000,
        startX: 100,
        startY: 700,
        finishX: 2250,
        finishY: 500,
        elements: [
            // 起点平台
            { type: 'platform', x: 0, y: 768, w: 6 },
            // 简单阶梯
            { type: 'platform', x: 220, y: 700, w: 3 },
            { type: 'coin', x: 236, y: 670 },
            { type: 'platform', x: 380, y: 640, w: 3 },
            { type: 'coin', x: 396, y: 610 },
            { type: 'platform', x: 540, y: 580, w: 3 },
            { type: 'coin', x: 556, y: 550 },
            { type: 'platform', x: 700, y: 520, w: 3 },
            // 间隔跳跃
            { type: 'platform', x: 900, y: 480, w: 4 },
            { type: 'coin', x: 916, y: 450 },
            { type: 'coin', x: 956, y: 450 },
            { type: 'platform', x: 1100, y: 450, w: 3 },
            // 下落平台
            { type: 'platform', x: 1250, y: 550, w: 3 },
            { type: 'coin', x: 1266, y: 520 },
            { type: 'platform', x: 1400, y: 650, w: 3 },
            { type: 'coin', x: 1416, y: 620 },
            // 终点平台
            { type: 'finish', x: 1550, y: 550, w: 6 },
            { type: 'coin', x: 1570, y: 520 },
            { type: 'coin', x: 1610, y: 520 },
        ]
    },

    // ==================== 关卡 2：钉子地狱 ====================
    {
        id: 2,
        name: '钉子地狱',
        description: '危险区域 - 避开所有钉子',
        bgColor: 0x2d1b4e,
        worldWidth: 2800,
        worldHeight: 1000,
        startX: 100,
        startY: 700,
        finishX: 2650,
        finishY: 500,
        elements: [
            // 起点
            { type: 'platform', x: 0, y: 768, w: 5 },
            // 钉子夹道
            { type: 'hazard', x: 200, y: 736, count: 3 },
            { type: 'platform', x: 200, y: 700, w: 3 },
            { type: 'hazard', x: 380, y: 736, count: 2 },
            { type: 'platform', x: 380, y: 620, w: 2 },
            { type: 'coin', x: 396, y: 590 },
            { type: 'hazard', x: 530, y: 736, count: 2 },
            { type: 'platform', x: 530, y: 560, w: 3 },
            { type: 'coin', x: 546, y: 530 },
            // 钉子+平台交替
            { type: 'hazard', x: 720, y: 736, count: 4 },
            { type: 'platform', x: 720, y: 500, w: 3 },
            { type: 'coin', x: 736, y: 470 },
            { type: 'hazard', x: 900, y: 736, count: 3 },
            { type: 'platform', x: 900, y: 460, w: 2 },
            { type: 'coin', x: 916, y: 430 },
            // 高难度区
            { type: 'hazard', x: 1080, y: 736, count: 5 },
            { type: 'platform', x: 1100, y: 400, w: 4 },
            { type: 'coin', x: 1116, y: 370 },
            { type: 'coin', x: 1156, y: 370 },
            { type: 'hazard', x: 1300, y: 736, count: 3 },
            { type: 'platform', x: 1300, y: 350, w: 3 },
            // 窄桥
            { type: 'platform', x: 1500, y: 320, w: 2 },
            { type: 'hazard', x: 1550, y: 288, count: 2 },
            { type: 'platform', x: 1550, y: 300, w: 3 },
            // 终点
            { type: 'finish', x: 1700, y: 350, w: 5 },
            { type: 'coin', x: 1720, y: 320 },
            { type: 'coin', x: 1760, y: 320 },
        ]
    },

    // ==================== 关卡 3：移动迷宫 ====================
    {
        id: 3,
        name: '移动迷宫',
        description: '移动平台 - 掌握Timing',
        bgColor: 0x1a3a5c,
        worldWidth: 3200,
        worldHeight: 1000,
        startX: 100,
        startY: 700,
        finishX: 3050,
        finishY: 400,
        elements: [
            // 起点
            { type: 'platform', x: 0, y: 768, w: 5 },
            // 移动平台链（水平）
            { type: 'moving', x: 200, y: 680, w: 4, dir: 'h', dist: 80, speed: 1.5 },
            { type: 'coin', x: 280, y: 650 },
            { type: 'moving', x: 450, y: 620, w: 3, dir: 'h', dist: 100, speed: 2 },
            { type: 'coin', x: 500, y: 590 },
            { type: 'moving', x: 650, y: 560, w: 3, dir: 'h', dist: 80, speed: 1.8 },
            { type: 'coin', x: 700, y: 530 },
            // 垂直移动平台
            { type: 'platform', x: 850, y: 550, w: 3 },
            { type: 'moving', x: 950, y: 500, w: 3, dir: 'v', dist: 100, speed: 2 },
            { type: 'coin', x: 966, y: 470 },
            // 复杂组合
            { type: 'platform', x: 1150, y: 450, w: 3 },
            { type: 'moving', x: 1280, y: 420, w: 4, dir: 'h', dist: 120, speed: 2.5 },
            { type: 'coin', x: 1320, y: 390 },
            { type: 'coin', x: 1380, y: 390 },
            // 快速移动平台
            { type: 'moving', x: 1500, y: 380, w: 3, dir: 'v', dist: 80, speed: 3 },
            { type: 'platform', x: 1650, y: 350, w: 3 },
            { type: 'moving', x: 1780, y: 320, w: 4, dir: 'h', dist: 100, speed: 2.2 },
            { type: 'coin', x: 1820, y: 290 },
            // 终点
            { type: 'finish', x: 1950, y: 400, w: 6 },
            { type: 'coin', x: 1970, y: 370 },
            { type: 'coin', x: 2010, y: 370 },
        ]
    },

    // ==================== 关卡 4：弹跳乐园 ====================
    {
        id: 4,
        name: '弹跳乐园',
        description: '弹跳垫 - 利用节奏越过高墙',
        bgColor: 0x1a4a1a,
        worldWidth: 2400,
        worldHeight: 1200,
        startX: 100,
        startY: 900,
        finishX: 2250,
        finishY: 300,
        elements: [
            // 起点
            { type: 'platform', x: 0, y: 968, w: 5 },
            // 弹跳垫序列
            { type: 'bounce', x: 200, y: 940 },
            { type: 'platform', x: 280, y: 780, w: 3 },
            { type: 'coin', x: 296, y: 750 },
            { type: 'bounce', x: 380, y: 940 },
            { type: 'platform', x: 480, y: 680, w: 3 },
            { type: 'coin', x: 496, y: 650 },
            { type: 'bounce', x: 600, y: 940 },
            { type: 'platform', x: 700, y: 580, w: 3 },
            { type: 'coin', x: 716, y: 550 },
            // 高墙需要连续弹跳
            { type: 'bounce', x: 850, y: 940 },
            { type: 'platform', x: 950, y: 450, w: 4 },
            { type: 'coin', x: 966, y: 420 },
            { type: 'coin', x: 1006, y: 420 },
            // 双弹跳
            { type: 'bounce', x: 1100, y: 940 },
            { type: 'bounce', x: 1250, y: 940 },
            { type: 'platform', x: 1380, y: 350, w: 3 },
            { type: 'coin', x: 1396, y: 320 },
            // 终点
            { type: 'finish', x: 1500, y: 300, w: 6 },
            { type: 'coin', x: 1520, y: 270 },
            { type: 'coin', x: 1560, y: 270 },
        ]
    },

    // ==================== 关卡 5：冰霜之巅 ====================
    {
        id: 5,
        name: '冰霜之巅',
        description: '冰面关卡 - 低摩擦需要精准控制',
        bgColor: 0x4a6a8a,
        worldWidth: 2600,
        worldHeight: 1000,
        startX: 100,
        startY: 700,
        finishX: 2450,
        finishY: 400,
        // iceMode: true 表示冰面物理（高滑行）
        iceMode: true,
        elements: [
            // 起点
            { type: 'ice', x: 0, y: 768, w: 6 },
            // 冰面滑行
            { type: 'ice', x: 250, y: 700, w: 4 },
            { type: 'coin', x: 266, y: 670 },
            { type: 'ice', x: 450, y: 640, w: 4 },
            { type: 'coin', x: 466, y: 610 },
            // 需要减速拐弯
            { type: 'platform', x: 700, y: 580, w: 3 }, // 普通平台缓冲
            { type: 'ice', x: 850, y: 530, w: 5 },
            { type: 'coin', x: 866, y: 500 },
            { type: 'coin', x: 906, y: 500 },
            // 窄冰道
            { type: 'platform', x: 1100, y: 480, w: 2 },
            { type: 'ice', x: 1200, y: 440, w: 3 },
            { type: 'coin', x: 1216, y: 410 },
            // 冰面+钉子
            { type: 'ice', x: 1400, y: 400, w: 4 },
            { type: 'hazard', x: 1400, y: 368, count: 2 },
            { type: 'coin', x: 1416, y: 370 },
            // 终点前减速
            { type: 'platform', x: 1650, y: 370, w: 3 },
            { type: 'ice', x: 1800, y: 340, w: 5 },
            // 终点
            { type: 'finish', x: 2050, y: 400, w: 6 },
            { type: 'coin', x: 2070, y: 370 },
            { type: 'coin', x: 2110, y: 370 },
        ]
    },

    // ==================== 关卡 6：火焰桥 ====================
    {
        id: 6,
        name: '火焰桥',
        description: '动态危险 - 躲避移动的火焰',
        bgColor: 0x1a0a0a,
        worldWidth: 2800,
        worldHeight: 1000,
        startX: 100,
        startY: 700,
        finishX: 2650,
        finishY: 400,
        elements: [
            // 起点
            { type: 'platform', x: 0, y: 768, w: 5 },
            // 静态钉子区
            { type: 'platform', x: 200, y: 700, w: 4 },
            { type: 'hazard', x: 220, y: 668, count: 3 },
            { type: 'coin', x: 236, y: 670 },
            // 移动火焰（会上下移动的钉子行）
            { type: 'platform', x: 500, y: 650, w: 3 },
            { type: 'fire', x: 500, y: 618, w: 3, dir: 'v', dist: 80, speed: 2 },
            { type: 'coin', x: 516, y: 620 },
            // 移动火焰+平台交替
            { type: 'platform', x: 750, y: 580, w: 3 },
            { type: 'fire', x: 750, y: 548, w: 3, dir: 'v', dist: 100, speed: 2.5 },
            { type: 'platform', x: 1000, y: 500, w: 3 },
            { type: 'fire', x: 1000, y: 468, w: 3, dir: 'v', dist: 60, speed: 3 },
            { type: 'coin', x: 1016, y: 470 },
            // 高难度区
            { type: 'platform', x: 1250, y: 450, w: 4 },
            { type: 'fire', x: 1250, y: 418, w: 4, dir: 'v', dist: 120, speed: 2.8 },
            { type: 'coin', x: 1266, y: 420 },
            { type: 'coin', x: 1310, y: 420 },
            // 终点区
            { type: 'platform', x: 1550, y: 400, w: 3 },
            { type: 'fire', x: 1550, y: 368, w: 3, dir: 'v', dist: 80, speed: 2 },
            { type: 'finish', x: 1750, y: 400, w: 6 },
            { type: 'coin', x: 1770, y: 370 },
            { type: 'coin', x: 1810, y: 370 },
        ]
    },

    // ==================== 关卡 7：金银岛 ====================
    {
        id: 7,
        name: '金银岛',
        description: '收集金币 - 选择最优路线获取最高分',
        bgColor: 0x3a2a0a,
        worldWidth: 3000,
        worldHeight: 1000,
        startX: 100,
        startY: 700,
        finishX: 2850,
        finishY: 400,
        elements: [
            // 起点
            { type: 'platform', x: 0, y: 768, w: 5 },
            // 金币收集路线
            { type: 'platform', x: 200, y: 700, w: 3 },
            { type: 'coin', x: 216, y: 670 },
            { type: 'coin', x: 250, y: 670 },
            { type: 'coin', x: 284, y: 670 },
            // 分支路线 - 上路（多金币但难）
            { type: 'platform', x: 400, y: 620, w: 2 },
            { type: 'coin', x: 416, y: 590 },
            { type: 'coin', x: 450, y: 590 },
            { type: 'coin', x: 484, y: 590 },
            { type: 'platform', x: 580, y: 540, w: 2 },
            { type: 'coin', x: 596, y: 510 },
            { type: 'coin', x: 630, y: 510 },
            // 下路（安全但少金币）
            { type: 'platform', x: 400, y: 750, w: 4 },
            { type: 'coin', x: 416, y: 720 },
            // 汇合
            { type: 'platform', x: 750, y: 600, w: 3 },
            { type: 'coin', x: 766, y: 570 },
            // 高金币区
            { type: 'platform', x: 950, y: 520, w: 3 },
            { type: 'coin', x: 966, y: 490 },
            { type: 'coin', x: 1000, y: 490 },
            { type: 'coin', x: 1034, y: 490 },
            { type: 'coin', x: 1068, y: 490 },
            // 移动平台+金币
            { type: 'moving', x: 1200, y: 480, w: 3, dir: 'h', dist: 80, speed: 1.5 },
            { type: 'coin', x: 1240, y: 450 },
            { type: 'coin', x: 1300, y: 450 },
            // 终点
            { type: 'finish', x: 1450, y: 400, w: 6 },
            { type: 'coin', x: 1470, y: 370 },
            { type: 'coin', x: 1510, y: 370 },
        ]
    },

    // ==================== 关卡 8：天空之桥 ====================
    {
        id: 8,
        name: '天空之桥',
        description: '极限挑战 - 长距离移动平台跳跃',
        bgColor: 0x0a1a2a,
        worldWidth: 3600,
        worldHeight: 1200,
        startX: 100,
        startY: 900,
        finishX: 3450,
        finishY: 300,
        elements: [
            // 起点
            { type: 'platform', x: 0, y: 968, w: 4 },
            // 连续移动平台（无落脚点）
            { type: 'moving', x: 200, y: 880, w: 3, dir: 'h', dist: 100, speed: 2 },
            { type: 'coin', x: 240, y: 850 },
            { type: 'moving', x: 450, y: 800, w: 3, dir: 'h', dist: 120, speed: 2.5 },
            { type: 'coin', x: 490, y: 770 },
            { type: 'moving', x: 700, y: 720, w: 3, dir: 'v', dist: 80, speed: 2 },
            { type: 'coin', x: 716, y: 690 },
            // 垂直跳升
            { type: 'bounce', x: 850, y: 940 },
            { type: 'platform', x: 950, y: 600, w: 3 },
            { type: 'coin', x: 966, y: 570 },
            // 超长移动平台链
            { type: 'moving', x: 1100, y: 550, w: 2, dir: 'h', dist: 150, speed: 3 },
            { type: 'coin', x: 1140, y: 520 },
            { type: 'moving', x: 1350, y: 500, w: 2, dir: 'v', dist: 100, speed: 2.5 },
            { type: 'coin', x: 1366, y: 470 },
            { type: 'moving', x: 1550, y: 450, w: 2, dir: 'h', dist: 120, speed: 2.8 },
            { type: 'coin', x: 1590, y: 420 },
            // 最后冲刺
            { type: 'bounce', x: 1750, y: 940 },
            { type: 'platform', x: 1850, y: 380, w: 3 },
            { type: 'coin', x: 1866, y: 350 },
            { type: 'moving', x: 2000, y: 350, w: 3, dir: 'h', dist: 100, speed: 2 },
            { type: 'coin', x: 2040, y: 320 },
            // 终点
            { type: 'finish', x: 2200, y: 300, w: 6 },
            { type: 'coin', x: 2220, y: 270 },
            { type: 'coin', x: 2260, y: 270 },
        ]
    },

    // ==================== 关卡 9：时空裂缝 ====================
    {
        id: 9,
        name: '时空裂缝',
        description: '逆向思维 - 利用移动平台反向跳跃',
        bgColor: 0x1a0a2a,
        worldWidth: 3000,
        worldHeight: 1200,
        startX: 100,
        startY: 900,
        finishX: 2850,
        finishY: 300,
        elements: [
            // 起点
            { type: 'platform', x: 0, y: 968, w: 5 },
            // 正向移动平台
            { type: 'moving', x: 250, y: 880, w: 3, dir: 'h', dist: 80, speed: 2 },
            { type: 'coin', x: 290, y: 850 },
            // 需要反向上跳
            { type: 'platform', x: 450, y: 750, w: 3 },
            { type: 'bounce', x: 450, y: 940 }, // 从下方弹跳
            { type: 'coin', x: 466, y: 720 },
            // 向上移动的平台（跳上去再跳）
            { type: 'moving', x: 650, y: 700, w: 3, dir: 'v', dist: 100, speed: 1.5 },
            { type: 'coin', x: 666, y: 670 },
            { type: 'platform', x: 850, y: 550, w: 3 },
            { type: 'bounce', x: 850, y: 940 },
            // 时空裂缝区 - 快速移动
            { type: 'moving', x: 1000, y: 500, w: 2, dir: 'h', dist: 150, speed: 3.5 },
            { type: 'coin', x: 1040, y: 470 },
            { type: 'moving', x: 1250, y: 470, w: 2, dir: 'v', dist: 120, speed: 3 },
            { type: 'coin', x: 1266, y: 440 },
            // 逆向下落
            { type: 'platform', x: 1450, y: 400, w: 3 },
            { type: 'bounce', x: 1450, y: 940 },
            { type: 'coin', x: 1466, y: 370 },
            { type: 'coin', x: 1500, y: 370 },
            // 终点区
            { type: 'moving', x: 1650, y: 380, w: 3, dir: 'h', dist: 100, speed: 2.5 },
            { type: 'finish', x: 1850, y: 300, w: 6 },
            { type: 'coin', x: 1870, y: 270 },
            { type: 'coin', x: 1910, y: 270 },
        ]
    },

    // ==================== 关卡 10：终极挑战 ====================
    {
        id: 10,
        name: '终极挑战',
        description: '全能考验 - 所有机制的大融合',
        bgColor: 0x0a0a0a,
        worldWidth: 4000,
        worldHeight: 1200,
        startX: 100,
        startY: 900,
        finishX: 3850,
        finishY: 300,
        elements: [
            // 起点
            { type: 'platform', x: 0, y: 968, w: 5 },
            // 1. 草地+钉子入门
            { type: 'platform', x: 200, y: 880, w: 3 },
            { type: 'hazard', x: 220, y: 848, count: 2 },
            { type: 'coin', x: 236, y: 850 },
            // 2. 弹跳垫越过钉墙
            { type: 'bounce', x: 380, y: 940 },
            { type: 'hazard', x: 380, y: 736, count: 5 },
            { type: 'platform', x: 500, y: 700, w: 3 },
            { type: 'coin', x: 516, y: 670 },
            // 3. 移动平台
            { type: 'moving', x: 700, y: 650, w: 3, dir: 'h', dist: 100, speed: 2 },
            { type: 'coin', x: 740, y: 620 },
            { type: 'moving', x: 950, y: 600, w: 3, dir: 'v', dist: 80, speed: 2.5 },
            { type: 'coin', x: 966, y: 570 },
            // 4. 冰面滑行
            { type: 'platform', x: 1150, y: 550, w: 2 }, // 缓冲
            { type: 'ice', x: 1300, y: 500, w: 5 },
            { type: 'coin', x: 1316, y: 470 },
            { type: 'coin', x: 1356, y: 470 },
            // 5. 移动火焰
            { type: 'platform', x: 1550, y: 450, w: 3 },
            { type: 'fire', x: 1550, y: 418, w: 3, dir: 'v', dist: 80, speed: 2.5 },
            { type: 'coin', x: 1566, y: 420 },
            // 6. 综合区
            { type: 'moving', x: 1750, y: 420, w: 3, dir: 'h', dist: 100, speed: 2 },
            { type: 'hazard', x: 1750, y: 388, count: 2 },
            { type: 'coin', x: 1790, y: 390 },
            { type: 'bounce', x: 1900, y: 940 },
            { type: 'platform', x: 2000, y: 350, w: 3 },
            { type: 'coin', x: 2016, y: 320 },
            // 7. 高难度移动平台
            { type: 'moving', x: 2150, y: 320, w: 2, dir: 'v', dist: 100, speed: 3 },
            { type: 'coin', x: 2166, y: 290 },
            { type: 'moving', x: 2350, y: 300, w: 2, dir: 'h', dist: 120, speed: 3.5 },
            { type: 'coin', x: 2390, y: 270 },
            // 8. 火焰+移动组合
            { type: 'platform', x: 2550, y: 280, w: 3 },
            { type: 'fire', x: 2550, y: 248, w: 3, dir: 'v', dist: 60, speed: 3 },
            { type: 'coin', x: 2566, y: 250 },
            // 9. 终极冲刺
            { type: 'bounce', x: 2700, y: 940 },
            { type: 'moving', x: 2850, y: 250, w: 2, dir: 'h', dist: 80, speed: 2.5 },
            { type: 'coin', x: 2890, y: 220 },
            // 终点
            { type: 'finish', x: 3000, y: 300, w: 8 },
            { type: 'coin', x: 3020, y: 270 },
            { type: 'coin', x: 3060, y: 270 },
            { type: 'coin', x: 3100, y: 270 },
        ]
    }
];

// 导出
window.LEVELS = LEVELS;
window.LEVEL_COUNT = LEVELS.length;
