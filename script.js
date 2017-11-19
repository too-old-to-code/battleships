(function(){
  var config = {
    apiKey: "AIzaSyBGi1VZkmiFMH8pk4Pam__8TB19EFpBVvo",
    authDomain: "battleships-c7e53.firebaseapp.com",
    databaseURL: "https://battleships-c7e53.firebaseio.com",
    projectId: "battleships-c7e53",
    messagingSenderId: "380665178914"
  };

  // Function to generate a 'unique' ID
  const uuidv4= () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  const fb = firebase.initializeApp(config);
  var defaultDatabase = firebase.database();
  var ref = defaultDatabase.ref('/battleships')

  // const date = new Date()
  // const num = date.getTime()
  let uuid;
  let intervalReference;
  let PLAYER;
  const getElmnt = (id) => document.getElementById(id)
  const makeElmnt = (type) => document.createElement(type)

  const gameState = {
    PENDING: 'Waiting for opponent',
    SETUP: 'Setting up board',
    PLAYING: 'Game in progress'
  }

  const p1Board = getElmnt('board');
  const p2Board = getElmnt('opponent-board');
  const width = getElmnt('width');
  const height = getElmnt('height');
  const startGameBtn = getElmnt('btn-create-game');
  const joinGameBtn = getElmnt('btn-join-game');
  const startGame = getElmnt('start-game');
  const gameSelect = getElmnt('game-select')
  const spinBtns = document.getElementsByClassName('btn-spin')
  const form = document.getElementsByClassName('form')[0]


  ref.on('value', function(snapshot){
    const fragment = document.createDocumentFragment();
    const obj = snapshot.val()
    if (obj){
      const keys = Object.keys(obj)
      keys.filter( key => obj[key].game.state === gameState.PENDING )
      .reverse()
      .forEach( key => {
        const option = makeElmnt('option')
        option.value = key
        option.textContent = `${obj[key].game.height} x ${obj[key].game.width}`
        fragment.appendChild(option)
      })
      gameSelect.innerHTML = ''
      gameSelect.appendChild(fragment)
    }
  })

  // const saveUserToPending = (width, height, player) => {
  //   uuid = uuidv4()
  //   defaultDatabase.ref(`/battleships/${uuid}`).set({
  //     game: {
  //       [player]: true,
  //       width: width,
  //       height: height
  //     }
  //   });

  //   defaultDatabase.ref(`/battleships/${uuid}`).on('child_changed', function(snapshot){
  //     console.log('hello');
  //     console.log(snapshot.val());
  //   })
  // }

  const saveGridToFirebase = (board, shipLocations, player) => {
    console.log('Saving to firebase');
    defaultDatabase.ref(`/battleships/${uuid}/game`).update({
      [PLAYER + 'Board']: {
        model: board.model,
        ships: shipLocations
      }
    });
  }

  const setBoard = (board, ships, cb) => {
    const EMPTY = 0;
    const SELECTING = 1;
    const SELECTED = 2;
    const PRESELECTED = 3;
    let horizontalOrientation = true;
    let gridsToHighlight = [];
    let shipLocations = [];
    let id = null;
    let startPoint = null;
    let endPoint = null;
    let size = ships.shift()

    const determineGridsToHighlight = () => {
      const distanceToNextHiglightedGrid = horizontalOrientation ? 1 : board.width;
      for (let i = startPoint; i < endPoint; i += distanceToNextHiglightedGrid){
        gridsToHighlight.push(i)
      }
    }

    const highlightGrids = (id) => {
      if (id != null){
        gridsToHighlight.forEach( idx => board.model[idx] += 1);
        board.renderView()
      }
    }

    const unhighlightControl = () => {
      gridsToHighlight = []
      board.model = board.model.map( status => [ SELECTING, PRESELECTED ].includes(status) ? status -= 1 : status )
    }

    const changeOrientation = () => {
      horizontalOrientation = !horizontalOrientation
      unhighlightControl()
      highlightControl()
    }

    document.onkeydown = (event) => {
      if (event.code !== 'Space') return;
      changeOrientation();
    }

    const highlightControl = (event) => {
      id = event ? Number(event.target.dataset.id) : id
      getStartAndEndPoints(id)
      determineGridsToHighlight()
      highlightGrids(id)
    }

    const getStartAndEndPoints = (id) => {
      const { width, height } = board
      let minPointOnAxis, maxPointOnAxis;
      if ( horizontalOrientation ){
        minPointOnAxis = Math.floor(id/width) * width
        maxPointOnAxis = minPointOnAxis + width
        startPoint = Math.min(Math.max(id - (Math.floor(size/2)), minPointOnAxis), maxPointOnAxis - size)
        endPoint = startPoint + size
      } else {
        minPointOnAxis = id % width
        maxPointOnAxis = minPointOnAxis + width * height
        startPoint = Math.min( Math.max(minPointOnAxis, id - ( Math.floor( size/2 ) * width)), maxPointOnAxis - (size * width))
        endPoint = startPoint + (size * width)
      }
    }

    const positionIsVacant = () => !board.model.includes(PRESELECTED)

    const placeShip = (event) => {
      if (positionIsVacant() && event.target.dataset.id != null){
        board.model = board.model.map( status => status === SELECTING ? PRESELECTED : status )
        shipLocations.push(gridsToHighlight);
        size = ships.shift()
        board.renderView()
        if (!size){
          board.model = board.model.map( status => status === PRESELECTED ? SELECTED : status)
          board.view.onclick = null
          board.renderView()
          saveGridToFirebase(board, shipLocations, 'PLAYER_1')
          cb(board.model)
        }
      }
    }

    board.view.onmouseover = highlightControl
    board.view.onmouseout = unhighlightControl
    board.view.onclick = placeShip
  }

  class Board {
    constructor({ width, height, element, gridClasses}){
      this.gridClasses = gridClasses;
      this.width = width = Number(width);
      this.height = height = Number(height);
      this.view = element
      this.view.append(this.createTable(width, height))
      this.model = this.createModel(width * height);
    }

    contains(item){
      return this.model.includes(item)
    }

    createTable(columns, rows){
      const tbody = document.createElement('tbody')
      for (let i = 0; i < rows; i ++){
        tbody.append(this.createRow(columns, i * columns))
      }
      return tbody
    }

    createRow(columns, colIndex){
      const tr = makeElmnt('tr')
      for (let i = 0; i < columns; i ++){
        tr.append(this.createCell(colIndex + i))
      }
      return tr
    }

    createCell(index){
      const td = makeElmnt('td')
      td.setAttribute('data-id', index)
      return td
    }

    createModel(numOfElements){
      const boardModel = new Int8Array(numOfElements);
      boardModel.fill(0);
      return boardModel
    }
    renderView(){
      this.model.forEach((state, index) => {
        this.view.querySelector('[data-id="' + index + '"]').className = this.gridClasses[state]
      })
    }
  }

  const tryToHit = (board) => {
    const EMPTY = 0;
    const MISS = 1;
    const SHIP = 2;
    const HIT = 3;
    board.view.onclick = function(event){
      const id = event.target.dataset.id
      if ( board.model[id] === SHIP ){
        board.model[id] = HIT
      }else if (board.model[id] === EMPTY){
        board.model[id] = MISS
      }
      board.renderView()
      if (!board.contains(SHIP)){
        console.log('All over')
      }
    }
  }

  const next = (otherModel) => {
    const GRID_OPTIONS = {
      width: width.value,
      height: height.value,
      element: p2Board,
      gridClasses: [ '', 'miss', '','hit']
    }

    const opponentBoard = new Board(GRID_OPTIONS)
    opponentBoard.model = otherModel
    opponentBoard.view.style.display = "table"
    tryToHit(opponentBoard)
  }

  const beginGame = (w, h) => {
    const GRID_OPTIONS = {
      element: p1Board,
      gridClasses: [ '', 'selecting', 'selected', 'preselected'],
      height: h ||  height.value,
      width: w || width.value
    }
    startGame.style.display = 'none'
    const gameBoard = new Board(GRID_OPTIONS);
    setBoard(gameBoard, [ 5, 4, 3, 2 ], next)
  }

  const animatedEllipsis = (element, text) => {
    let counter = 0;
    let ellipsis = '...'
    const changeText = () => element.textContent = `${text}${ellipsis.slice(0, counter++ % 4)}`
    intervalReference = setInterval(changeText, 1000)
    changeText()
  }

  const overlay = (color, text) => {
    const overlay = makeElmnt('div')
    const overlayTextContainer = makeElmnt('span')
    overlay.appendChild(overlayTextContainer)
    overlay.classList.add('overlay')
    overlay.style.backgroundColor = color
    animatedEllipsis(overlayTextContainer, text)
    return overlay
  }

  const waitForOpponent = () => {
    let bgColor = 'rgba(200,0,0,.1)'
    let text = 'Waiting for opponent'
    form.style.display = 'none'
    startGame.appendChild(overlay(bgColor, text))
  }

  const saveUserToPending = (width, height, player) => {
    uuid = uuidv4()
    defaultDatabase.ref(`/battleships/${uuid}`).set({
      game: {
        [PLAYER]: true,
        width: width,
        height: height,
        state: gameState.PENDING
      }
    });

    defaultDatabase.ref(`/battleships/${uuid}`).on('child_changed', function(snapshot){
      const gameData = snapshot.val();
      if (gameData.p1 && gameData.p2 && !(gameData.p1Board || gameData.p2Board)){
        beginGame()
      }
    })
  }

  const offerGame = () => {
    PLAYER = 'p1'
    saveUserToPending(width.value, height.value, 'p1')
    waitForOpponent()
  }

  const spinPanel = (function(){
    let panelRotation = 0;
    return () => {
      form.style.transform = `rotateY(${panelRotation += 180}deg)`
    }
  })()

  const listenToGameInstance = () => {
    uuid = gameSelect.value
    defaultDatabase.ref(`/battleships/${gameSelect.value}/game`)
    .on('value', (snapshot) => {
      const gameData = snapshot.val();
      if (gameData.p1Board && gameData.p2Board){
        console.log('no harm');
      } else if (gameData.p1 && gameData.p2 && !(gameData.p1Board || gameData.p2Board)){
        console.log('Beginning');
        beginGame(gameData.width, gameData.height)
      }
    })
  }

  const joinGame = (evt, player = 'p2') => {
    PLAYER = 'p2'
    listenToGameInstance()
    defaultDatabase.ref(`/battleships/${gameSelect.value}/game`)
    .update({
      [PLAYER]: true,
      state: gameState.SETUP
    })
  }


  startGameBtn.onclick = offerGame;
  joinGameBtn.onclick = joinGame;
  [].forEach.call(spinBtns, (btn) => btn.onclick = spinPanel)

})()