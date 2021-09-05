// Game parameters
let FPS, HEIGHT, WIDTH, GRID_SIZE;
let SIDE_MARGIN, CELL, TOP_MARGIN, STROKE, TILE_STROKE, DOT, PADDING;

let PLAYERTURN_X = WIDTH / 2;
let PLAYERTURN_Y = TOP_MARGIN / 2;

// Game Canvas
var canv = document.getElementById("myCanvas");
document.body.appendChild(canv);
var ctx = canv.getContext("2d");

function initGrid() {
    FPS = 30;
    HEIGHT = 700;
    WIDTH = 640;
    GRID_SIZE = GET_GRID_SIZE();
    SIDE_MARGIN = 20;
    CELL = ((WIDTH - 2 * SIDE_MARGIN) / GRID_SIZE);
    TOP_MARGIN = HEIGHT - (GRID_SIZE * CELL) - SIDE_MARGIN;
    STROKE = CELL / 10;
    TILE_STROKE = CELL / 15;
    DOT = STROKE;
    PLAYERTURN_X = WIDTH / 2;
    PLAYERTURN_Y = TOP_MARGIN / 2;
    canv.height = HEIGHT;
    canv.width = WIDTH;
}

// Colors
const COLOR_BOARD = "#8AAAE5";
const COLOR_BORDER = "#0063B2FF";
const COLOR_TILE = "#2C73F7";
const COLOR_OUTER_TILE = COLOR_BORDER;
const COLOR_YELLOW = "#FCE77D";
const COLOR_RED = "#F7545C";
const COLOR_TIE = "#EEEEFF";
const COLOR_LINE = COLOR_BORDER;

// Emojis
const EMOJI_YELLOW = "🟡";
const EMOJI_RED = "🔴";
const EMOJI_EMPTY = "⚪";

// Game variables
var PLAYER_TURN, STARTING_PLAYER, DISK_LIST, DISK_PER_COLUMN, MOVE_LIST;
var WINNING_DISK_LIST = [];
var NUMBER_OF_YELLOW = 0;
var NUMBER_OF_RED = 0;
var GET_GRID_SIZE = () => { return 7 };

// Event handlers
canv.addEventListener("click", mouseClick);

function registerMove(row, col) {
    const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const moveName = alphabet[col] + "" + row;
    MOVE_LIST.push(moveName);
}

function mouseClick(/** @type {MouseEvent} */ event) {
    if (!PLAYER_TURN) {
        return
    }

    var canvRect = canv.getBoundingClientRect(); // get mouse position relatively to the canvas
    // get mouse position relative to the canvas
    let x = event.clientX - canvRect.left;
    let y = event.clientY - canvRect.top - PADDING; // remove padding_top

    var RowCol = getGridRowCol(x, y);
    if (RowCol) {
        [row, col] = RowCol;
        playTurn(col);
        registerMove(row, col);
    }
}

function playMove(col) {
    if (!PLAYER_TURN) return;
    try {
        playTurn(col);
        registerMove(getPossibleRow(col), col);
    } catch (error) {
        console.log("Incorrect move");
    }
}

function nextTurn() {
    if (!PLAYER_TURN) {
        return;
    } else if (PLAYER_TURN == "yellow") {
        PLAYER_TURN = "red";
    } else {
        PLAYER_TURN = "yellow";
    };
}

function getGridX(col) {
    return (SIDE_MARGIN + CELL * col); // start after magin
}

function getGridY(row) {
    return (TOP_MARGIN + CELL * row); // start after margin
}

function getGridRowCol(x, y) {
    // Outside the board
    if (x < SIDE_MARGIN || x >= SIDE_MARGIN + (GRID_SIZE * CELL)) {
        return (null);
    } else if (y < TOP_MARGIN || y >= (TOP_MARGIN + (GRID_SIZE * CELL))) {
        return (null);
    }

    // Inside the board
    var col = Math.floor((x - SIDE_MARGIN) / CELL);
    var row = getPossibleRow(col);
    if (row < 0) {
        return (null);
    }
    return [row, col];
}

function getPossibleRow(col) {
    return ((GRID_SIZE - 1) - DISK_PER_COLUMN[col]);
}

