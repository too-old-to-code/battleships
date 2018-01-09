'use strict';
// (function(){

  let intervalReference

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