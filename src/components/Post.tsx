import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import Publication from '@satellite-earth/publication';
import ClientInstance from '../api/client';

import '../style/Post.css';
import { GlobalState } from '../reducers';
import { Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';

export interface IProps {
   publication: Publication;
}

function Post({ publication, content }: IProps & PropsFromRedux) {
   const ref = useRef<HTMLDivElement>(null);
   const [shouldShowReadMore, setShouldShowReadMore] = useState(false);
   const [isShowingMore, setShowMore] = useState(false);
   const [isLoaded, setLoaded] = useState(false);
   useEffect(() => {
      if (ref.current && ref.current.clientHeight >= 180) {
         setShouldShowReadMore(true);
      }
      if (!isLoaded) {
         setLoaded(true);
         ClientInstance.load(publication, {
            directDownload: true,
            eventParams: {
               isPublication: true,
               alias: publication.authorAlias,
               media: false,
            },
         });
      }
   }, [publication, isLoaded, isShowingMore, shouldShowReadMore, content]);
   const markdown = content && content.markdown;
   return (
      <div className="post-container">
         <div className="post-header">
            <a href={`https://satellite.earth/@${publication.authorAlias}`}>
               <span className="post-author">@{publication.authorAlias}</span>
            </a>
            {!markdown && <h1 className="post-title">{publication._signed_.title}</h1>}
            {!markdown && <h6 className="post-subtitle">{publication._signed_.subtitle}</h6>}
         </div>
         <div className="post-content" ref={ref} style={isShowingMore ? { maxHeight: 'none' } : {}}>
            <ReactMarkdown plugins={[gfm]} children={markdown} />
         </div>
         {shouldShowReadMore && !isShowingMore && (
            <span
               onClick={() => {
                  setShowMore(true);
               }}
               className="post-show-more"
            >
               show more
            </span>
         )}
      </div>
   );
}

const mapStateToProps = (state: GlobalState, ownProps: IProps) => ({
   content: state.contents[ownProps.publication.uuid],
});

const mapDispatchToProps = (dispatch: Dispatch) => ({});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Post);
