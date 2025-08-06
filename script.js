// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 960;
canvas.height = 540;

// Game constants
const GRAVITY = 0.5;
const PLAYER_JUMP_FORCE = -12;
const TILE_SIZE = 32;

// Asset placeholders (we'll draw simple rectangles for now)
const assets = {
    player: { color: '#00aaff', width: 24, height: 48 },
    platform: { color: '#445533' },
    tree: { color: '#112200', width: 32, height: 64 },
    rock: { color: '#555555', width: 32, height: 32 },
    log: { color: '#964b00' },
    stone: { color: '#aaaaaa' },
    food: { color: '#e07a5f' }
};

// Player object
const player = {
    x: 100,
    y: canvas.height - TILE_SIZE - assets.player.height,
    width: assets.player.width,
    height: assets.player.height,
    velY: 0,
    isOnGround: false,
    isJumping: false,
    speed: 5,
    health: 100,
    hunger: 100,
    inventory: {}
};

// Game world and objects
let gameObjects = [];
const platforms = [];
const breakables = [];
const foodSources = [];

// Game state variables
const keys = {};
let cameraX = 0;
let lastUpdate = Date.now();

// Game items and crafting recipes
const items = {
    log: { name: "Log", image: assets.log.color },
    stone: { name: "Stone", image: assets.stone.color },
    cooked_meat: { name: "Cooked Meat", image: assets.food.color, foodValue: 25 },
};

const craftingRecipes = {
    campfire: {
        name: "Campfire",
        recipe: { log: 5, stone: 3 },
        result: "campfire_item",
        onCraft: () => { console.log('Crafted Campfire!'); } // Placeholder for future logic
    },
    axe: {
        name: "Stone Axe",
        recipe: { log: 2, stone: 3 },
        result: "axe_item",
        onCraft: () => { console.log('Crafted Stone Axe!'); }
    }
};

// --- CORE GAME LOGIC ---

// Setup the game world
function initializeGame() {
    // Generate a simple world with platforms and resources
    for (let i = 0; i < 20; i++) {
        platforms.push({
            x: i * 150,
            y: canvas.height - TILE_SIZE,
            width: 100,
            height: TILE_SIZE,
        });

        // Add breakables (trees and rocks)
        if (i % 2 === 0) {
            breakables.push({
                x: i * 150 + 20,
                y: canvas.height - TILE_SIZE - assets.tree.height,
                width: assets.tree.width,
                height: assets.tree.height,
                type: 'tree',
                health: 10
            });
        } else {
            breakables.push({
                x: i * 150 + 60,
                y: canvas.height - TILE_SIZE - assets.rock.height,
                width: assets.rock.width,
                height: assets.rock.height,
                type: 'rock',
                health: 15
            });
        }
    }
    
    // Add a couple of food sources
    foodSources.push({ x: 350, y: canvas.height - TILE_SIZE - 20, width: 20, height: 20, type: 'berry' });

    // Initial UI render
    renderInventory();
    renderCraftingMenu();
}

// Main game loop
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - lastUpdate) / 1000;
    lastUpdate = now;

    update(deltaTime);
    render();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    // Player horizontal movement
    if (keys.a) player.x -= player.speed;
    if (keys.d) player.x += player.speed;

    // Apply gravity
    player.velY += GRAVITY;
    player.y += player.velY;

    // Platform collision
    player.isOnGround = false;
    platforms.forEach(platform => {
        if (isColliding(player, platform)) {
            // Player is above the platform
            if (player.velY > 0 && player.y + player.height < platform.y + player.velY + 10) {
                player.y = platform.y - player.height;
                player.velY = 0;
                player.isOnGround = true;
                player.isJumping = false;
            }
        }
    });

    // Handle jumping
    if (keys.w && player.isOnGround && !player.isJumping) {
        player.velY = PLAYER_JUMP_FORCE;
        player.isJumping = true;
    }

    // Hunger drain
    player.hunger -= 0.05 * deltaTime;
    if (player.hunger <= 0) {
        player.health = Math.max(0, player.health - 0.1 * deltaTime);
        player.hunger = 0;
    }

    // Update camera to follow the player
    cameraX = player.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > 20 * 150 - canvas.width) cameraX = 20 * 150 - canvas.width;

    // Update UI
    document.getElementById('health').textContent = Math.floor(player.health);
    document.getElementById('hunger').textContent = Math.floor(player.hunger);
    renderInventory();
}

