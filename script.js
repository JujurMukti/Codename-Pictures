const agent1 = document.getElementById('agent1');
const agent2 = document.getElementById('agent2');
const gameTimer1 = document.getElementById('timer1');
const gameTimer2 = document.getElementById('timer2');
const countdownElement = document.getElementById('countdown');
const infoPanel = document.getElementById('info-panel');
const infoTeam = document.getElementById('team-turn');
const penaltyPoint1 = document.getElementById('pp1');
const penaltyPoint2 = document.getElementById('pp2');
const boardContainer = document.getElementById("game-board");
const allImages = [...document.querySelectorAll(".image-container:nth-child(5) img")];
const roleCounts = {
  blueAgents: 7,
  redAgents: 7,
  doubleAgents: 1,
  assassin: 1,
  innocentBystanders: 4
};
const voices = {};
["a", "b", "c", "d", "e", "1", "2", "3", "4", "5", "blue", "red"].forEach(key => {
  voices[key] = document.getElementById(`sound-${key}`);
});
["blueAgents", "redAgents", "assassin", "doubleAgents", "innocentBystanders"].forEach(key => {
  voices[key] = document.getElementById(`sound-${key}`);
});
["blueTeam", "redTeam", "attempt", "attempts", "winnerBlue", "winnerRed"].forEach(key => {
  voices[key] = document.getElementById(`sound-${key}`);
});

const soundCountdown1 = document.getElementById("sound-countdown1");
const soundCountdown2 = document.getElementById("sound-countdown2");
const soundAutoReveal = document.getElementById("sound-autoReveal");
const soundShuffle = document.getElementById("sound-shuffle");
const soundWinner = document.getElementById("sound-winner");
const backsound = document.getElementById("sound-backsound");

let attempts = document.getElementById("attempts");
let currentRole = null;
let agents = { 1: 0, 2: 0 };
let gameTimes = { 1: 300, 2: 300 };
let pp = { 1: 0, 2: 0};
let currentTeam = 1;
let bystanders = 0 ;
let blue = 0;
let red = 0;
let attempt = 0;
let mode = 0;
let start = false;
let isCountingDown = false;
let isCountingDown2 = false; 
let gameActive = false;
let endgame = false;
let countdownInterval = null;
let boardImages = [];
let boardRoles = [];
let hasShuffled = false;
let cards;

