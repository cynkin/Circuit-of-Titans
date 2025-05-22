const svg = document.getElementById("shape");
const centerX = 320;
const centerY = 320;
// const radius = [90, 190, 290];
const sides = 6;
const noOfRings = 3;
const innerRadius = 15;
let totalSeconds = 10*60;
let PlayerTime = 30;
// const weights = [9, 8, 8, 9, 8, 8, 4, 6, 5, 4, 6, 5, 2, 1, 2, 3, 1, 1];
const history = [];
const future = [];
const moveRows =[];
const entries =[];
let clickLock = false;
let playerInterval = null;
let timerInterval = null;
let isPaused = false;
let noOfTitans = 0;
let isSinglePlayer = false;
let lastClickTime = 0;
let placed = false;

const scaleMap = {
    2: 1.15,
    3: 1,
    4: 0.85,
    5: 0.70,
    6: 0.55,
    7: 0.5,
    8: 0.45,
    9: 0.40,
}
svg.style.transform = `scale(${scaleMap[noOfRings]})`;
// svg.style.transform = `scale(0.40)`;

const radius = [];
for(let i = 0; i<noOfRings; i++){
    radius.push(90 + i*100);
}

let weights= [];
for(let i = noOfRings-1; i >=0; i--){
    for(let j = 0; j < sides; j++){
        weights.push(Math.floor(Math.random()*2 + (noOfRings*i + 1)));
    }
}

const state = {
    turn: 1,
    hex : new Array(noOfRings).fill(false),
}
state.hex[noOfRings - 1] = true;

const edgeSet = [];
const circleSet = [];
const nodeSet = [];
const edgeInfo = []
let selectedTitan = null;

const occupied = [];
for(let i = 0; i< noOfRings; i++){
    occupied[i] = new Array(sides).fill(0);
}
console.log(occupied);

const pieces1 = document.querySelector(".pieces1");
const pieces2 = document.querySelector(".pieces2");

//pieces 1
const row1 = document.createElement("div");
const image1 = document.createElement("img");
row1.classList.add("piece-list");
image1.src = "images/icon4.png";
image1.alt = "piece";
image1.width = 50;
image1.height = 50;

for(let i = 0; i<4; i++){
    row1.appendChild(image1.cloneNode());
}

pieces1.appendChild(row1);

//pieces2
let row2 = document.createElement("div");
const image2 = document.createElement("img");
row2.classList.add("piece-list");
image2.src = "images/iconP2.png";
image2.alt = "piece";
image2.width = 50;
image2.height = 50;

for(let i = 0; i<4; i++){
    row2.appendChild(image2.cloneNode());
}
pieces2.appendChild(row2);


const players = {
    1  : {name: "Player 1", color :"#ff2e63", id :1, titans: 4, pTitans:0, row:row1, image: image1, list:pieces1, time:15, score:0},
    2  : {name: "Player 2", color :"#2bc1ff", id :2, titans: 4, pTitans:0, row:row2, image: image2, list:pieces2, time:15, score:0},
}


function playSound(name){
    const audio = document.getElementById(name);
    audio.currentTime = 0;
    audio.play();
}

function updatePiece(player){
    player.row.innerHTML = "";
    for(let i = 0; i<player.titans; i++){
        player.row.appendChild(player.image.cloneNode());
    }
    player.list.appendChild(player.row)
}

function getCurrent(a = state.turn){
    return players[a % 2 === 0 ? 2: 1];
}

function setText(x1, x2, y1, y2, t = 1){
    const midX = (x1+ x2)/2;
    const midY = (y1 + y2)/2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / length;
    const perpY = dx / length;

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", midX + perpX * 10);
    text.setAttribute("y", midY + perpY * 20);
    text.setAttribute("font-size", "24");
    text.setAttribute("font-weight", "300");
    text.setAttribute("fill", "white");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.textContent = t;
    svg.appendChild(text);
}

function setTextCircle(x, y, t){
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("font-size", "24");
    text.setAttribute("font-weight", "300");
    text.setAttribute("fill", "white");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.textContent = t;
    svg.appendChild(text);
}

function makeCircle(x, y, t=""){
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", innerRadius);
    circle.setAttribute("fill", "#1e1f1e");
    circle.setAttribute("stroke", "white");
    return circle;
}

