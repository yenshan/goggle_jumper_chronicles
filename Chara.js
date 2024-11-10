import {GObject} from "./GObject.js"
import {SpriteSheet} from "./SpriteSheet.js"
import {input} from "./index.js"

const CHARA_WIDTH = 16;
const CHARA_HEIGHT = 24;
const JUMP_VY = -5;

const State = {
    STOP: 'STOP',
    MOVE_LEFT : 'MOVE_LEFT',
    MOVE_RIGHT: 'MOVE_RIGHT',
    TURN_LEFT: 'TURN_LEFT',
    TURN_RIGHT: 'TURN_RIGHT',
    BREAKING: 'BREAKING',
    JUMP_UP: 'JUMP_UP',
    JUMP_DOWN: 'JUMP_DOWN',
    JUMP_HIT: 'JUMP_HIT',
    FALL: 'FALL',
    FALL2: 'FALL2',
    DEAD: 'DEAD',
    FALL_END: 'FALL_END',
    REBORN: 'REBORN'
}

const anime_table = {
    STOP: {move_count: 1, frames: [0], frame_interval: 60},
    MOVE_LEFT: {move_count: 12, frames: [1,2,3,1,5,4], frame_interval: 2},
    MOVE_RIGHT: {move_count: 12, frames: [1,2,3,1,5,4], frame_interval: 2},
    TURN_LEFT: {move_count: 8, frames: [0], frame_interval: 2},
    TURN_RIGHT: {move_count: 8, frames: [0], frame_interval: 2},
    BREAKING: {move_count: 16, frames: [7,10,11], frame_interval: 2},
    JUMP_UP: {move_count: 60, frames: [6], frame_interval: 1},
    JUMP_DOWN: {move_count: 60, frames: [6], frame_interval: 1},
    JUMP_HIT: {move_count: 16, frames: [6], frame_interval: 1},
    FALL: {move_count: 1, frames: [3], frame_interval: 1},
    FALL2: {move_count: 1, frames: [7], frame_interval: 1},
    DEAD: {move_count: 30, frames: [8], frame_interval: 30},
    FALL_END: {move_count: 60, frames: [9], frame_interval: 60},
    REBORN: {move_count: 70, frames: [0], frame_interval: 70},
};

const spsheet = new SpriteSheet(CHARA_WIDTH, CHARA_HEIGHT, "./assets/chara_spritesheet.png");

export class Chara extends GObject {

    static create(x,y, world) {
        return new Chara({
            name: "chara",
            x: x,
            y: y,
            w: CHARA_WIDTH,
            h: CHARA_HEIGHT,
            state: State.STOP,
            flip: false,
            anime_table: anime_table,
            world: world,
            sprite: 0,
            spritesheet: spsheet,
        });
    }

    check_vy() {
        if (this.state == State.JUMP_HIT || this.state == State.DEAD) {
            this.vy = 0;
            return;
        }
        if (this.state == State.FALL_END)
            return;
        super.check_vy();
    }

    do_jump() {
        if (input.left) {
            this.vx = -1;
            this.flip = true;
        }
        if (input.right) {
            this.vx = 1;
            this.flip = false;
        }
        this.vy = JUMP_VY;
        this.change_state(State.JUMP_UP);
    }
    
    action_stop() {
        if (this.vy > 0) {
            if (this.vx == 0)
                this.change_state(State.FALL);
            else 
                this.change_state(State.FALL2);
        } else if (input.left) {
            this.move_left();
        } else if (input.right) {
            this.move_right();
        } else if (input.A) {
            this.do_jump();
        } else {
            this.count_move(0,0);
        }
    }

    action_fall() {
        if (this.vy == 0) {
            if (this.vx == 0) {
                this.change_state(State.STOP);
            } else if (this.vx > 0 && input.right) {
                this.change_state(State.MOVE_RIGHT);
            } else if (this.vx < 0 && input.left) {
                this.change_state(State.MOVE_LEFT);
            } else {
                this.change_state(State.BREAKING);
            }
        }
    }

