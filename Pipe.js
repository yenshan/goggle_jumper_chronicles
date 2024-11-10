import {SpriteSheet} from "./SpriteSheet.js"
import {GObject} from "./GObject.js"

const WIDTH = 8;
const HEIGHT = 8;

const State = {
    NORMAL: 'NORMAL',
    PUSH_UP: 'PUSH_UP',
}

const spsheet = new SpriteSheet(WIDTH, HEIGHT, "./assets/tilesheet.png");

export class Pipe extends GObject {
    constructor(props) {
        super(props);
        this.o_y = props.y;
        this.pushed_up = false;
    }

    static create(x,y, world) {
        return new Pipe({
            x: x,
            y: y,
            w: WIDTH,
            h: HEIGHT,
            state: State.NORMAL,
            flip: false,
            anime_table: undefined,
            world: world,
            sprite: 1,
            spritesheet: spsheet,
        });
    }

    update_position() {
        if (this.state == State.NORMAL)
            return;
        super.update_position();
    }

    push_up(src) {
        if (src.y < this.y)
            return false;

        if (this.hit(src, this)) {
            let p = src.x+src.w/2;
            if (p >= this.x && p <= this.x+this.w) {
                this.vy = src.vy/2;
            } else {
                this.vy = src.vy/4;
            }
            this.change_state(State.PUSH_UP);
            return true;
        }
        return false;
    }

    action_normal() {
    }

    action_push_up() {
        if (this.vy >= 0) {
            if (Math.floor(this.y) == this.o_y) {
                this.y = this.o_y;
                this.change_state(State.NORMAL);
            } 
            return;
        }
        this.world.pushUpEnemy(this);
    }

}