// Render game
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render platforms
    platforms.forEach(p => {
        ctx.fillStyle = assets.platform.color;
        ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
    });

    // Render breakables
    breakables.forEach(b => {
        if (b.health > 0) {
            ctx.fillStyle = assets[b.type].color;
            ctx.fillRect(b.x - cameraX, b.y, b.width, b.height);
        }
    });

    // Render food sources
    foodSources.forEach(f => {
        ctx.fillStyle = assets.food.color;
        ctx.fillRect(f.x - cameraX, f.y, f.width, f.height);
    });

    // Render player
    ctx.fillStyle = assets.player.color;
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);
}

// --- UTILITY FUNCTIONS ---

// Simple AABB collision detection
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Harvest item from breakable
function harvest(type) {
    let itemToGive = null;
    let quantity = 1;
    if (type === 'tree') {
        itemToGive = 'log';
        quantity = Math.floor(Math.random() * 3) + 1;
    } else if (type === 'rock') {
        itemToGive = 'stone';
        quantity = Math.floor(Math.random() * 2) + 1;
    } else if (type === 'berry') {
        itemToGive = 'food';
        quantity = Math.floor(Math.random() * 5) + 1;
    }

    if (itemToGive) {
        if (!player.inventory[itemToGive]) {
            player.inventory[itemToGive] = 0;
        }
        player.inventory[itemToGive] += quantity;
    }
}

// Craft an item
function craftItem(recipeName) {
    const recipe = craftingRecipes[recipeName];
    if (!recipe) return;

    let canCraft = true;
    for (const item in recipe.recipe) {
        if (!player.inventory[item] || player.inventory[item] < recipe.recipe[item]) {
            canCraft = false;
            break;
        }
    }

    if (canCraft) {
        for (const item in recipe.recipe) {
            player.inventory[item] -= recipe.recipe[item];
        }
        
        // Add the crafted item to inventory or run a special function
        if (items[recipe.result]) {
             if (!player.inventory[recipe.result]) {
                player.inventory[recipe.result] = 0;
            }
            player.inventory[recipe.result]++;
        } else {
            recipe.onCraft();
        }
        renderInventory();
    } else {
        alert("Not enough resources to craft " + recipe.name);
    }
}

// Render inventory to the UI
function renderInventory() {
    const invList = document.getElementById('inventory-list');
    invList.innerHTML = '';
    for (const item in player.inventory) {
        if (player.inventory[item] > 0) {
            const listItem = document.createElement('li');
            listItem.textContent = `${items[item].name}: ${player.inventory[item]}`;
            invList.appendChild(listItem);
        }
    }
}

// Render crafting menu to the UI
function renderCraftingMenu() {
    const craftingList = document.getElementById('crafting-list');
    craftingList.innerHTML = '';
    for (const recipeName in craftingRecipes) {
        const recipe = craftingRecipes[recipeName];
        const listItem = document.createElement('li');
        listItem.textContent = recipe.name;
        
        // Show required items
        let requirements = '';
        for (const item in recipe.recipe) {
            requirements += ` ${items[item].name} x${recipe.recipe[item]}`;
        }
        listItem.title = `Requires:${requirements}`;

        listItem.onclick = () => craftItem(recipeName);
        craftingList.appendChild(listItem);
    }
}


// --- USER INPUT ---

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // Handle 'E' for interaction (breaking/harvesting)
    if (e.key.toLowerCase() === 'e') {
        const playerCenter = { x: player.x + player.width / 2, y: player.y + player.height / 2 };
        
        // Check for breakables
        breakables.forEach(b => {
            if (isColliding(player, b) && b.health > 0) {
                b.health -= 10;
                if (b.health <= 0) {
                    harvest(b.type);
                }
            }
        });
        
        // Check for food
        foodSources.forEach(f => {
            if (isColliding(player, f)) {
                player.hunger = Math.min(100, player.hunger + 25); // Replenish hunger
                f.x = -100; // "Remove" the food source
            }
        });
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    if (e.key.toLowerCase() === 'w') {
        player.isJumping = false;
    }
});

// Start the game!
initializeGame();
gameLoop();
