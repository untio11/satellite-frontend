<<<<<<< HEAD:src/react-redux-button.js
import React from 'react'
import { connect } from 'react-redux'
import { sayHello } from './actions/sayHello'
=======
import React from 'react';
import { connect } from 'react-redux';
import { sayHello } from '../actions/sayHello'
>>>>>>> 8061d35... (linting) restructured project:src/components/react-redux-button.js

// Q: How to make a file like this one in TypeScript?
let Button = ({ whatsUp, stateObject, saySomething }) => (
    <div>
        <button onClick={saySomething}>Press to dispatch an action.</button>
        <h2>{whatsUp}</h2>
        <button onClick={() => console.log('Redux state: ', stateObject)}>
            Press this button to log the current redux state to console.
        </button>
    </div>
)

const mapStateToProps = (state) => ({
    whatsUp: state.say,
    stateObject: state,
})

const mapDispatchToProps = (dispatch) => ({
    saySomething: () => {
        dispatch(sayHello())
    },
})

<<<<<<< HEAD:src/react-redux-button.js
export default connect(mapStateToProps, mapDispatchToProps)(Button)
=======

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Button);
>>>>>>> 8061d35... (linting) restructured project:src/components/react-redux-button.js
