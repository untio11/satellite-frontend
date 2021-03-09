import React, { useEffect, useState } from 'react';
import '../style/App.css';
import Content from './Content';
import Header from './Header';
import Publication from '@satellite-earth/publication';
import Client, { API_URL } from '../api/client';

import { connect, ConnectedProps } from 'react-redux';
import { Dispatch } from 'redux';
import { GlobalState } from '../reducers';
import { addPublications } from '../actions';
import Searchbar from './Searchbar';

function App({ actions: { addPublications } }: PropsFromRedux) {
   const [loaded, setLoaded] = useState(false);

   useEffect(() => {
      async function connectWorld() {
         await Client.contact('satellite', { endpoint: `${API_URL}/world` });
         setLoaded(true);
      }
      if (!loaded) connectWorld();
   });
   return (
      <div className="App">
         <Header />
         <Searchbar />
         <Content />
      </div>
   );
}

const mapStateToProps = (state: GlobalState) => ({});

const mapDispatchToProps = (dispatch: Dispatch) => ({
   actions: {
      addPublications: (v: Publication[], n: number) => {
         dispatch(addPublications(v, n));
      },
   },
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(App);
