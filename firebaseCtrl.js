const FB_CONFIG = {
  apiKey: "AIzaSyBGi1VZkmiFMH8pk4Pam__8TB19EFpBVvo",
  authDomain: "battleships-c7e53.firebaseapp.com",
  databaseURL: "https://battleships-c7e53.firebaseio.com",
  projectId: "battleships-c7e53",
  messagingSenderId: "380665178914"
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
              this.gameInstance.opponentBoard.view.classList.add('turn');
            } else {
              this.gameInstance.opponentBoard.view.classList.remove('turn');
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