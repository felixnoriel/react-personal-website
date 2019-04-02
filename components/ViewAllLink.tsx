import * as React from 'react';
import routes from '../routes';
const Link  = routes.Link;
// import { Link } from '../routes'
export const ViewAllLink = (route: any, indexPage: boolean = false ) => {
  if(!indexPage){
    return;
  }

  return (
      <div className="btn-view-all-container">
        <Link as={`${route}`} route={`/${route}`} prefetch>
            <a className="button-view-all is-link">view more <i className="fas fa-arrow-right"></i></a>
        </Link>
      </div>
  )
  
}