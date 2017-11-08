(function(){
  var VERTICAL = 'vertical'
  var HORIZONTAL = 'horizontal'
  var game;
  var width = document.getElementById('width');
  var height = document.getElementById('height');
  var dimensionsBtn = document.getElementById('dimensionsBtn');

  function Board(width, height){
    this.orientation = HORIZONTAL
    this.width = Number(width);
    this.height = Number(height);
    this.size = 4
    this.states = ['empty','selecting','selected','preselected']
    this.view = document.getElementById('board')
    this.view.append(this.createTable(height, width))
    this.model = this.createModel(width * height)
    this.gridsToHighlight = []

    this.view.onmouseover = this.highlightControl.bind(this)
    this.view.onmouseout = this.unhighlightControl.bind(this)
    this.view.onclick = this.placeShip.bind(this)
  }

  Board.prototype.highlightControl = function(e){
    this.id = e ? Number(e.target.dataset.id) : this.id
    this.getStartAndEndPoints(this.id)
    this.determineGridsToHighlight()
    this.highlightGrids(this.id)
  }

  Board.prototype.unhighlightControl = function(){
    this.gridsToHighlight = []
    this.model = this.model.map( num => [1,3].includes(num) ? num -= 1 : num )
  }

  Board.prototype.positionIsVacant = function(){
    return !this.model.includes(3)
  }

  Board.prototype.placeShip = function(){
    if (this.positionIsVacant()){
      this.model = this.model.map(num => num === 1 ? 2 : num )
    }
  }

  Board.prototype.determineGridsToHighlight = function(){
    var distanceToNextHiglightedGrid = this.orientation === HORIZONTAL ? 1 : this.width;
    for (var i = this.startPoint; i < this.endPoint; i += distanceToNextHiglightedGrid){
      this.gridsToHighlight.push(i)
    }
  }

  Board.prototype.createTable = function(rows, columns){
    var tbody = document.createElement('tbody')
    for (var i = 0; i < rows; i ++){
      tbody.append(this.createRow(columns, i * columns))
    }
    return tbody
  }

  Board.prototype.getStartAndEndPoints = function(id){
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

  Board.prototype.highlightGrids = function(id){
    if (id != null){
      this.gridsToHighlight.forEach( idx => this.model[idx] += 1);
      this.refresh()
    }
  }

  Board.prototype.changeOrientation = function(){
    this.orientation = this.orientation === HORIZONTAL ? VERTICAL : HORIZONTAL
    this.unhighlightControl()
    this.highlightControl()
  }

  Board.prototype.createRow = function(columns, colIndex){
    var tr = document.createElement('tr')
    for (var i = 0; i < columns; i ++){
      tr.append(this.createCell(colIndex + i))
    }
    return tr
  }

  Board.prototype.createCell = function(index){
    var td = document.createElement('td')
    td.setAttribute('data-id', index)
    return td
  }

  Board.prototype.refresh = function(){
    this.model.forEach(function(state, index){
      this.view.querySelector('[data-id="' + index + '"]').className = this.states[state]
    }.bind(this))
  }

  Board.prototype.createModel = function(numOfElements){
    var boardModel = new Array(numOfElements);
    boardModel.fill(0);
    return boardModel
  }

  function Game(width, height){
    this.width = width
    this.height = height
    var board = new Board(width, height)
    document.onkeydown = function(e){
      if (e.code === 'Space'){
        board.changeOrientation()
      }
    }
  }

  dimensionsBtn.onclick = function(){
    game = new Game(width.value, height.value);
  }


})()