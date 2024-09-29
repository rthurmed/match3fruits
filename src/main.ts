import kaplay, { Vec2 } from "kaplay";

interface Item {
    pos: Vec2;
    tile: Vec2;
    sprite: string;
    visible: boolean;
}

const SPRITE_SIZE = 64;
const BOARD_COLS = 5;
const BOARD_ROWS = 6;
const PREVIEW_MOVEMENT_SPEED = 40;
// const GAP = 10;

const k = kaplay({
    canvas: document.getElementById("canvas") as HTMLCanvasElement,
    width: 400,
    height: 600,
    // letterbox: true,
    debug: true
});

k.setBackground(k.Color.fromHex("#fff275"));
k.debug.inspect = true;

const itemTypes = [
    "apple",
    "bread",
    "cookie",
    "croissant",
    "donut",
    "orange"
];

// load all items
for (let i = 0; i < itemTypes.length; i++) {
    const itemType = itemTypes[i];
    k.loadSprite(itemType, `./sprites/${itemType}.png`);
}

k.scene("main", () => {
    const items: Item[] = [];

    const game = k.add([
        k.timer(),
    ]);

    const playerController = {
        focusedIndex: -1,
    }

    const itemPreview = game.add([
        k.sprite("donut"),
        k.pos(-100, -100),
        k.opacity(0),
        k.z(100),
    ]);

    const board = game.add([
        k.area({
            shape: new k.Rect(k.vec2(), SPRITE_SIZE * BOARD_COLS, SPRITE_SIZE * BOARD_ROWS)
        }),
        // centralizes board
        k.pos(
            (k.width() - SPRITE_SIZE * BOARD_COLS) / 2,
            (k.height() - SPRITE_SIZE * BOARD_ROWS) / 2
        ),
        {
            tile(v: Vec2): Vec2 {
                // may include undefined in the return type if need consider gaps
                return k.vec2(
                    Math.floor((v.x - this.pos.x) / SPRITE_SIZE),
                    Math.floor((v.y - this.pos.y) / SPRITE_SIZE)
                )
            },
            untile(v: Vec2): Vec2 {
                return k.vec2(
                    v.x * SPRITE_SIZE,
                    v.y * SPRITE_SIZE
                )
            },
            getIndex(v: Vec2): number {
                return v.y * BOARD_COLS + v.x;
            }
        }
    ]);

    // fill board
    // sequentially: (0,0) (0,1) (1,0) (1,1) (2,0) (2,1)
    for (let posy = 0; posy < BOARD_ROWS; posy++) {
        for (let posx = 0; posx < BOARD_COLS; posx++) {
            const pos = k.vec2(posx, posy);
            items.push({
                pos: board.untile(pos),
                tile: pos,
                sprite: k.choose(itemTypes),
                visible: true
            })
        }
    }

    board.onDraw(() => {
        // draw board
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.visible) {
                continue;
            }
            k.drawSprite({
                sprite: item.sprite,
                pos: item.pos,
            });
        }
    });

    board.onUpdate(() => {
        const offseted = k.mousePos().add(k.vec2(SPRITE_SIZE / -2, SPRITE_SIZE / -2));
        itemPreview.pos = itemPreview.pos.lerp(offseted, k.dt() * PREVIEW_MOVEMENT_SPEED);
    });

    board.onMousePress((_button) => {
        const mousePos = k.mousePos();
        const index = board.getIndex(board.tile(mousePos));
        if (index < 0 || index >= items.length) {
            return;
        }
        const item = items[index];
        item.visible = false;
        itemPreview.pos = board.toWorld(item.pos);
        itemPreview.sprite = item.sprite;
        itemPreview.opacity = 1;
        playerController.focusedIndex = index;
    });

    board.onMouseRelease((_button) => {
        itemPreview.pos = k.vec2(-100, -100);
        itemPreview.opacity = 0;
        items[playerController.focusedIndex].visible = true;
    });
});
k.go("main");
