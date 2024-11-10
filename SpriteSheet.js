export class SpriteSheet {
    constructor(spr_w, spr_h, png_file) {
        this.sprite_w = spr_w;
        this.sprite_h = spr_h;
        this.image_loaded = false;

        // load the sprite sheet
        this.image = new Image();
        this.image.src = png_file;
        this.onDecoded = this.onDecoded.bind(this);
        this.image.decode()
            .then( this.onDecoded )
            .catch((error) => { console.error("failed to decode", error); });
    }

    onDecoded() {
        this.columns = Math.floor(this.image.width / this.sprite_w);
        this.image_loaded = true;
    }

    drawSprite(context, sprite_no, x, y, flip=false) {
        if (!this.image_loaded) 
            return;

        const sw = this.sprite_w;
        const sh = this.sprite_h;
        const sx = (sprite_no % this.columns) * sw;
        const sy = Math.floor(sprite_no / this.columns) * sh;
        if (flip) {
            context.save();
            context.scale(-1,1);
            context.drawImage(this.image, sx, sy, sw, sh, -x-sw, y, sw, sh);
            context.restore();
        } else {
            context.drawImage(this.image, sx, sy, sw, sh, x, y, sw, sh);
        }
    }

    drawSprite_half(context, sprite_no, x, y, flip=false) {
        if (!this.image_loaded) 
            return;

        const sw = this.sprite_w;
        const sh = this.sprite_h;
        const sx = (sprite_no % this.columns) * sw;
        const sy = Math.floor(sprite_no / this.columns) * sh;
        context.drawImage(this.image, sx, sy, sw, sh, x, y, sw*2/3, sh*2/3);
    }
}

