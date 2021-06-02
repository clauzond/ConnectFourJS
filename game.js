// Game parameters
const FPS = 30;
const HEIGHT = 700;
const WIDTH = 640;
const GRID_SIZE = 7; // number of rows and columns

const SIDE_MARGIN = 20;
const CELL = ((WIDTH - 2*SIDE_MARGIN) / GRID_SIZE); // size of cell ; 1 side margin on left and right
const TOP_MARGIN = HEIGHT - (GRID_SIZE * CELL) - SIDE_MARGIN;
const STROKE = CELL / 10; // stroke width (stroke=contour)
const TILE_STROKE = CELL / 15;
const DOT = STROKE; // dot radius

const PLAYERTURN_X = WIDTH / 2;
const PLAYERTURN_Y = TOP_MARGIN / 2;

const PADDING = 20; // padding in style.css - #myCanvas

// Colors
const COLOR_BOARD = "#497ac8";
const COLOR_BORDER = "#1348a2";
const COLOR_TILE = "#2C73F7";
const COLOR_OUTER_TILE = "#1348a2";
const COLOR_YELLOW = "#fdef08";
const COLOR_RED = "#d5030e";
const COLOR_TIE = "#aaaaaa";

// Game Canvas
var canv = document.getElementById("myCanvas");
canv.height = HEIGHT;
canv.width = WIDTH;
document.body.appendChild(canv);

// Other elements
// infoContainer = document.getElementById("infoContainer");

// Context
var ctx = canv.getContext("2d");

// Game variables
var playerTurn, diskList, moveList;
var NUMBER_OF_YELLOW = 0;
var NUMBER_OF_RED = 0;
var HIGHLIGHT_HOVER = () => { return document.getElementById("highlightHover").checked };
var HIGHLIGHT_CAPTURED = () => { return document.getElementById("highlightCaptured").checked };
var HIGHLIGHT_POSSIBLE = () => { return document.getElementById("highlightPossible").checked };

// Event handlers
canv.addEventListener("mousemove", highlightGrid);
canv.addEventListener("click", mouseClick);
canv.addEventListener("mouseleave", clearHighlight);

function registerMove(row, col) {
    const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const moveName = alphabet[col]+""+row;
    moveList.push(moveName);
}

function highlightGrid(/** @type {MouseEvent} */ event) {
    if (!playerTurn) {
        return
    }

    var canvRect = canv.getBoundingClientRect(); // get mouse position relatively to the canvas
    // get mouse position relative to the canvas
    let x = event.clientX - canvRect.left;
    let y = event.clientY - canvRect.top - PADDING; // padding_top

    // highlight the possible disk and/or the captured disks
    if (HIGHLIGHT_HOVER() || HIGHLIGHT_CAPTURED() || HIGHLIGHT_POSSIBLE()) {
        // clear previous highlights
        clearHighlight();

        // calculate possible
        var row, col;
        var RowCol = getGridRowCol(x, y);
        if (RowCol) {
            [row, col] = RowCol;
            var disk = diskList[row][col];
            var capturedList = isTilePossible(disk);
            var bool = (capturedList.length != 0);
        } else {
            var disk = undefined;
            var bool = false;
            var capturedList = [];
        }
    }

    if (HIGHLIGHT_HOVER() && bool) {
        highlightHovered(disk);
    }
    if (HIGHLIGHT_CAPTURED() && bool) {
        highlightCaptured(capturedList);
    }
    if (HIGHLIGHT_POSSIBLE()) {
        highlightPossible();
    }


}

function clearHighlight() {
    for (let row of diskList) {
        for (let disk of row) {
            disk.highlight_state = false;
        }
    }
}

function highlightHovered(disk) {
    disk.highlight_state = true;
}

function highlightCaptured(capturedList) {
    for (let disk of capturedList) {
        disk.highlight_state = true;
    }
}

function highlightPossible() {
    var possibleList = [];
    for (let row of diskList) {
        for (let disk of row) {
            if (isTilePossible(disk).length != 0) {
                possibleList.push(disk);
            }
        }
    }
    for (let disk of possibleList) {
        disk.highlight_state = true;
    }
}

function mouseClick(/** @type {MouseEvent} */ event) {
    if (!playerTurn) {
        return
    }

    var canvRect = canv.getBoundingClientRect(); // get mouse position relatively to the canvas
    // get mouse position relative to the canvas
    let x = event.clientX - canvRect.left;
    let y = event.clientY - canvRect.top - PADDING;

    var RowCol = getGridRowCol(x, y);
    console.log(RowCol);
    if (RowCol) {
        [row, col] = RowCol;
        var disk = diskList[row][col];
        var capturedList = isTilePossible(disk);
        var bool = (capturedList != 0);
        if (bool) {
            disk.state = playerTurn;
            playTurn(capturedList, event);
            registerMove(row, col);
        }
    }
}

function nextTurn() {
    if (playerTurn == "yellow") {
        playerTurn = "red";
    } else {
        playerTurn = "yellow";
    };
}

function getGridX(col) {
    return (SIDE_MARGIN + CELL * col) // start after magin
}

function getGridY(row) {
    return (TOP_MARGIN + CELL * row) // start after margin
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
    var row = Math.floor((y - TOP_MARGIN) / CELL);


    return [row, col]
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
    // TODO: Draw tile in a circle pattern
    drawDisk(x + CELL / 2, y + CELL / 2, COLOR_TILE);
    drawCircle(x + CELL / 2, y + CELL / 2, COLOR_OUTER_TILE);
}

function drawDisks() {
    for (let row of diskList) {
        for (let disk of row) {
            disk.draw();
            disk.highlight();
        }
    }
}

