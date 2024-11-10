import {print_small_num} from "./index.js"
import {GObject} from "./GObject.js"

const WIDTH = 4;
const HEIGHT = 6;

const State = {
    DISPLAY: 'DISPLAY',
    CLEAR: 'CLEAR'
};

export class GamePoint extends GObject {
    constructor(props, points) {
        super(props);
        this.points = points;
        this.count = 30;
    }

    static create(x,y, points) {
        return new GamePoint({
            name: "GamePoint",
            x: x,
            y: y,
            w: WIDTH, 
            h: HEIGHT,
            state: State.DISPLAY,
            anime_table: undefined,
            spritesheet: undefined,
            sprite: 0,
        }, points);
    }

    action_display() {
        if (this.count < 0) {
            this.change_state(State.CLEAR);
            return;
        }
        this.count--;
    }

    action_clear() {
    }

    is_clear() {
        return this.state==State.CLEAR;
    }

    draw() {
        if (this.state == State.DISPLAY) {
            print_small_num(`${this.points}`, this.x, this.y);
        }
    }
}