    action_fall2() {
        this.action_fall();
    }

    stop() {
        this.vx = 0;
        this.vy = 0;
        this.change_state(State.STOP);
    }

    move_right() {
        this.vx = 1;
        this.change_state(State.MOVE_RIGHT);
        this.flip = false;
    }

    move_left() {
        this.vx = -1;
        this.change_state(State.MOVE_LEFT);
        this.flip = true;
    }

    action_move_left() {
        if (input.A) {
            this.do_jump();
            return;
        }

        if (!this.count_move(-1, 0).finished)
            return;

        if (this.vy > 0) {
            if (this.vx == 0)
                this.change_state(State.FALL);
            else 
                this.change_state(State.FALL2);
        } else if (input.left) {
            this.move_left();
        } else if (this.prev_state == State.STOP) {
            this.stop();
        } else { 
            this.vx = -1;
            this.change_state(State.BREAKING);
        }
    }

    action_move_right() {
        if (input.A) {
            this.do_jump();
            return;
        }
        if (!this.count_move(1, 0).finished)
            return;

        if (this.vy > 0) {
            if (this.vx == 0)
                this.change_state(State.FALL);
            else 
                this.change_state(State.FALL2);
        } else if (input.right) {
            this.move_right();
        } else if (this.prev_state == State.STOP) {
            this.stop();
        } else {
            this.vx = 1;
            this.change_state(State.BREAKING);
        }
    }

    foot_area(dx, dy) {
        return {
            x: this.x+2+dx,
            y: this.y+this.h-1+dy,
            w: this.w-4,
            h: 1,
        };
    }

    head_area() {
        return {
            x: this.x+2,
            y: this.y+4,
            w: this.w-4,
            h: 1,
            vy: this.vy,
        };
    }

    bounds() {
        return {
            x: this.x+2,
            y: this.y+8,
            w: this.w-4,
            h: this.h-8,
        };
    }

    action_jump_up() {
        if (this.vy < 0) {
            const ht = this.world.pushUpObj(this.head_area());
            if (ht) {
                this.vy = 0;
                this.change_state(State.JUMP_HIT);
                return;
            }
            if (this.vx == 0) {
                if (input.left) {
                    this.flip = true;
                    this.vx = -1;
                }
                if (input.right) {
                    this.flip = false;
                    this.vx = 1;
                }
            }
        }
        if (this.vy > 0) {
            this.change_state(State.JUMP_DOWN);
            return;
        }
        this.count_move(this.vx, 0);
    }

    action_jump_down() {
        if (this.vy != 0) {
            this.count_move(this.vx, 0);
            return;
        }
        if (this.vx > 0) {
            if (input.right)
                this.change_state(State.MOVE_RIGHT);
            else
                this.change_state(State.BREAKING);
        } else if (this.vx < 0) {
            if (input.left)
                this.change_state(State.MOVE_LEFT);
            else
                this.change_state(State.BREAKING);
        } else {
            this.change_state(State.STOP);
        }
    }

    action_jump_hit() {
        if (this.count_move(this.vx, -this.vy).finished) {
            this.change_state(State.JUMP_DOWN);
        }
    }

    action_breaking() {
        if (!this.count_move(this.vx, 0).finished)
            return;
        this.stop();
    }

    attack(src) {
        if (this.state == State.DEAD || this.state == State.FALL_END)
            return;
        if (this.hit(src)) {
            this.vx = 0;
            this.vy = 0;
            this.change_state(State.DEAD);
        }
    }

    action_dead() {
        if (this.count_move(0,0).finished) {
            this.change_state(State.FALL_END);
        }
    }
    
    action_fall_end() {
    }

    is_deading() {
        return this.state == State.DEAD || this.state == State.FALL_END;
    }

}

