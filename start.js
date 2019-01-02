makeGameBtn.onclick = makeGame;
joinGameBtn.onclick = joinGame;

// add event listener to 'btn-spin' buttons on each side of panel
[].forEach.call(spinBtns, (btn) => btn.onclick = spinPanel.bind(null, form))