"use strict";

const BACKGROUND = 0x11100C;
const DARK_GRASS = 0x1B1910;
const GRASS = 0x6C5533;
const STONES = 0x40261E;
const WOOD = 0xDF9080;
const LIGHT = 0xFFE0BD;
const GOLD = 0xFF8800;

const TEXT_STYLE = {
    dropShadow: true,
    dropShadowAngle: 0,
    dropShadowBlur: 15,
    dropShadowDistance: 0,
    fill: 0xFFFFFF,
    fontWeight: "bold",
    align: "center",
    padding: 25,
    stroke: BACKGROUND,
    strokeThickness: 2
};

const Mouse = { x: 0, y: 0 };
const PointedCell = { x: 0, y: 0 };
let BackgroundMusic = null;
let HoverSound = null;
let ScoreSound = null;

const App = new PIXI.Application({ background: BACKGROUND, resizeTo: window });

let animation = 0;
let happiness = 1;
let Emotion = null;

const Game = new PIXI.Container();
Game.alpha = 0.0;
const Loader = new PIXI.Container();
const LoadingSprite = new PIXI.Sprite();
LoadingSprite.anchor.set(0.5);
LoadingSprite.scale.set(2.0);
const Progress = new PIXI.Text("", {...TEXT_STYLE,
    fontSize: 50,
    fill: LIGHT
});
Progress.anchor.set(0.5);
Loader.addChild(LoadingSprite);
Loader.addChild(Progress);
App.stage.addChild(Loader);

const UI = new PIXI.Container();
const Layout = {
    topLeft: new PIXI.Container(),
    top: new PIXI.Container(),
    topRight: new PIXI.Container(),
    right: new PIXI.Container(),
    bottomRight: new PIXI.Container(),
    bottom: new PIXI.Container(),
    bottomLeft: new PIXI.Container(),
    left: new PIXI.Container()
};

const Objects = {
    snake: new PIXI.Sprite(),
    tail: new PIXI.Sprite()
};

const Buttons = { };

const Ground = new PIXI.Container();

let urls = [
    "audios/background.mp3",
    "audios/score.mp3",
    "audios/hover.mp3",
    "sprites/grass.png",
    "sprites/stones.png",
    "sprites/dash.png",
    "sprites/star.png",
    "sprites/seeds.png",
    "sprites/bag.png",
    "sprites/shadow.png",
    "sprites/rotate.png",
    "sprites/rotate_hover.png",
    "sprites/restart.png",
    "sprites/music.png",
    "sprites/sound.png",
    "sprites/snake/snake_idle.png",
    "sprites/snake/snake_blink.png",
    "sprites/snake/snake_happy.png",
    "sprites/snake_tail.png",
    "sprites/flowers/001/01.png",
    "sprites/flowers/001/02.png",
    "sprites/flowers/001/03.png",
    "sprites/flowers/002/02.png",
    "sprites/flowers/002/01.png",
    "sprites/flowers/002/03.png",
    "sprites/flowers/003/01.png",
    "sprites/flowers/003/02.png",
    "sprites/flowers/003/03.png",
    "sprites/flowers/004/01.png",
    "sprites/flowers/004/02.png",
    "sprites/flowers/004/03.png",
    "sprites/flowers/005/01.png",
    "sprites/flowers/005/02.png",
    "sprites/flowers/005/03.png",
    "sprites/flowers/006/01.png",
    "sprites/flowers/006/02.png",
    "sprites/flowers/006/03.png"
];

const Assets = { };

const num = 3;
const den = 4;

let SELECTED_TYPES = [
    "001",
    "002",
    "003",
    "004",
    "005",
    "006"
];

let Sides = [
    {x: 0, y: -1},
    {x: 1, y: -1},
    {x: 1, y: 0},
    {x: 0, y: 1},
    {x: -1, y: 1},
    {x: -1, y: 0}
];

const Positions = {
    1: {
        1: { x: 0, y: 40 }
    },
    3: {
        1: { x: -13, y: 40 },
        2: { x: 13, y: 45 },
        3: { x: 0, y: 20 }
    }
};

let isFisrtTime = true;
let isPointerDown = false;
let isPointerMove = false;
let isHappy = false;
let isBundlesMoving = false;
let isSpinning = false;
let isLoaded = false;

/**
 * 
 */

class Random {
    static random(min, max) {
        return (Math.round(min + Math.random() * max));
    }

    static choose(array) {
        let index = Math.floor(Math.random() * array.length);

        return array[index];
    }

    static chance(chance) {
        return (Math.random() <= chance);
    }
}

class Easing {
    static easeLinear(t, b, c, d) {
        return c * t / d + b;
    }

    static easeInOutSine(t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    }
}

class Tween {
    static start(frames, fps, animation, result) {
        if (!isLoaded) return;
        let progress = 0;
        let p = frames / fps;
        let time = 0;
    
        const onTick = () => {
            progress += p;
            time = (progress / frames);
    
            animation(time);
            
            if (progress >= frames) {
                PIXI.Ticker.shared.remove(onTick);
                if (result) result();
            }
        }
        PIXI.Ticker.shared.add(onTick);
    }
}

class Data {

    static send(data) {
        localStorage.Seeds = JSON.stringify(data);
    }

    static get() {
        let data = {};
        if ("Seeds" in localStorage) data = { Seeds: JSON.parse(localStorage.Seeds) };
        return data;
    }
}

