// Game variables and setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 32;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 50;

// Player data
const player = {
    x: MAP_WIDTH / 2 * TILE_SIZE,
    y: MAP_HEIGHT / 2 * TILE_SIZE,
    speed: 5,
    health: 100,
    hunger: 100,
    stamina: 100,
    inventory: {}
};

// Map generation (simple for now)
const map = [];
for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
        map[y][x] = Math.random() < 0.2 ? 'tree' : 'grass';
    }
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Player movement
    if (keys.w) player.y -= player.speed;
    if (keys.s) player.y += player.speed;
    if (keys.a) player.x -= player.speed;
    if (keys.d) player.x += player.speed;

    // Boundary checks
    player.x = Math.max(0, Math.min(canvas.width - TILE_SIZE, player.x));
    player.y = Math.max(0, Math.min(canvas.height - TILE_SIZE, player.y));
    
    // Simple hunger and stamina drain
    player.hunger = Math.max(0, player.hunger - 0.01);
    player.stamina = Math.max(0, player.stamina - 0.05);

    // Update UI
    document.getElementById('health').textContent = Math.floor(player.health);
    document.getElementById('hunger').textContent = Math.floor(player.hunger);
    document.getElementById('stamina').textContent = Math.floor(player.stamina);
}

// Render game
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            if (tile === 'grass') {
                ctx.fillStyle = '#445533';
            } else if (tile === 'tree') {
                ctx.fillStyle = '#112200';
            }
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Render player
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(player.x, player.y, TILE_SIZE, TILE_SIZE);
}

// Handle user input
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Initial setup
canvas.width = 800;
canvas.height = 600;
gameLoop();
