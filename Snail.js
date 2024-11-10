import {GObject} from "./GObject.js"
import {SpriteSheet} from "./SpriteSheet.js"

const CHARA_WIDTH = 16;
const CHARA_HEIGHT = 16;

const State = {
    STOP:  "STOP",
    BOUNCE_UP: "BOUNCE_UP",
    BOUNCE_DOWN: "BOUNCE_DOWN",
    RECOVER_UP: "RECOVER_UP", 
    RECOVER_DOWN: "RECOVER_DOWN",
    MOVE_LEFT:  "MOVE_LEFT",
    MOVE_RIGHT:  "MOVE_RIGHT",
    UPSIDEDOWN: "UPSIDEDOWN",
    FALL: "FALL",
    FALL_END: "FALL_END"
};

const anime_table = {
    STOP: {move_count: 1, frames: [0], frame_interval: 1},
    BOUNCE_UP: {move_count: 50, frames: [0], frame_interval: 4},
    BOUNCE_DOWN: {move_count: 50, frames: [11,10], frame_interval: 10},
    RECOVER_UP: {move_count: 50, frames: [5], frame_interval: 4},
    RECOVER_DOWN: {move_count: 50, frames: [0], frame_interval: 4},
    MOVE_LEFT: {move_count: 20, frames: [0,1,2,3,4], frame_interval: 4},
    MOVE_RIGHT: {move_count: 20, frames: [0,1,2,3,4], frame_interval: 4},
    UPSIDEDOWN: {move_count: 60*10, frames: [5,9], frame_interval: 30},
    FALL: {move_count: 50, frames: [0], frame_interval: 2},
    FALL_END: {move_count: 100, frames: [5,6,7,8], frame_interval: 12},
};


const spsheet = new SpriteSheet(CHARA_WIDTH, CHARA_HEIGHT, "./assets/snail_spritesheet.png");


export class Snail extends GObject {
    constructor(props) {
        super(props);
        this.wait_time = 0;
    }

    static create(x,y, flip, world) {
        return new Snail({
            x: x,
            y: y,
            w: CHARA_WIDTH,
            h: CHARA_HEIGHT,
            state: State.STOP,
            flip: flip,
            anime_table: anime_table,
            world: world,
            sprite: 0,
            spritesheet: spsheet,
        });
    }

    check_vx() {}
    check_vy() {
        if (this.state == State.FALL_END)
            return;
        super.check_vy();
    }

    init(x,y, flip) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.state = State.STOP;
        this.flip = flip;
    }

    bounds() {
        return {
            x: this.x+2,
            y: this.y+8,
            w: this.w-4,
            h: this.h-8,
        };
    }

    foot_area(dx, dy) {
        return {
            x: this.x+2+dx,
            y: this.y+this.h-1+dy,
            w: this.w-4,
            h: 1,
        };
    }

    push_up(src) {
        if (this.state == State.BOUNCE_UP || this.state == State.RECOVER_UP)
            return false;

        if (super.hit(src, this)) {
            if (this.state == State.UPSIDEDOWN) {
                this.change_state(State.RECOVER_UP);
            } else {
                this.change_state(State.BOUNCE_UP);
            }

            const p1 = src.x+src.w/2;
            const p2 = this.x+this.w/2;
            if (p1 < p2-2) {
                this.vx = 0.5;
            } else if (p1 > p2+2) {
                this.vx = -0.5;
            } else {
                this.vx = 0;
            }
            this.vy = -2;
            return true;
        }
        return false;
    }

    attack(src) {
        if (!super.hit(src, this))
            return false;

        let ret = { hit:false, point: 0};
        switch(this.state) {
        case State.UPSIDEDOWN:
            this.vy = -1.2;
            this.vx = src.x < this.x ? 1 : -1;
            this.change_state(State.FALL_END);
            ret = { hit: true, point: 800};
            break;
        case State.BOUNCE_UP:
        case State.BOUNCE_DOWN:
            this.vy = -1.2;
            this.vx = src.x < this.x ? 1 : -1;
            this.change_state(State.FALL_END);
            ret = { hit: true, point: 1000};
            break;
        case State.FALL_END:
            break;
        default:
            break;
        }
        return ret;
    }

    action_bounce_up() {
        if (this.vy > 0) {
            this.change_state(State.BOUNCE_DOWN);
            return;
        }
        this.count_move(this.vx, this.vy);
    }

    action_bounce_down() {
        if (this.vy == 0) {
            this.vx = 0;
            this.change_state(State.UPSIDEDOWN);
            return;
        }
        this.count_move(this.vx, this.vy);
    }

    action_recover_up() {
        if (this.vy > 0) {
            this.change_state(State.RECOVER_DOWN);
            return;
        }
        this.count_move(this.vx, this.vy);
    }

    action_recover_down() {
        if (this.vy == 0) {
            this.vx = 0;
            this.change_state(State.STOP);
            return;
        }
        this.count_move(this.vx, this.vy);
    }

    count_move(dx, dy) {
        this.x += dx;
        this.y += dy;
        return super.count_move(dx,dy);
    }

    action_fall_end() {
        if (this.vy >= 5) {
            this.vx = this.vx/2;
        }
        this.count_move(this.vx, this.vy); 
    }

    action_stop() {
        if(this.flip) {
            this.move_left();
        } else {
            this.move_right();
        }
    }

    stop() {
        this.vx = 0;
        this.vy = 0;
        this.change_state(State.STOP);
    }

    move_right() {
        this.change_state(State.MOVE_RIGHT);
        this.flip = false;
    }

    move_left() {
        this.change_state(State.MOVE_LEFT);
        this.flip = true;
    }

    action_move_right() {
        if (this.wait_next_action(2))
            return;

        if (this.count_move(1, 0).finished) {
            if (this.world.checkHitEnemy(this))
                this.move_left(); 
            else
                this.stop();
        }
    }

    action_move_left() {
        if (this.wait_next_action(2))
            return;

        if (this.count_move(-1, 0).finished) {
            if (this.world.checkHitEnemy(this))
                this.move_right(); 
            else
                this.stop();
        }
    }

    action_upsidedown() {
        if (this.count_move(0, 0).finished) {
            this.vx = 0; 
            this.change_state(State.STOP);
        }
    }

    wait_next_action(wait_time) {
        if (this.angry) return false;
        if (this.wait_time < wait_time) {
            this.wait_time++;
            return true;
        }
        this.wait_time = 0;
        return false;
    }

    offensive() {
        return this.state == State.STOP || this.state == State.MOVE_LEFT || this.state == State.MOVE_RIGHT;
    }
}
