const keyMap = {
    'j': 'left',
    'l': 'right',
    'i': 'up',
    'm': 'down',
    'c': 'A',
    'x': 'Y',
    'r': 'reset',
    's': 'start',
}

const btnMap = {
    0: 'B',
    1: 'A',
    2: 'Y',
    3: 'X',
    8: 'reset',
    9: 'start',
    12: 'up',
    13: 'down',
    14: 'left',
    15: 'right',
}

const htmlBtnMap = {
    'left': 'left',
    'right': 'right',
    'up': 'up',
    'down': 'down',
    'B': 'B',
    'A': 'A',
}

class GamePad {
    constructor(no) {
        this.no = no;
        this.prev_pressed = [];
        this.listener_list = { 'pressed': [], 'released': [] }

        this.updateGamepadStatus = this.updateGamepadStatus.bind(this);
        requestAnimationFrame(this.updateGamepadStatus);
    }

    addEventListener(type, listener) {
        this.listener_list[type].push(listener);
    }

    notify_event(type, e) {
        let listeners = this.listener_list[type];
        for (let func of listeners) {
            func(e);
        }
    }

    updateGamepadStatus() {
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[this.no];

        if (gamepad) {
            // ボタンの状態をチェック
            gamepad.buttons.forEach((button, index) => {
                if (button.pressed) {
                    if(!this.prev_pressed[index]) {
                        this.notify_event("pressed", { index: index });
                        this.prev_pressed[index] = true;
                    }
                } else {
                    if(this.prev_pressed[index]) {
                        this.notify_event("released", { index: index });
                        this.prev_pressed[index] = false;
                    }
                }
            });
        }

        // 次のフレームでまたポーリングを実行
        requestAnimationFrame(this.updateGamepadStatus);
    }
}

export class HtmlGamePad {
    constructor(document) {
        this.document = document;
        this.buttons = this.document.querySelectorAll('.button');
        this.dpad_buttons = this.document.querySelectorAll('.dpad-button');
        this.isJoystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.eventListeners = {};
        this.initButtons();
    }

    initButtons() {
        this.buttons.forEach(button => {
            button.addEventListener('mousedown', (e) => this.dispatchEvent('buttonPress', e.currentTarget.getAttribute('value')));
            button.addEventListener('mouseup', (e) => this.dispatchEvent('buttonRelease', e.currentTarget.getAttribute('value')));
            button.addEventListener('touchstart', (e) => { 
                this.dispatchEvent('buttonPress', e.currentTarget.getAttribute('value'));
                e.preventDefault();
            });
            button.addEventListener('touchend', (e) => this.dispatchEvent('buttonRelease', e.currentTarget.getAttribute('value')));
        });
        this.dpad_buttons.forEach(button => {
            button.addEventListener('mousedown', (e) => this.dispatchEvent("buttonPress", e.currentTarget.getAttribute('value')));
            button.addEventListener('mouseup', (e) => this.dispatchEvent("buttonRelease", e.currentTarget.getAttribute('value')));
            button.addEventListener('touchstart', (e) => {
                this.dispatchEvent('buttonPress', e.currentTarget.getAttribute('value'));
                e.preventDefault();
            });
            button.addEventListener('touchend', (e) => this.dispatchEvent("buttonRelease", e.currentTarget.getAttribute('value')));
        });
    }

    dispatchEvent(eventName, detail) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => callback({ detail }));
        }
    }

    addEventListener(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }
}

let gamepad = new GamePad(0);

export class UserInput {
    constructor(doc) {
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;
        this.A = false;
        this.B = false;
        this.reset = false;
        this.start = false;
        this.prev_pressed = null;
        this.available_inputs = Object.values(keyMap);

        this.keyDownHandler = this.keyDownHandler.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);
        doc.addEventListener('keydown', this.keyDownHandler, false);
        doc.addEventListener('keyup', this.keyUpHandler, false);

        this.btnDownHandler = this.btnDownHandler.bind(this);
        this.btnUpHandler = this.btnUpHandler.bind(this);
        gamepad.addEventListener("pressed", this.btnDownHandler);
        gamepad.addEventListener("released", this.btnUpHandler);

        this.htmlBtnDownHandler = this.htmlBtnDownHandler.bind(this);
        this.htmlBtnUpHandler = this.htmlBtnUpHandler.bind(this);
        this.html_gamepad = new HtmlGamePad(doc);
        this.html_gamepad.addEventListener("buttonPress", this.htmlBtnDownHandler);
        this.html_gamepad.addEventListener("buttonRelease", this.htmlBtnUpHandler);

    }

    clearInputs() {
        for (let prop of Object.values(keyMap)) {
            this[prop] = false;
        }
    }

    set_input(map, key, val) {
        const prop = map[key];
        if (this.available_inputs.includes(prop)) {
            this[prop] = val;
        }
    }

    setInputFilter(list) {
        if (list==null)
            list = Object.values(keyMap);
        this.available_inputs = list;
    }

    keyDownHandler(event) {
        this.set_input(keyMap, event.key, true);
    }

    keyUpHandler(event) {
        this.set_input(keyMap, event.key, false);
    }

    btnDownHandler(event) {
        this.set_input(btnMap, event.index, true);
    }

    btnUpHandler(event) {
        this.set_input(btnMap, event.index, false);
    }

    htmlBtnDownHandler(event) {
        this.set_input(htmlBtnMap, event.detail, true);
    }

    htmlBtnUpHandler(event) {
        this.set_input(htmlBtnMap, event.detail, false);
    }

}



