const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
const list = document.getElementById('leaderboard-list');

if(leaderboard.length === 0){

}

leaderboard.sort((a, b)=>(b.score-a.score));

let winners = [];


//const scoreObj = {};
// leaderboard.forEach(entry => {
//     if(scoreObj[entry.winner]){
//         scoreObj[entry.winner] += entry.score;
//     }
//     else{
//         scoreObj[entry.winner] = entry.score
//     }
// });
//
// const sorted = Object.entries(scoreObj).sort((a, b) => b[1] - a[1]);
//
// sorted.forEach(([name, score], i) => {
//     const div = document.createElement('div');
//     div.classList.add('entry');
//     div.innerHTML = `
//         <span class="rank">${i + 1}</span>
//         <span class="name">${name}</span>
//         <span class="score">${score}</span>
//          `;
//     list.appendChild(div);
// })

const header = document.createElement('div');
header.classList.add('entry', 'header');
header.innerHTML = `
    <span class="rank">RANK</span>
    <span class="name">PLAYER</span>
    <span class="score">SCORE</span>
`;
list.appendChild(header);

let t = 1;
leaderboard.forEach(entry=> {
    if(!winners.includes(entry.winner)) {
        winners.push(entry.winner);
        const div = document.createElement('div');
        div.classList.add('entry');
        div.innerHTML = `
            <span class="rank">${t}</span>
            <span class="name">${entry.winner}</span>
            <span class="score">${entry.score}</span>
             `;
        list.appendChild(div);
        t++;
    }


})