import React, { Component } from 'react'
import logo from './genetics.jpg'
import { Container, Row, Col, Card, CardImg, CardTitle, CardBody, FormGroup, Label, Input, Button, Alert } from 'reactstrap'
import InputRange from 'react-input-range'
import 'react-input-range/lib/css/index.css'

import LifeBoard from './LifeBoard'
import Provider, { Context } from './Provider'

class App extends Component {
  /**
   * Update the state to reflect changes to the birth and survival checkboxes.
   * The data-life attribute is used to pass in the birth or survival identifier.
   */
  handleChecked = (event, context) => {
    if (event.target.getAttribute('data-life') === 'birth') {
      context.actions.setBirthFlag(event.target.getAttribute('data-number'), event.target.checked)
    } else {
      context.actions.setSurvivalFlag(event.target.getAttribute('data-number'), event.target.checked)
    }
  }

  render() {
    return (
      <Provider>
        <Container fluid>
          <Row>
            {
              // The first column is the setup and instructions
            }
            <Col md="4" sm="12" className="spaced">
              <Card>
                <CardImg src={logo} top  className="img-fluid" />
                <CardBody style={{padding:15}}>
                  <CardTitle>Game of Life</CardTitle>
                  <h3>Instructions</h3>
                  <ul>
                    <li>Clicking on the individual cells toggles them on and off.</li>
                    <li>Click start/stop button to start/stop the simulation.</li>
                    <li>Change the number of rows and columns using provided sliders.</li>
                    <li>Change the birth and survival rules using the provided checkboxes.</li>
                    <li>The number next to the birth/survival checkboxes indicate the number of neighbours required for birth of a new cell or survival of an existing cell.</li>
                  </ul>

                </CardBody>
                <Context.Consumer>
                  {(context) => (
                    <CardBody style={{padding:15}}>
                      <h3>Settings</h3>
                      <FormGroup>
                        <Label for="rows">Number of Rows:</Label>
                        <InputRange id="rows" minValue={5} maxValue={50} value={context.state.rows} onChange={(rows) => context.actions.setRows(rows)} onChangeComplete={() => context.actions.randomize()}/>
                      </FormGroup>
                      <FormGroup>
                        <Label for="columns">Number of Columns:</Label>
                        <InputRange id="columns" minValue={5} maxValue={50} value={context.state.columns} onChange={(columns) => context.actions.setColumns(columns)} onChangeComplete={() => context.actions.randomize()}/>
                      </FormGroup>
                      <FormGroup check>
                        <Label for="birth">Neighbours required for Birth:</Label>
                        <div>
                          {[1,2,3,4,5,6,7,8].map((number) =>
                            <Label key={number} className="checkbox-style" check>
                              <Input type='checkbox' data-life='birth' data-number={number} checked={context.state["birth" + number]} onChange={(event) => this.handleChecked(event, context)}/> {number}
                            </Label>
                          )}
                        </div>
                      </FormGroup>
                      <FormGroup check>
                        <Label for="survival">Neighbours required for Cell Survival:</Label>
                        <div>
                          {[1,2,3,4,5,6,7,8].map((number) =>
                            <Label key={number} className="checkbox-style" check>
                              <Input type='checkbox' data-life={'survival'} data-number={number} checked={context.state["survival" + number]} onChange={(event) => this.handleChecked(event, context)}/> {number}
                            </Label>
                          )}
                        </div>
                      </FormGroup>
                      <FormGroup>
                        <Label for="fps">Animation speed (fps):</Label>
                        <InputRange id="fps" minValue={1} maxValue={20} value={context.state.fps} onChange={(fps) => context.actions.setFps(fps)}/>
                      </FormGroup>
                    </CardBody>
                  )}
                </Context.Consumer>
                {
                  // Control buttons
                }
                <Context.Consumer>
                  {(context) => (
                    <CardBody style={{padding:15}}>
                      <Button color="secondary" className="spaced-buttons" onMouseDown={e => e.preventDefault()} onClick={context.actions.clearBoard}>Clear</Button>
                      <Button color="secondary" className="spaced-buttons" onMouseDown={e => e.preventDefault()} onClick={context.actions.randomize}>Randomize</Button>
                      <Button color={context.state.running ? 'danger' : 'success'} className="spaced-buttons" onClick={context.actions.toggleRunning}>{context.state.running ? 'Stop' : 'Start'}</Button>
                    </CardBody>
                  )}
                </Context.Consumer>
                {
                  // This is where the status information is displayed
                }
                <Context.Consumer>
                  {(context) => (
                    <CardBody style={{paddingLeft:15, paddingRight:15}}>
                      {context.state.running &&
                        <Alert>Current generation: {context.state.currentGeneration}</Alert>
                      }
                      {!context.state.running && context.state.exitReason &&
                        <Alert>{context.state.exitReason}</Alert>
                      }
                    </CardBody>
                  )}
                </Context.Consumer>
              </Card>
            </Col>
            {
              // The second column displays the board where the pixels live out their short and meaningless lives
            }
            <Col  md="8" sm="12" className="spaced">
              <Card>
                <CardBody>
                  <Context.Consumer>
                    {(context) => (
                      <LifeBoard rows={context.state.rows} columns={context.state.columns} selection={context.state.selection} handleCellClicked={context.actions.handleCellClicked}/>
                    )}
                  </Context.Consumer>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </Provider>

    )
  }
}

export default App
