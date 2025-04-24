const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let currentPlayer = "X";

let gameActive = false;

let gameState = ["", "", "", "", "", "", "", "", ""];

let gameMode = null;

let playerSymbol = null;

let computerSymbol = null;

let difficulty = "easy";

const board = document.getElementById("board");

const status = document.getElementById("status");

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8],
    [2, 4, 6],
];

// Sound functions

function playSound(frequency = 440, type = "sine") {
    if (audioContext.state === "suspended") audioContext.resume();

    const oscillator = audioContext.createOscillator();

    const gainNode = audioContext.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);

    gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
    );

    oscillator.connect(gainNode);

    gainNode.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(audioContext.currentTime + 0.3);
}

// Game mode handlers

function setGameMode(mode) {
    gameMode = mode;

    document.getElementById("difficultyLevels").style.display = "none";

    document.getElementById("symbolSelector").style.display = "none";

    if (mode === "2-player") {
        board.classList.remove("disabled");

        resetGame();

        playSound(523.25);
    }
}

function showComputerOptions() {
    document.getElementById("difficultyLevels").style.display = "flex";

    document.getElementById("symbolSelector").style.display = "none";

    board.classList.add("disabled");

    gameMode = null;

    playSound(523.25);
}

function setDifficulty(level) {
    difficulty = level;

    document.getElementById("difficultyLevels").style.display = "none";

    document.getElementById("symbolSelector").style.display = "flex";

    gameMode = "computer";

    board.classList.remove("disabled");

    resetGame();

    playSound(587.33);
}

function setPlayerSymbol(symbol) {
    playerSymbol = symbol;

    computerSymbol = symbol === "X" ? "O" : "X";

    gameActive = true;

    status.textContent = `Your turn (${playerSymbol})`;

    playSound(659.25);

    // Only start computer if it's their turn first

    if (computerSymbol === "X") {
        computerMove();
    }
}

// Core game logic

function handleCellClick(e) {
    if (!gameActive || !gameMode) return;

    if (gameMode === "computer" && currentPlayer !== playerSymbol) return;

    const cell = e.target;

    const cellIndex = parseInt(cell.dataset.cellIndex);

    if (gameState[cellIndex] !== "") return;

    makeMove(cell, cellIndex);

    if (checkWin()) handleGameEnd();
    else if (checkDraw()) handleDraw();
    else handleNextTurn();
}

function makeMove(cell, index) {
    gameState[index] = currentPlayer;

    cell.textContent = currentPlayer;

    cell.classList.add(currentPlayer.toLowerCase(), "occupied");

    playSound(currentPlayer === "X" ? 784 : 659);
}

// AI logic

function computerMove() {
    if (!gameActive || currentPlayer !== computerSymbol) return;

    let move;

    switch (difficulty) {
        case "god":
            move = getBestMove();
            break;

        case "hard":
            move = Math.random() < 0.8 ? getBestMove() : getRandomMove();
            break;

        case "medium":
            move = Math.random() < 0.5 ? getBestMove() : getRandomMove();
            break;

        default:
            move = getRandomMove();
    }

    setTimeout(
        () => {
            if (!gameActive) return;

            const cell = document.querySelector(`[data-cell-index="${move}"]`);

            makeMove(cell, move);

            if (checkWin()) handleGameEnd();
            else if (checkDraw()) handleDraw();
            else handleNextTurn();
        },
        difficulty === "god" ? 100 : 500
    );
}

// Minimax algorithm

function getBestMove() {
    function minimax(board, depth, isMaximizing) {
        if (checkWinForPlayer(computerSymbol, board)) return 1;

        if (checkWinForPlayer(playerSymbol, board)) return -1;

        if (board.every((cell) => cell !== "")) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;

            for (let i = 0; i < 9; i++) {
                if (board[i] === "") {
                    const newBoard = [...board];

                    newBoard[i] = computerSymbol;

                    const score = minimax(newBoard, depth + 1, false);

                    bestScore = Math.max(score, bestScore);
                }
            }

            return bestScore;
        } else {
            let bestScore = Infinity;

            for (let i = 0; i < 9; i++) {
                if (board[i] === "") {
                    const newBoard = [...board];

                    newBoard[i] = playerSymbol;

                    const score = minimax(newBoard, depth + 1, true);

                    bestScore = Math.min(score, bestScore);
                }
            }

            return bestScore;
        }
    }

    let bestScore = -Infinity;

    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
        if (gameState[i] === "") {
            const newBoard = [...gameState];

            newBoard[i] = computerSymbol;

            const score = minimax(newBoard, 0, false);

            if (score > bestScore) {
                bestScore = score;

                bestMove = i;
            }
        }
    }

    return bestMove;
}

// Helper functions

function checkWinForPlayer(player, board = gameState) {
    return winningCombinations.some((combination) =>
        combination.every((index) => board[index] === player)
    );
}

function getRandomMove() {
    const emptyCells = gameState

        .map((cell, index) => (cell === "" ? index : null))

        .filter((cell) => cell !== null);

    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function checkWin() {
    return checkWinForPlayer(currentPlayer);
}

function checkDraw() {
    return gameState.every((cell) => cell !== "");
}

function handleDraw() {
    status.textContent = "Draw!";

    playSound(392);

    gameActive = false;
}

function highlightWinningCombination() {
    winningCombinations.forEach((combination) => {
        if (combination.every((index) => gameState[index] === currentPlayer)) {
            combination.forEach((index) => {
                document
                    .querySelector(`[data-cell-index="${index}"]`)

                    .classList.add("winning-cell");
            });
        }
    });
}

function handleGameEnd() {
    status.textContent =
        gameMode === "computer"
            ? currentPlayer === playerSymbol
                ? "You win! 🎉"
                : "Computer wins! 🤖"
            : `Player ${currentPlayer} wins! 🎉`;

    playSound(1046.5);

    gameActive = false;

    highlightWinningCombination();
}

function handleNextTurn() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";

    if (gameMode === "computer") {
        if (currentPlayer === computerSymbol) {
            status.textContent = "Computer thinking...";

            board.classList.add("disabled");

            setTimeout(() => {
                computerMove();

                board.classList.remove("disabled");
            }, 500);
        } else {
            status.textContent = `Your turn (${playerSymbol})`;
        }
    } else {
        status.textContent = `Player ${currentPlayer}'s turn`;
    }
}

function resetGame() {
    currentPlayer = "X";

    gameActive = true;

    gameState = ["", "", "", "", "", "", "", "", ""];

    document.querySelectorAll(".cell").forEach((cell) => {
        cell.textContent = "";

        cell.className = "cell";
    });

    if (gameMode === "computer") {
        status.textContent = playerSymbol
            ? `Your turn (${playerSymbol})`
            : "Choose your symbol";

        if (computerSymbol === "X") computerMove();
    } else {
        status.textContent = gameMode
            ? `Player ${currentPlayer}'s turn`
            : "Select game mode";
    }
}

function fullReset() {
    gameMode = null;

    difficulty = "easy";

    playerSymbol = null;

    computerSymbol = null;

    document.getElementById("difficultyLevels").style.display = "none";

    document.getElementById("symbolSelector").style.display = "none";

    resetGame();

    status.textContent = "Select game mode";

    board.classList.add("disabled");
}

// Initialize game

document.querySelectorAll(".cell").forEach((cell) => {
    cell.addEventListener("click", handleCellClick);
});

fullReset();
