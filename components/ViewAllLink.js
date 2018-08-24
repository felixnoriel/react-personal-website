import { Link } from '../routes'

const ViewAllLink = ({indexPage, route}) => {
  if(indexPage){
    return <Link as={`${route}`} route={`/${route}`} prefetch>
              <a className="button button-view-all is-link">view all <i className="fas fa-arrow-right"></i></a>
           </Link>
  }
  return '';
}


export default ViewAllLink;
