import * as React from 'react';
import Link from 'next/link';

export const ViewAllLink = (route: any, indexPage: boolean = false ) => {
  if(!indexPage){
    return;
  }

  return (
      <div className="btn-view-all-container">
        <Link as={`${route}`} href={`/page?name=${route}`} prefetch>
            <a className="button-view-all is-link">view more <i className="fas fa-arrow-right"></i></a>
        </Link>
      </div>
  )
}