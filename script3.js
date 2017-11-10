(function(){
  var VERTICAL = '|'
  var HORIZONTAL = '––'
  var EMPTY = 0;
  var SELECTING = 1;
  var SELECTED = 2;
  var PRESELECTED = 3;
  var game;
  var width = document.getElementById('width');
  var height = document.getElementById('height');
  var dimensionsBtn = document.getElementById('dimensionsBtn');
  var startGame = document.getElementById('start-game');

  function beginGame(opponentGrid, model){
    setTimeout(() => {
      var opponentBoard = document.getElementById('opponent-board')
      opponentBoard.style.display = "table"
      opponentBoard.append(opponentGrid)
      opponentBoard.onclick = function(e){
        var gridId = e.target.dataset.id
        if (gridId != null){
          if (model[gridId] == 2){
            console.log('hit');
          }else if(model[gridId] == 0){
            // model[gridId] = 2
            console.log('miss');
          }
        }
      }

    }, 1000)
  }

  class Board {
    constructor(width, height){
      this.orientation = HORIZONTAL
      this.width = Number(width);
      this.height = Number(height);
      this.ships = [ 5, 4, 4, 3, 3, 2, 2 ]
      this.size = this.ships.shift()
      this.states = ['empty','selecting','selected','preselected']

      this.view = document.getElementById('board')
      this.view.append(this.createTable(height, width))
      this.model = this.createModel(width * height)
      this.gridsToHighlight = []
      this.view.onmouseover = this.highlightControl.bind(this)
      this.view.onmouseout = this.unhighlightControl.bind(this)
      this.view.onclick = this.placeShip.bind(this)
    }

    highlightControl(event){
      console.log(this.id);
      this.id = event ? Number(event.target.dataset.id) : this.id
      this.getStartAndEndPoints(this.id)
      this.determineGridsToHighlight()
      this.highlightGrids(this.id)
    }

    unhighlightControl(){
      this.gridsToHighlight = []
      this.model = this.model.map( status => [ SELECTING, PRESELECTED ].includes(status) ? status -= 1 : status )
    }

    positionIsVacant(){
      return !this.model.includes(3)
    }

    placeShip(event){
      if (this.positionIsVacant() && event.target.dataset.id != null){
        this.model = this.model.map( status => status === SELECTING ? PRESELECTED : status )
        this.size = this.ships.shift()
        this.refresh()
        if (!this.size){
          this.model = this.model.map( status => status === PRESELECTED ? SELECTED : status)
          this.refresh()
          var opponentGrid = this.createTable(this.height, this.width)
          this.view.onclick = null;
          beginGame(opponentGrid, this.model)
        }
      }
    }

    determineGridsToHighlight(){
      var distanceToNextHiglightedGrid = this.orientation === HORIZONTAL ? 1 : this.width;
      for (var i = this.startPoint; i < this.endPoint; i += distanceToNextHiglightedGrid){
        this.gridsToHighlight.push(i)
      }
    }

    createTable(rows, columns){
      var tbody = document.createElement('tbody')
      for (var i = 0; i < rows; i ++){
        tbody.append(this.createRow(columns, i * columns))
      }
      return tbody
    }

    createRow(columns, colIndex){
      var tr = document.createElement('tr')
      for (var i = 0; i < columns; i ++){
        tr.append(this.createCell(colIndex + i))
      }
      return tr
    }

    createCell(index){
      var td = document.createElement('td')
      td.setAttribute('data-id', index)
      return td
    }

    getStartAndEndPoints(id){
      var minPointOnAxis, maxPointOnAxis;
      if ( this.orientation === HORIZONTAL ){
        minPointOnAxis = Math.floor(id/this.width) * this.width
        maxPointOnAxis = minPointOnAxis + this.width
        this.startPoint = Math.min(Math.max(id - (Math.floor(this.size/2)), minPointOnAxis), maxPointOnAxis - this.size)
        this.endPoint = this.startPoint + this.size
      } else {
        minPointOnAxis = id % this.width
        maxPointOnAxis = minPointOnAxis + this.width * this.height
        this.startPoint = Math.min( Math.max(minPointOnAxis, id - ( Math.floor(this.size/2) * this.width)), maxPointOnAxis - (this.size * this.width))
        this.endPoint = this.startPoint + (this.size * this.width)
      }
    }

    highlightGrids(id){
      if (id != null){
        this.gridsToHighlight.forEach( idx => this.model[idx] += 1);
        this.refresh()
      }
    }

    changeOrientation(){
      this.orientation = this.orientation === HORIZONTAL ? VERTICAL : HORIZONTAL
      this.unhighlightControl()
      this.highlightControl()
    }

    refresh(){
      this.model.forEach(function(state, index){
        this.view.querySelector('[data-id="' + index + '"]').className = this.states[state]
      }.bind(this))
    }

    createModel(numOfElements){
      var boardModel = new Array(numOfElements);
      boardModel.fill(0);
      return boardModel
    }
  }


  function Game(width, height){
    this.width = width
    this.height = height

    var board = new Board(width, height)

    document.onkeydown = function(event){
      if (event.code === 'Space'){
        board.changeOrientation()
      }
    }
  }



  dimensionsBtn.onclick = function(){
    startGame.style.display = 'none'
    game = new Game(width.value, height.value);
  }


})()