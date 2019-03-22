import { PureComponent } from 'react';
import { Link } from '../routes'
import helper from '../helpers/helper';
import ViewAllLink from './ViewAllLink';

class CareerTimeline extends PureComponent{

  render(){
      const { experiences, indexPage } = this.props;

      return ( [<section id="career-section" key="career-1" className="hero has-text-centered  is-bold">
                  <div className="hero-body">
                    <div className="container">
                      <h1 className="title">Career Timeline</h1>
                      <h2 className="subtitle">Companies I have been a part of</h2>
                    </div>
                  </div>
                </section>,
                <section key="career-2" className="section container section-container-default timeline-container">
                    <div className="timeline is-centered">
                      <header className="timeline-header">
                        <span className="tag tag-laptop is-medium is-dark"><i className="fas fa-laptop"></i></span>
                      </header>
                      <ExperienceList experiences={experiences} />
                    </div>
                    <ViewAllLink route="career" indexPage={indexPage}/>
                </section>])
  }
}

const ExperienceList = ({experiences}) => {
  if(!experiences || experiences.length == 0){
    return ''
  }
  return experiences.map(exp => {
    return <Experience key={exp.id} experience={exp}/>
  })
}
export const Experience = ({experience}) => {
  if(!experience){ return '' }
  const modifyExperience = helper.modifyWordpressObject(experience);
  return (<div className="timeline-item is-dark ">
            <div className="timeline-marker is-dark"></div>
            <div className="timeline-content">
            <Link as={modifyExperience.custom_modified.postUrlPath}
                route={modifyExperience.custom_modified.postUrlPath} prefetch>
              <a>
                <p className="heading heading-1" dangerouslySetInnerHTML={{ __html: `${modifyExperience.custom_meta.custom_meta_job_title} | ${modifyExperience.title.rendered}` }} />
                <p className="heading">{modifyExperience.custom_meta.custom_meta_start_date} - {modifyExperience.custom_meta.custom_meta_end_date}</p>
              </a>
            </Link>
              <Link as={modifyExperience.custom_modified.postUrlPath}
                  route={modifyExperience.custom_modified.postUrlPath} prefetch>
                <a>
                  <figure className="image company-logo">
                    <img src={modifyExperience.custom_modified.featuredImgSrc.source_url} alt={modifyExperience.title.rendered} title={modifyExperience.title.rendered}/>
                  </figure>
                </a>
              </Link>
              <em className="" dangerouslySetInnerHTML={{ __html: `${modifyExperience.custom_meta.custom_meta_location}` }} />
            </div>
          </div>)
}



export default CareerTimeline;
