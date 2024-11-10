import {shake_camera, print} from "./index.js"
import {Chara} from "./Chara.js"
import {Snail} from "./Snail.js"
import {Pipe} from "./Pipe.js"
import {Block} from "./Block.js"
import {PowBlock} from "./PBlock.js"
import {GamePoint} from "./GamePoint.js"

const MAP_ELEM_SIZE = 8;

const GRAVITY = 0.2;

const State = {
    START_STAGE: 'START_STAGE',
    GAME_RUN: 'GAME_RUN',
    PLAYER_FALL: 'PLAYER_FALL',
    STAGE_CLEAR: 'STAGE_CLAER',
    GAME_OVER: 'GAME_OVER',
}

const Elem = {
    NONE: 0,
    PLAYER: 1,
    PIPE: 2,
    BLOCK: 3,
    POW: 4,
}

let wait_count = 0;
function wait_time(cnt) {
    if (wait_count > cnt) {
        wait_count = 0;
        return true;
    }
    wait_count++;
    return false;
}

let last_time_enemy_created;

export class World {
    constructor(w,h, data) {
        this.w = w;
        this.h = h;
        this.map = this.create_objs_from_map_data(data);
        this.player_init_pos = this.get_player_pos(w,h,data);
        this.player = Chara.create(this.player_init_pos.x, this.player_init_pos.y, this);
        this.enemy_list = [];
        this.num_of_dead_enemies = 0;
        this.score = 0;
        this.game_point = [];
        this.state = State.START_STAGE;
        this.stage = 1;
    }

    create_enemy() {
        if (this.enemy_list.length + this.num_of_dead_enemies >= this.stage+2)
            return;
        if ((Date.now() - last_time_enemy_created) < 5000)
            return;

        const born_place = [ 
            { x:4  * MAP_ELEM_SIZE, flip:false}, 
            { x:30 * MAP_ELEM_SIZE, flip:true}
        ];
        let bp = born_place[this.enemy_list.length % 2];
        this.enemy_list.push(
            Snail.create( bp.x, 0, bp.flip, this)
        );

        last_time_enemy_created = Date.now();
    }

    create_objs_from_map_data(m) {
        let dat = [];
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                let id = m[x + y*this.w];
                const px = x*MAP_ELEM_SIZE;
                const py = y*MAP_ELEM_SIZE;
                switch(id) {
                case Elem.PIPE: dat.push(Pipe.create(px, py, this)); break;
                case Elem.BLOCK: dat.push(Block.create(px, py, this)); break;
                case Elem.POW: dat.push(PowBlock.create(px, py, this)); break;
                }
            }
        }
        return dat;
    }

    get_player_pos(w, h, data) {
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (data[x + y*w] == Elem.PLAYER)
                    return {x: x*MAP_ELEM_SIZE, y:y*MAP_ELEM_SIZE};
            }
        }
    }

    pushUpObj(src) {
        let ht = false;
        for (let o of this.map) {
            if (o.push_up(src))
                ht = true;
        }
        return ht;
    }

    pushUpEnemy(src) {
        for (let o of this.enemy_list) {
            o.push_up(src);
        }
    }

    pushUpAllEnemy() {
        shake_camera();
        for (let o of this.enemy_list) {
            if (o.is_on_obj(1)) 
                o.push_up(o);
        }
    }

    attackEnemy(src) {
        for (let o of this.enemy_list) {
            const res = o.attack(src);
            if (res.hit) {
                this.game_point.push(GamePoint.create(o.x, o.y, res.point));
                this.add_score(res.point);
                if (this.num_of_dead_enemies+1 == this.stage+2) {
                    src.doPause(true);
                }
            }
        }
    }

    checkHitEnemy(src) {
        for (let o of this.enemy_list) {
            if (src == o) continue;
            if (o.hit(src)) return true;
        }
        return false;
    }

    warp_if_outside(obj) {
        if (obj.x <= 0) obj.x = (this.w)* MAP_ELEM_SIZE-MAP_ELEM_SIZE;
        if (obj.x > (this.w-1)* MAP_ELEM_SIZE) obj.x = 1 
    }

    warp_if_outside2(obj) {
        if (obj.x <= 0) {
            obj.x = (this.w)* MAP_ELEM_SIZE-MAP_ELEM_SIZE;
            if (obj.y == 26*MAP_ELEM_SIZE)
                obj.y = 8*MAP_ELEM_SIZE;
        }
        if (obj.x > (this.w-1)* MAP_ELEM_SIZE) {
            obj.x = 1 
            if (obj.y == 26*MAP_ELEM_SIZE)
                obj.y = 8*MAP_ELEM_SIZE;
        }
    }

    checkHitObj(src) {
        for (let o of this.map) {
            if (o.hit(src)) {
                return true;
            }
        }
        return false;
    }

    update_game_run() {
        this.player.affectForce(0, GRAVITY);
        this.player.update();
        this.attackEnemy(this.player);
        this.warp_if_outside(this.player);

        if (this.player.is_deading()) {
            this.state = State.PLAYER_FALL;
            return;
        }

        for (let o of this.map) {
            o.affectForce(0, GRAVITY);
            o.update();
        }

        this.create_enemy();
        let dead_enemies = [];
        for (let e of this.enemy_list) {
            e.affectForce(0, GRAVITY);
            e.update();
            if (e.offensive()) {
                this.player.attack(e)
            }
            this.warp_if_outside2(e);
            if (e.y > this.h * MAP_ELEM_SIZE) {
                dead_enemies.push(e);
                this.num_of_dead_enemies++;
            }
        }
        this.enemy_list = this.enemy_list.filter(e => !dead_enemies.includes(e));
        if (this.num_of_dead_enemies == this.stage+2) {
            this.state = State.STAGE_CLEAR;
        }

        for (let gp of this.game_point) {
            gp.update();
        }
        this.game_point = this.game_point.filter(g => !g.is_clear());
    }

    update() {
        switch(this.state) {
        case State.START_STAGE:
            if (wait_time(200)) {
                this.state = State.GAME_RUN;
                return;
            }
            print(`STAGE ${this.stage}`, 15*8, 18*8);
            break;
        case State.GAME_RUN:
            this.update_game_run();
            break;
        case State.STAGE_CLEAR:
            if (wait_time(200)) {
                this.num_of_dead_enemies = 0;
                this.stage++;
                this.game_point = [];
                this.player = Chara.create(this.player_init_pos.x, this.player_init_pos.y, this);
                this.state = State.START_STAGE;
            }
            break;
        case State.PLAYER_FALL:
            this.player.affectForce(0, GRAVITY);
            this.player.update();
            if (this.player.y > this.h * MAP_ELEM_SIZE) {
                this.state = State.GAME_OVER;
            }
            break;
        case State.GAME_OVER:
            break;
        }
    }

    gameOver() {
        return this.state == State.GAME_OVER;
    }

    add_score(num) {
        this.score += num;
    }

    draw() {
        for (let gp of this.game_point) {
            gp.draw();
        }

        for (let o of this.map) {
            o.draw();
        }

        this.player.draw();

        for (let e of this.enemy_list) {
            e.draw();
        }

    }
}

