  const getElmnt = (id) => document.getElementById(id)
  const makeElmnt = (type) => document.createElement(type)

  const spinPanel = (function(){
    let panelRotation = 0;
    return (element) => {
      element.style.transform = `rotateY(${panelRotation += 180}deg)`
    }
  })()

  const animatedEllipsis = (element, terminalMark) => {
    let counter = 0;
    let ellipsis = String(terminalMark).repeat(3)
    const changeText = () => element.textContent = `${ellipsis.slice(0, counter++ % 4)}`
    intervalReference = setInterval(changeText, 1000)
    changeText()
  }

  const overlay = (color, text, terminalMark) => {
    const overlay = makeElmnt('div')
    const overlayTextContainer = makeElmnt('span')
    overlayTextContainer.innerText = text
    overlay.appendChild(overlayTextContainer)
    overlay.classList.add('overlay')
    overlay.style.backgroundColor = color
    if (terminalMark != null){
      const afterText = makeElmnt('span')
      afterText.classList.add('afterText')
      overlayTextContainer.appendChild(afterText)
      animatedEllipsis(afterText, terminalMark)
    }
    return overlay
  }