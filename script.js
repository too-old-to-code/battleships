(function(){
  var config = {
    apiKey: "AIzaSyBGi1VZkmiFMH8pk4Pam__8TB19EFpBVvo",
    authDomain: "battleships-c7e53.firebaseapp.com",
    databaseURL: "https://battleships-c7e53.firebaseio.com",
    projectId: "battleships-c7e53",
    messagingSenderId: "380665178914"
  };

  const fb = firebase.initializeApp(config);
  var defaultDatabase = firebase.database();
  const date = new Date()
  const num = date.getTime()

  const getElmnt = (id) => document.getElementById(id)
  const makeElmnt = (type) => document.createElement(type)

  const p1Board = getElmnt('board');
  const p2Board = getElmnt('opponent-board');
  const width = getElmnt('width');
  const height = getElmnt('height');
  const dimensionsBtn = getElmnt('dimensionsBtn');
  const startGame = getElmnt('start-game');

  const saveGridToFirebase = (board, shipLocations, player) => {
    console.log('Saving to firebase');
    defaultDatabase.ref(`/battleships/${num}`).set({
      [player]: {
        model: board.model,
        ships: shipLocations
      },
      width: board.width,
      height: board.height
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

    const positionIsVacant = () => !board.model.includes(3)

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



  const beginGame = () => {
    const GRID_OPTIONS = {
      width: width.value,
      height: height.value,
      element: p1Board,
      gridClasses: [ '', 'selecting', 'selected', 'preselected']
    }
    startGame.style.display = 'none'
    const gameBoard = new Board(GRID_OPTIONS);


    setBoard(gameBoard, [ 5, 4, 3, 2 ], next)
  }

  dimensionsBtn.onclick = beginGame

})()