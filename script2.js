(function(){
  var game;
  var width = document.getElementById('width');
  var height = document.getElementById('height');
  var dimensionsBtn = document.getElementById('dimensionsBtn');


  function Board(width, height){
    this.width = width;
    this.height = height;
    this.size = 3
    this.states = ['empty','selecting','selected','preselected']
    this.view = document.getElementById('board')
    this.view.append(this.createTable(height, width))
    this.model = this.createModel(width * height)

    this.view.onmouseover = function(e){
      var id = e.target.dataset.id
      var group = Math.floor(id/this.width) * this.width
      console.log(group);
      if (id != null){
        this.model[id] = 1;
      }
      this.refresh()
    }.bind(this)

    this.view.onmouseout = function(e){
      var id = e.target.dataset.id
      if (id != null){
        this.model[id] = 0;
      }
    }.bind(this)


  }

  Board.prototype.createTable = function(rows, columns){
    var tbody = document.createElement('tbody')
    for (var i = 0; i < rows; i ++){
      tbody.append(this.createRow(columns, i * columns))
    }
    return tbody
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
    return boardModel.fill(0);
  }

  function Game(width, height){
    this.width = width
    this.height = height
    var board = new Board(width, height)
    console.log(board);
  }

  dimensionsBtn.onclick = function(){
    game = new Game(width.value, height.value);
  }


})()