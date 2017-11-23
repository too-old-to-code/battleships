'use strict';
(function(){

  // Configuration
  const FB_CONFIG = {
    apiKey: "AIzaSyBGi1VZkmiFMH8pk4Pam__8TB19EFpBVvo",
    authDomain: "battleships-c7e53.firebaseapp.com",
    databaseURL: "https://battleships-c7e53.firebaseio.com",
    projectId: "battleships-c7e53",
    messagingSenderId: "380665178914"
  }

  // firebase initialisation
  // const fb = firebase.initializeApp(FB_CONFIG);
  // const defaultDatabase = firebase.database();
  // const ref = defaultDatabase.ref('/battleships')

  const setBoard = (board, ships, game) => {
    console.log('hello');
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
          let boardName = `${game.player}Board`;
          board.model = board.model.map( status => status === PRESELECTED ? SELECTED : status)
          board.view.onclick = null
          board.renderView()
          game.gameData.game[boardName] = {}
          game.gameData.game[boardName].model = board.model
          game.gameData.game[boardName].shipLocations = shipLocations
          game.pushGameDataToFB()
          // game.setOpponentsBoard()
          // saveGridToFirebase(board, shipLocations, 'PLAYER_1')
          // cb(board.model)
        }
      }
    }

    board.view.onmouseover = highlightControl
    board.view.onmouseout = unhighlightControl
    board.view.onclick = placeShip
  }





  let intervalReference

  // utility functions
  const getElmnt = (id) => document.getElementById(id)
  const makeElmnt = (type) => document.createElement(type)

  const spinPanel = (function(){
    let panelRotation = 0;
    return (element) => {
      element.style.transform = `rotateY(${panelRotation += 180}deg)`
    }
  })()

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


  // get references to DOM
  // const p1Board = getElmnt('board');
  // const p2Board = getElmnt('opponent-board');
  // const width = getElmnt('width');
  // const height = getElmnt('height');
  const startGameBtn = getElmnt('btn-create-game');
  const joinGameBtn = getElmnt('btn-join-game');
  const startGame = getElmnt('start-game');
  const gameSelect = getElmnt('game-select')
  const spinBtns = document.getElementsByClassName('btn-spin')
  const form = document.getElementsByClassName('form')[0]



  // board class
  class Board {
    constructor({ width, height, element, gridClasses}){
      this.gridClasses = gridClasses;
      this.width = width = Number(width);
      this.height = height = Number(height);
      this.view = element
      this.view.append(this.createTable(width, height))
      this.model = this.createModel(width * height);
      console.log(this);
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

  class FirebaseControl {
    constructor(appName){
      this.gameInstance = null;
      this.appName = appName
      this.fb = firebase.initializeApp(FB_CONFIG);
      this.defaultDatabase = firebase.database();
      this.ref = this.defaultDatabase.ref(`/${appName}`)
    }
    openConnection(){
      this.ref.on('value', snapshot => {
        const fragment = document.createDocumentFragment();
        const obj = snapshot.val()
        if (obj){
          const keys = Object.keys(obj)
          keys.filter( key => obj[key].game.state === Game.STATES.PENDING )
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
    }
    offerGame(gameID, gameData){
      console.log('Setting');
      this.defaultDatabase.ref(`/${this.appName}/${gameID}`)
      .set( gameData )
    }
    // listenForGameAcceptance(gameID){
    //   this.defaultDatabase.ref(`/${this.appName}/${gameID}`)
    //   .on('child_changed', (snapshot) => {
    //     const gameData = snapshot.val();
    //     // if (gameData.p1 && gameData.p2 && !(gameData.p1Board || gameData.p2Board)){
    //     //   this.gameInstance.setBoard()
    //     // }
    //   })
    // }
    updateGameData(gameID){
      this.defaultDatabase.ref(`/${this.appName}/${gameID}/game`)
      .update(this.gameInstance.gameData.game)
    }
    listenToGameAction(gameID){
      this.defaultDatabase.ref(`/${this.appName}/${gameID}/game`)
      .on('value', snapshot => {
        const gameData = snapshot.val();
        console.log('Data',gameData);
        const { p1Board, p2Board, playerTurn } = gameData;
        const { state } = this.gameInstance.gameData.game;
        if (p1Board && p2Board){
          if (state !== Game.STATES.PLAYING){
            console.log('Only see me once');
            this.gameInstance.setGameState(Game.STATES.PLAYING)
            this.gameInstance.setPlayerTurn('p1')
            this.gameInstance.pushGameDataToFB()
            this.gameInstance.setOpponentsBoard()
          }
          this.gameInstance.setBoards(gameData.p1Board, gameData.p2Board)
          this.gameInstance.setPlayerTurn(playerTurn)
        } else if (gameData && gameData.p1 && gameData.p2 && !(gameData.p1Board || gameData.p2Board)){
          const { width, height } = gameData
          this.gameInstance.setBoardDimensions([ width, height ])
          this.gameInstance.setBoard()
          // beginGame(gameData.width, gameData.height)
        }
      })
    }
    connectToGameInstance(game){
      this.gameInstance = game
    }
  }

  class Game {
    constructor(player, fb){
      this.fbRef = fb;
      this.player = player
      this.opponent = player === 'p1' ? 'p2' : 'p1'
      this.fbRef.connectToGameInstance(this)
      this.currentState = Game.STATES.PENDING
      this.playerTurn = 'p1'
      // this.playerName
      this.opponentName

      this.gameData = {
        game: {
          playerTurn: 'p1',
          state: this.currentState
        }
      }
    }

    setGameID(gameID){
      this.gameID = gameID
    }
    setPlayerTurn(player){
      this.playerTurn = player
      this.gameData.game.playerTurn = player
    }

    setBoardDimensions(dimensions){
      this.gameData.game.width = dimensions[0]
      this.gameData.game.height = dimensions[1]
    }

    setPlayer1(isActive){
      this.gameData.game.p1 = isActive
    }

    setPlayer2(isActive){
      this.gameData.game.p2 = isActive
    }

    setGameState(state){
      this.currentState = state
      this.gameData.game.state = this.currentState
    }

    displayMessage(text, bgColor){
      form.style.display = 'none'
      startGame.appendChild(overlay(bgColor, text))
    }

    offerGame(){
      this.fbRef.offerGame(this.gameID, this.gameData)
    }

    // listenForGameAcceptance(){
    //   this.fbRef.listenForGameAcceptance(this.gameID)
    // }

    listenToGameAction(gameID){
      console.log('Game to listen to:',this.gameID);
      this.fbRef.listenToGameAction(this.gameID)
    }
    setBoards(p1Board, p2Board){
      this.gameData.game.p1Board = p1Board
      this.gameData.game.p2Board = p2Board
      console.log(this);
    }
    pushGameDataToFB(){
      this.fbRef.updateGameData(this.gameID)
    }
    setBoard(){
      const GRID_OPTIONS = {
        element: getElmnt('board'),
        gridClasses: [ '', 'selecting', 'selected', 'preselected'],
        height: this.gameData.game.height,
        width: this.gameData.game.width
      }
      startGame.style.display = 'none'
      console.log('Build board');
      this.board = new Board(GRID_OPTIONS)
      setBoard(this.board, [ 5, 4, 3, 2 ], this)
    }
    setOpponentsBoard(){
      this.displayMessage('Waiting for ships', 'blue')
      const GRID_OPTIONS = {
        element: getElmnt('opponent-board'),
        gridClasses: [ '', 'miss', '', 'hit'],
        height: this.gameData.game.height,
        width: this.gameData.game.width
      }
      console.log(this.opponent);
      this.opponentBoard = new Board(GRID_OPTIONS)
      this.opponentBoard.model = this.gameData.game[`${this.opponent}Board`].model
      this.opponentBoard.view.style.display = 'table'
      this.beginFiring(this.opponentBoard)
      // this.opponentBoard.model =
    }
    beginFiring(board){
      board.view.onclick = this.updateFiringResults.bind(this, board)
    }
    updateFiringResults(board, event){
      const EMPTY = 0;
      const MISS = 1;
      const SHIP = 2;
      const HIT = 3;
      const id = event.target.dataset.id
      console.log(this.gameData.game.playerTurn);
      console.log(this.player);
      if (this.gameData.game.playerTurn === this.player){
        this.setPlayerTurn(this.opponent)
        if ( board.model[id] === SHIP ){
          board.model[id] = HIT
        }else if (board.model[id] === EMPTY){
          board.model[id] = MISS
        }
        board.renderView()
        if (!board.contains(SHIP)){
          console.log(board.model);
          console.log('All over')
        }
        this.pushGameDataToFB()
      }
    }
    generateUUID(){
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  // static variables
  Game.STATES = {
    PENDING: 'Waiting for opponent',
    SETUP: 'Setting up board',
    PLAYING: 'Game in progress',
    COMPLETE: 'Game over'
  }

  const fb = new FirebaseControl('battleships')
  fb.openConnection()

  // startGameBtn.onclick = offerGame.bind(null, 'p1');
  startGameBtn.onclick = () => {
    let player = 'p1'
    let dimensions = [
      getElmnt('width').value,
      getElmnt('height').value
    ]
    let game = new Game(player, fb)
    game.setGameID(game.generateUUID())
    game.setBoardDimensions(dimensions)
    game.setPlayer1(true)
    game.displayMessage('Waiting for opponent', 'rgba(200,0,0,.1)')
    game.offerGame()
    // game.listenForGameAcceptance()
    game.listenToGameAction()
  }

  joinGameBtn.onclick = () => {
    const gameID = getElmnt('game-select').value;
    let player = 'p2';
    let game = new Game(player, fb)
    game.setPlayer2(true);
    game.setGameID(gameID)
    game.setGameState(Game.STATES.SETUP)
    game.listenToGameAction()
    game.pushGameDataToFB()

  }

  // add event listener to 'btn-spin' buttons on each side of panel
  [].forEach.call(spinBtns, (btn) => btn.onclick = spinPanel.bind(null, form))

})()