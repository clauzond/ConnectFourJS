// Game parameters
let FPS = 30;
let HEIGHT = 700;
let WIDTH = 640;
let GRID_SIZE = 7; // number of rows and columns

let SIDE_MARGIN = 20;
let CELL = ((WIDTH - 2 * SIDE_MARGIN) / GRID_SIZE); // size of cell ; 1 side margin on left and right
let TOP_MARGIN = HEIGHT - (GRID_SIZE * CELL) - SIDE_MARGIN;
let STROKE = CELL / 10; // stroke width (stroke=contour)
let TILE_STROKE = CELL / 15;
let DOT = STROKE; // dot radius

let PLAYERTURN_X = WIDTH / 2;
let PLAYERTURN_Y = TOP_MARGIN / 2;

let PADDING = 20; // padding in style.css - #myCanvas

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
}

// Colors
const COLOR_BOARD = "#8AAAE5";
const COLOR_BORDER = "#0063B2FF";
const COLOR_TILE = "#2C73F7";
const COLOR_OUTER_TILE = COLOR_BORDER;
const COLOR_YELLOW = "#FCE77D";
const COLOR_RED = "#F7545C";
const COLOR_TIE = "#EEEEFF";
const COLOR_LINE = "#000000";


// Game Canvas
var canv = document.getElementById("myCanvas");
canv.height = HEIGHT;
canv.width = WIDTH;
document.body.appendChild(canv);

// Other elements
infoContainer = document.getElementById("infoContainer");

// Context
var ctx = canv.getContext("2d");

// Game variables
var PLAYER_TURN, STARTING_PLAYER, DISK_LIST, DISK_PER_COLUMN, MOVE_LIST;
var WINNING_MOVE_LIST = [];
var NUMBER_OF_YELLOW = 0;
var NUMBER_OF_RED = 0;
var HIGHLIGHT_HOVER = () => { return document.getElementById("highlightHover").checked };
var HIGHLIGHT_COLUMN = () => { return document.getElementById("highlightColumn").checked };
var GET_ALPHA = () => { return parseFloat(document.getElementById("alpha").value) };
var GET_GRID_SIZE = () => { return parseInt(document.getElementById("gridSize").value) };
var SWAP_BUTTON = document.getElementById("swapTurn");
SWAP_BUTTON.style.color = COLOR_YELLOW;
SWAP_BUTTON.onclick = () => {
    if (!PLAYER_TURN) {
        return;
    } else if (PLAYER_TURN == "yellow") {
        PLAYER_TURN = "red";
        SWAP_BUTTON.style.color = COLOR_RED;
    } else {
        PLAYER_TURN = "yellow"
        SWAP_BUTTON.style.color = COLOR_YELLOW;
    }

    var player = (PLAYER_TURN == "yellow" ? "Yellow" : "Red");
    var sentence = player + " is now playing !";

    clearHighlight();
    overwriteGameInfo(sentence);
}

// Event handlers
canv.addEventListener("mousemove", highlightGrid);
canv.addEventListener("click", mouseClick);
canv.addEventListener("mouseleave", clearHighlight);

function registerMove(row, col) {
    const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const moveName = alphabet[col] + "" + row;
    MOVE_LIST.push(moveName);
}

function highlightGrid(/** @type {MouseEvent} */ event) {
    if (!PLAYER_TURN) {
        return
    }

    var canvRect = canv.getBoundingClientRect(); // get mouse position relatively to the canvas
    // get mouse position relative to the canvas
    let x = event.clientX - canvRect.left;
    let y = event.clientY - canvRect.top - PADDING; // remove padding_top

    // highlight the possible disk and/or the captured disks
    if (HIGHLIGHT_HOVER() || HIGHLIGHT_COLUMN()) {
        // clear previous highlights
        clearHighlight();

        // calculate possible
        var row, col;
        var RowCol = getGridRowCol(x, y);
        if (RowCol) {
            [row, col] = RowCol;
            if (HIGHLIGHT_HOVER()) {
                highlightHovered(col);
            }
            if (HIGHLIGHT_COLUMN()) {
                highlightColumn(col);
            }
        }
    }
}

function clearHighlight() {
    if (!PLAYER_TURN) {
        return;
    }
    for (let row of DISK_LIST) {
        for (let disk of row) {
            disk.highlight_state = false;
        }
    }
}

function highlightHovered(col) {
    possibleRow = getPossibleRow(col);
    if (possibleRow >= 0) {
        DISK_LIST[possibleRow][col].highlight_state = true;
    }
}

function highlightColumn(col) {
    for (let row = 0; row <= getPossibleRow(col); row++) {
        DISK_LIST[row][col].highlight_state = true;
    }
}