class Score {
    static scoreContainer = new PIXI.Container()
    static questContainer = new PIXI.Container()
    static #score = 0
    static scoreLabel
    static scoreIncrementLabel
    static #reward = 0

    static #quest = { }

    static setup() {
        Score.#score = 0;
        Score.scoreContainer.destroy({ children: true });
        Score.questContainer.destroy({ children: true });
        
        Score.scoreContainer = new PIXI.Container();
        Score.questContainer = new PIXI.Container();
        Score.scoreLabel = new PIXI.Text(Score.getScoreText(), { ...TEXT_STYLE, 
            fontSize: 32, 
            fill: WOOD
        });
        Score.scoreIncrementLabel = new PIXI.Text("+ 0", {...TEXT_STYLE,
            fontSize: 32, 
            fill: WOOD
        });

        Score.scoreContainer.y = -35;

        Score.scoreLabel.anchor.set(0.5);
        Score.scoreContainer.addChild(Score.scoreLabel); 

        Score.scoreIncrementLabel.anchor.set(0.5);
        Score.scoreIncrementLabel.alpha = 0;
        Score.scoreContainer.addChild(Score.scoreIncrementLabel);

        Score.questContainer.y = 35;
        Score.questContainer.sortableChildren = true;

        Layout.bottom.addChild(Score.scoreContainer);
        Layout.top.addChild(Score.questContainer);

        Score.setupQuest();
    }

    static setupQuest() {
        Score.#quest = { };
        let start = -(SELECTED_TYPES.length / 2 - 0.5);
        for (let type = 0; type < SELECTED_TYPES.length; type++) {
            Score.#quest[SELECTED_TYPES[type]] = { required: 15, current: 0 };

            let x = (start + type) * 80;
            
            let shadow = new PIXI.Sprite(Assets.shadow);
            shadow.tint = BACKGROUND;
            shadow.anchor.set(0.5);
            shadow.zIndex = 1;
            shadow.x = x;
            Score.questContainer.addChild(shadow);
            
            let flower = new PIXI.Sprite(Assets[SELECTED_TYPES[type]][0]);
            flower.anchor.set(0.5);
            flower.anchor.set(0.5);
            flower.zIndex = 2;
            flower.x = x - 10;
            Score.questContainer.addChild(flower);
            
            let score = new PIXI.Text(Score.getQuestScoreText(SELECTED_TYPES[type]), {...TEXT_STYLE,
                fontSize: 20, 
                fill: WOOD,
                lineHeight: 16,
                strokeThickness: 0,
                dropShadow: false
            });
            score.name = Score.getQuestScoreName(SELECTED_TYPES[type]);
            score.anchor.set(0.0, 0.5);
            score.zIndex = 3;
            score.x = x + 5;
            Score.questContainer.addChild(score);
        }
    }

    static addScore(value) {
        Score.#score += value;
        Score.scoreLabel.text = Score.getScoreText();
        Score.scoreIncrementLabel.text = "+ " + value;

        Tween.start(100, 50, time => {
            let a = Math.abs(Easing.easeInOutSine(time, -1.0, 2.0, 1));
            let l = Easing.easeLinear(time, 100, -100, 1);
            Score.scoreLabel.scale.set(1.25 - a * 0.25);
            Score.scoreIncrementLabel.alpha = 1.0 - a;
            Score.scoreIncrementLabel.pivot.y = l;
            
            for (let i in Score.questContainer.children) {
                Score.questContainer.children[i].scale.set(1.25 - a * 0.25);
            }
        });
    }

