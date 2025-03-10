const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(30, 30); 

const arena = createMatrix(10, 20);
const colors = ['red', 'blue', 'green', 'purple', 'orange', 'cyan', 'yellow'];

let nextPiece = {
    matrix: createPiece(),
    color: randomColor()
};

const player = {
    position: { x: 4, y: 0 },
    matrix: createPiece(),
    color: randomColor(),
    score: 0
};

let dropCounter = 0;
let lastTime = 0;
const dropInterval = 1000;


function resizeCanvas() {
    const gameCanvas = document.getElementById('tetris');
    const nextCanvas = document.getElementById('next');
    const container = document.getElementById('game-container');
    
    // Calculate maximum available height
    const headerHeight = document.querySelector('h1').offsetHeight;
    const infoHeight = document.querySelector('#game-container').previousElementSibling.offsetHeight;
    const footerHeight = document.querySelector('p').offsetHeight;
    const padding = 32; // Total vertical padding
    
    const maxHeight = window.innerHeight - headerHeight - infoHeight - footerHeight - padding;
    const maxWidth = container.clientWidth;

    // Set canvas dimensions maintaining 2:1 aspect ratio (width:height)
    const canvasHeight = Math.min(maxHeight, maxWidth * 2);
    const canvasWidth = canvasHeight / 2;

    gameCanvas.width = canvasWidth;
    gameCanvas.height = canvasHeight;
    container.style.height = `${canvasHeight}px`;
    
    // Scale drawing context
    const context = gameCanvas.getContext('2d');
    context.scale(canvasWidth / 10, canvasHeight / 20);

    // Next piece canvas scaling
    const nextContext = nextCanvas.getContext('2d');
    nextCanvas.width = nextCanvas.clientWidth;
    nextCanvas.height = nextCanvas.clientHeight;
    nextContext.scale(nextCanvas.width / 4, nextCanvas.height / 4);
}

// Add event listeners
window.addEventListener('resize', () => {
    requestAnimationFrame(resizeCanvas);
});
window.addEventListener('load', resizeCanvas);


function createMatrix(width, height) {
    return Array.from({ length: height }, () => new Array(width).fill(0));
}

function createPiece() {
    const pieces = [
        [[1, 1, 1, 1]], // I
        [[1, 1], [1, 1]], // O
        [[1, 1, 1], [0, 1, 0]], // T
        [[1, 1, 1], [1, 0, 0]], // L
        [[1, 1, 1], [0, 0, 1]], // J
        [[0, 1, 1], [1, 1, 0]], // S
        [[1, 1, 0], [0, 1, 1]]  // Z
    ];
    return pieces[Math.floor(Math.random() * pieces.length)];
}

function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

function collide(arena, player) {
    return player.matrix.some((row, y) =>
        row.some((value, x) => value !== 0 && (arena[y + player.position.y]?.[x + player.position.x] !== 0))
    );
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.position.y][x + player.position.x] = player.color; 
            }
        });
    });
}

function clearLines() {
    let rowCount = 0;

    for (let y = arena.length - 1; y >= 0; y--) {
        if (arena[y].every(cell => cell !== 0)) {
            arena.splice(y, 1); 
            arena.unshift(new Array(10).fill(0)); 
            rowCount++;
            y++;
        }
    }

    if (rowCount > 0) {
        player.score += rowCount * 10;
        updateScore();
    }
}

function updateScore() {
    document.getElementById('score').innerText = `${player.score}`;
}

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = typeof value === 'string' ? value : player.color;
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);

                // Grid outline
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}


function drawNextPiece() {
    const nextCanvas = document.getElementById('next');
    const nextContext = nextCanvas.getContext('2d');
    const padding = 0.2;
    
    // Clear canvas
    nextContext.fillStyle = "#222";
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    // Reset transformation
    nextContext.setTransform(1, 0, 0, 1, 0, 0);
    const scale = Math.min(nextCanvas.width / 6, nextCanvas.height / 6);
    nextContext.scale(scale, scale);

    // Draw next piece centered
    if (nextPiece.matrix) {
        const offset = {
            x: (6 - nextPiece.matrix[0].length) / 2,
            y: (6 - nextPiece.matrix.length) / 2
        };
        
        nextPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    nextContext.fillStyle = nextPiece.color;
                    nextContext.fillRect(
                        x + offset.x + padding,
                        y + offset.y + padding,
                        1 - padding * 2,
                        1 - padding * 2
                    );
                }
            });
        });
    }
}


function drawGrid() {
    context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    context.lineWidth = 0.05;

    for (let x = 0; x < canvas.width / 30; x++) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height / 30);
        context.stroke();
    }

    for (let y = 0; y < canvas.height / 30; y++) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width / 30, y);
        context.stroke();
    }
}



function draw() {
    context.fillStyle = '#e0e0e0';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(); 
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.position);
}


function playerDrop() {
    player.position.y++;
    if (collide(arena, player)) {
        player.position.y--; 
        merge(arena, player);
        clearLines();
        playerReset();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.position.x += dir;
    if (collide(arena, player)) {
        player.position.x -= dir;
    }
}

function rotate(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function playerRotate() {
    const prevMatrix = player.matrix;
    player.matrix = rotate(player.matrix);
    
    if (collide(arena, player)) {
        player.matrix = prevMatrix; 
    }
}

function playerReset() {
    player.matrix = nextPiece.matrix;
    player.color = nextPiece.color;
    player.position.y = 0;
    player.position.x = Math.floor(arena[0].length / 2) - 
                      Math.floor(player.matrix[0].length / 2);

    // Generate new next piece
    nextPiece = {
        matrix: createPiece(),
        color: randomColor()
    };

    // Game Over Check
    if (collide(arena, player)) {
        gameOver = true;
        showGameOver();
        return;
    }

    drawNextPiece();
}



function update(time = 0) {
    if (gameOver) return;
    if (!bgMusic.paused) {
        bgMusic.play();
    }
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    requestAnimationFrame(update);
}

// Add gameOver state at the top of script.js
let gameOver = false;


// Add new functions for game over handling
function showGameOver() {
    // Stop background music
    const bgMusic = document.getElementById('bg-music');
    bgMusic.pause();
    
    // Play game over sound
    const gameOverSound = document.getElementById('game-over-sound');
    gameOverSound.play();

    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-gray-800 p-8 rounded-lg text-center">
            <h2 class="text-2xl text-red-500 mb-4">Game Over!</h2>
            <p class="text-white mb-4">Final Score: ${player.score}</p>
            <button onclick="location.reload()" 
                    class="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400">
                Play Again
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}


// Modify update function to stop the game
function update(time = 0) {
    if (gameOver) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    
    draw();
    requestAnimationFrame(update);
}

// Add CSS for the game over modal
const style = document.createElement('style');
style.textContent = `
    .game-over-modal {
        backdrop-filter: blur(5px);
    }
`;
document.head.appendChild(style);

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'ArrowUp') {
        playerRotate();
    }
});

update();
