import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import Publication from '@satellite-earth/publication';
import ClientInstance from '../api/client';

import '../style/Post.css';
import { TestState } from '../reducers';
import { Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';

const markdown = `A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done
* Lists
* [ ] todo
* [x] done
* Lists
* [ ] todo
* [x] done
* Lists
* [ ] todo
* [x] done
* Lists
* [ ] todo
* [x] done
* Lists
* [ ] todo
* [x] done
* Lists
* [ ] todo
* [x] done
* Lists
* [ ] todo
* [x] done
* Lists
* [ ] todo
* [x] done
`;
export interface IProps {
   publication: Publication;
}

function Post({ publication, content }: IProps & PropsFromRedux) {
   const ref = useRef<HTMLDivElement>(null);
   const [showReadMore, setShowMore] = useState(false);
   const [isLoaded, setLoaded] = useState(false);
   useEffect(() => {
      if (ref.current && ref.current.clientHeight >= 150) {
         setShowMore(true);
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
   }, [publication, isLoaded]);
   return (
      <div className="post-container">
         <div className="post-header">
            <span className="post-author">@{publication.authorAlias}</span>
            <span className="post-title">{publication._signed_.title}</span>
         </div>
         <div className="post-content" ref={ref}>
            <ReactMarkdown plugins={[gfm]} children={content && content.markdown} />
         </div>
         {showReadMore && <span className="post-show-more">show more</span>}
      </div>
   );
}

const mapStateToProps = (state: TestState, ownProps: IProps) => ({
   content: state.contents[ownProps.publication.uuid],
});

const mapDispatchToProps = (dispatch: Dispatch) => ({});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Post);
