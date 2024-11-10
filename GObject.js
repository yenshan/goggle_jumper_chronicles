import {drawSprite} from "./index.js"

export function collision(obj1, obj2) {
    let flg =  obj1.x >= obj2.x + obj2.w
        || obj2.x >= obj1.x + obj1.w
        || obj1.y >= obj2.y + obj2.h
        || obj2.y >= obj1.y + obj1.h;
    return !flg;
}

export class GObject {
    constructor(prop) {
        this.name = prop.name;
        this.x = prop.x;
        this.y = prop.y;
        this.w = prop.w;
        this.h = prop.h;
        this.vx = 0;
        this.vy = 0;
        this.anime_count = 0;
        this.anime_index = 0;
        this.move_count = 0;
        this.prev_state = prop.state;
        this.state = prop.state;
        this.flip = prop.flip;
        this.anime_table = prop.anime_table;
        this.world = prop.world;
        this.sprite = prop.sprite;
        this.spritesheet = prop.spritesheet;
        this.pause = false;
    }

    bounds() {
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
        };
    }

    foot_area(dx, dy) {
        return {
            x: this.x+dx,
            y: this.y+this.h+dy,
            w: this.w,
            h: 1,
        };
    }

    update() {
        if (this.pause) 
            return;
        this.update_position();
        const action_func = `action_${this.state.toLowerCase()}`;
        this[action_func]();
        this.anime_update();
    }

    update_position() {
        this.check_vx();
        this.check_vy();
        this.x = Math.round(this.x + this.vx);
        this.y = Math.round(this.y + this.vy);
    }

    check_vy() {
        if (this.vy > 0) {
            if (this.is_on_obj(this.vy))
                this.vy = 0;
        }
    }

    check_vx() {
        if (this.vx != 0) {
            if (this.world.checkHitObj(this.bounds())) {
                this.vx = -this.vx;
            }
        }
    }

    anime_update() {
        if (!this.anime_table)
            return;

        const frames = this.anime_table[this.state].frames;
        const frame_interval = this.anime_table[this.state].frame_interval;

        if (this.anime_count >= frame_interval) {
            this.anime_index++;
            this.anime_count = 0;
        }

        if (this.anime_index >= frames.length)
            this.anime_index = 0;

        this.sprite = frames[this.anime_index];
        this.anime_count++;
    }

    change_state(state) {
        this.prev_state = this.state;
        this.state = state;
        if (this.anime_table != undefined) {
            this.move_count = this.anime_table[this.state].move_count;
        }
    }

    count_move(dx, dy) {
        this.move_count--;
        if (this.move_count < 0) {
            return { finished: true };
        }
        return { finished: false };
    }

    affectForce(vx, vy) {
        this.vx += vx;
        this.vy += vy;
    }

    is_on_obj(dy) {
        return this.world.checkHitObj(this.foot_area(0, dy));
    }

    hit(src) {
        return collision(src, this.bounds());
    }

    push_up(src) {}
    attacked() {}

    draw() {
        drawSprite(this.spritesheet, this.sprite, this.x, this.y, this.flip);
    }

    doPause(flag) {
        this.pause = flag;
    }

}
