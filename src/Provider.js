import React, { Component } from 'react'

export const Context = React.createContext()

// The size of history to keep when checking for oscillating loops
const HISTORY_CHECK_LENGTH = 5

class Provider extends Component {
  constructor(props) {
    super(props)

    this.stateHistory = []
    this.animationFrame = null

    this.state =  {
      rows: 25,
      columns:25,

      birth1:false,
      birth2:false,
      birth3:true,
      birth4:false,
      birth5:false,
      birth6:false,
      birth7:false,
      birth8:false,

      survival1:false,
      survival2:true,
      survival3:true,
      survival4:false,
      survival5:false,
      survival6:false,
      survival7:false,
      survival8:false,

      fps: 10,
      running:false,
      selection: this.generateRandomCellStates(25,25),
      currentGeneration: 0,
      exitReason: '',
    }
  }

  render() {
    return (
      <Context.Provider value={
        {
          state: this.state,
          actions: {
            toggleRunning: () => this.toggleRunning(),
            clearBoard: () => this.clearBoard(),
            randomize: () => this.randomize(),
            handleCellClicked: (row, column) => this.handleCellClicked(row, column),
            setRows: (rows) => this.setRows(rows),
            setColumns: (columns) => this.setColumns(columns),
            setFps: (fps) => this.setFps(fps),
            setBirthFlag: (number, flag) => this.setBirthFlag(number, flag),
            setSurvivalFlag: (number, flag) => this.setSurvivalFlag(number, flag),
          },
        }
      }>
        {this.props.children}
      </Context.Provider>
    )
  }

  /**
   * Either start or stop the running of the simulation.
   */
  toggleRunning = () => {
    const shouldRun = !this.state.running

    if (shouldRun) {
      this.stateHistory = []
      this.stateHistory.push(JSON.stringify(this.state.selection))
      this.setState({
        currentGeneration: this.state.currentGeneration+1,
        exitReason: '',
        running: shouldRun,
      })

      this.animationFrame = requestAnimationFrame(this.nextFrame)
    } else {
      this.setState({
        running: shouldRun,
      })

      cancelAnimationFrame(this.animationFrame)
    }
  }

  clearBoard = () => {
    this.setState({
      selection: this.generateEmptyBoard(this.state.rows, this.state.columns),
      exitReason: '',
      currentGeneration: 0,
    })
  }

  randomize = () => {
    this.setState({
      selection: this.generateRandomCellStates(this.state.rows, this.state.columns),
      exitReason: '',
      currentGeneration: 0,
    })
  }

  handleCellClicked = (row, column) => {
    let newSelection = { ...this.state.selection }
    newSelection[[row, column]] = this.state.selection[[row, column]] ? 0: 1
    this.setState({
      selection: newSelection,
      exitReason: '',
      currentGeneration: 0,
    })
  }

  setRows = (rows) => {
    this.setState({
      rows: rows,
    })
  }

  setColumns = (columns) => {
    this.setState({
      columns: columns,
    })
  }

  setFps = (fps) => {
    this.setState({
      fps: fps,
    })
  }

  setBirthFlag = (number, flag) => {
    let state = {}
    state['birth'+number] = flag
    this.setState(state)
  }

  setSurvivalFlag = (number, flag) => {
    let state = {}
    state['survival'+number] = flag
    this.setState(state)
  }

  /**
   * Go to the next frame in the animation by sorting out which cells should be born and which should die.
   */
  nextFrame = () => {
    let newState = Object.assign({}, this.state)
    // Ensure a deep copy of the selections
    newState.selection = Object.assign({}, this.state.selection)

    let stateChanged = false

    for (let row = 0 ; row < this.state.rows ; row ++ ) {
      for (let col = 0 ; col < this.state.columns; col ++ ) {
        let count = this.countAdjacentCells(row, col)

        // console.log(count + " cells adjacent to " + row + ", " + col + " (currently " + this.state.selection[[row,col]] + ")");

        // Now see if we want to change the state.
        if (this.state.selection[[row,col]]) {
          // It is currently turned on - see whether it has the right number of lives to survive
          if (!this.state['survival' + count]) {
            newState.selection[[row,col]] = 0
            stateChanged = true
            // console.log("Cell died at " + row + ", " + col);
          }
        } else {
          // Currently not on - see if one should be born here
          if (this.state['birth' + count]) {
            newState.selection[[row,col]] = 1
            stateChanged = true
            // console.log("Cell born at " + row + ", " + col);
          }
        }
      }
    }

    if (stateChanged) {
      // Now check whether we are just oscillating in a repeated loop.
      // To do this, we will go back a defined number of generations and see if any of them match our current generation
      const newSelection = JSON.stringify(newState.selection)

      const oldSelections = this.stateHistory.slice(-HISTORY_CHECK_LENGTH)

      for (let thisSelection of oldSelections) {
        if (newSelection === thisSelection) {
          newState.running = false
          newState.exitReason = 'Exited because of a loop after ' + this.state.currentGeneration + ' generations.'
          this.setState(newState)
          return
        }
      }

      // No need to keep endless state history around
      this.stateHistory = oldSelections
      this.stateHistory.push(newSelection)

      newState.currentGeneration = this.state.currentGeneration+1

      let speed = 1000 / this.state.fps
      setTimeout(() => {
        if (this.state.running) {
          this.animationFrame = requestAnimationFrame(this.nextFrame)
        }
      }, speed)
    } else {
      newState.running = false
      newState.exitReason = 'Exited in stable state after ' + this.state.currentGeneration + ' generations.'
    }
    this.setState(newState)
  }

  /**
   * Utility function to generate a board of the required size with randomly selected cells.
   */
  generateRandomCellStates = (rows, columns) => {
    let state = {}
    for (let row = 0 ; row < rows ; row ++ ) {
      for (let col = 0 ; col < columns; col ++ ) {
        state[[row,col]] = Math.round(Math.random())
      }
    }
    return state
  }

  /**
   * Utility function to generate a board of the required size with no cells selected.
   */
  generateEmptyBoard = (rows, columns) => {
    let state = {}
    for (let row = 0 ; row < rows ; row ++ ) {
      for (let col = 0 ; col < columns; col ++ ) {
        state[[row,col]] = 0
      }
    }
    return state
  }

  /**
   * Count the number of cells adjacent to the given location which are on. This checks up to 8 cells
   * but needs to respect edges too.
   */
  countAdjacentCells = (row, col) => {
    if (row < 0 || row > this.state.rows-1 || col < 0 || col > this.state.columns-1) {
      // TODO: Handle error nicely
      return 0
    }
    let count = 0
    // Previous row
    if (row - 1 >= 0) {
      count += (col - 1 < 0) ? 0 : this.state.selection[[row-1,col-1]]
      count += this.state.selection[[row-1,col]]
      count += (col + 1 >= this.state.columns) ? 0 : this.state.selection[[row-1,col+1]]
    }
    // Current row
    count += (col - 1 < 0) ? 0 : this.state.selection[[row,col-1]]
    count += (col + 1 >= this.state.columns) ? 0 : this.state.selection[[row,col+1]]
    // Next row
    if (row + 1 < this.state.rows) {
      count += (col - 1 < 0) ? 0 : this.state.selection[[row+1,col-1]]
      count += this.state.selection[[row+1,col]]
      count += (col + 1 >= this.state.columns) ? 0 : this.state.selection[[row+1,col+1]]
    }
    return count
  }


}

export default Provider