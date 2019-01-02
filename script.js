'use strict';
// (function(){

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

  const animatedEllipsis = (element, terminalMark) => {
    let counter = 0;
    let ellipsis = String(terminalMark).repeat(3)
    const changeText = () => element.textContent = `${ellipsis.slice(0, counter++ % 4)}`
    intervalReference = setInterval(changeText, 1000)
    changeText()
  }

  const overlay = (color, text, terminalMark) => {
    const overlay = makeElmnt('div')
    const overlayTextContainer = makeElmnt('span')
    overlayTextContainer.innerText = text
    overlay.appendChild(overlayTextContainer)
    overlay.classList.add('overlay')
    overlay.style.backgroundColor = color
    if (terminalMark != null){
      const afterText = makeElmnt('span')
      afterText.classList.add('afterText')
      overlayTextContainer.appendChild(afterText)
      animatedEllipsis(afterText, terminalMark)
    }
    return overlay
  }


  // get references to DOM
  // const p1Board = getElmnt('board');
  // const p2Board = getElmnt('opponent-board');
  // const width = getElmnt('width');
  // const height = getElmnt('height');
  const makeGameBtn = getElmnt('btn-create-game');
  const joinGameBtn = getElmnt('btn-join-game');
  const startGame = getElmnt('start-game');
  const gameSelect = getElmnt('game-select')
  const spinBtns = document.getElementsByClassName('btn-spin')
  const form = document.getElementsByClassName('form')[0]
  // const gameContainer = document.getElementsByClassName('form')[0]
  // const anchor = document.getElementsByClassName('anchor')[0]



  // board class
  class Board {
    constructor({ width, height, element, gridClasses}){
      this.gridClasses = gridClasses;
      this.width = width = Number(width);
      this.height = height = Number(height);
      this.view = element
      this.view.append(this.createTable(width, height))
      this.model = this.createModel(width * height);
    }

    setGridClasses(){
      this.gridClasses = [ '', 'miss', 'selected', 'hit']
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
        console.log('1');
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
      this.defaultDatabase.ref(`/${this.appName}/${gameID}`)
      .set( gameData )
    }

    updateGameData(gameID){
      this.defaultDatabase.ref(`/${this.appName}/${gameID}/game`)
      .update(this.gameInstance.gameData.game)
    }
    listenToGameAction(gameID){
      this.defaultDatabase.ref(`/${this.appName}/${gameID}/game`)
      .on('value', snapshot => {
        const gameData = snapshot.val();
        const { p1Board, p2Board, playerTurn } = gameData;
        const { state } = this.gameInstance.gameData.game;
        if (p1Board && p2Board){
          if (state !== Game.STATES.PLAYING){
            // this should only run once per instance per game
            this.gameInstance.setGameState(Game.STATES.PLAYING)
            this.gameInstance.setPlayerTurn('p1')
            this.gameInstance.pushGameDataToFB()
            this.gameInstance.setOpponentsBoard()
          }
          this.gameInstance.setBoards(gameData.p1Board, gameData.p2Board)
          this.gameInstance.checkForWinner(gameData.p1Board, gameData.p2Board)
          this.gameInstance.setPlayerTurn(playerTurn)
          try {
            if (this.gameInstance.playerTurn === this.gameInstance.player){
              this.gameInstance.opponentBoard && this.gameInstance.opponentBoard.view.classList.add('turn');
            } else {
              this.gameInstance.opponentBoard && this.gameInstance.opponentBoard.view.classList.remove('turn');
            }
          } catch (e){
            console.log(e);
          }
        } else if (gameData && gameData.p1 && gameData.p2 && !(gameData.p1Board || gameData.p2Board)){
          const { width, height } = gameData
          this.gameInstance.setBoardDimensions([ width, height ])
          this.gameInstance.setBoard()
        }
      })
    }
    connectToGameInstance(game){
      this.gameInstance = game
    }
  }

  class Game {
    static generateUUID(){
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    constructor(gameID, player, fb, die){
      this.die = die
      this.fbRef = fb;
      this.player = player
      this.opponent = player === 'p1' ? 'p2' : 'p1'
      this.fbRef.connectToGameInstance(this)
      this.currentState = Game.STATES.PENDING
      this.playerTurn = 'p1'
      this.gameID = gameID
      this.opponentName

      this.gameData = {
        game: {
          playerTurn: 'p1',
          state: this.currentState
        }
      }
    }

    setPlayerTurn(player){
      this.playerTurn = player
      this.gameData.game.playerTurn = player
    }

    checkForWinner(p1, p2){
      [].forEach.call(arguments, (playerBoard, index) => {
        const boardNumber = index + 1
        if (!this.board.contains.call(playerBoard, 2)){
          this.displayWinOrLoseMessages(boardNumber)
        }
      })
    }

    displayWinOrLoseMessages(boardNumber){
      if (this.player === `p${boardNumber}`){
        this.displayMessage('You were obliterated!', 'rgba(200,0,0,.95)', anchor)
      } else {
        this.displayMessage('You were victorious!', 'rgba(255,215,0,.95)', anchor)
      }
      setTimeout(()=> {
        console.log('end game')
        this.die()
      }, 5000)
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

    displayMessage(text, bgColor, element, terminalMark){
      form.style.display = 'none'
      element.appendChild(overlay(bgColor, text, terminalMark))
    }

    offerGame(){
      this.fbRef.offerGame(this.gameID, this.gameData)
    }

    listenToGameAction(gameID){
      this.fbRef.listenToGameAction(this.gameID)
    }

    setBoards(p1Board, p2Board){
      const { game } = this.gameData;
      game.p1Board = p1Board
      game.p2Board = p2Board
      this.board.model = game[`${this.player}Board`].model
      this.board.renderView()
    }
    pushGameDataToFB(){
      this.fbRef.updateGameData(this.gameID)
    }
    setBoard(){
      anchor.innerHTML = ''
      const { height, width } = this.gameData.game;
      const GRID_OPTIONS = {
        element: getElmnt('board'),
        gridClasses: [ '', 'selecting', 'selected', 'preselected'],
        height,
        width
      }
      startGame.style.display = 'none'
      this.board = new Board(GRID_OPTIONS)
      setBoard(this.board, [ 5, 4, 3, 2 ], this)
    }
    setOpponentsBoard(){
      anchor.innerHTML = ''
      const { height, width } = this.gameData.game;
      const GRID_OPTIONS = {
        element: getElmnt('opponent-board'),
        gridClasses: [ '', 'miss', '', 'hit'],
        height,
        width
      }
      this.opponentBoard = new Board(GRID_OPTIONS)
      this.opponentBoard.model = this.gameData.game[`${this.opponent}Board`].model
      this.opponentBoard.view.style.display = 'table'
      this.beginFiring(this.opponentBoard)

    }
    beginFiring(board){
      this.board.setGridClasses()
      board.view.onclick = this.updateFiringResults.bind(this, board)
    }
    updateFiringResults(board, event){
      const EMPTY = 0;
      const MISS = 1;
      const SHIP = 2;
      const HIT = 3;
      const id = event.target.dataset.id
      const { game} = this.gameData

      if (game.playerTurn === this.player && [EMPTY, SHIP].includes(game[`${this.opponent}Board`].model[id])){
        this.setPlayerTurn(this.opponent)
        if ( board.model[id] === SHIP ){
          board.model[id] = HIT
          this.gameData.game[`${this.opponent}Board`].model[id] = HIT
        }else if (board.model[id] === EMPTY){
          board.model[id] = MISS
          this.gameData.game[`${this.opponent}Board`].model[id] = MISS
        }
        board.renderView()
        this.pushGameDataToFB()
      }
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


// })()