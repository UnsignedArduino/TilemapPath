//% color="#00FF42"
namespace TilemapPath {
    /**
     * Define variables that are part of the namespace
     */
    let _sprites_to_stop: Sprite[] = [];
    let _sprites_are_following: Sprite[] = [];
    let _finish_callback: (sprite: Sprite) => void;

    /**
     * Create a TilemapPath object, which will hold an array of tilemap locations.
     */
    export class TilemapPath {
        /**
         * Define variables that are part of the class
         */
        private tilemap_path: tiles.Location[] = [];
        public a_star_path: tiles.Location[][] = undefined;

        /**
         * Make a tilemap path.
         * @param tilemap_path: An array of locations that a sprite will go to.
         */
        constructor(tilemap_path: tiles.Location[] = []) {
            this.tilemap_path = tilemap_path;
            this._calculate_path();
        }

        /**
         * Calculates the paths. 
         */
        //% hidden
        _calculate_path() {
            this.a_star_path = [];
            for (let index = 0; index < this.tilemap_path.length - 1; index += 1) {
                let from_loc: tiles.Location = this.tilemap_path[index];
                let to_loc: tiles.Location = this.tilemap_path[index + 1];
                // tiles.setTileAt(from_loc, sprites.castle.tileDarkGrass1);
                // tiles.setTileAt(to_loc, sprites.castle.tileDarkGrass2);
                // pause(1000);
                // tiles.setTileAt(from_loc, sprites.castle.tileGrass2);
                // tiles.setTileAt(to_loc, sprites.castle.tileGrass2);
                let path = scene.aStar(from_loc, to_loc);
                // mySprite.say("" + path);
                this.a_star_path.push(path);
            }
        }

        /**
         * Set the tilemap path.
         * @param tilemap_path: An array of locations that a sprite will go to.
         */
        set_path(tilemap_path: tiles.Location[]) {
            this.tilemap_path = tilemap_path;
            this._calculate_path();
        }

        /**
         * Get the tilemap path.
         * @return: An array of locations that a sprite will go to.
         */
        get_path(): tiles.Location[] {
            return this.tilemap_path;
        }
    }

    /**
     * Converts a screen coordinate to a tilemap location.
     * Definitely did not copy from the tilemap extension. 
     * @param value: The value (either X or Y coordinate)
     */
    function screenCoordinateToTile(value: number): number {
        const tm = game.currentScene().tileMap;
        if (!tm) return value >> 4;
        return value >> tm.scale;
    }

    /**
     * Find the location of a sprite. 
     * Definitely did not copy from the tilemap extension. 
     * @param sprite: The sprite.
     */
    function locationOfSprite(sprite: Sprite): tiles.Location {
        return tiles.getTileLocation(
            screenCoordinateToTile(sprite.x), 
            screenCoordinateToTile(sprite.y)
        );
    }

    /**
     * Create a new TilemapPath object
     * @param path: A list of locations to go to in order. 
     */
    //% block="create path $path"
    //% path.shadow="lists_create_with"
    //% blockSetVariable=path
    //% weight=100
    export function create_path(path: tiles.Location[]): TilemapPath {
        return new TilemapPath(path)
    }

    /**
     * Have a sprite follow a TilemapPath
     * @param sprite: The sprite that will follow the path.
     * @param path: The TilemapPath that will be followed.
     * @param speed: How fast the sprite should follow the path. Defaults to 100.
     */
    //% block="sprite $sprite follow path $path || at speed $speed"
    //% sprite.shadow="variables_get"
    //% sprite.defl="mySprite"
    //% path.shadow="variables_get"
    //% path.defl="path"
    //% speed.defl=100
    //% expandableArgumentMode="enabled"
    //% weight=90
    export function follow_path(sprite: Sprite, path: TilemapPath, speed: number = 100) {
        _sprites_are_following.push(sprite);
        if (path.get_path().length > 0) {
            scene.followPath(sprite, scene.aStar(locationOfSprite(sprite), path.get_path()[0]), speed);
        }
        for (let inner_path of path.a_star_path) {
            scene.followPath(sprite, inner_path, speed);
            wait_till_finish_path(sprite);
            let sprite_index = _sprites_to_stop.indexOf(sprite);
            if (sprite_index != -1) {
                _sprites_to_stop.splice(sprite_index, 1);
                _sprites_are_following.splice(_sprites_are_following.indexOf(sprite), 1);
                return;
            }
        }
        if (_finish_callback) {
            _finish_callback(sprite);
        }
        _sprites_are_following.splice(_sprites_are_following.indexOf(sprite), 1);
    }

    /**
     * Wait until a sprite finishes following it's path. 
     * This returns immediimmediately if not following a path. 
     * @param sprite: The sprite to wait for. 
     */
    //% hidden
    function wait_till_finish_path(sprite: Sprite) {
        while (scene.spriteIsFollowingPath(sprite)) {
            pause(0);
        }
    }

    /**
     * Get if a sprite is following a tilemap_path
     * @param sprite: The sprite to check.
     */
    //% block="is $sprite following path"
    //% sprite.shadow="variables_get"
    //% sprite.defl="mySprite"
    //% weight=80
    export function is_sprite_following_path(sprite: Sprite) {
        return _sprites_are_following.indexOf(sprite) != -1;
    }

    /**
     * Have a sprite stop following a TilemapPath
     * @param sprite: The sprite that will stop following the path.
     */
    //% block="sprite $sprite stop following path"
    //% sprite.shadow="variables_get"
    //% sprite.defl="mySprite"
    //% weight=70
    export function stop_follow_path(sprite: Sprite) {
        if (_sprites_are_following.indexOf(sprite) != -1) {
            _sprites_to_stop.push(sprite);
            scene.followPath(sprite, null);
        }
    }

    /**
     * Event handlers can have arguments too. You can refer to them using $NAME.
     */
    //% block="on sprite $sprite finishes tilemap path"
    //% draggableParameters="reporter"
    //% weight=60
    export function on_sprite_finishes_path(handler: (sprite: Sprite) => void) {
        _finish_callback = handler;
    }
}