function makeEdge(from, to, weight){
    const edge = document.createElementNS("http://www.w3.org/2000/svg", "line");
    console.log(from, to, weight)
    edge.setAttribute("x1", from.x);
    edge.setAttribute("y1", from.y);
    edge.setAttribute("x2", to.x);
    edge.setAttribute("y2", to.y);
    edge.setAttribute("stroke", "white");
    // svg.appendChild(edge);
    edgeSet.push(edge);
    setText(from.x, to.x, from.y, to.y, weight);

    edgeInfo.push({from, to, weight, owner:null});
    return edge;
}

function makeShape(j){
    const nodes = [];
    const circles = [];

    for (let i = 0; i < sides; i++) {
        const angle = (2 *Math.PI/sides) * i;
        const x = centerX + radius[j] * Math.cos(angle);
        const y = centerY + radius[j] * Math.sin(angle);
        nodes.push({x, y});
    }

    for (let i = 0; i < sides; i++) {
        const n1 = nodes[i];
        const n2 = nodes[(i + 1) % sides];
        const edge = makeEdge(n1, n2, weights[i + sides*j]);
        svg.appendChild(edge);
    }

    for (let i = 0; i < sides; i++){
        console.log(nodes[i]);
        const circle = makeCircle(nodes[i].x, nodes[i].y);
        svg.appendChild(circle);
        if(state.hex[j]) circle.classList.add("unlocked");
        circles.push(circle);
    }

    nodeSet.push(nodes);
    circleSet.push(circles);
}

function connect() {
    const interEdges = document.createElementNS("http://www.w3.org/2000/svg", "g");
    for (let i = 0; i < noOfRings - 1; i++) {
        let a = (i%2 === 0 ? 0 : 1);
        for (let j = a; j < sides - 1 + a; j += 2) {
            console.log(i, j);
            const n1 = nodeSet[i][j];
            const n2 = nodeSet[i + 1][j];
            console.log(nodeSet);
            const edge = makeEdge(n1, n2, 1);
            interEdges.appendChild(edge);
        }
    }
    svg.insertBefore(interEdges, svg.firstChild);
}

for(let i = 0; i < noOfRings; i++) {
    makeShape(i);
}
connect();

function getOwner(node){
    const {x, y} = node;
    for(let i = 0; i < nodeSet.length; i++){
        for(let j = 0; j < sides; j++){
            if(x === nodeSet[i][j].x && y === nodeSet[i][j].y){
                return occupied[i][j];
            }
        }
    }
    return 0;
}

function update(){
    const score = [0, 0];
    edgeInfo.forEach((edge, i) => {
        const fromId = getOwner(edge.from);
        const toId = getOwner(edge.to);

        edgeSet[i].setAttribute("stroke", "white");
        edgeSet[i].classList.remove("edge-capture");

        if(fromId !== 0 && fromId === toId){
            edge.owner = fromId;
            score[fromId - 1] += edge.weight;
            edgeSet[i].setAttribute("stroke", players[fromId].color);
            edgeSet[i].classList.add("edge-capture");

        }

    });

    document.querySelector('.score1').innerHTML = score[0];
    document.querySelector('.score2').innerHTML = score[1];

    players[1].score = score[0];
    players[2].score = score[1];

    // if(score[0] === score[2]){
    //     return gameOver(2);
    // }
    return score[0] > score[1] ? players[1] : players[2];
}

function applyState(saved){

    state.hex = [...saved.hex];

    for(let i = 0; i<noOfRings; i++){
        for(let j = 0; j < sides; j++){
            occupied[i][j] = saved.occupied[i][j];
            const val = saved.occupied[i][j];
            const circle = circleSet[i][j];
            if (val !== 0) {
                const color = players[val].color;
                circle.setAttribute("fill", color);
                circle.setAttribute("stroke", color);
                circle.setAttribute("player", val);

            } else {
                circle.setAttribute("fill", "#1e1f1e");
                circle.setAttribute("stroke", "white");
                circle.removeAttribute("player");
            }

            if(state.hex[i]){
                circle.classList.add("unlocked");
            }
            else{
                circle.classList.remove("unlocked");
            }
        }
    }

    update();
}

function save(){
    history.push({
        occupied: JSON.parse(JSON.stringify(occupied)),
        a :players[1].titans,
        b: players[2].titans,
        c: players[1].pTitans,
        d: players[2].pTitans,
        noOfTitans : noOfTitans,
        hex:[...state.hex],

    })
    future.length = 0;
    console.log("Saved state", history.length, JSON.stringify(occupied));
}

