import { useEffect } from 'react';
import '../style/App.css';
import Header from './Header';
import { Earth } from '@satellite-earth/core';
import Client from '@satellite-earth/client';
import { Contact, SignedContent } from '../api/satellite';
import { connect, ConnectedProps } from 'react-redux';
import { Dispatch } from 'redux';
import { TestState } from '../reducers';
import { addPublications } from '../actions';

function App({ actions: { addPublications } }: PropsFromRedux) {
   useEffect(() => {
      async function connectWorld() {
         const earth = new Earth();
         const client = new Client(earth, (event: string, data: Contact, params: string[]) => {
            console.log(data);
            console.log(event);
            console.log(params);
            addPublications(data.current.included);
         });
         client.contact('satellite', { endpoint: 'https://api.satellite.earth/world' });
      }
      connectWorld();
   });
   return (
      <div className="App">
         <Header />
      </div>
   );
}

const mapStateToProps = (state: TestState) => ({});

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
