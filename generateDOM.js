const spinButton = `
  <button class="btn-spin">↺</button>
`

const startGameButton = (text, id) => {
  return `
    <button id="btn-${id}-game">${text}</button>
  `
}

const input = (name) => {
  const lowerCasedName = name.toLowerCase();
  return `
    <label for="${lowerCasedName}">
      <span>${name}:</span>
      <input type="number" id="${lowerCasedName}" max="30" min="10" value="10">
    </label>
  `
}

const formSide = (side, specifics) => {
  return `
    <div class="side-${side}">
      ${spinButton}
      ${specifics}
      ${startGameButton('Make Game!', 'create')}
    </div>
  `
}

const formA = `
  ${input('Width')}
  ${input('Height')}
`

const formB = `
  <select id="game-select" size="4"></select>
`

const spinnableForm = `
  <div class="form">
    ${formSide('a', formA)}
    ${formSide('b', formB)}
  </div>
`

const gameBoards = `
  <div class="game-container">
    <table id="board"></table>
    <table id="opponent-board"></table>
  </div>
`



const getElmnt = (id) => document.getElementById(id)
const makeElmnt = (type) => document.createElement(type)

const game = document.getElementById('game')
game.innerHTML = spinnableForm
const anchor = document.getElementsByClassName('anchor')[0]
const makeGameBtn = getElmnt('btn-create-game');
const joinGameBtn = getElmnt('btn-join-game');
const startGame = getElmnt('start-game');
const gameSelect = getElmnt('game-select')
const spinBtns = document.getElementsByClassName('btn-spin')
const form = document.getElementsByClassName('form')[0]

const spinPanel = (function(){
  let panelRotation = 0;
  return (element) => {
    element.style.transform = `rotateY(${panelRotation += 180}deg)`
  }
})();

// add event listener to 'btn-spin' buttons on each side of panel
[].forEach.call(spinBtns, (btn) => btn.onclick = spinPanel.bind(null, form))