function updateTimers(team) {
  if (team <= 0) {
    if (currentTeam === 1) gameTimer1.textContent = `00:00`;
    else gameTimer2.textContent = `00:00`;
    playSound(soundCountdown2);
    countdownElement.style.display = 'block';
    countdownElement.style.opacity = '1';
    countdownElement.textContent = 'GAME OVER!';
    setTimeout(() => {
      countdownElement.style.opacity = '0';
      setTimeout(() => {
        countdownElement.style.display = 'none';
      }, 500);
    }, 1000);
    showPopup(0);
    endgame = true;
  } else {
  const minutes = Math.floor(team / 60);
  const seconds = team % 60;
  if (currentTeam === 1) gameTimer1.textContent = `0${minutes}:${seconds.toString().padStart(2, '0')}`;
  else gameTimer2.textContent = `0${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function resetGame() {
  location.reload();
}

function startCountdown(text, counts = 3) {
  if (isCountingDown) return;
  isCountingDown = true;

  let count = counts === 0 ? 'GAME OVER!' : counts;
  countdownElement.style.display = 'block';
  countdownElement.style.opacity = '1';
  countdownElement.textContent = count;
  playSoundCountdown(count);

  countdownInterval = setInterval(() => {
    if (isCountingDown2) {
    isCountingDown = false;
    clearInterval(countdownInterval);
    countdownInterval = null;
    countdownElement.style.opacity = '0';
    countdownElement.style.display = 'none';
    return;
    }
    count--;
    if (count > 0) {
      countdownElement.textContent = count;
    } else if (count === 0) {
      countdownElement.textContent = text;

      if (text === 'GAME OVER!') {
        showPopup(0);
        endgame = true;
      } 
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdownElement.style.opacity = '0';
      setTimeout(() => {
        countdownElement.style.display = 'none';
      }, 500);
      isCountingDown = false;
      if (text === 'START!') {
        gameActive = true;
        backsound.loop = true;
        backsound.volume = 0.2;
        setTimeout(() => backsound.play(), 500);
      }
    }
  }, 1000);
}

function playSound(sound) {
  sound.pause();
  sound.currentTime = 0;
  sound.volume = 0.5;
  sound.play();
}

async function playSoundCountdown(times) {
  soundCountdown1.volume = 0.5;
  soundCountdown2.volume = 0.5;
  if (times === 'GAME OVER!') times = 0;
  for (i = times; i >= 0; i--) {
    if (isCountingDown2) {
     isCountingDown2 = false;
     return;
    }
    if (i > 0) {
      soundCountdown1.currentTime = 0;
      soundCountdown1.play();
    } else {
      soundCountdown2.currentTime = 0;
      soundCountdown2.play();
    }
    await delay(1000);
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getShuffledRoles() {
  let roles = [];
  for (const role in roleCounts) {
    roles.push(...Array(roleCounts[role]).fill(role));
  }
  return shuffleArray(roles);
}

function buildGameBoard() {
  boardContainer.innerHTML = "";
  boardImages = allImages.map(img => img.src);

  for (let i = 1; i <= 20; i++) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.id = `card-${i - 1}`;
    card.dataset.revealed = 0;
    card.dataset.voice1 = String.fromCharCode(96 + ((i - 1) % 5 + 1));
    card.dataset.voice2 = Math.ceil(i/5);

    const background = document.createElement("img");
    const img = document.createElement("img");
    background.classList.add( "background")
    img.classList.add("foreground")
    img.src = boardImages[i - 1];
    card.appendChild(img);
    card.appendChild(background);

    card.addEventListener("click", () => {
      if (gameActive && hasShuffled && card.dataset.revealed !== "1") {
        const previouslySelected = document.querySelector(".card.selected");
        if (previouslySelected && previouslySelected !== card) {
          previouslySelected.classList.remove("selected");
        }
        if (!card.classList.contains("selected")) {
          card.classList.add("selected");
          cards = card;
        } else {
          card.classList.remove("selected");
          cards = null;
        }

        const preventError = document.querySelector(".selected");
        if (preventError) {
        playSound(voices[card.dataset.voice1]);
        setTimeout(() => playSound(voices[card.dataset.voice2]), 800);
        }
      }
    });
    boardContainer.appendChild(card);
  }
}

function blueTeamTurn () {
  setTimeout(() => {
    playSound(voices["blueTeam"]);
    infoPanel.style.backgroundColor = '#253cae';
    infoTeam.innerHTML = 
    `<h3>BLUE TEAM'S TURN</h3>
      <div class="attempt">
        <span id="attempts">ATTEMPT REMAINING = 0</span>  
      </div>`;
    currentTeam = 1;
    attempt = 0;
    attempts = document.getElementById("attempts");
    if (gameTimes[2] <= 3 && gameTimes[2] > 0) {
      isCountingDown2 = true;
    }
  }, 2000);
}

function redTeamTurn () {
  setTimeout(() => {
    playSound(voices["redTeam"]);
    infoPanel.style.backgroundColor = '#ae2525';
    infoTeam.innerHTML = 
    `<h3>RED TEAM'S TURN</h3>
      <div class="attempt">
        <span id="attempts">ATTEMPT REMAINING = 0</span>  
      </div>`;
    currentTeam = 2;
    attempt = 0;
    attempts = document.getElementById("attempts");
    if (gameTimes[1] <= 3 && gameTimes[1] > 0) {
      isCountingDown2 = true;
    }
  }, 2000);
}

function revealCard(card) {
  if (!gameActive) return;
  if (card.dataset.revealed === "1") return;

  const role = card.dataset.role;
  if (role === "blueAgents") {
    currentRole = blue;
    blue++;
  } else if (role === "redAgents") {
    currentRole = red;
    red++;
  } else if (role === "innocentBystanders") {
    currentRole = bystanders;
    bystanders++;
  } else if (role === "doubleAgents") {
    if (currentTeam === 1) currentRole = 0, card.classList.add("blue");
    else currentRole = 1, card.classList.add("red");
  } else {
    currentRole = 0;
  }
  card.dataset.revealed = "1";
  const background = card.querySelector(".background");
  const img = card.querySelector(".foreground");
  card.classList.remove("selected");
  if (role === "blueAgents" || role === "redAgents" || role === "innocentBystanders") background.src = `image/backs/${role}.png`;
  img.src = `image/${role}/${currentRole + 1}.png`

  if (role === "blueAgents") {
    agents[1]++;
    agent1.textContent = `AGENT REVEALED: ${agents[1]}`;
    if (agents[1] === 7) {
      showPopup(1);
      return;
    }
    if (currentTeam === 1) {
      attempt--;
      setTimeout(() => {
        playSound(voices[`${attempt}`]);
        setTimeout(() => attempt === 1 ? playSound(voices["attempt"]) : playSound(voices["attempts"]), 800);
      }, 1800);
      const s = attempt === 1 ? "" : "S";
      attempts.innerText = `ATTEMPT${s} REMAINING = ${attempt}`;
    }
    if (attempt <= 0) {
      if (currentTeam === 1) redTeamTurn();
      else blueTeamTurn();
    } else if (currentTeam === 2) {
      pp[2] += attempt;
      penaltyPoint2.innerText = `PP: ${pp[2]}`;
      blueTeamTurn();
    }
  } else if (role === "redAgents") {
    agents[2]++;
    agent2.textContent = `AGENT REVEALED: ${agents[2]}`;
    if (agents[2] === 7) {
      showPopup(1);
      return;
    }
    if (currentTeam === 2) {
      attempt--;
      setTimeout(() => {
        playSound(voices[`${attempt}`]);
        setTimeout(() => attempt === 1 ? playSound(voices["attempt"]) : playSound(voices["attempts"]), 800);
      }, 1800);
      const s = attempt === 1 ? "" : "S";
      attempts.innerText = `ATTEMPT${s} REMAINING = ${attempt}`;
    }
    if (attempt <= 0) {
      if (currentTeam === 1) redTeamTurn();
      else blueTeamTurn();
    } else if (currentTeam === 1) {
      pp[1] += attempt;
      penaltyPoint1.innerText = `PP: ${pp[1]}`;
      redTeamTurn();
    }
  } else if (role === "doubleAgents") {
    currentTeam === 1 ? agents[1]++ : agents[2]++;
    if (currentTeam === 1) agent1.textContent = `AGENT REVEALED: ${agents[1]}`;
    else agent2.textContent = `AGENT REVEALED: ${agents[2]}`;
    if (agents[1] === 7 || agents[2] === 7) {
      showPopup(1);
      return;
    }
    attempt--;
    setTimeout(() => {
        playSound(voices[`${attempt}`]);
        setTimeout(() => attempt === 1 ? playSound(voices["attempt"]) : playSound(voices["attempts"]), 800);
    }, 1800);
    const s = attempt === 1 ? "" : "S";
    attempts.innerText = `ATTEMPT${s} REMAINING = ${attempt}`;
    if (attempt <= 0) {
      if (currentTeam === 1) redTeamTurn();
      else blueTeamTurn();
    }
  } else if (role === "innocentBystanders") {
    if (currentTeam === 1) {
      pp[1] += attempt + 1;
      penaltyPoint1.innerText = `PP: ${pp[1]}`;
      redTeamTurn();
    }
    else {
      pp[2] += attempt + 1;
      penaltyPoint2.innerText = `PP: ${pp[2]}`;
      blueTeamTurn();
    }
  } else {
      if (currentTeam === 1) {
      pp[1] += attempt;
      penaltyPoint1.innerText = `PP: ${pp[1]}`;
      gameTimes[1] -= 180;
      updateTimers(gameTimes[1])
      if (gameTimes[1] - 2 > 0) redTeamTurn();
    } else {
      pp[2] += attempt;
      penaltyPoint2.innerText = `PP: ${pp[2]}`;
      gameTimes[2] -= 180;
      updateTimers(gameTimes[2]);
      if (gameTimes[2] - 2 > 0) blueTeamTurn();
    }
  }

  if (pp[1] >= 5) {
    pp[1] = pp[1] - 5;
    penaltyPoint1.textContent = `PP: ${pp[1]}`;
    autoRevealAgent(2);
  }

  if (pp[2] >= 5) {
    pp[2] = pp[2] - 5;
    penaltyPoint2.textContent = `PP: ${pp[2]}`;
    autoRevealAgent(1);
  }
}

function autoRevealAgent(team) {
  const targetRole = team === 1 ? "blueAgents" : "redAgents";
  const cards = document.querySelectorAll(".card");
  for (const card of cards) {
    if (card.dataset.revealed === "0" && card.dataset.role === targetRole) {
      card.classList.add("auto-reveal");
      setTimeout(() => card.classList.remove("auto-reveal"), 1000);
      card.dataset.revealed = "1";
      const background = card.querySelector(".background");
      const img = card.querySelector(".foreground");
      background.src = `image/backs/${targetRole}.png`;
      const currentRole = targetRole === "blueAgents" ? (blue, blue++) : (red, red++); 
      img.src = `image/${targetRole}/${currentRole + 1}.png`
      if (targetRole === "blueAgents") {
        agents[1]++;
        agent1.textContent = `AGENT REVEALED: ${agents[1]}`;
      } else {
        agents[2]++;
        agent2.textContent = `AGENT REVEALED: ${agents[2]}`;
      }  
      playSound(soundAutoReveal);
      if (agents[1] === 7 || agents[2] === 7) {
      showPopup(1);
      return;
      }
      break;
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWithDelay() {
  for (let i = 0; i < 20; i++) {
    const card = document.getElementById(`card-${i}`);
    card.classList.add("selected");
    setTimeout(() => card.classList.remove("selected"), 200);
    card.dataset.role = boardRoles[i];
    card.classList.add(boardRoles[i]);
    playSound(soundShuffle);
    await delay(200);
  }
}

async function showCardWinner(winnerTeam, whichDoubleAgents, cards) {
  for (const card of cards) {
    let preventDoubleAgent = false;
    if (card.dataset.revealed === "1") {
      if (card.dataset.role === "doubleAgents") {
        if (winnerTeam === whichDoubleAgents) {
          card.classList.add("auto-reveal");
          card.classList.add("winner");
          setTimeout(() => card.classList.remove("auto-reveal"), 500);
          playSound(soundWinner);
        } else {
          preventDoubleAgent = true;
        }
      }
      if (!preventDoubleAgent) {
        card.classList.add("auto-reveal");
        card.classList.add("winner");
        setTimeout(() => card.classList.remove("auto-reveal"), 500);
        playSound(soundWinner);
      }
    }
    await delay(200);
  }
}

function showPopup(condition) {
  const popup = document.getElementById('popup');
  if (agents[1] === 7 || gameTimes[2] <= 0) {
    popup.innerHTML = `
    <div class="popup-box">BLUE TEAM</div>
    `;
     popup.style.backgroundColor = 'rgba(37, 60, 174, 0.6)';
  } else {
    popup.innerHTML = `
    <div class="popup-box">RED TEAM</div>
    `;
     popup.style.backgroundColor = 'rgba(174, 37, 37, 0.6)';
  }
  if (condition === 1) {
     const winnerTeam = agents[1] === 7 ? "blueAgents" : "redAgents";
     const whichDoubleAgents = document.querySelector(".doubleAgents").classList.contains("blue") ? "blue" : "red";
     const cards = document.querySelectorAll(`[data-role=${winnerTeam}], [data-role="doubleAgents"]`);
     setTimeout (() => showCardWinner(agents[1] === 7 ? "blue" : "red", whichDoubleAgents, cards), 1500);
  }
  setTimeout (() => {
    popup.classList.add('show');
    agents[1] === 7 || gameTimes[2] <= 0 ? playSound(voices["winnerBlue"]) : playSound(voices["winnerRed"]);
    setTimeout(() => {
      popup.classList.remove('show');
    }, 3000);
  }, 4000);
  gameActive = false;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      soundCountdown.pause();
      soundCountdown.currentTime = 0;
      countdownInterval = null;
    }
    isCountingDown = false;
    countdownElement.style.opacity = '0';
    countdownElement.style.display = 'none';
    resetGame();
    return;
  }

  if (e.key === "Enter" && !hasShuffled) {
    boardRoles = getShuffledRoles();
    runWithDelay();
    hasShuffled = true;
  }

  if (e.code === 'Space') {
    if (endgame) return;

    const preventError = document.querySelector(".selected");
    if (!gameActive && hasShuffled && !isCountingDown) {
      startCountdown('START!');
    } else if (attempt !== 0 && preventError) {
        currentTeam === 1 ? playSound(voices["blue"]) : playSound(voices["red"]);
        setTimeout(() => {
          playSound(voices[cards.dataset.role]);
          revealCard(cards);
        }, 3300)
    } else if (hasShuffled) {
        if (attempts.classList.contains('shake-flash')) return;
        attempts.classList.add("shake-flash");
        setTimeout(() => {
          attempts.classList.remove("shake-flash");
        }, 400);
      }
    e.preventDefault();
    return;
  }

  if (!gameActive) return;

  if (e.key === 'p') {
    mode = mode === 0 ? 1 : 0;
  }

  if (e.key.length === 1 && e.key.match(/[1-5]/)) {
    if (mode === 1) {
      pp[currentTeam] += Number(e.key);
      if (pp[currentTeam] >= 5) {
      pp[currentTeam] = pp[currentTeam] - 5;
      currentTeam === 1 ? autoRevealAgent(2) : autoRevealAgent(1);
      }
      currentTeam === 1 ? penaltyPoint1.textContent = `PP: ${pp[1]}` : penaltyPoint2.textContent = `PP: ${pp[2]}`;
      mode = 0;
    } else {
    attempt = Number(e.key);
    const s = attempt === 1 ? "" : "S";
    attempts.innerText = `ATTEMPT${s} REMAINING = ${attempt}`;
    }
  }
});

setInterval(() => {
  if (!gameActive) return;

  currentTeam === 1 ? (gameTimes[1]--, updateTimers(gameTimes[1])) : (gameTimes[2]--, updateTimers(gameTimes[2]));
  if (gameTimes[currentTeam] <= 3 && gameTimes[currentTeam] >= 0) {
    startCountdown('GAME OVER!', gameTimes[currentTeam]);
  }
}, 1000);

updateTimers(gameTimes[1]);
buildGameBoard();
