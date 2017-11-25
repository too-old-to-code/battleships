const makeGame = () => {

    const player = 'p1'
    const dimensions = [ getElmnt('width').value, getElmnt('height').value ]
    let game = new Game(Game.generateUUID(), player, fb, deleteSelf)
    game.setBoardDimensions(dimensions)
    game.setPlayer1(true)
    game.displayMessage('Waiting for opponent', 'rgba(0,143,200,.9)', anchor, '.')
    game.offerGame()
    game.listenToGameAction()


    function deleteSelf(){
      game.setGameState(Game.STATES.COMPLETE)
      game.opponentBoard.view.innerHTML = ''
      game.opponentBoard.view.style.display = 'none'
      game.board.view.innerHTML = ''
      anchor.innerHTML = ''
      game = null
      startGame.style.display = 'flex'
      form.style.display = 'flex'
    }
  }

  const joinGame = () => {
    const player = 'p2';
    const gameID = getElmnt('game-select').value;
    let game = new Game(gameID, player, fb, deleteSelf)
    game.setPlayer2(true);
    game.setGameState(Game.STATES.SETUP)
    game.listenToGameAction()
    game.pushGameDataToFB()

    function deleteSelf(){
      game.setGameState(Game.STATES.COMPLETE)
      game.opponentBoard.view.innerHTML = ''
      game.opponentBoard.view.style.display = 'none'
      game.board.view.innerHTML = ''
      anchor.innerHTML = ''
      game = null
      startGame.style.display = 'flex'
      form.style.display = 'flex'
    }
  }