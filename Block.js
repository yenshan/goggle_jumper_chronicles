import {SpriteSheet} from "./SpriteSheet.js"
import {GObject} from "./GObject.js"

const WIDTH = 8;
const HEIGHT = 8;

const State = {
    NORMAL: 'normal',
}

const spsheet = new SpriteSheet(WIDTH, HEIGHT, "./assets/tilesheet.png");

export class Block extends GObject {
    static create(x,y, world) {
        return new Block({
            x: x,
            y: y,
            w: WIDTH,
            h: HEIGHT,
            state: State.NORMAL,
            flip: false,
            anime_table: undefined,
            world: world,
            sprite: 2,
            spritesheet: spsheet,
        });
    }

    update_position() {
    }

    action_normal() {
    }
}

