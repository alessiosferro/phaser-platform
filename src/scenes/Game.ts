import Phaser from 'phaser';
import GameObjectWithBody = Phaser.Types.Physics.Arcade.GameObjectWithBody;
import Tile = Phaser.Tilemaps.Tile;

export class Game extends Phaser.Scene {
    platforms: Phaser.Physics.Arcade.StaticGroup;
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    space?: Phaser.Input.Keyboard.Key;
    stars: Phaser.Physics.Arcade.Group;
    bombs: Phaser.Physics.Arcade.Group;
    score = 0;
    isGameOver = false;
    scoreText: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    create() {
        this.add.image(512, 386, 'sky').setScale(1.28);

        this.drawPlatforms();
        this.drawPlayer();
        this.drawStars();
        this.drawBombs();
        this.drawScore();

        this.addMoveAnimations();

        this.cursors = this.input.keyboard?.createCursorKeys();
    }

    update() {
        this.updatePlayerState();
    }

    updatePlayerState() {
        if (this.isGameOver) {
            return;
        }

        const { velocityX, animation } =
            this.cursors?.left.isDown ? { velocityX: -200, animation: 'left' }  :
            this.cursors?.right.isDown ? { velocityX: 200, animation: 'right' } :
                { velocityX: 0, animation: 'turn' };

        this.player.setVelocityX(velocityX);
        this.player.anims.play(animation, true);

        if (this.isPlayerJumping()) {
            this.player.setVelocityY(-700);
        }
    }

    drawScore() {
        this.scoreText = this.add.text(1000, 24, "0", { fontSize: 36, fontFamily: 'Tahoma, sans-serif', color: 'gold' })
            .setOrigin(1, 0)
    }

    isPlayerJumping() {
        return (this.space?.isDown || this.cursors?.up.isDown) && this.player.body.touching.down;
    }

    drawBombs() {
        this.bombs = this.physics.add.group();
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.overlap(this.bombs, this.player, this.hitBomb, undefined, this);
        this.physics.add.collider(this.bombs, this.bombs);
    }

    hitBomb() {
        this.physics.pause();

        this.player.setTint(0xff0000);
        this.player.anims.play('turn');

        this.isGameOver = true;

        this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
            if (e.code !== 'Enter') return;

            this.input.keyboard?.off('keydown')

            this.physics.resume();
            this.isGameOver = false;
            this.player.clearTint();
            this.player.setPosition(512, 600);

            this.score = 0;
            this.scoreText.setText(`0`);

            this.bombs.children.each((child) => {
                this.bombs.remove(child, true, true );
                return true;
            });

            this.stars.children.iterate((child: any) => {
                const sprite = child as Phaser.Physics.Arcade.Sprite;
                sprite.enableBody(true, child.x, 16, true, true);
                return true;
            })
        });
    }

    drawStars() {
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 12,
            setScale: { x: 1.4 },
            setXY: { x: 30, y: 0, stepX: 80 }
        });

        this.stars.children.iterate((child) => {
            if ('setBounce' in child) {
                (child.setBounce as Phaser.Physics.Arcade.Body['setBounce'])(.2);
            }

            return null;
        });

        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.overlap(this.stars, this.player, this.collectStar, undefined, this);
    }

    collectStar(player: GameObjectWithBody | Tile, star: GameObjectWithBody | Tile) {
        this.score += 10;
        this.scoreText.setText(this.score.toString());

        if ('disableBody' in star) {
            (star.disableBody as Phaser.Physics.Arcade.Sprite['disableBody'])(true, true);
        }

        if (this.areAllStarsCollected()) {
            this.resetStars();

            if ('x' in player) {
                const x = player.x < 512 ?
                    Phaser.Math.Between(512, 1024)
                    : Phaser.Math.Between(0, 512);

                const bomb = this.bombs.create(x, 16, 'bomb').setScale(1.5).refreshBody();

                bomb.setBounce(true);
                bomb.setCollideWorldBounds(true);
                bomb.setVelocity(Phaser.Math.Between(-200, 200), 80);
            }
        }
    }

    areAllStarsCollected() {
        return this.stars.countActive(true) === 0;
    }

    resetStars() {
        this.stars.children.iterate((child) => {
            if ('enableBody' in child && 'x' in child) {
                (child.enableBody as Phaser.Physics.Arcade.Sprite['enableBody'])(true, child.x as number, 0, true, true);
            }

            return true;
        })
    }

    drawPlatforms() {
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(512, 752, 'platform').setScale(3, 1).refreshBody();
        this.platforms.create(256, 600, 'platform').setScale(.6, 1).refreshBody();
        this.platforms.create(768, 600, 'platform').setScale(.6, 1).refreshBody();
        this.platforms.create(512, 450, 'platform').setScale(.6, 1).refreshBody();
    }

    drawPlayer() {
        this.player = this.physics.add.sprite(512, 600, 'dude').setScale(1.25).refreshBody();
        this.player.setBounce(.15);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
        this.space = this.input.keyboard?.addKey('SPACE');
    }

    addMoveAnimations() {
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4 }]
        });
    }
}
