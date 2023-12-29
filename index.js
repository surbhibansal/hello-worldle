const DIMENSION = 5;
const guessedWords = new Array(DIMENSION);
let currRow = 0;
let currCol = 0;

const INCORRECT_LETTER_COLOR = 'rgb(107 104 104)';
const INCORRECT_POSITION_LETTER_COLOR = 'rgb(194 170 12)';
const CORRECT_POSITION_LETTER_COLOR = '#359c35';

function initGrid() {
    for (let i = 0; i < DIMENSION; ++i) {
        guessedWords[i] = new Array(DIMENSION);
        for (let j = 0; j < DIMENSION + 1; ++j) {
            guessedWords[i][j] = '';
        }
    }
}

const KEYPAD_MAPPING = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ''],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL', '']
];

const usedLetters = new Set();
let solution = [];

function mapSolution() {
    const map = new Map();
    for (const letter of solution) {
        if (map.has(letter)) {
            map.set(letter, map.get(letter) + 1)
        } else {
            map.set(letter, 1);
        }
    }
    return map;
}

function guess(word) {
    if (word === solution.join('')) {
        updateInfo(`Congrats! You guessed it in ${currRow + 1} attempts`, 3000);
        return true;
    }
    return false;
}

function updateInfo(message, timeout = 1000) {
    const infoEl = document.querySelector('.hello_worldle__info');
    infoEl.textContent = message;
    infoEl.style.display = 'block';
    if (shouldHide) {
        setTimeout(() => {
            infoEl.style.display = 'none';
        }, timeout)
    }
}

function selectCurrentRowCells() {
    return new Array(DIMENSION).fill(null).map(((_, i) =>
        document.querySelector(`div[id='${currRow}_${i}']`)));
}

document.addEventListener('keyup', ev => {
    if (ev.code === 'Enter') {
        onEnter();
    } else if (ev.code === 'Backspace') {
        onDelete()
    }
});

async function isValidWord(word) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    const res = await fetch(url);
    console.log(res.status);
    if (res.status === 404) {
        return false;
    }
    return true;

}

function applyShakeAnimation(gridItems) {
    gridItems.forEach(gridItem => {
        gridItem.classList.add('shake-animation');
        setTimeout(() => {
            gridItem.classList.remove('shake-animation');
        }, 1000)
    });
}

async function onEnter() {
    const guessedWord = guessedWords[currRow].join('');
    const gridItems = selectCurrentRowCells();
    if (guessedWord.length < 5) {
        applyShakeAnimation(gridItems);
        updateInfo('Not enough letters');
        return;
    }
    const isValid = await isValidWord(guessedWord);
    if (!isValid) {
        applyShakeAnimation(gridItems);
        updateInfo('Not in dictionary');
        return;
    }
    const correct = guess(guessedWord);
    if (correct) {
        processCurrentRow(guessedWord)
        return;
    }
    processCurrentRow(guessedWord)
    currRow++;
    currCol = 0;
}

function onDelete() {
    if (currCol > 0) {
        currCol--;
        const gridEl = document.querySelector(`div[id='${currRow}_${currCol}']`);
        gridEl.innerText = '';
        guessedWords[currRow][currCol] = '';
    }
}

function processCurrentRow(guessedWord) {
    const gridItems = selectCurrentRowCells();
    const solutionMap = mapSolution();
    for (let i = 0; i < DIMENSION; ++i) {
        const gridItem = gridItems[i]
        if (gridItem) {
            const guessedLetter = guessedWord[i];
            const keypadCell = document.querySelector(`div[id='${guessedLetter}']`);
            // 1. Correct position
            if (guessedLetter === solution[i]) {
                gridItem.style.backgroundColor = CORRECT_POSITION_LETTER_COLOR;
                keypadCell.style.backgroundColor = CORRECT_POSITION_LETTER_COLOR;
                solutionMap.set(guessedLetter, solutionMap.get(guessedLetter) - 1);
                // 2. Incorrect position
            } else if (solution.includes(guessedLetter)) {
                const letterCount = solutionMap.get(guessedLetter);
                if (letterCount > 0) {
                    gridItem.style.backgroundColor = INCORRECT_POSITION_LETTER_COLOR;
                    keypadCell.style.backgroundColor = INCORRECT_POSITION_LETTER_COLOR;
                    solutionMap.set(guessedLetter, letterCount - 1);
                } else {
                    gridItem.style.backgroundColor = INCORRECT_LETTER_COLOR;
                    keypadCell.style.backgroundColor = INCORRECT_LETTER_COLOR;
                }
            } else {
                gridItem.style.backgroundColor = INCORRECT_LETTER_COLOR;
                keypadCell.style.backgroundColor = INCORRECT_LETTER_COLOR;
                usedLetters.add(guessedLetter);
            }
        }
    }
}

function setupCells() {
    const grid = document.querySelector('.hello_worldle__grid');
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < DIMENSION + 1; ++i) {
        for (let j = 0; j < DIMENSION; ++j) {
            const cell = document.createElement('div');
            cell.id = `${i}_${j}`;
            cell.classList.add('hello_worldle__grid__item');
            cell.innerText = '';
            fragment.appendChild(cell)

        }
    }
    grid.appendChild(fragment);
}

function setupKeypad() {
    const keypadGrid = document.querySelector('.hello_worldle__keypad');
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 3; ++i) {
        for (let j = 0; j < 10; ++j) {
            const key = document.createElement('div');
            key.innerText = KEYPAD_MAPPING[i][j];
            key.id = key.innerText;
            if (key.innerText !== '') {
                key.classList.add('hello_worldle__keypad__key')
            }
            key.addEventListener('click', ev => {
                const val = ev.target.innerText;
                if (val === '') {
                    return;
                }
                if (val === 'ENTER') {
                    onEnter();
                    return;
                }
                if (val === 'DEL') {
                    onDelete();
                    return;
                }

                if (guessedWords[currRow].join('').length >= 5) {
                    return;
                }

                const cell = document.querySelector(`div[id='${currRow}_${currCol}']`);
                cell.innerText = val;
                guessedWords[currRow][currCol] = val;
                currCol++;
            });
            fragment.appendChild(key);
        }

    }
    keypadGrid.appendChild(fragment);
}

async function readWordFromJson() {
   const res = await fetch('words.json');
   const json = await res.json();
   const date = new Date();
   const today = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}` 
   return atob(json[today]);
};


window.onload = async (_) => {
    const word = await readWordFromJson();
    solution = word.split('').map(l => l.toUpperCase());
    initGrid()
    setupCells()
    setupKeypad()
}