function highlightPossible() {
    return;
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
        playTurn(row, col, event);
        registerMove(row, col);
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
            disk.highlight();
        }
    }
}

function drawLine(row, col, offset_row, offset_col) {
    var first_disk = DISK_LIST[row][col];
    var last_disk = DISK_LIST[row + 3*offset_row][col + 3*offset_col];
    var x1 = first_disk.x + CELL/2, y1 = first_disk.y + CELL/2;
    var x2 = last_disk.x + CELL/2, y2 = last_disk.y + CELL/2;
    ctx.fillStyle = COLOR_LINE
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
    // TODO: stroke width?
    ctx.fillStyle = color;
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

    var row, col, offset_row, offset_col;
    for (let quadruplet of WINNING_MOVE_LIST) {
        [row, col, offset_row, offset_col] = quadruplet;
        drawLine(row, col, offset_row, offset_col);
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

// Tile object constructor
function Disk(row, col) {
    this.row = row;
    this.col = col;
    this.x = getGridX(col);
    this.y = getGridY(row);

    this.state = null;
    this.highlight_state = false;


    this.draw = () => {
        if (getColor(this.state) && PLAYER_TURN) {
            drawDisk(this.x + CELL / 2, this.y + CELL / 2, getColor(this.state));
        }
    }

    this.highlight = () => {
        var alpha = GET_ALPHA();
        if (this.highlight_state && PLAYER_TURN) {
            var possibleRow = getPossibleRow(this.col);
            if (this.row == possibleRow && HIGHLIGHT_HOVER()) {
                drawDisk(this.x + CELL / 2, this.y + CELL / 2, getColor(PLAYER_TURN), alpha);
            } else if (this.row <= possibleRow) {
                drawDisk(this.x + CELL / 2, this.y + CELL / 2, COLOR_OUTER_TILE, alpha);
            }
        }
    }

}

// Game rules
function playTurn(row, col, event) {
    if (PLAYER_TURN == "yellow") {
        NUMBER_OF_YELLOW += 1;
    } else {
        NUMBER_OF_RED += 1;
    }

    DISK_LIST[row][col].state = PLAYER_TURN;
    DISK_PER_COLUMN[col] += 1

    var player = (PLAYER_TURN == "yellow" ? "Yellow" : "Red");
    var sentence = player + " has played in column " + (col + 1);

    clearHighlight();
    overwriteGameInfo(sentence);
    checkForWin(row, col);
    nextTurn();
    highlightGrid(event);
}

function checkInDirection(row, col, offset_row, offset_col) {
    var playerChecked = PLAYER_TURN;
    let r = row;
    let c = col;
    let count = 0;
    while (count < 4 && (0 <= r && r < GRID_SIZE) && (0 <= c && c < GRID_SIZE)) {
        if (DISK_LIST[r][c].state != playerChecked) {
            return false;
        }

        r += offset_row;
        c += offset_col;
        count++;
    }
    if (count == 4) {
        console.log(row, col, offset_row, offset_col);
        WINNING_MOVE_LIST.push([row, col, offset_row, offset_col]);
    }
    return (count == 4);
}

function checkForConnectFour(row, col) {
    var playerChecked = PLAYER_TURN;
    var bool = false;
    // Trigonometry-like rotation to check
    bool = checkInDirection(row, col, 1, 0) || bool;
    bool = checkInDirection(row, col, 1, 1) || bool;
    bool = checkInDirection(row, col, 0, 1) || bool;
    bool = checkInDirection(row, col, -1, 1) || bool;
    bool = checkInDirection(row, col, -1, 0) || bool;
    bool = checkInDirection(row, col, -1, -1) || bool;
    bool = checkInDirection(row, col, 0, -1) || bool;
    bool = checkInDirection(row, col, 1, -1) || bool;
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
    infoContainer.innerHTML = text;
}

function newGame() {
    initGrid();
    STARTING_PLAYER = ((!STARTING_PLAYER || STARTING_PLAYER == "red") ? "yellow" : "red");
    PLAYER_TURN = STARTING_PLAYER;
    WINNING_MOVE_LIST = [];
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
}

function stopGame() {
    PLAYER_TURN = "";
    clearInterval(runningLoop);
}

function resetGame() {
    stopGame();
    startLoop();
    newGame();
    overwriteGameInfo("Game has reset.");
}

// Start a new game
newGame();

// Set up the game loop
function startLoop() {
    runningLoop = setInterval(loop, 1000 / FPS);
}

var runningLoop;
startLoop();

function loop() {
    drawBoard(); // draw background
    drawGrid(); // draw grid, with each individual tile
    drawDisks(); // draw the active disk
    drawText(); // draw the top hud
    // 2 mouse events : click (-> place a disk) and mousemove (-> highlight if possible)
}