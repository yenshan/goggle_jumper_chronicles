import { SpriteSheet } from "./SpriteSheet.js"
import { UserInput } from "./UserInput.js"
import { Chara } from "./Chara.js"
import { World } from "./World.js"

const SCREEN_W = 36
const SCREEN_H = 32

// background canvas
const canvas_bg = document.getElementById('canvasBg');
const context_bg = canvas_bg.getContext('2d');
canvas_bg.width = SCREEN_W * 8;
canvas_bg.height = SCREEN_H * 8;

// display canvas
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
canvas.width = canvas_bg.width * 2;
canvas.height = canvas_bg.height * 2;
context.imageSmoothingEnabled = false;

// Adjust canvas size to maintain aspect ratio
function resizeCanvas() {
    const aspectRatio = SCREEN_W*1.2 / SCREEN_H;

    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;
    
    if (width / height > aspectRatio) {
        canvas.height = height;
        canvas.width = height * aspectRatio;
    } else {
        canvas.width = width;
        canvas.height = width / aspectRatio;
    }
    
    context.imageSmoothingEnabled = false;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

export const input = new UserInput(document);

// -----------------------------------
//  Sub routines
// -----------------------------------
let wait_count = 0;
function wait_time(cnt) {
    if (wait_count > cnt) {
        wait_count = 0;
        return true;
    }
    wait_count++;
    return false;
}

// -----------------------------------
//  text drawing functions
// -----------------------------------
const fontsheet = new SpriteSheet(8,8,"./assets/nesfont.png");
const fontchars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-=";

function charIndex(c) {
    let idx = fontchars.indexOf(c);
    return idx >= 0? idx : fontchars.lengh;
}

function putchar(c,x,y) {
    drawSprite(fontsheet, charIndex(c), x, y);
}

export function print(str ,x ,y) {
   for (let i = 0; i < str.length; i++) {
       putchar(str[i], x + 8*i, y);
   }
}

let text_display = true;
function print_blink(str, x, y) {
    if (wait_time(30)) {
        text_display = !text_display;
    }
    if (text_display) {
        print(str,x,y);
    }
}

const numfonts = new SpriteSheet(4,6,"./assets/small_num_fonts.png");

export function print_small_num(str, x, y) {
   for (let i = 0; i < str.length; i++) {
       numfonts.drawSprite(context_bg, charIndex(str[i]), x + 4*i, y);
   }
}

function padNumber(num, digits) {
    return String(num).padStart(digits, '0');
}

// -----------------------------------
//  Stage data 
// -----------------------------------
let stages = [];
// load stage data
const res = await fetch("./assets/stages.json");
if (res.ok) {
    const data = await res.json();
    stages = data.maps;
}

// -----------------------------------
//  Camera position management
// -----------------------------------
const camera_pos = {
    x: 8,
    y: 8*2,
};

// camera shake functions
//
let camera_up_count = 0;
let camera_down_count = 0;
const SHAKE_RANGE = 8;

export function shake_camera() {
    camera_up_count = SHAKE_RANGE;
}
function check_camera_shake() {
    if (camera_up_count > 0) {
        camera_up_count--;
        let dy = (SHAKE_RANGE-camera_up_count);
        camera_pos.y = 8*2 + dy;
        if (camera_up_count == 0)
            camera_down_count = SHAKE_RANGE;

    }
    if (camera_down_count > 0) {
        camera_down_count--;
        let dy = camera_down_count;
        camera_pos.y = 8*2 + dy;
    }
}

// -----------------------------------
//  sprite draw / back ground draw
// -----------------------------------
export function drawSprite(spsheet, sprite_no, x, y, flip=false) {
    spsheet.drawSprite(context_bg, sprite_no, x, y, flip);
}

function clear_background() {
    context_bg.clearRect(0, 0, canvas_bg.width, canvas_bg.height);
}

function enlarge_and_display_background_buffer() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const src_x = camera_pos.x;
    const src_y = camera_pos.y;
    const src_w = canvas_bg.width-8*2;
    const src_h = canvas_bg.height-8*4;
    context.drawImage(canvas_bg, src_x, src_y, src_w, src_h, 0, 0, canvas.width, canvas.height);
}

// -----------------------------------
//  title image
// -----------------------------------
const titleImage = new Image();
titleImage.src = "./assets/title.png";

function draw_title() {
    const aspect_ratio = 460/512;
    const tw = canvas.width*3/5;
    const th = tw*aspect_ratio;
    const tx = (canvas.width-tw)/2;
    const ty = (canvas.height-th)/10;
    context.drawImage(titleImage,0,0,512,460, tx, ty, tw, th);
}


const bgImage = new Image();
bgImage.src = "./assets/background.png";

function draw_background() {
    context_bg.drawImage(bgImage,15,0,512,460, 0, 0, canvas_bg.width, canvas_bg.height);

    context_bg.globalAlpha = 0.5;  
    context_bg.fillStyle = "black";  
    context_bg.fillRect(0, 0, canvas_bg.width, canvas_bg.height);
    context_bg.globalAlpha = 1.0;
}

// -----------------------------------
//  game main update routine
// -----------------------------------
const State = {
    TITLE: 'TITLE',
    GAME: 'GAME',
    GAME_OVER: 'GAME_OVER',
}

let state = State.TITLE;
let h_score = 0;
let world;

function update() {

    switch(state) {
    case State.TITLE:
        clear_background();
        draw_background();
        print_blink("PUSH S KEY TO START", 8*8, 26*8);
        enlarge_and_display_background_buffer();
        draw_title();
        if (input.start) {
            world = new World(SCREEN_W, SCREEN_H, stages[0].data);
            state = State.GAME;
        }
        break;
    case State.GAME:
        clear_background();
        draw_background();

        world.update();
        world.draw();

        if (world.gameOver()) {
            state = State.GAME_OVER;
        }

        check_camera_shake();

        print(`SCORE:${padNumber(world.score, 6)}`, 2*8, 3*8);
        print(`HSCORE:${padNumber(h_score, 6)}`, (36-13-2)*8, 3*8);
        print(`S:${padNumber(world.stage, 2)}`, 4*8, 29*8);

        enlarge_and_display_background_buffer();
        break;

    case State.GAME_OVER:
        if (wait_time(60*4)) {
            if (world.score > h_score) h_score = world.score;
            context.clearRect(0, 0, canvas.width, canvas.height);
            state = State.TITLE;
        }
        break;
    }

    requestAnimationFrame(update);
}


update();