    static getScoreText() {
        return ("\u{1F65E} " + Score.#score + " \u{1F65C}");
    }

    static getQuestScoreText(quest) {
        return (Score.#quest[quest].current + "\n" + Score.#quest[quest].required);
    }

    static getQuestScoreName(quest) {
        return ("QuestScore_" + quest);
    }

    static getQuestScoreLabel(quest) {
        return Score.questContainer.getChildByName(Score.getQuestScoreName(quest));
    }

    static addQuestScore(type, value) {
        Score.#quest[type].current += value;
        Score.getQuestScoreLabel(type).text = Score.getQuestScoreText(type);
    }

    static checkQuest() {
        let modif = 0;
        let reward = 0;
        for (let type in Score.#quest) {
            let check = Score.#quest[type].current >= Score.#quest[type].required;
            if (!check) continue;

            modif += (1 / 6);
            let dif = Score.#quest[type].current - Score.#quest[type].required;
            reward = Score.#quest[type].required / 12;
            Score.#quest[type].current = 0;
            Score.#quest[type].required += 5;
            Score.addQuestScore(type, dif);

        }
        Score.#reward += 1;
        return Math.round(reward);
        //return Math.round(Score.#reward * modif);
    }

    static get score() {
        return Score.#score;
    }
}

class Table {
    static #Cells = {}
    static #offX = 95;
    static #offY = 110;

    static Pointer

    static #layers = []

    static setup() {
        Table.#Cells = {};
        for (let i in Table.#layers) {
            Table.#layers[i].destroy({ children: true });
        }

        Table.#layers = [ new PIXI.Container(), new PIXI.Container(), new PIXI.Container() ];
        Table.#layers[1].pivot.y = 10;
        Ground.addChild(...Table.#layers);
        Table.addPointer();
    }

    static addPointer() {
        let container = new PIXI.Container();
        container.name = "Pointer";
    
        let point = new PIXI.Sprite(Assets.star);
        point.anchor.set(0.5);
        point.scale.set(0.6);
        point.eventMode = "none";
    
        container.addChild(point);
        for (let i = 0; i < 6; i++) {
            let side = new PIXI.Container();
            side.angle = i * 60;
            side.name = "Side_" + i;
            side.visible = false;
    
            let star = new PIXI.Sprite(Assets.star);
            star.anchor.set(0.5);
            star.scale.set(0.8);
            star.y = -37.5;
            star.eventMode = "none";
            side.addChild(star);
            container.addChild(side);
        }

        Table.Pointer = container;
        Table.#layers[2].addChild(container);
    }

    static setSideOfPointer(index, shine) {
        if (Table.Pointer == null) Table.addPointer();

        let sideName = Table.getSideName(index);
        Table.Pointer.getChildByName(sideName).visible = shine;
    }

    static getCellName(x, y) {
        return ("Cell_x" + x + "_y" + y);
    }

    static getSideName(index) {
        return ("Side_" + index);
    }

    static getSeedName(seed) {
        return ("Seed_" + seed);
    }

    static addCell(x, y) {
        if (!(x in Table.#Cells)) Table.#Cells[x] = { };
        if (!(y in Table.#Cells[x])) Table.#Cells[x][y] = {
            seed: null, preffered: Array.from(new Array(6), () => null)
        };
        
        let cellName = Table.getCellName(x, y);
        
        if (Table.#layers[0].getChildByName(cellName) != null) return;
        
        let cell = new PIXI.Container();
        cell.name = cellName;
        cell.hitArea = new PIXI.Polygon([
            -60, 0,
            -30, -50,
            30, -50,
            60, 0,
            30, 50,
            -30, 50
        ]);
        cell.cursor = "pointer";
        cell.interactiveChildren = false;
        cell.eventMode = "static";
        
        let grass = new PIXI.Sprite(Assets.grass);
        grass.name = "Grass";
        grass.anchor.set(0.5);
        grass.tint = DARK_GRASS;
        grass.angle = Math.floor(Math.random() * 6) * 60;
        grass.pivot.x = 0;
        grass.pivot.y = 0;
        cell.addChild(grass);
        
        let stones = new PIXI.Sprite(Assets.stones);
        stones.name = "Stones";
        stones.anchor.set(0.5);
        stones.tint = STONES;
        stones.visible = false;
        cell.addChild(stones);
        
        cell.onpointerup = () => { plant(x, y); };
        cell.onpointerover = () => { sidesCheck(x, y);};
        
        Table.#layers[0].addChild(cell);
        Table.updateCellPosition(cell, x, y);
    }

    static getCell(x, y) {
        let cellName = Table.getCellName(x, y);
        return Table.#layers[0].getChildByName(cellName);
    }

    static getCellData(x, y) {
        if (!(x in Table.#Cells)) return null;
        if (!(y in Table.#Cells[x])) return null;
        return Table.#Cells[x][y];
    }

    static setCellSeed(x, y, seed) {
        if (seed == null) return;   // Должно быть число
        Table.addCell(x, y);    // На всякий случай :р
        let cell = Table.getCell(x, y);
        let data = Table.getCellData(x, y);
        data.seed = seed;

        cell.getChildByName("Grass").tint = GRASS;
        cell.getChildByName("Stones").visible = true;
        cell.eventMode = "none";
    }

    static removeCellSeed(x, y) {
        Table.addCell(x, y);    // На всякий случай :р
        let data = Table.getCellData(x, y);
        data.seed = null;
        
        let cell = Table.getCell(x, y);
        cell.getChildByName("Grass").tint = DARK_GRASS;
        cell.getChildByName("Stones").visible = false;
        cell.eventMode = "static";
    }

    static getCellSeed(x, y) {
        Table.addCell(x, y);    // На всякий случай :р
        let data = Table.getCellData(x, y);
        return data.seed;
    }

    static setCellPrefferedSide(x, y, index, type) {
        Table.addCell(x, y);
        let data = Table.getCellData(x, y);
        data.preffered[index] = type;
    }

    static getCellPrefferedSide(x, y, index) {
        Table.addCell(x, y);
        let data = Table.getCellData(x, y);
        return data.preffered[index];
    }

    static addSeed(seed, x, y) {
        let cell = new PIXI.Container();
        cell.name = Table.getSeedName(seed);
        Table.setCellSeed(x, y, seed);

        Table.#layers[1].addChild(cell);
        Table.updateCellPosition(cell, x, y);
        Table.Pointer.visible = false;
    }

    static getSeed(seed) {
        return Table.#layers[1].getChildByName(Table.getSeedName(seed));
    }

    static setSeedSide(seed, index, type, count) {
        let cell = Table.getSeed(seed);
        if (cell == null) return;

        let side = Table.getSeedSide(seed, index);
        if (side != null) side.destroy({ children: true });
        side = new PIXI.Container();
        side.name = Table.getSideName(index);
        side.angle = index * 60;

        let positions = Positions[count];
        
        for (let c = 1; c <= count; c++) {
            let flower = new PIXI.Sprite(Assets[type][c - 1]);
            flower.anchor.set(0.5);
            flower.x = -positions[c].x;
            flower.y = -positions[c].y;
            flower.scale.y = den / num;
            flower.angle = -side.angle;
            side.addChild(flower);
        }

        cell.addChild(side);
    }

    static getSeedSide(seed, index) {
        return Table.getSeed(seed).getChildByName(Table.getSideName(index));
    }

    static updateCellPosition(Object, x, y) {
        Object.x = Table.#offX * x;
        Object.y = Table.#offY * y + Table.#offY * 0.5 * x;
        let zIndex = (x + y * 2);
        if (Object.zIndex != zIndex) Object.zIndex = zIndex;
    }

    static setPointerOnCell(x, y) {
        Table.Pointer.visible = true;
        PointedCell.x = x;
        PointedCell.y = y;
        Table.updateCellPosition(Table.Pointer, x, y);
    }
}

class Bag {
    static container = new PIXI.Container();
    static totalSeeds = new PIXI.Text("", {...TEXT_STYLE,
        dropShadowBlur: 5, 
        dropShadowColor: 0xFFFFFF,
        strokeThickness: 0,
        fontWeight: "normal",
        fontSize: 32
    })
    static incrementSeeds = new PIXI.Text("", {...TEXT_STYLE,
        dropShadowBlur: 5, 
        dropShadowColor: 0xFFFFFF,
        strokeThickness: 0,
        fontWeight: "normal",
        fontSize: 32
    })
    static #Bundles = new PIXI.Container()

    static #Seeds = { 
        list: [],
        current: 0
    }

    static setup() {
        Bag.container.destroy({ children: true });

        Bag.container = new PIXI.Container();
        Bag.totalSeeds = new PIXI.Text("", {...TEXT_STYLE,
            dropShadowBlur: 5, 
            dropShadowColor: 0xFFFFFF,
            strokeThickness: 0,
            fontWeight: "normal",
            fontSize: 32
        });
        Bag.container = new PIXI.Container();
        Bag.incrementSeeds = new PIXI.Text("", {...TEXT_STYLE,
            dropShadowBlur: 5, 
            dropShadowColor: 0xFFFFFF,
            strokeThickness: 0,
            fontWeight: "normal",
            fontSize: 32
        });
        Bag.#Bundles = new PIXI.Container();

        Bag.#Bundles.sortableChildren = false;
        Bag.#Bundles.zIndex = 2;
        Bag.container.addChild(Bag.#Bundles);

        let bag = new PIXI.Sprite(Assets.bag);
        bag.anchor.set(1.0, 1.0);
        bag.zIndex = 5;
        bag.eventMode = "none";
        Bag.container.addChild(bag);
        
        Bag.totalSeeds.anchor.set(0.5, 1.0);
        Bag.totalSeeds.zIndex = 10;
        Bag.totalSeeds.eventMode = "none";
        Bag.totalSeeds.pivot.x = 70;
        Bag.totalSeeds.pivot.y = 5;
        Bag.container.addChild(Bag.totalSeeds);
        
        Bag.incrementSeeds.anchor.set(0.5, 1.0);
        Bag.incrementSeeds.zIndex = 10;
        Bag.incrementSeeds.eventMode = "none";
        Bag.incrementSeeds.pivot.x = 70;
        Bag.incrementSeeds.pivot.y = 40;
        Bag.incrementSeeds.alpha = 0.0;
        Bag.container.addChild(Bag.incrementSeeds);
        Layout.bottomRight.addChild(Bag.container);
    }
    
    static create() {
        Bag.addSeeds(10);

        for (let i = 0; i < 3; i++) {
            Bag.createBundle();
        }

        Bag.animation(0);
    }

    static load(data) {
        Bag.#Seeds.list.length = 0;
        Bag.#Seeds.current = data.current;
        Bag.#Seeds.list = data.list;

        for (let i = 0; i < 3; i++) {
            Bag.createBundle();
        }

        Bag.animation(0);
    }

    static updateCount() {
        let count = Bag.#Seeds.list.length - Bag.#Seeds.current;
        Bag.totalSeeds.text = "\u{2619} " + count + " \u{2767}";

        let isGameOver = (count == 0);

        if (isGameOver) GameOver();
        return isGameOver;
    }

    /**
     * Семена 
     */

    static addSeeds(n) {
        for (let i = 0; i < n; i++) {
            Bag.#Seeds.list.push(Bag.newSeed());
            Bag.createBundle();
        }

        if (n == 0) return;
        Bag.incrementSeeds.text = "+ " + n;
        Bag.countAnimation();
        Bag.updateCount();
        Data.send(Bag.#Seeds);
    }

    static newSeed() {
        let sides = [];

        let type = null;
        let chance = 1.0;

        for (let i = 0; i < 6; i++) {
            if (Random.chance(chance)) {
                type = Random.choose(SELECTED_TYPES);
                chance -= 0.25;
            }

            sides.push({ type: type });
        }

        return { sides: sides, point: { x: null, y: null }};
    }

    static removeSeeds() {
        Bag.#Seeds.list.length = 0;
        Bag.#Seeds.current = 0;
        Data.send(Bag.#Seeds);
    }

    static exchangeCurrentSeed() {
        if (Bag.seedAt(0) == null) return;

        let index = Bag.#Seeds.current;
        Bag.#Seeds.list[index] = Bag.newSeed();
        
        Data.send(Bag.#Seeds);

        Bag.replaceFirstBundle();

        Bag.animation(0);
    }

    static setSeedPoint(seed, x, y) {
        let Seed = Bag.getSeed(seed);
        let send = (Seed.point.x == null || Seed.point.y == null);
        Seed.point.x = x;
        Seed.point.y = y;
        if (send) Data.send(Bag.#Seeds);
    }

    static toNextSeed() {
        Bag.#Seeds.current += 1;
        Bag.updateCount();
        Data.send(Bag.#Seeds);
    }

    static get current() {
        return Bag.#Seeds.current;
    }

    static getSeed(index) {
        return Bag.#Seeds.list[index];
    }

    static seedAt(relI) {
        let index = Bag.#Seeds.current + relI;
        return Bag.#Seeds.list[index];
    }

    static getSeedSide(seed, index) {
        return Bag.getSeed(seed).sides[index];
    }

    static countAnimation() {
        Tween.start(100, 50, (time) => {
            let a = Easing.easeInOutSine(time, 2.0, -2.0, 1) / 2;
            Bag.incrementSeeds.alpha = a;
        });
    }

    /**
     * Мешки
     */

    static createBundle() {
        let index = Bag.#Bundles.children.length;
        if (index > 2) return;

        if (Bag.seedAt(index) == null) return;
        
        Bag.addBundle(index);
    }

    static replaceFirstBundle() {
        if (Bag.seedAt(0) == null) return;

        if (Bag.#Bundles.children[0]) Bag.#Bundles.children[0].destroy({ children: true });

        Bag.addBundle(0);
    }

    static addBundle(index) {
        let container = new PIXI.Container();

        let topLayer = new PIXI.Container();
        let bottomLayer = new PIXI.Container();
        
        let bundle = new PIXI.Sprite(Assets.seeds);
        bundle.anchor.set(0.5);
        topLayer.addChild(bundle);
        
        for (let i = 0; i < 6; i++) {
            let dash = new PIXI.Sprite(Assets.dash);
            dash.anchor.set(0.5, 1.0);
            dash.pivot.y = 50;
            dash.angle = 90 + i * 60;
            topLayer.addChild(dash);
        }

        container.addChildAt(bottomLayer, 0);
        container.addChildAt(topLayer, 1);
        Bag.#Bundles.addChildAt(container, index);

        for (let i = 0; i < 6; i++) {
            let type = Bag.seedAt(index).sides[i].type;

            let flower = new PIXI.Sprite(Assets[type][0]);
            flower.anchor.set(0.5);
            flower.scale.set(1.25);
            flower.pivot.y = 40;
            flower.angle = i * 60;
            bottomLayer.addChild(flower);
        }
    }

    static animation(time) {
        if (Bag.#Bundles.children.length < 1) return;
        Bag.#Bundles.children[0].x = -Easing.easeInOutSine(time, 275, 50, 1);
        Bag.#Bundles.children[0].y = -Easing.easeInOutSine(time, 250, 25, 1);
        Bag.#Bundles.children[0].scale.set(Easing.easeInOutSine(time, 1.0, -0.5, 1));
        Bag.#Bundles.children[0].children[0].scale.set(Easing.easeInOutSine(time, 1.0, -0.3, 1));
        Bag.#Bundles.children[0].alpha = Easing.easeInOutSine(time, 1.0, -1.0, 1);
        
        if (Bag.#Bundles.children.length < 2) return;
        Bag.#Bundles.children[1].x = -Easing.easeInOutSine(time, 150, 125, 1);
        Bag.#Bundles.children[1].y = -Easing.easeInOutSine(time, 175, 75, 1);
        Bag.#Bundles.children[1].scale.set(Easing.easeInOutSine(time, 0.75, 0.25, 1));
        Bag.#Bundles.children[1].children[0].scale.set(Easing.easeInOutSine(time, 0.9, 0.1, 1));
        Bag.#Bundles.children[1].alpha = 1.0;
        
        if (Bag.#Bundles.children.length < 3) return;
        Bag.#Bundles.children[2].x = -Easing.easeInOutSine(time, 0, 150, 1);
        Bag.#Bundles.children[2].y = -Easing.easeInOutSine(time, 0, 175, 1);
        Bag.#Bundles.children[2].scale.set(Easing.easeInOutSine(time, 0.5, 0.25, 1));
        Bag.#Bundles.children[2].children[0].scale.set(Easing.easeInOutSine(time, 0.7, 0.2, 1));
        Bag.#Bundles.children[2].alpha = 1.0;
    }
    
    static nextBundle() {
        isBundlesMoving = true;
        Bag.toNextSeed();
        
        Tween.start(100, 50, (time) => {
            Bag.animation(time);
        },
        () => {
            Bag.#Bundles.children[0].destroy({ children: true });
            Bag.createBundle();
            Bag.animation(0);
            isBundlesMoving = false;
        });
    }

    static rotateCurrentSeedForward() {
        isSpinning = true;

        Bag.seedAt(0).sides.unshift(Bag.seedAt(0).sides.pop());
        Bag.rotate(1);
    }
    
    static rotateCurrentSeedBack() {
        isSpinning = true;

        Bag.seedAt(0).sides.push(Bag.seedAt(0).sides.shift());
        Bag.rotate(-1);
    }

    static rotate(n) {
        let angle = Bag.#Bundles.children[0].children[0].angle;

        Tween.start(100, 10, (time) => {
            Bag.#Bundles.children[0].children[0].angle = Easing.easeInOutSine(time, angle, 60 * n, 1);
        },
        () => {
            isSpinning = false;
        });
    }
}

class Button extends PIXI.Sprite {

    constructor(texture) {
        super(texture.idle);
        this.anchor.set(0.5);
        this.eventMode = "static";
        this.interactiveChildren = false;
        this.cursor = "pointer";
        
        this.onpointerover = () => {
            this.texture = texture.hover;
            this.scale.set(1.1);
            HoverSound.play();
        };
        this.onpointerout = () => {
            this.texture = texture.idle;
            this.scale.set(1.0);
        };
    }
}

/**
 * 
 * Загрузка
 * 
 */

function Loading() {
    PIXI.Assets.load(urls, onProgress).then(onComplete);
}

function onProgress(progress) {
    Progress.text = "\u{1F65E} " + Math.round(progress * 100) + " \u{1F65C}";
}

function onComplete(assets) {
    Assets.grass = assets["sprites/grass.png"];
    Assets.stones = assets["sprites/stones.png"];
    Assets.dash = assets["sprites/dash.png"];
    Assets.star = assets["sprites/star.png"];
    Assets.seeds = assets["sprites/seeds.png"];
    Assets.bag = assets["sprites/bag.png"];
    Assets.shadow = assets["sprites/shadow.png"];
    Assets.rotate = {
        idle: assets["sprites/rotate.png"],
        hover: assets["sprites/rotate_hover.png"],
    };
    Assets.restart = {
        idle: assets["sprites/restart.png"],
        hover: assets["sprites/restart.png"],
    };
    Assets.music = {
        idle: assets["sprites/music.png"],
        hover: assets["sprites/music.png"],
    };
    Assets.sound = {
        idle: assets["sprites/sound.png"],
        hover: assets["sprites/sound.png"],
    };
    Assets.snake = {
        idle: assets["sprites/snake/snake_idle.png"],
        blink: assets["sprites/snake/snake_blink.png"],
        happy: assets["sprites/snake/snake_happy.png"],
        tail: assets["sprites/snake_tail.png"]
    };
    Assets["001"] = [ 
        assets["sprites/flowers/001/01.png"], 
        assets["sprites/flowers/001/02.png"], 
        assets["sprites/flowers/001/03.png"] 
    ];
    Assets["002"] = [ 
        assets["sprites/flowers/002/01.png"], 
        assets["sprites/flowers/002/02.png"], 
        assets["sprites/flowers/002/03.png"] 
    ];
    Assets["003"] = [ 
        assets["sprites/flowers/003/01.png"], 
        assets["sprites/flowers/003/02.png"], 
        assets["sprites/flowers/003/03.png"] 
    ];
    Assets["004"] = [ 
        assets["sprites/flowers/004/01.png"], 
        assets["sprites/flowers/004/02.png"], 
        assets["sprites/flowers/004/03.png"] 
    ];
    Assets["005"] = [ 
        assets["sprites/flowers/005/01.png"], 
        assets["sprites/flowers/005/02.png"], 
        assets["sprites/flowers/005/03.png"] 
    ];
    Assets["006"] = [ 
        assets["sprites/flowers/006/01.png"], 
        assets["sprites/flowers/006/02.png"], 
        assets["sprites/flowers/006/03.png"] 
    ];
    
    BackgroundMusic = assets["audios/background.mp3"];
    BackgroundMusic.play();
    BackgroundMusic.loop = true;
    BackgroundMusic.muted = false;
    BackgroundMusic.volume = 0.25;
    
    HoverSound = assets["audios/hover.mp3"];
    HoverSound.muted = false;
    HoverSound.volume = 0.1;
    ScoreSound = assets["audios/score.mp3"];
    ScoreSound.muted = false;
    ScoreSound.volume = 0.05;
    
    Emotion = Assets.snake.idle;
    Objects.snake.texture = Emotion;
    Objects.tail.texture = Assets.snake.tail;

    setInterval(() => {
        if (!isHappy) {
            Objects.snake.texture = Assets.snake.blink;
            setTimeout(() => Objects.snake.texture = Emotion, 100);
        }
    }, 7500);
    
    Buttons.rotate = new Button(Assets.rotate);
    Buttons.restart = new Button(Assets.restart);
    Buttons.music = new Button(Assets.music);
    Buttons.sound = new Button(Assets.sound);
    LoadData();
}

function LoadData() {
    GameStart(Data.get());
}

function GameSetup() {
    App.stage.eventMode = "static";
    App.stage.addChild(Game);
    Game.sortableChildren = true;

    UI.name = "UI";
    UI.x = 0;
    UI.y = 0;
    UI.zIndex = 5;
    UI.sortableChildren = true;
    Game.addChild(UI);

    Layout.topLeft.zIndex = 10;
    UI.addChild(Layout.topLeft);

    Layout.top.zIndex = 10;
    UI.addChild(Layout.top);

    Layout.topRight.zIndex = 10;
    UI.addChild(Layout.topRight);

    Layout.right.zIndex = -5;
    UI.addChild(Layout.right);
    
    Layout.bottomRight.sortableChildren = true;
    let shadow = new PIXI.Sprite(Assets.shadow);
    shadow.tint = BACKGROUND;
    shadow.eventMode = "none";
    shadow.anchor.set(0.5);
    shadow.x = -275;
    shadow.y = -250;
    shadow.zIndex = -5;
    Layout.bottomRight.addChild(shadow);
    shadow = new PIXI.Sprite(Assets.shadow);
    shadow.tint = BACKGROUND;
    shadow.eventMode = "none";
    shadow.anchor.set(0.5);
    shadow.x = -150;
    shadow.y = -175;
    shadow.zIndex = -5;
    Layout.bottomRight.addChild(shadow);
    UI.addChild(Layout.bottomRight);

    Layout.bottom.zIndex = -5;
    UI.addChild(Layout.bottom);
    
    Layout.bottomLeft.sortableChildren = true;
    UI.addChild(Layout.bottomLeft);

    UI.addChild(Layout.left);
    
    Objects.snake.anchor.set(0.1, 0.7);
    Objects.snake.eventMode = "none";
    Layout.bottomLeft.addChild(Objects.snake);
    
    Objects.tail.anchor.set(0.95, 0.7);
    Objects.tail.eventMode = "none";
    Layout.bottomRight.addChild(Objects.tail);
    
    Ground.name = "Ground";
    Ground.x = 0;
    Ground.y = 0;
    Ground.sortableChildren = true;
    Game.addChild(Ground);
    
    Buttons.rotate.x = -275;
    Buttons.rotate.y = -250;
    Buttons.rotate.zIndex = 10;
    Buttons.rotate.onpointerup = () => { if (!isSpinning) Bag.rotateCurrentSeedBack() };
    Layout.bottomRight.addChild(Buttons.rotate);

    Buttons.restart.x = 60;
    Buttons.restart.y = 60;
    Buttons.restart.zIndex = 10;
    Buttons.restart.onpointerup = () => GameRestart();
    shadow = new PIXI.Sprite(Assets.shadow);
    shadow.tint = BACKGROUND;
    shadow.eventMode = "none";
    shadow.anchor.set(0.5);
    shadow.x = Buttons.restart.x;
    shadow.y = Buttons.restart.y;
    Layout.topLeft.addChild(shadow);
    Layout.topLeft.addChild(Buttons.restart);

    Buttons.music.x = -60;
    Buttons.music.y = 60;
    Buttons.music.zIndex = 10;
    Buttons.music.onpointerdown = () => {
        let value = !BackgroundMusic.muted;
        BackgroundMusic.muted = value;
        
        Buttons.music.alpha = 1.0 - +value * 0.25;
    };
    shadow = new PIXI.Sprite(Assets.shadow);
    shadow.tint = BACKGROUND;
    shadow.eventMode = "none";
    shadow.anchor.set(0.5);
    shadow.x = Buttons.music.x;
    shadow.y = Buttons.music.y;
    Layout.topRight.addChild(shadow);
    Layout.topRight.addChild(Buttons.music);

    Buttons.sound.x = -60;
    Buttons.sound.y = 180;
    Buttons.sound.zIndex = 10;
    Buttons.sound.onpointerdown = () => {
        let value = !ScoreSound.muted;
        ScoreSound.muted = value;
        HoverSound.muted = value;
        
        Buttons.sound.alpha = 1.0 - +value * 0.25;
    };
    shadow = new PIXI.Sprite(Assets.shadow);
    shadow.tint = BACKGROUND;
    shadow.eventMode = "none";
    shadow.anchor.set(0.5);
    shadow.x = Buttons.sound.x;
    shadow.y = Buttons.sound.y;
    Layout.topRight.addChild(shadow);
    Layout.topRight.addChild(Buttons.sound);
}

function GameStart(_data) {
    GameSetup();
    Table.setup();
    Bag.setup();
    Score.setup();
    Table.addCell(0, 0);
    let data = _data;

    if (!("Seeds" in data)) data = { Seeds: { list: [], current: 0 }};

    if (data.Seeds.list.length > 0) {
        Bag.load(data.Seeds);
        for (let i = 0; i < data.Seeds.list.length; i++) {
            let seed = data.Seeds.list[i];
            if (seed.point.x == null || seed.point.y == null) continue;
            onPlant(seed.point.x, seed.point.y, i);
        }
    } else {
        Bag.create();
    }

    isLoaded = true;
    let isGameOver = Bag.updateCount();
    if (!isGameOver) {
        Ground.eventMode = "static";
        Buttons.rotate.eventMode = "static";
        Buttons.rotate.visible = true;
        
        Emotion = Assets.snake.idle;
        Objects.snake.texture = Emotion;
    }
    Tween.start(100, 100, (time) => {
        Game.alpha = time;
        Loader.alpha = 1 - time;
    });
}

function GameRestart() {
    Tween.start(100, 50, (time) => {
        Game.alpha = 1 - time;
        Loader.alpha = time;
    }, () => {
        Layout.bottomRight.alpha = 1.0;
        Bag.removeSeeds();
        GameStart({});
    });
}

function GameOver() {
    Ground.eventMode = "none";
    Buttons.rotate.eventMode = "none";
    Buttons.rotate.visible = false;
    Buttons.restart.eventMode = "none";

    Tween.start(100, 50, (time) => { 
        Layout.bottomRight.alpha = 1 - time;
        Score.questContainer.alpha = 1 - time;
    },
    () => {
        Buttons.restart.eventMode = "static";
    });
    
    Emotion = Assets.snake.happy;
    Objects.snake.texture = Emotion;
}

function onPlant(x, y, seed) {
    let score = 0;
    let quest = Score.quest;
    Table.addSeed(seed, x, y);
    Bag.setSeedPoint(seed, x, y);
    for (let i = 0; i < 6; i++) {
        let Seed = Bag.getSeed(seed);
        //  Данные смежных сторон
        let adjX = x + Sides[i].x;
        let adjY = y + Sides[i].y;
        let adj = ((i + 3) % 6);
        Table.addCell(adjX, adjY);
        let adjSeed = Table.getCellSeed(adjX, adjY);
        
        //  Садим на текущую ячейку
        let seedType = Seed.sides[i].type;
        let cellType = Table.getCellPrefferedSide(x, y, i);
        let count = 1;
        
        if (seedType == cellType) count = 3;
        
        score += count;
        
        if (seedType == quest) c += count;
        
        Table.setSeedSide(seed, i, seedType, count);
        Table.setCellPrefferedSide(adjX, adjY, adj, seedType);
        Score.addQuestScore(seedType, count);
        
        if (adjSeed == null) continue;
        
        Seed = Bag.getSeed(adjSeed);
        seedType = Seed.sides[adj].type;
        cellType = Table.getCellPrefferedSide(adjX, adjY, adj);
        count = 1;
        
        score -= count;
        Score.addQuestScore(seedType, -1);
        
        if (seedType == cellType) count = 3;
        
        score += count;
        Score.addQuestScore(seedType, count);
        
        Table.setSeedSide(adjSeed, adj, seedType, count);
    }
    Score.addScore(score);

    let reward = Score.checkQuest();
    if (!isLoaded) return;
    Bag.addSeeds(reward);
}

function plant(x, y) {
    if(isPointerMove || isBundlesMoving) return;
    if (!isHappy) HappySnake();
    
    onPlant(x, y, Bag.current);
    ScoreSound.play();
    Bag.nextBundle();
}

function sidesCheck(x, y) {
    Table.setPointerOnCell(x, y);
    HoverSound.play();
    for (let i = 0; i < 6; i++) {
        let cellType =  Table.getCellPrefferedSide(x, y, i);
        let seedType =  Bag.seedAt(0).sides[i].type;
        let shine = (cellType == seedType);

        Table.setSideOfPointer(i, shine);
    }
}

function ViewToCenter() {
    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;
    let scale = Math.min(window.innerWidth, window.innerHeight) / 800;
    let groundX = scale + 0.25;
    let groundY = groundX * 0.75;
    Ground.scale.x = groundX;
    Ground.scale.y = groundY;

    App.stage.x = centerX;
    App.stage.y = centerY;

    Layout.topLeft.x = -centerX;
    Layout.topLeft.y = -centerY;
    Layout.topLeft.scale.set(scale + 0.1);
    
    Layout.top.x = 0;
    Layout.top.y = -centerY;
    Layout.top.scale.set(scale);
    
    Layout.topRight.x = centerX;
    Layout.topRight.y = -centerY;
    Layout.topRight.scale.set(scale + 0.1);
    
    Layout.right.x = centerX;
    Layout.right.y = 0;
    
    Layout.bottomRight.x = centerX;
    Layout.bottomRight.y = centerY;
    Layout.bottomRight.scale.set(scale);
    
    Layout.bottom.x = 0;
    Layout.bottom.y = centerY;
    Layout.bottom.scale.set(scale);
    
    Layout.bottomLeft.x = -centerX;
    Layout.bottomLeft.y = centerY;
    Layout.bottomLeft.scale.set(scale);
    
    Layout.left.x = -centerX;
    Layout.left.y = 0;
}

function HappySnake() {
    let tick = 0;
    let pi = Math.PI;
    let p = pi / 30;
    let y = Objects.snake.y;
    isHappy = true;

    Objects.snake.texture = Assets.snake.happy;

    Tween.start(pi, 30, () => {
        tick += p;

        Objects.snake.y = y - Math.sin(tick) * 10;
    }, 
    () => {
        isHappy = false;
        Objects.snake.texture = Emotion;
    });
}

document.onpointerdown = function(event) {
    Mouse.x = event.clientX;
    Mouse.y = event.clientY;

    isPointerDown = true;
};

document.onpointermove = function(event) {
    if(isPointerDown) {
        isPointerMove = true;
        Ground.x += (event.clientX - Mouse.x);
        Ground.y += (event.clientY - Mouse.y);

        Mouse.x = event.clientX;
        Mouse.y = event.clientY;
    }
}

document.onpointerup = function() {
    isPointerMove = false;
    isPointerDown = false;
}

document.onwheel = function(event) {
    if (isSpinning || Bag.seedAt(0) == null) return;

    if (event.deltaY < 0) Bag.rotateCurrentSeedForward();

    if (event.deltaY > 0) Bag.rotateCurrentSeedBack();

    sidesCheck(PointedCell.x, PointedCell.y);
}

App.ticker.add(() => {
    animation += 0.005;
    
    let angle = Math.sin(animation * happiness) * 2.5;
    LoadingSprite.angle = (-animation * 500) % 360;

    Objects.tail.angle = angle;
    Objects.snake.angle = -angle;
})

window.onresize = ViewToCenter;

document.body.appendChild(App.view);

ViewToCenter();

PIXI.Assets.load(["sprites/loading.png", "font/MTCORSVA.TTF", "font/Symbola.ttf"]).then(assets => {
    LoadingSprite.texture = assets["sprites/loading.png"];
    PIXI.TextStyle.defaultStyle.fontFamily = ["MTCORSVA", "Symbola"];
    TEXT_STYLE.fontFamily = ["MTCORSVA", "Symbola"];
    Progress.style.fontFamily = ["MTCORSVA", "Symbola"];
}).finally(() => Loading());