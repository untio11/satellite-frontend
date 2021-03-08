import React from 'react';
import ReactDOM from 'react-dom';
import './style/index.css';
import './style/Theme.css';
import App from './components/App';
import reportWebVitals from './reportWebVitals';


import { Provider } from 'react-redux';
import Client from '@satellite-earth/client';
import { Earth } from '@satellite-earth/core';
import store  from './store';
import {Contact} from './api/satellite';

async function connect() {
   const earth = new Earth();
   const client = new Client(earth, (event: string, data: Contact, params: string[]) => {
      console.log(data);
      console.log(event);
      console.log(params);
   });
   client.contact("satellite", {endpoint: "https://api.satellite.earth/world"});
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
