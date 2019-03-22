import React, { PureComponent } from 'react'
import { Link } from '../../routes'
import helper from '../../helpers/helper';
import ProjectList from '../ProjectList';

const CareerView = ({experience, projects}) => {
  return ([<section key="career-view-1" className="section career-view-container">
            <CareerInfo experience={experience} />
          </section>,
          <ProjectList key="career-view-2" viewType="career" projects={projects} />])
}

const CareerInfo = ({ experience }) => {
  const modifyExperience = helper.modifyWordpressObject(experience[0]);

  return (<div className="container">
            <div className="has-text-centered">
              <h1 className="title " dangerouslySetInnerHTML={{ __html: `${modifyExperience.custom_meta.custom_meta_job_title}, ${modifyExperience.title.rendered}` }} />
              <h2 className="subtitle">{modifyExperience.custom_meta.custom_meta_start_date} - {modifyExperience.custom_meta.custom_meta_end_date}</h2>
              <figure className="company-logo image">
                <img src={modifyExperience.custom_modified.featuredImgSrc.source_url}
                    alt={modifyExperience.title.rendered} title={modifyExperience.title.rendered} />
              </figure>
              <em className="" dangerouslySetInnerHTML={{ __html: `${modifyExperience.custom_meta.custom_meta_location}` }} />
            </div>
            <div className="content" dangerouslySetInnerHTML={{ __html: modifyExperience.custom_modified.content }} />
          </div>)
}

export default CareerView;
