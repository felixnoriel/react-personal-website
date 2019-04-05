import * as React from 'react'

import { modifyWordpressObject } from '../../helpers/helper';
import { ProjectList } from '../project/ProjectList';

import routes from '../../routes';
const Link = routes.Link;

type CareerViewProps = {
  experience: any;
  projects: Array<any>;
}

export const CareerView: React.SFC<CareerViewProps> = ({experience, projects}) => {
  return (
    <div>
      <section key="career-view-1" className="section career-view-container">
        <CareerInfo experience={experience} />
      </section>
      <ProjectList projects={projects} viewType="career"/>
    </div>
  );
}

type CareerInfoProps = {
  experience: any
}
const CareerInfo = ({ experience }: CareerInfoProps) => {
  if(!experience || !experience[0]){
    return <div />;
  }
  const modifyExperience = modifyWordpressObject(experience[0]);
  return (
    <div className="container">
      <div className="has-text-centered">
        <h1 className="title " 
          dangerouslySetInnerHTML={{ __html: `${modifyExperience.custom_meta.custom_meta_job_title}, ${modifyExperience.title.rendered}` }} 
        />
        <h2 className="subtitle">
          {modifyExperience.custom_meta.custom_meta_start_date} - {modifyExperience.custom_meta.custom_meta_end_date}
        </h2>
        <figure className="company-logo image">
          <img src={modifyExperience.custom_modified.featuredImgSrc.source_url}
              alt={modifyExperience.title.rendered} title={modifyExperience.title.rendered} />
        </figure>
        <em className="" dangerouslySetInnerHTML={{ __html: `${modifyExperience.custom_meta.custom_meta_location}` }} />
      </div>
      <div className="content" dangerouslySetInnerHTML={{ __html: modifyExperience.custom_modified.content }} />
    </div>
  )
}
