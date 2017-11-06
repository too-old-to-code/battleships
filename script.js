(function(){
  var boardArray;

  function determineCellsToHighlight(){
    return boardArray.reduce(function(acc, num, i){
      if (num == 2){
        acc.push(i)
      }
      return acc
    }, [])
  }


  function refreshScreen(board){
    var index = boardArray.indexOf(2)
    console.log(determineCellsToHighlight(boardArray));


    var elementsWithHighlight = document.getElementsByClassName('highlight');
    [].map.call(elementsWithHighlight, function(el){
      el.classList.remove('highlight')
    })
    var element = board.querySelector('[data-id="' + index + '"]')
    element.classList.add('highlight')
  }

  function beginPlacement(board){
    board.onmouseover = function(evt){
      if (evt.target.dataset.id != null){
        boardArray[evt.target.dataset.id] = 2
        boardArray[evt.target.dataset.id + 1] = 2
        boardArray[evt.target.dataset.id - 1] = 2
        refreshScreen(board)
      }
    }

    board.onmouseout = function(evt){
      if (evt.target.dataset.id != null){

        boardArray[evt.target.dataset.id] = 1
      }
    }
  }


  function getElements(identifiers){
    var el = {}
    identifiers.forEach(function(name){
      el[name] = document.getElementById(name)
    })
    return el
  }

  function createCell(index){
    var td = document.createElement('td')
    td.setAttribute('data-id', index)
    return td
  }

  function createRow(columns, colIndex){
    var tr = document.createElement('tr')
    for (var i = 0; i < columns; i ++){
      tr.append(createCell(colIndex + i))
    }
    return tr
  }

  function createTable(rows, columns){
    var tbody = document.createElement('tbody')
    for (var i = 0; i < rows; i ++){
      tbody.append(createRow(columns, i * columns))
    }
    return tbody
  }

  var elementNames =  [
    'width',
    'height',
    'board',
    'dimensionsBtn'
  ]


  function createBoardArray(numOfElements){
    boardArray = new Array(numOfElements)
    boardArray.fill(1)
  }

  var el = getElements(elementNames)

  el.dimensionsBtn.onclick = function(){
    var width = el.width.value;
    var height = el.height.value;
    var tbody = createTable(height, width);
    console.log(height * width);
    createBoardArray(height * width)
    board.append(tbody)
    beginPlacement(board)
  }


})()