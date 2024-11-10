import {GObject} from "./GObject.js"
import {SpriteSheet} from "./SpriteSheet.js"

const WIDTH = 16;
const HEIGHT = 16;

const State = {
    NORMAL: 'NORMAL',
    PUSH_UP : 'PUSH_UP',
}

const anime_table = {
    NORMAL: {move_count: 1, frames: [0], frame_interval: 1},
    PUSH_UP: {move_count: 8, frames: [1], frame_interval: 8},
}

const spsheet = new SpriteSheet(WIDTH, HEIGHT, "./assets/pow_spritesheet.png");

export class PowBlock extends GObject {
    static create(x,y, world) {
        return new PowBlock({
            x: x,
            y: y,
            w: WIDTH,
            h: HEIGHT,
            state: State.NORMAL,
            flip: false,
            anime_table: anime_table,
            world: world,
            sprite: 0,
            spritesheet: spsheet,
        });
    }

    update_position() {
    }

    action_normal() {
    }

    action_push_up() {
        if (this.count_move(0,0).finished) {
            this.change_state(State.NORMAL);
        };
    }

    push_up(src) { 
        if (this.hit(src, this)) {
            this.world.pushUpAllEnemy();
            this.change_state(State.PUSH_UP);
            return true;
        }
        return false;
    }
}

