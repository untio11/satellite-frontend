import { useEffect, useState } from 'react';
import '../style/App.css';
import Header from './Header';
import { Earth } from '@satellite-earth/core';
import Client from '@satellite-earth/client';
import { Contact, SignedContent } from '../api/satellite';
import { connect, ConnectedProps, useStore } from 'react-redux';
import { Dispatch } from 'redux';
import { TestState } from '../reducers';
import { addPublications } from '../actions';

function App({ pubs, actions: { addPublications } }: PropsFromRedux) {
   const [loaded, setLoaded] = useState(false);
   useEffect(() => {
      async function connectWorld() {
         const earth = new Earth();
         const client = new Client(earth, (event: string, data: Contact, params: string[]) => {
            console.log(data);
            console.log(event);
            console.log(params);
            setLoaded(true);
            addPublications(data.current.included);
         });
         client.contact('satellite', { endpoint: 'https://api.satellite.earth/world' });
      }
      if (!loaded) connectWorld();
   });
   return (
      <div className="App">
         <Header />
         <span>{pubs}</span>
      </div>
   );
}

const mapStateToProps = (state: TestState) => ({
   pubs: state.contents.length,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
   actions: {
      addPublications: (v: Record<string, SignedContent>) => {
         dispatch(addPublications(v));
      },
   },
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(App);
