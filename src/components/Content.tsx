import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Dispatch } from 'redux';
import { GlobalState } from '../reducers';
import '../style/Content.css';
import Post from './Post';

function Content({ pubs }: PropsFromRedux) {
   return (
      <div className="content-container">
         {pubs.map((p) => (
            <Post publication={p} />
         ))}
      </div>
   );
}

const mapStateToProps = (state: GlobalState) => ({
   pubs: state.publications,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Content);
