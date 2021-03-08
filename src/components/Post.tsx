import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import Publication from '@satellite-earth/publication';

import '../style/Post.css';

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

function Content({ publication }: IProps) {
   const ref = useRef<HTMLDivElement>(null);
   const [showReadMore, setShowMore] = useState(false);
   useEffect(() => {
      if (ref.current && ref.current.clientHeight >= 150) {
         setShowMore(true);
      }
   }, []);
   return (
      <div className="post-container">
         <div className="post-header">
            <span className="post-author">@{publication.authorAlias}</span>
            <span className="post-title">{publication._signed_.title}</span>
         </div>
         <div className="post-content" ref={ref}>
            <ReactMarkdown plugins={[gfm]} children={markdown} />
         </div>
         {showReadMore && <span className="post-show-more">show more</span>}
      </div>
   );
}

export default Content;
