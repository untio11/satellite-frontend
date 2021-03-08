import React from 'react';
import ReactDOM from 'react-dom';
import './style/index.css';
import './style/Theme.css';
import App from './components/App';
import reportWebVitals from './reportWebVitals';

import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from './reducers/reducer';
import Client from '@satellite-earth/client';
import { Earth } from '@satellite-earth/core';

const store = createStore(reducer);

async function connect() {
   const earth = new Earth();
   const client = new Client(earth);
   earth.connect();
}

connect();

ReactDOM.render(
   <React.StrictMode>
      <Provider store={store}>
         <App />
      </Provider>
   </React.StrictMode>,
   document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
