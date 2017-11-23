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