import { useEffect, useState } from 'react';
import '../style/App.css';
import Header from './Header';
import { Earth } from '@satellite-earth/core';
import Publication from '@satellite-earth/publication';
import Client from '@satellite-earth/client';
import { Contact } from '../api/satellite';
import { connect, ConnectedProps } from 'react-redux';
import { Dispatch } from 'redux';
import { TestState } from '../reducers';
import { addPublications } from '../actions';

function App({ pubs, actions: { addPublications } }: PropsFromRedux) {
   const [loaded, setLoaded] = useState(false);
   useEffect(() => {
      async function connectWorld() {
         const earth = new Earth();
         const client = new Client(earth, (event: string, data: Contact, params: string[]) => {
            if (event === 'contact') {
               setLoaded(true);
               addPublications(data.current.signals, data.current.number);
               console.log(data);
            } else {
               console.log(data);
               console.log(event);
               console.log(params);
            }
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
   pubs: state.publications.length,
});

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
