import { Link } from '../routes'

const ViewAllLink = ({indexPage, route}) => {
  if(indexPage){
    return <div className="btn-view-all-container">
            <Link as={`${route}`} route={`/${route}`} prefetch>
                <a className="button-view-all is-link">view more <i className="fas fa-arrow-right"></i></a>
             </Link>
           </div>
  }
  return '';
}


export default ViewAllLink;
