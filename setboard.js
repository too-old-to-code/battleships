 const setBoard = (board, ships, game) => {
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
          board.view.onmouseover = null
          board.view.onmouseout = null
          board.renderView()
          game.gameData.game[boardName] = {}
          game.gameData.game[boardName].model = board.model
          game.gameData.game[boardName].shipLocations = shipLocations
          game.displayMessage('Waiting for opponent to place ships', 'rgba(0,143,200,.9)', anchor, '.')
          game.pushGameDataToFB()
        }
      }
    }

    board.view.onmouseover = highlightControl
    board.view.onmouseout = unhighlightControl
    board.view.onclick = placeShip
  }