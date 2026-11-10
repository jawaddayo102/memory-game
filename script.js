// script.js - Memory Game (find the matching pairs)
// 8 symbols x 2 = 16 cards. Click two cards: if they match they stay open,
// if not they flip back. The game ends when all pairs are found.

const SYMBOLS = ['\u{1F512}', '\u{1F4BB}', '\u{1F680}', '\u{1F431}', '⚽', '\u{1F3A7}', '\u{1F319}', '\u{1F34E}'];
const BEST_KEY = 'memory-best-moves';

// ---------- Page elements ----------
const boardElement = document.getElementById('board');
const movesElement = document.getElementById('moves');
const timeElement = document.getElementById('time');
const bestElement = document.getElementById('best');
const winMessage = document.getElementById('winMessage');
const restartBtn = document.getElementById('restartBtn');

// ---------- Game state ----------
let firstCard = null;   // the first card of the current pair
let lockBoard = false;  // true while two wrong cards are showing (no clicking)
let moves = 0;
let matchedCount = 0;
let seconds = 0;
let timerId = null;

// ---------- Best score is saved in the browser ----------
function loadBest() {
  try {
    const saved = Number(localStorage.getItem(BEST_KEY));
    return saved > 0 ? saved : null;
  } catch (error) {
    return null;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch (error) {
    // storage is blocked: ignore, the game still works
  }
}

function showBest() {
  const best = loadBest();
  bestElement.textContent = best === null ? '-' : String(best);
}

// ---------- Shuffle an array (Fisher-Yates) ----------
function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------- Timer ----------
function startTimer() {
  if (timerId !== null) return;
  timerId = setInterval(() => {
    seconds++;
    timeElement.textContent = seconds + 's';
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

// ---------- Show or hide a card face ----------
function openCard(card) {
  card.classList.add('flipped');
  card.textContent = card.dataset.symbol;
  card.setAttribute('aria-label', 'Card ' + card.dataset.symbol);
}

function closeCard(card) {
  card.classList.remove('flipped');
  card.textContent = '?';
  card.setAttribute('aria-label', 'Hidden card');
}

// ---------- The player clicked a card ----------
function onCardClick(card) {
  if (lockBoard || card === firstCard) return;
  if (card.classList.contains('matched') || card.classList.contains('flipped')) return;

  startTimer();
  openCard(card);

  // First card of a pair: just remember it
  if (firstCard === null) {
    firstCard = card;
    return;
  }

  // Second card: count a move and compare
  moves++;
  movesElement.textContent = moves;
  const secondCard = card;

  if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
    // It's a match: both cards stay open
    [firstCard, secondCard].forEach((c) => {
      c.classList.remove('flipped');
      c.classList.add('matched');
      c.disabled = true;
    });
    matchedCount += 2;
    firstCard = null;
    if (matchedCount === SYMBOLS.length * 2) endGame();
  } else {
    // No match: wait a moment so the player can see, then flip both back
    lockBoard = true;
    const previous = firstCard;
    firstCard = null;
    setTimeout(() => {
      closeCard(previous);
      closeCard(secondCard);
      lockBoard = false;
    }, 700);
  }
}

// ---------- All pairs found ----------
function endGame() {
  stopTimer();
  winMessage.hidden = false;
  winMessage.textContent = 'You won in ' + moves + ' moves and ' + seconds + ' seconds!';

  const best = loadBest();
  if (best === null || moves < best) {
    saveBest(moves);
    showBest();
    winMessage.textContent += ' New best score!';
  }
}

// ---------- Start a new game ----------
function newGame() {
  stopTimer();
  firstCard = null;
  lockBoard = false;
  moves = 0;
  matchedCount = 0;
  seconds = 0;
  movesElement.textContent = '0';
  timeElement.textContent = '0s';
  winMessage.hidden = true;
  showBest();

  boardElement.replaceChildren();
  shuffle(SYMBOLS.concat(SYMBOLS)).forEach((symbol) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dataset.symbol = symbol;
    closeCard(card);
    card.addEventListener('click', () => onCardClick(card));
    boardElement.append(card);
  });
}

restartBtn.addEventListener('click', newGame);
newGame();