function undo(){
    let t = 0;
    if(selectedTitan) return;
    if(history.length === 0) return;
    if(isSinglePlayer && state.turn%2 === 1) t = 1;

    const lastState = history.pop();

    const container = document.querySelector('.history-container');
     const lastEntry = entries.pop();

    container.removeChild(lastEntry);

    future.push({
        occupied: JSON.parse(JSON.stringify(occupied)),
        entry: lastEntry,
        a :players[1].titans,
        b: players[2].titans,
        c: players[1].pTitans,
        d: players[2].pTitans,
        noOfTitans : noOfTitans,
        hex:[...state.hex]
    });


    state.turn--;
    applyState(lastState);
    players[1].titans = lastState.a;
    players[2].titans = lastState.b;
    players[1].pTitans = lastState.c;
    players[2].pTitans = lastState.d;
    updatePiece(players[1]);
    updatePiece(players[2]);
    noOfTitans = lastState.noOfTitans;
    console.log("Undo:", history.length, "Future:", future.length, state.turn);

    highlight(getCurrent());
    if(t === 1) {
        undo();
    }
}

function redo() {
    let t = 0;
    if(selectedTitan) return;
    if (future.length === 0) return;
    if(isSinglePlayer && state.turn%2 === 1) t = 1;

    const lastState = future.pop();
    history.push({
        occupied: JSON.parse(JSON.stringify(occupied)),
        a :players[1].titans,
        b: players[2].titans,
        c: players[1].pTitans,
        d: players[2].pTitans,
        noOfTitans : noOfTitans,
        hex:[...state.hex]
    });

    console.log("Redoing", lastState);
    state.turn++;
    applyState(lastState);
    players[1].titans = lastState.a;
    players[2].titans = lastState.b;
    players[1].pTitans = lastState.c;
    players[2].pTitans = lastState.d;
    updatePiece(players[1]);
    updatePiece(players[2]);
    noOfTitans = lastState.noOfTitans;

    document.querySelector('.history-container').appendChild(lastState.entry);
    console.log("Undo:", history.length, "Future:", future.length, state.turn);

    highlight(getCurrent());
    if(t === 1) {
        redo();
    }
}

function gameOver(b, id=0){
    isPaused = true;
    const overlay = document.querySelector(".overlay");
    const msg = document.querySelector(".winMsg");
    const by = document.querySelector(".winBy");
    const name1 = document.querySelector(".name-1");
    const name2 = document.querySelector(".name-2");

    let score1 = document.querySelector('.final-score1');
    let score2 = document.querySelector('.final-score2');
    score1.innerHTML = players[1].score;
    score2.innerHTML = players[2].score;

    let score = 0;
    name1.innerHTML = players[1].name;
    name2.innerHTML = players[2].name;

    let winner;
    let method;
    if(b === 2){
        winner = "draw";
        msg.innerHTML = "Draw";
        method = "points";
        score = 0;
    }
    else if(b === 3 || b === 4) {
        winner = players[id].name;
        score = players[id].score;
        msg.innerHTML = `${winner} Won!`;
        console.log(b, id);
        method = b===3? "resignation": "Insufficient Material";
    }
    else{
        let winner = update();
        msg.innerHTML = `${winner.name} Won!`;
        score = winner.score;
        method = b===0? "points":"timeout";
    }


    by.innerHTML = `by ${method}`;
    overlay.classList.remove("hidden");
    saveScore(winner, score, b);
}

saveScore("Player 1", 10, 0);
saveScore("Player 2", 20, 0);
saveScore("Player 3", 30, 0);
saveScore("Player 2", 40, 0);