function drawBoard() {
    ctx.fillStyle = COLOR_BOARD;
    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = STROKE;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeRect(STROKE / 2, STROKE / 2, WIDTH - STROKE, HEIGHT - STROKE);
}

function drawGrid() {
    for (let i = 0; i < GRID_SIZE; i++) { // row
        for (let j = 0; j < GRID_SIZE; j++) { // column
            drawTile(getGridX(j), getGridY(i));
        }
    }
}

function drawTile(x, y) {
    drawDisk(x + CELL / 2, y + CELL / 2, COLOR_BOARD);
    drawCircle(x + CELL / 2, y + CELL / 2, COLOR_OUTER_TILE);
}

function drawDisks() {
    for (let row of DISK_LIST) {
        for (let disk of row) {
            disk.draw();
        }
    }
}

function drawWinningLine(first_disk, last_disk) {
    var x1 = first_disk.x + CELL / 2, y1 = first_disk.y + CELL / 2;
    var x2 = last_disk.x + CELL / 2, y2 = last_disk.y + CELL / 2;
    ctx.strokeStyle = COLOR_LINE
    ctx.beginPath()
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawDisk(x, y, color, alpha = 1) {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, (CELL / 2) * 0.8 + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawCircle(x, y, color, alpha = 1) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = STROKE / 2;
    ctx.beginPath();
    ctx.arc(x, y, (CELL / 2) * 0.8 + STROKE / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = STROKE;
}

function drawText() {
    ctx.font = "48px Garamond";
    ctx.fillStyle = getColor(PLAYER_TURN);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var turn = (PLAYER_TURN == "yellow" ? "Yellow plays" : "Red plays");
    ctx.fillText(turn, PLAYERTURN_X, PLAYERTURN_Y, WIDTH);
}

function drawWinText(player, winCondition) {
    let screenText, infoText, winSentence;

    let x = PLAYER_TURN[0].toUpperCase() + PLAYER_TURN.substring(1);
    infoText = "Game ended. ";
    infoText += (winCondition == "boardFull" ? "The board is full. " : "");

    if (player == "tie") {
        screenText = "IT'S A TIE !";
        infoText += "It's a tie.";
    } else {
        screenText = (player == "yellow" ? "YELLOW WON !" : "RED WON !");
        infoText += (player == "yellow" ? "Yellow won." : "Red won.")
    }
    overwriteGameInfo(infoText);

    drawBoard();
    drawGrid();
    drawDisks();
    PLAYER_TURN = "";
    ctx.font = "48px Garamond";
    ctx.fillStyle = getColor(player);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(screenText, PLAYERTURN_X, PLAYERTURN_Y, WIDTH);

    var first_disk, last_disk
    for (let two_disk of WINNING_DISK_LIST) {
        [first_disk, last_disk] = two_disk;
        drawWinningLine(first_disk, last_disk);
    }
}

function getColor(state) {
    switch (state) {
        case "yellow":
            return (COLOR_YELLOW);
            break;
        case "red":
            return (COLOR_RED);
            break;
        case "tie":
            return (COLOR_TIE);
        default:
            return (false);
            break;
    }
}

// Emoji functions
function getEmoji(state) {
    if (state == "yellow") {
        return EMOJI_YELLOW;
    } else if (state == "red") {
        return EMOJI_RED;
    } else {
        return EMOJI_EMPTY;
    }
}

function getGameString() {
    let gameString = "";
    for (let i = 0; i < GRID_SIZE; i++) { // row
        for (let j = 0; j < GRID_SIZE; j++) { // column
            gameString += getEmoji(DISK_LIST[i][j].state);
        }
        gameString += "\n"
    }
    return gameString;
}

// Tile object constructor
function Disk(row, col) {
    this.row = row;
    this.col = col;
    this.x = getGridX(col);
    this.y = getGridY(row);

    this.state = null;


    this.draw = () => {
        if (getColor(this.state) && PLAYER_TURN) {
            drawDisk(this.x + CELL / 2, this.y + CELL / 2, getColor(this.state));
        }
    }
}

// Game rules
function playTurn(col) {
    let row = getPossibleRow(col);
    
    if (PLAYER_TURN == "yellow") {
        NUMBER_OF_YELLOW += 1;
    } else {
        NUMBER_OF_RED += 1;
    }

    DISK_LIST[row][col].state = PLAYER_TURN;
    DISK_PER_COLUMN[col] += 1

    var player = (PLAYER_TURN == "yellow" ? "Yellow" : "Red");
    var sentence = player + " has played in column " + (col + 1);

    loop();
    overwriteGameInfo(sentence);
    checkForWin(row, col);
    nextTurn();
}

function checkInDirection(row, col, offset_row, offset_col) {
    var playerChecked = PLAYER_TURN;
    var first_disk, last_disk;
    let count = 1; // [row][col] is occupied by player

    // Count backwards
    let r = row - offset_row;
    let c = col - offset_col;
    while ((0 <= r && r < GRID_SIZE) && (0 <= c && c < GRID_SIZE)) {
        if (DISK_LIST[r][c].state == playerChecked) {
            count++;
            first_disk = DISK_LIST[r][c];
        } else {
            break;
        }

        r -= offset_row;
        c -= offset_col;
    }

    if (!first_disk) {
        first_disk = DISK_LIST[row][col];
    }

    // Count forwards
    r = row + offset_row;
    c = col + offset_col;
    while ((0 <= r && r < GRID_SIZE) && (0 <= c && c < GRID_SIZE)) {
        if (DISK_LIST[r][c].state == playerChecked) {
            count++;
            last_disk = DISK_LIST[r][c];
        } else {
            break;
        }

        r += offset_row;
        c += offset_col;
    }

    if (!last_disk) {
        last_disk = DISK_LIST[row][col];
    }

    if (count >= 4) {
        WINNING_DISK_LIST.push([first_disk, last_disk]);
    }
    return (count >= 4);
}

function checkForConnectFour(row, col) {
    var playerChecked = PLAYER_TURN;
    var bool = false;

    // Trigonometry-like rotation to check, but checking in straight line (both directions)
    bool = checkInDirection(row, col, 1, 0) || bool;
    bool = checkInDirection(row, col, 1, 1) || bool;
    bool = checkInDirection(row, col, 0, 1) || bool;
    bool = checkInDirection(row, col, -1, 1) || bool;
    return (bool ? playerChecked : "");
}

function checkForWin(row, col) {
    let boardFull = false;
    let winner = checkForConnectFour(row, col)
    if (NUMBER_OF_YELLOW + NUMBER_OF_RED == GRID_SIZE ** 2) {
        boardFull = true;
    }

    if (winner) {
        drawWinText(player = winner, winCondition = "");
        stopGame();
    } else if (boardFull) {
        drawWinText(player = "tie", winCondition = "boardFull");
        stopGame();
    } else {
        return;
    }
}

function overwriteGameInfo(text) {
    console.log(text);
}

function newGame() {
    initGrid();
    STARTING_PLAYER = ((!STARTING_PLAYER || STARTING_PLAYER == "red") ? "yellow" : "red");
    PLAYER_TURN = STARTING_PLAYER;
    WINNING_DISK_LIST = [];
    DISK_LIST = [];
    MOVE_LIST = [];
    DISK_PER_COLUMN = Array(GRID_SIZE).fill(0);
    for (let i = 0; i < GRID_SIZE; i++) { // row
        DISK_LIST[i] = []
        for (let j = 0; j < GRID_SIZE; j++) { // column
            DISK_LIST[i][j] = new Disk(i, j);
        }
    }
    
    NUMBER_OF_RED = 0;
    NUMBER_OF_YELLOW = 0;
    loop();
}

function stopGame() {
    PLAYER_TURN = "";
}

function resetGame() {
    stopGame();
    newGame();
    overwriteGameInfo("Game has reset.");
}

// Start a new game
newGame();

function loop() {
    drawBoard(); // draw background
    drawGrid(); // draw grid, with each individual tile
    drawDisks(); // draw the active disk
    drawText(); // draw the top hud
    // 2 mouse events : click (-> place a disk)
}