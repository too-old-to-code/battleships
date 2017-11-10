(function(){
  const getElmnt = (id) => document.getElementById(id)
  const makeElmnt = (type) => document.createElement(type)

  const p1Board = getElmnt('board');
  const p2Board = getElmnt('opponent-board');
  const width = getElmnt('width');
  const height = getElmnt('height');
  const dimensionsBtn = getElmnt('dimensionsBtn');
  const startGame = getElmnt('start-game');

  const setBoard = (board, ships, cb) => {
    const EMPTY = 0;
    const SELECTING = 1;
    const SELECTED = 2;
    const PRESELECTED = 3;
    const STATE_CLASSES = [
      'empty',
      'selecting',
      'selected',
      'preselected'
    ]
    let horizontalOrientation = true;
    let gridsToHighlight = [];
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

    const refresh = () => {
      board.model.forEach((state, index) => {
        board.view.querySelector('[data-id="' + index + '"]').className = STATE_CLASSES[state]
      })
    }

    const highlightGrids = (id) => {
      if (id != null){
        gridsToHighlight.forEach( idx => board.model[idx] += 1);
        refresh()
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
        size = ships.shift()
        refresh()
        if (!size){
          board.model = board.model.map( status => status === PRESELECTED ? SELECTED : status)
          board.view.onclick = null
          refresh()
          cb()
        }
      }
    }

    board.view.onmouseover = highlightControl
    board.view.onmouseout = unhighlightControl
    board.view.onclick = placeShip
  }

  class Board {
    constructor(width, height, tableElement){
      this.width = width = Number(width);
      this.height = height = Number(height);
      this.view = tableElement
      this.view.append(this.createTable(width, height))
      this.model = this.createModel(width * height);
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
      const boardModel = new Array(numOfElements);
      boardModel.fill(0);
      return boardModel
    }
  }

  const next = () => {
    const opponentBoard = new Board( width.value, height.value, p2Board)
    opponentBoard.view.style.display = "table"
  }


  const beginGame = () => {
    startGame.style.display = 'none'
    const gameBoard = new Board( width.value, height.value, p1Board);
    setBoard(gameBoard, [ 5, 4, 4, 3, 3, 2, 2 ], next)
  }

  dimensionsBtn.onclick = beginGame

})()