function saveScore(winner, score, b){
    if(!winner) return;

    let leaderboard = JSON.parse(localStorage.getItem("leaderboard"));
    if(!leaderboard){
        leaderboard = [];
    }
    leaderboard.push({winner, score, b});
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function isAdjacent(ring, index, i, j){
    if (ring === i) {
        return (Math.abs(index - j) === 1 || Math.abs(index - j) === sides - 1);
    }

    if(index === j){
        if((ring + i -3) %4 === 0 && j % 2 !== 0){
            return true;
        }
        if((ring + i -1) % 4 === 0 && j % 2 === 0){
            return true;
        }
    }
    return false;
}

function getAdjacent(i, j) {
    const adj = [];

    const n1 = (j - 1 + sides) % sides;
    const n2 = (j + 1)%sides;
    adj.push({a:i, b:n2});
    adj.push({a:i, b:n1});

    if(i> 0){
        if((i%2 !==0 && j % 2 === 0) || i%2 === 0 && j%2 !== 0){
            adj.push({a:i -1 , b:j})
        }
    }
    if(i<noOfRings - 1){
        if((i%2 ===0 && j % 2 === 0) || i%2 !== 0 && j%2 !== 0){
            adj.push({a:i + 1 , b:j})
        }
    }

    return adj;
}

function screenShake(){
    const game = document.querySelector(".middle-panel");
    game.classList.add("shake");
    setTimeout(()=>{
        game.classList.remove("shake");
    }, 400);
}

function eliminate(i, j, player){
    console.log("eliminating player", player);
    screenShake();
    occupied[i][j] = 0;
    circleSet[i][j].setAttribute("fill", "#1e1f1e");
    circleSet[i][j].setAttribute("stroke", "white");
    circleSet[i][j].setAttribute("player", 0);
    playSound("eliminate")
    console.log("Eliminated");

    const next = getCurrent(player.id + 1);

    player.titans--;
    updatePiece(player);
    if(player.titans <= 1){
        gameOver(4, next.id);
    }
}

function checkElimination(i, j, a = 0){

    if(i === noOfRings - 1) return;

    const id = occupied[i][j];
    if(!id) return;

    console.log("Checking for ", i, j);
    const attack_id = id === 1? 2 : 1;
    console.log("Attacking id ", attack_id);
    let surrounded = true;

    //CURRENT POSITION
    let t = 0;
    const adj = getAdjacent(i, j);
    for(const {a, b} of adj) {
        if (occupied[a][b] !== attack_id) {
            surrounded = false;
            break;
        }
        else t++;
    }
    if(a === 2) return t;
    if(surrounded){
        console.log(id);
        if(a === 1) return true;
        eliminate(i, j, players[id]);
        console.log(`Titan at (${i}, ${j}) Eliminated!`);
    }
}

async function check(i, j){
    await checkElimination(i, j);
    const adj = getAdjacent(i, j);
    for(const {a, b} of adj) {
        await checkElimination(a, b);

    }
    console.log("Checked", i, j);
}

function showMoves(i, j){
    const adj = getAdjacent(i, j);
    for(const {a, b} of adj) {
        if (occupied[a][b] === 0 && state.hex[a]) {
            circleSet[a][b].classList.add("show");
        }
    }
}

function removeShow(){
    circleSet.flat().forEach(c => c.classList.remove("show"));
}

function updatePlayerTime(player, t=0){
    const timer = document.querySelector(`.time-${player.id}`);
    if(t === 1) timer.classList.remove("active");
    else timer.classList.add("active");
    timer.textContent = player.time.toString().padStart(2, "0");

}

function startPlayerTime(){
    if(playerInterval){
        clearInterval(playerInterval);
    }

    isPaused = false;

    const current = getCurrent();
    const next = getCurrent(state.turn + 1);
    next.time = PlayerTime;
    updatePlayerTime(next, 1);

    playerInterval = setInterval(()=>{
        if(!isPaused && current.time > 0){
            current.time--;
            updatePlayerTime(current);
        }
        if(!isPaused && current.time <= 0){
            clearInterval(playerInterval);
            gameOver(3, next.id);
        }
    }, 1000)
}

function updateTotalTime(a = 0){
    const timer = document.querySelector('.total-time');
    const min = Math.floor(totalSeconds / 60);
    const sec = (totalSeconds % 60).toString().padStart(2, "0");
    if(a === 0) {timer.textContent = `${min}:${sec}`}
    else {timer.textContent = `10:00`}
}

function startTimer(){
    timerInterval = setInterval(()=>{
        if(!isPaused && totalSeconds > 0){
            totalSeconds--;
            updateTotalTime();
        }
        if(!isPaused && totalSeconds <= 0){
            clearInterval(timerInterval);
            gameOver(1);
        }
    }, 1000);
}

function highlight(player){
    const boxes = document.querySelectorAll(".box");
    boxes.forEach(box => {
        box.classList.remove("active");
    })

    boxes[player.id - 1].classList.add("active");
}

function getAllMoves(playerID){
    const moves = [];
    if(noOfTitans < 8 && players[playerID].pTitans < 4) {

        for (let i = 0; i < noOfRings; i++) {
            for (let j = 0; j < sides; j++) {
                if (occupied[i][j] === 0 && state.hex[i]) {
                    moves.push({
                        type: "place",
                        from: null,
                        to: {ring: i, index: j},
                        score: evaluate(i, j, playerID, 0)
                    });
                }
            }
        }
    }
    else{
        for(let i = 0; i<noOfRings; i++) {
            for (let j = 0; j < sides; j++) {
                if (occupied[i][j] === playerID && state.hex[i]) {
                    const adj = getAdjacent(i, j);
                    adj.forEach(({a, b}) => {
                        if (occupied[a][b] === 0 && state.hex[a])
                            moves.push({
                                type: "move",
                                from: {ring: i, index: j},
                                to: {ring: a, index: b},
                                score: evaluate(i, j, playerID, a - i)
                            });
                    })
                }
            }
        }
    }
    console.log("Total Moves:", moves.length);
    moves.sort((a, b) => b.score - a.score);
    return moves
}

function evaluate(i, j, playerID, p) {
    const opponentId = playerID === 1? 2 : 1;
    let score = 0;

    score += (noOfRings - i + 3*p)*5;

    if (state.hex[i]) {
        score += 5;
    }

    let inter = false;
    if (i !== 0) {
        if ((i % 2 === 0 && j % 2 !== 0) || (i % 2 !== 0 && j % 2 === 0)) {
            score += (noOfRings - i)*5;
            inter = true;
        }
    }

    const neighbours = getAdjacent(i, j);
    for(const {a, b} of neighbours){
        if(occupied[a][b] === playerID){
            score += 5;
        }
        if(occupied[a][b] === opponentId){
            if(!inter) score -= 10;
        }
    }
    if(checkElimination(i, j, 1)) score -= 75;

    return score;
}

// function evaluateBoard(playerId){
//     let opponentId = playerId === 1? 2 : 1;
//
//     let score = 0;
//
//     for(let i = 0; i<noOfRings; i++){
//         for(let j = 0; j<sides; j++){
//             if(occupied[i][j] === playerId) {
//                 score += evaluate(i, j, 2, 0);
//             }
//         }
//     }
//
//     // for (let j = 0; j < sides; j++) {
//     //     const cell = occupied[0][j];
//     //     if (cell === playerId) score += 30;
//     //     if (cell === opponentId) score -= 25;
//     // }
//
//     edgeInfo.forEach(edge  => {
//         const fromId = getOwner(edge.from);
//         const toId = getOwner(edge.to);
//         if (fromId === playerId && toId === playerId) {
//             score += edge.weight * 15;
//         }
//         if (fromId === opponentId && toId === opponentId) {
//             score -= edge.weight * 12;
//         }
//     })
//
//     score += (players[playerId].titans - players[opponentId].titans) * 25;
//     score += (getAllMoves(playerId).length - getAllMoves(opponentId).length) * 8;
//
//     return score;
// }
//
// function makeMove(move, playerId){
//     if(move.type === "place") {
//         occupied[move.to.ring][move.to.index] = playerId;
//         players[playerId].pTitans++;
//         noOfTitans++;
//     }
//     else{
//         occupied[move.from.ring][move.from.index] = 0;
//         occupied[move.to.ring][move.to.index] = playerId;
//     }
// }
//
// function undoMove(move, playerId){
//     if(move.type === "place") {
//         occupied[move.to.ring][move.to.index] = 0;
//         players[playerId].pTitans--;
//         noOfTitans--;
//     }
//     else
//         occupied[move.from.ring][move.from.index] = playerId;
//         occupied[move.to.ring][move.to.index] = 0;
// }
//
// function isTerminalNode() {
//
//     if(occupied[0].every(cell => cell !== 0)) return true;
//
//     if(players[1].titans <= 1 || players[2].titans <= 1) return true;
//
//     // if(noOfTitans === 8) {
//     //     return getAllMoves(1).length === 0 && getAllMoves(2).length === 0;
//     // }
//
//     return false;
// }

// function minimax(depth, isMaximizing, alpha = -Infinity, beta = Infinity, playerId){
//     if(depth === 0 || isTerminalNode()) {
//         return {score: evaluateBoard(2)};
//     }
//
//     console.log("depth", depth, "isMaximizing", isMaximizing, "alpha", alpha, "beta", beta, "Player ID", playerId);
//
//     let bestMove = null;
//     let bestScore = isMaximizing? -Infinity : Infinity;
//
//     const moves = getAllMoves(playerId);
//
//     for(const move of moves){
//         makeMove(move, playerId);
//
//         const result = minimax(depth - 1, !isMaximizing, alpha, beta, playerId === 1? 2 : 1);
//
//         undoMove(move, playerId);
//
//         if(isMaximizing) {
//             if (result.score > bestScore) {
//                 bestScore = result.score;
//                 bestMove = move;
//                 alpha = Math.max(alpha, bestScore);
//             }
//         }
//         else{
//             if(result.score < bestScore){
//                 bestScore = result.score;
//                 bestMove = move;
//                 beta = Math.min(beta, bestScore);
//             }
//         }
//
//         if(alpha >= beta) break;
//     }
//
//     return {score: bestScore, move: bestMove};
// }

// function aiMove(difficulty){
//
//     console.log("AI Move")
//     if(isPaused) return;
//
//     const playerId = 2;
//     let bestmove = null;
//
//     let depth = difficulty + 1;
//
//     const result = minimax(depth, true, -Infinity, Infinity, playerId);
//     bestmove = result.move;
//
//     console.log(`Chose move at (${bestmove.to.ring},${bestmove.to.index}) because:`);
//     console.log(`- Ring value: ${result.score}`);
//
//     if(bestmove){
//         if(bestmove.type === "place") {
//             playSound("place");
//             clickLock = false;
//             handleClick(bestmove.to.ring, bestmove.to.index);
//         }
//         else{
//             playSound("place");
//             let i = bestmove.from.ring;
//             let j = bestmove.from.index;
//             selectedTitan = {ring: i, index: j};
//             circleSet[i][j].setAttribute("stroke", "yellow");
//             showMoves(i, j);
//
//
//             setTimeout(()=>{
//                 playSound("move");
//                 clickLock = false;
//                 handleClick(bestmove.to.ring, bestmove.to.index);
//             }, 500);
//
//         }
//     }
//     else console.log("ERROR");
//
// }

async function aiMove(difficulty){
    const moves = [];
    console.log("AI titans placed:", players[2].pTitans);

    // showLoader();
    // await new Promise(resolve => setTimeout(resolve, 300));

    //PLACEMENT
    if(noOfTitans < 8 && players[2].pTitans < 4) {
        console.log("AI placing");
        playSound("place");
        for (let i = 0; i < noOfRings; i++) {
            for (let j = 0; j < sides; j++) {
                if (occupied[i][j] === 0 && state.hex[i]) {
                    moves.push([i, j]);
                }
            }
        }
        if(moves.length === 0) {
            state.turn++;
            return;
        }

        if(difficulty === 0) {
            const [i, j] = moves[Math.floor(Math.random() * moves.length)];
            console.log("AI placement", i, j);
            clickLock = false;
            handleClick(i, j);
        }
        else if(difficulty === 1) {
            let score = -30;
            let i, j;
            for(let k = 0; k<moves.length; k++){
                let temp = evaluate(moves[k][0], moves[k][1], t=0);
                if(temp > score) {
                    i = moves[k][0];
                    j = moves[k][1];
                    score = temp;
                    console.log(i, j, score)
                }
            }
            clickLock = false;
            console.log("AI placement", i, j);
            handleClick(i, j);
        }


    }

    //MOVEMENT
    else{
        console.log("AI moving");
        for(let i = 0; i<noOfRings; i++){
            for(let j = 0; j<sides; j++){
                if(occupied[i][j] === 2 && state.hex[i]){
                    for(let a = 0; a<noOfRings; a++){
                        for(let b = 0; b<sides; b++){
                            if(occupied[a][b] === 0 && state.hex[a] && isAdjacent(i, j, a, b)){
                                moves.push([i, j, a, b])
                            }
                        }
                    }

                }
            }
        }
        if(moves.length === 0) {
            state.turn++;
            return;
        }

        //EASY
        if(difficulty === 0) {
            const move = moves[Math.floor(Math.random() * moves.length)];
            let i = move[0];
            let j = move[1];
            selectedTitan = {ring: i, index: j};
            circleSet[i][j].setAttribute("stroke", "yellow");
            showMoves(i, j);
            playSound("place");

            console.log("AI movement");
            clickLock = false;
            setTimeout(()=>{handleClick(move[2], move[3])}, 300);

        }

        //MEDIUM
        else if(difficulty === 1){
            let a, b, i, j;
            let score = -30;
            for(let k = 0; k<moves.length; k++){
                let temp = evaluate(moves[k][0], moves[k][1], moves[k][0] - moves[k][2], t=1);
                if(temp > score) {
                    a = moves[k][2];
                    b = moves[k][3];
                    i = moves[k][0];
                    j = moves[k][1];
                    score = temp;
                }
            }
            selectedTitan = {ring: i, index: j};
            circleSet[i][j].setAttribute("stroke", "yellow");
            showMoves(i, j);
            playSound("place");
            console.log("AI movement");
            clickLock = false;
            setTimeout(()=> {
                handleClick(a, b);
            }, 500);

        }

        playSound("move");

    }
}

function animate(ring, index, i, j) {
    const {x: x1, y: y1} = nodeSet[ring][index];
    const {x: x2, y: y2} = nodeSet[i][j];

    // Create particle effect
    const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    particle.setAttribute("cx", x1);
    particle.setAttribute("cy", y1);
    particle.setAttribute("r", innerRadius);
    particle.setAttribute("fill", getCurrent().color);
    particle.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    svg.appendChild(particle);

    // Trigger animation
    requestAnimationFrame(() => {
        particle.setAttribute("cx", x2);
        particle.setAttribute("cy", y2);
        particle.style.opacity = "0";
    });

    // Cleanup
    setTimeout(() => particle.remove(), 300);
}

function addHistory(type, detail){
    const container = document.querySelector('.history-container');
    const entry = document.createElement("div");
    entry.classList.add("history-entry");

    const min = Math.floor(totalSeconds / 60);
    const sec = (totalSeconds % 60).toString().padStart(2, "0");

    entry.innerHTML = `
    <div class="entry-header">${type}</div>
    <div class="entry-detail">${detail}</div>
    <span class="stamp">${min}:${sec}</span>`;

    entries.push(entry);
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

async function handleClick(i, j) {

    if(!state.hex[i] || clickLock) return;

    const now = Date.now();
    if (now - lastClickTime < 300) return;
    lastClickTime = now;

    const player = getCurrent();

    console.log(noOfTitans, player.pTitans);
    //PLACEMENT
    if (!placed && !selectedTitan && !occupied[i][j] && noOfTitans < 8 && player.pTitans < 4) {
        console.log(player.id, "Placing", i, j);
        playSound("place");
        save();
        if(state.turn === 1) startTimer();

        occupied[i][j] = player.id;
        circleSet[i][j].setAttribute("fill", player.color);
        circleSet[i][j].setAttribute("stroke", player.color);
        circleSet[i][j].setAttribute("player", player.id);

       circleSet[i][j].classList.add("titan-placing");
        setTimeout(() => {
            circleSet[i][j].classList.remove("titan-placing");
        }, 600);

        player.pTitans++;
        noOfTitans++
        state.turn++;

        addHistory("Placed Titan", `(${i}, ${j})`);

        clickLock = true;
        await check(i, j);
        clickLock = false;

        highlight(getCurrent());
        startPlayerTime();
    }
    else if(placed){
        removeShow();
        //SELECTION

        if(!selectedTitan) {
            console.log(player.id, "Selection", i, j);
            if (occupied[i][j] === player.id) {
                selectedTitan = {ring: i, index: j};
                circleSet[i][j].setAttribute("stroke", "yellow");
                // circleSet[i][j].setAttribute("stroke-width", "5");
                playSound("place");

                showMoves(i , j);
            }
        }

        else{
            const {ring, index} = selectedTitan;

            //DESELECTION
            if(ring === i && index === j){
                playSound("place");
                selectedTitan = null;
                // if(occupied[i][j] === 0) circleSet[ring][index].setAttribute("stroke", "white");
                // else circleSet[ring][index].setAttribute("stroke", player.color);
                circleSet[ring][index].setAttribute("stroke", player.color);
                return;

            }

            //CHANGE SELECTION
            if(occupied[i][j] === player.id){
                selectedTitan = {ring: i, index: j};
                circleSet[i][j].setAttribute("stroke", "yellow");
                circleSet[ring][index].setAttribute("stroke", player.color);
                playSound("place");
                showMoves(i, j);
            }

            //MOVEMENT
            console.log(player.id, "Moving", ring, index, i, j);
            if(occupied[i][j] === 0 && isAdjacent(ring, index, i, j)) {
                save();

                occupied[i][j] = player.id;
                occupied[ring][index] = 0;
                animate(ring, index, i, j);
                circleSet[i][j].setAttribute("fill", player.color);
                circleSet[i][j].setAttribute("stroke", player.color);
                circleSet[i][j].setAttribute("player", player.id);

                circleSet[ring][index].setAttribute("fill", "#1e1f1e");
                circleSet[ring][index].setAttribute("stroke", "white");
                circleSet[ring][index].removeAttribute("player");

                selectedTitan = null;
                // removeShow();
                state.turn++;

                addHistory("Moved Titan", `(${ring},${index}) &rarr; (${i},${j})`);

                clickLock = true;
                await check(i, j);
                clickLock = false;

                playSound("move");
                highlight(getCurrent());
                startPlayerTime();
            }
        }
    }
    else{
        playSound("error")
    }
    update();


    for(let a =noOfRings - 1; a>0; a--){
        if(occupied[a].every(n => n > 0)){
            state.hex[a-1] = true;
            for(let b = 0; b<sides; b++){
                circleSet[a-1][b].classList.add("unlocked");
            }
        }
    }


    if (occupied[0].every(n => n > 0)) gameOver(0);

    let c1 = 0;
    let c2 = 0;
    occupied[0].forEach(id =>{
        c1 = id === 1? c1 + 1 : c1;
        c2 = id === 2 ? c2 + 1 : c2;
    })
    if(c1 === 4) gameOver(0)
    if(c2 === 4) gameOver(0);

    if (noOfTitans === 8) {
        placed = true;
        document.querySelector('.phase').innerHTML = "All titans placed";
    }

    if(getCurrent().id === 2 && isSinglePlayer && !isPaused){
        console.log("AI MOVE");
        clickLock = true;
        setTimeout(()=>{
            aiMove(4);
        }, Math.random()*1000 + 500);

    }

}

function pause(){
    playSound("pauseResume")
    if(!isPaused){
        const image = document.querySelector('#pause');
        image.classList.add("fade-out");

        setTimeout(()=>{
            image.src="images/resume_icon_rounded.png";
            image.classList.remove("fade-out");
        }, 300);

        clickLock = true;
    }
    else{
        const image = document.querySelector('#pause');

        image.classList.add("fade-out");

        setTimeout(()=>{
            image.src="images/pause_icon_wider.png";
            image.classList.remove("fade-out");
        }, 300);

        clickLock = false;
    }
    isPaused = !isPaused;
}

function reset(){
    isPaused = false;
    clearInterval(timerInterval);
    clearInterval(playerInterval);
    updateTotalTime(1);
    players[1].time = PlayerTime;
    players[2].time = PlayerTime;
    updatePlayerTime(players[1]);
    updatePlayerTime(players[2]);

    document.querySelector('.history-container').innerHTML = "";
    players[1].titans = 4;
    players[2].titans = 4;
    updatePiece(players[1]);
    updatePiece(players[2]);

    state.turn = 1;
    noOfTitans = 0;
    state.hex = [false, false, true];
    selectedTitan = null;

    history.length = 0;
    future.length = 0;
    moveRows.length = 0;

    for (let i = 0; i < noOfRings; i++) {
        occupied[i] = new Array(sides).fill(0);
    }

    circleSet.flat().forEach(circle => {
        circle.setAttribute("fill", "#1e1f1e");
        circle.setAttribute("stroke", "white");
        circle.removeAttribute("player");
        circle.classList.remove("unlocked");
    });

    const overlay = document.querySelector(".overlay");
    overlay.classList.add("hidden");
    update();
    removeShow();
}

circleSet.forEach((ring, i) => {
    ring.forEach((circle, j) => {
        highlight(players[1]);
        circle.addEventListener("click", () => handleClick(i, j));
    });
});

document.querySelectorAll('.name').forEach((nameBox, i) => {
    nameBox.addEventListener('click', () => {

            const finishEditing = () => {
            nameBox.setAttribute('contenteditable', 'false');
            players[i+ 1].name = nameBox.textContent.trim();
            console.log("adfasdfasf", players[i+ 1].name, i+1);
        };

        nameBox.setAttribute('contenteditable', 'true');
        nameBox.focus();

        nameBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameBox.blur();
            }
        });

        nameBox.addEventListener('blur', finishEditing, {once: true});
    });
});

document.addEventListener('DOMContentLoaded', ()=>{
    document.addEventListener('keydown', (e) => {
        if(e.key === 'g'){
            let b = prompt("Enter b");
            gameOver(b);
        }
        if(e.key === 'c'){
            localStorage.removeItem('leaderboard');
        }

        if(e.key === 'l'){
            e.preventDefault();
            window.location.href='leaderboard.html';
        }
    })
})

document.querySelector(".close").addEventListener("click", () => {
    const overlay = document.querySelector(".overlay");
    overlay.classList.add("hidden");
})

if(isSinglePlayer){
    document.querySelectorAll('.name')[1].textContent = "Computer";
}