function drawDisk(x, y, color, alpha = 1) {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, (CELL / 2) * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawCircle(x, y, color, alpha = 1) {
    // TODO: stroke width?
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = STROKE/2;
    ctx.beginPath();
    ctx.arc(x, y, (CELL / 2) * 0.8 + STROKE/2 - 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = STROKE;
}

function drawText() {
    ctx.font = "48px Garamond";
    ctx.fillStyle = getColor(playerTurn);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var turn = (playerTurn == "yellow" ? "Yellow plays" : "Red plays");
    ctx.fillText(turn, PLAYERTURN_X, PLAYERTURN_Y, WIDTH);
}

function drawWinText(player, winCondition, playerTurn) {
    let screenText, infoText, winSentence;

    let x = playerTurn[0].toUpperCase() + playerTurn.substring(1);
    infoText = "Game ended. ";
    infoText += (winCondition == "boardFull" ? "The board is full. " : x+" cannot place any disk. ");

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
    playerTurn = null;
    ctx.font = "48px Garamond";
    ctx.fillStyle = getColor(player);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(screenText, PLAYERTURN_X, PLAYERTURN_Y, WIDTH);

}

function getColor(playerTurn) {
    switch (playerTurn) {
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
        if (getColor(this.state) && playerTurn) {
            drawDisk(this.x + CELL / 2, this.y + CELL / 2, getColor(this.state));
        }
    }

    this.highlight = () => {
        var alpha = document.getElementById("alpha").value;
        if (this.highlight_state && playerTurn) {
            drawDisk(this.x + CELL / 2, this.y + CELL / 2, getColor(playerTurn), alpha);
        }
    }

}

// Game rules
function isTilePossible(disk) {
    if (disk.state != null) {
        return ([])
    }

    var capturedList = [];

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (!((i == 0) && (j == 0))) {
                // add captured disks to capturedList
                capturedList = capturedList.concat(verifyTile_withDirection(disk, i, j))
            }
        }
    }
    return (capturedList)
}

function verifyTile_withDirection(disk, offset_row, offset_col) {
    let list = []; // disk list to add to capturedList
    let yourColor = (playerTurn == "yellow") ? "yellow" : "red";
    let otherColor = (playerTurn == "yellow") ? "red" : "yellow";
    let thisRow = disk.row + offset_row;
    let thisCol = disk.col + offset_col;

    // capture until blank or you-colored disk
    while ((0 <= thisRow) && (thisRow < GRID_SIZE) && (0 <= thisCol) && (thisCol < GRID_SIZE) && (diskList[thisRow][thisCol].state == otherColor)) {
        list.push(diskList[thisRow][thisCol]);
        thisRow += offset_row;
        thisCol += offset_col;
    }

    // if your disk is on the other side, you can capture
    if ((0 <= thisRow) && (thisRow < GRID_SIZE) && (0 <= thisCol) && (thisCol <= GRID_SIZE - 1) && (diskList[thisRow][thisCol].state == yourColor)) {
        return (list)
    } else {
        return ([])
    }

}

function playTurn(capturedList, event) {
    let p, sum=0;
    if (playerTurn == "yellow") {
        NUMBER_OF_YELLOW += 1;
        p = 1;
    } else {
        NUMBER_OF_RED += 1;
        p = -1;
    }
    for (let disk of capturedList) {
        disk.state = playerTurn;
        NUMBER_OF_YELLOW += p;
        NUMBER_OF_RED -= p;
        sum += 1;
    }

    let s = (sum==1 ? "" : "s");
    let ve = (sum==1 ? "s" : "ve");
    let sentence = sum+" disk"+s+" ha"+ve+" been captured."

    clearHighlight();
    nextTurn();
    highlightGrid(event);
    overwriteGameInfo(sentence);
    checkForWin(playerTurn);
}

function isThereAvailableTile() {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (isTilePossible(diskList[i][j]).length != 0) {
                return (true)
            }
        }
    }
    return (false)
}

function checkForWin(playerTurn) {
    let winCondition;
    if (NUMBER_OF_YELLOW + NUMBER_OF_RED == GRID_SIZE ** 2) {
        winCondition = "boardFull";
    } else if (!isThereAvailableTile()) {
        winCondition = "noAvailableTile"
    } else {
        return
    }

    if (NUMBER_OF_RED > NUMBER_OF_YELLOW) {
        stopGame();
        drawWinText(player="red", winCondition=winCondition, playerTurn=playerTurn)
    } else if (NUMBER_OF_YELLOW > NUMBER_OF_RED) {
        stopGame();
        drawWinText(player="yellow", winCondition=winCondition, playerTurn=playerTurn)
    } else {
        stopGame();
        drawWinText(player="tie", winCondition=winCondition, playerTurn=playerTurn);
    }

}

function overwriteGameInfo(text) {
    infoContainer.innerHTML = text;
}

function newGame() {
    playerTurn = "red";
    diskList = [];
    moveList = [];
    for (let i = 0; i < GRID_SIZE; i++) { // row
        diskList[i] = []
        for (let j = 0; j < GRID_SIZE; j++) { // column
            diskList[i][j] = new Disk(i, j);
        }
    }

    m = Math.floor(GRID_SIZE / 2) - 1;

    diskList[m][m].state = "yellow";
    diskList[m + 1][m + 1].state = "yellow";
    diskList[m][m + 1].state = "red";
    diskList[m + 1][m].state = "red";

    NUMBER_OF_RED = 2;
    NUMBER_OF_YELLOW = 2;

}

function stopGame() {
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