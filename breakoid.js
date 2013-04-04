/**
* JavaScript Bricks Breaking game.
*/
;(function (window) {

    function Breakoid (canvasId) {

        Breakoid.TICKS_INTERVAL = 1
        Breakoid.NBROWS         = 8
        Breakoid.NBCOLS         = 10
        Breakoid.BRICK_HEIGHT   = 15
        Breakoid.EMPTY_SPACE    = 5
        Breakoid.BAR_HEIGHT     = 10
        Breakoid.BAR_COLOR      = '#333333'
        Breakoid.BAR_SPEED      = 3
        Breakoid.BAR_FRICTION   = 0.90
        Breakoid.BALL_COLOR     = 'red'
        Breakoid.BALL_SIZE      = 8
        Breakoid.TEXT_COLOR     = 'blue'

        var _bricksArray = new Array(Breakoid.NBROWS)
        , _ctx // context
        , _gameWidth, _gameHeight // canvas width/height
        , _brickWidth
        , _barX, _barY, _barWidth, _barVelocity = 0 // bar properties
        , _ballX, _ballY, _ballDirX, _ballDirY // ball properties
        , _interval // interval
        , _running = false, _pause = false // state of the game
        , _arrowKeys = [] 

        /**
        * Class constructor from canvas' id.
        * Calculate bar and bricks widths if a
        * canvas was provided, print error if not.
        *
        * @method __construct
        * @param {string} canvasId The html canvas's id 
        * @return {void}
        */
        function __construct (canvasId) {
            var canvas = document.getElementById(canvasId)
            if (canvas) {
                _ctx        = canvas.getContext('2d')
                _gameWidth  = canvas.width
                _gameHeight = canvas.height
                _barWidth   = _gameWidth / 8.0
                _brickWidth = (_gameWidth / Breakoid.NBCOLS) - (Breakoid.EMPTY_SPACE * Breakoid.NBCOLS / Breakoid.NBCOLS+0.5)
                keyboardListener()
                _ctx.font = "20px sans-serif"
                _ctx.fillStyle = Breakoid.TEXT_COLOR
                buildGame()
            } else {
                console.log('No canvas with id: %s', canvasId)
            }
        }  __construct(canvasId);

        /**
        * Bind the keyboard for shortcuts and bar moves.
        *
        * @method keyboardListener
        * return {void}
        */
        function keyboardListener () {
            window.document.onkeydown = function (e) {
                switch (e.keyCode) {
                    case 39:
                        _arrowKeys['right'] = true
                    break
                    case 37:
                        _arrowKeys['left'] = true
                    break
                    case 80: // p (pause)
                        if (_running)
                            pause()
                    break
                    case 82: // r (restart)
                        _running = false
                        clearInterval(_interval)
                        buildGame()
                    break
                    case 83: // s (start)
                        if (!_running)
                            start()
                    break
                }
            }
            window.document.onkeyup = function (e) {
                switch (e.keyCode) {
                    case 39:
                        _arrowKeys['right'] = false
                    break
                    case 37:
                        _arrowKeys['left'] = false
                    break
                }
            }
        }

        /**
        * Calculate bar and ball sizes and positions and build the first frame.
        *
        * @method buildGame
        * @return {void}
        */
        function buildGame () {
            // Sizes
            _barX     = (_gameWidth / 2) - (_barWidth / 2)
            _barY     = _gameHeight - Breakoid.BAR_HEIGHT - 2
            _ballX    = _gameWidth / 1.3
            _ballY    = _gameHeight / 2
            _ballDirX = -1
            _ballDirY = 1
            clearContext()
            // Bricks
            for (var i=0 ; i<Breakoid.NBROWS ; i++) {
                _bricksArray[i] = new Array(Breakoid.NCOLS)
                // random line color
                _ctx.fillStyle = "rgb("+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+")"
                _bricksArray[i].color = _ctx.fillStyle
                for (var j=0 ; j<Breakoid.NBCOLS ; j++) {
                    _ctx.fillRect( (j * (_brickWidth + Breakoid.EMPTY_SPACE)) + Breakoid.EMPTY_SPACE, (i * (Breakoid.BRICK_HEIGHT + Breakoid.EMPTY_SPACE)) + Breakoid.EMPTY_SPACE, _brickWidth, Breakoid.BRICK_HEIGHT)
                    _bricksArray[i][j] = true // a brick is here
                }
            }
            // Bar
            _ctx.fillStyle = Breakoid.BAR_COLOR
            _ctx.fillRect(_barX, _barY, _barWidth, Breakoid.BAR_HEIGHT)

            printText("Press S to start the game, R to reload.")
        };

        /**
        * Core method of the graphics, to be called by an interval.
        * Will redraw every graphic element and bricks according to the _bricksArray array.
        *
        * @method tick
        * @return {void}
        */
        function tick () {
            clearContext()
            ballOnTick() // Ball
            // Bricks
            var won = true
            for (var i=0 ; i<Breakoid.NBROWS ; i++) {
                _ctx.fillStyle = _bricksArray[i].color
                for (var j=0 ; j<Breakoid.NBCOLS ; j++) {
                    if (_bricksArray[i][j]) {
                        _ctx.fillRect( (j * (_brickWidth+Breakoid.EMPTY_SPACE)) + Breakoid.EMPTY_SPACE, (i * (Breakoid.BRICK_HEIGHT+Breakoid.EMPTY_SPACE)) + Breakoid.EMPTY_SPACE, _brickWidth, Breakoid.BRICK_HEIGHT)
                        won = false
                    }
                }
            }
            if (won)
                gameIsFinished('You won! Press R to reload the game.')
            barOnTick() // Bar
        };

        /**
        * Redraw the ball on each tick of the game. Handle collisions with bricks and bar.
        *
        * @method ballOnTick
        * @return {void}
        */
        function ballOnTick () {
            _ballX += _ballDirX
            _ballY += _ballDirY
            if (_ballX + Breakoid.BALL_SIZE > _gameWidth) _ballDirX  = -1 // right border
            else if (_ballX - Breakoid.BALL_SIZE < 0 )    _ballDirX  = 1 // left border
            if (_ballY + Breakoid.BALL_SIZE > _gameHeight) gameIsFinished('You lost! Press R to reload the game.')
            else {
                if (_ballY - Breakoid.BALL_SIZE < 0 ) _ballDirY = 1 // top border
                else {
                    // Ball touch the bar
                    if  (
                        _ballY + Breakoid.BALL_SIZE > _barY - 1
                        && (_ballX >= _barX && _ballX <= _barX + _barWidth)
                        ) {
                        _ballDirY = -1
                        if (_barVelocity > 1 || _barVelocity < -1)
                            _ballDirX = _barVelocity * 0.35
                    }
                }
            }
 
            // Ball is in brick zone (First empty space row, the top of the game, is NOT considered as the brick zone because of...)
            if (_ballY - Breakoid.BALL_SIZE <= Breakoid.NBROWS * (Breakoid.BRICK_HEIGHT + Breakoid.EMPTY_SPACE) 
                && _ballY - Breakoid.BALL_SIZE > Breakoid.BRICK_HEIGHT) {
                var Y = Math.floor((_ballY - Breakoid.BALL_SIZE + Breakoid.BRICK_HEIGHT) / (Breakoid.BRICK_HEIGHT + Breakoid.EMPTY_SPACE)) - 1
                var X = Math.floor(_ballX / (_brickWidth + Breakoid.EMPTY_SPACE))
                if (_bricksArray[Y][X]) { // ...this. And because we don't need to do this stuff anyway.
                    _bricksArray[Y][X] = false
                    _ballDirY = 1
                }
            }

            _ctx.fillStyle = Breakoid.BALL_COLOR
            _ctx.beginPath()
            _ctx.arc(_ballX, _ballY, Breakoid.BALL_SIZE, 0, Math.PI * 2, true)
            _ctx.closePath()
            _ctx.fill()
        };

        /**
        * Redraw the bar on each tick of the game.
        *
        * @method barOnTick
        * @return {void}
        */
        function barOnTick () {
            if (_arrowKeys['right']) { // right
                if (_barVelocity < Breakoid.BAR_SPEED)
                    _barVelocity++
            } else if (_arrowKeys['left']) { // left
                if (_barVelocity > -Breakoid.BAR_SPEED)
                    _barVelocity--
            }

            _barVelocity *= Breakoid.BAR_FRICTION
            _barX += _barVelocity

            if (_barX > _gameWidth - _barWidth)
                _barX = _gameWidth - _barWidth
            else if (_barX < 0) 
                _barX = 0

            _ctx.fillStyle = Breakoid.BAR_COLOR
            _ctx.fillRect(_barX, _barY, _barWidth, Breakoid.BAR_HEIGHT)
        };

        /**
        * Clear the canvas.
        *
        * @method clearContext
        * @return {void}
        */
        function clearContext () {
            _ctx.clearRect(0, 0, _gameWidth, _gameHeight)
        };

        /**
        * Print some text on the canvas.
        * 
        * @method printText
        * @param {string} msg The text to print
        * @return {void}
        */
        function printText (msg) {
            _ctx.fillText(msg, _gameWidth / 2 - _ctx.measureText(msg).width / 2, Breakoid.NBROWS * (Breakoid.BRICK_HEIGHT + Breakoid.EMPTY_SPACE) + 30)
        };

        /**
        * Pause or resume the game by clearing 
        * or setting the refreshing interval.
        *
        * @method pause
        * @return {void}
        */
        function pause () {
            if (!_pause) {
                _pause = true
                clearInterval(_interval)
            }
            else {
                _pause = false
                _interval = setInterval(tick, Breakoid.TICKS_INTERVAL)
            }
        };

        /**
        * Notificate the user that the game is finisehd, and prints the reason.
        *
        * @method gameIsFinished
        * @return {void}
        */
        function gameIsFinished (msg) {
            _running = false
            clearInterval(_interval)
            printText(msg)
        };

        /**
        * Start the game.
        *
        * @method start
        * @return {void}
        */
        function start () {
            if (_ctx && !_running) {
                _running = true
                _interval = setInterval(tick, Breakoid.TICKS_INTERVAL)
            }
            else if (_ctx) {
                printText('Error during initialization. Can\'t start game.')
            }
            else {
                console.log('Error during initialization. Can\'t start game.')
            }
        };
    }

window.Breakoid = Breakoid

}(window));