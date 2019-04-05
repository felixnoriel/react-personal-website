import * as React from 'react';

import { modifyWordpressObject } from '../../helpers/helper';
import { Tag } from '../Tag';
import { ViewAllLink } from '../ViewAllLink';
import routes from '../../routes';
const Link = routes.Link;

type ProjectListProps = {
  projects: Array<any>;
  viewType?: string;
  indexPage?: boolean;
}

export const ProjectList: React.SFC<ProjectListProps> = ({projects, viewType, indexPage}) => {
  if(!projects || !projects[0]){ return <div/>};
  return (
      <div>
        <ProjectListHeader viewType={viewType} />
        <section key="project-2" className={`section ${viewType} container projects-container`}>
          { ProjectsListText(projects) }
          { ViewAllLink(projects, indexPage) } 
        </section>
      </div>
  );
}

const ProjectListHeader = ({viewType}) => {
  let title = "Projects";
  let subtitle = "Some of my past work";
  let heroSize = "is-medium";
  if(viewType === 'career'){
    title = "Some projects I've been involved with";
    subtitle = "";
    heroSize = "";
  }
  return (
    <section className={`hero ${heroSize} is-darkturquoise is-long is-bold`}>
        <div className="hero-body">
        <div className="container has-text-centered">
          <h1 className="title"> { title } </h1>
          <h2 className="subtitle"> { subtitle } </h2>
        </div>
      </div>
    </section>
  )
}

const ProjectsListText = (projects: any) => {
  if(!projects || !projects.map){
    return '';
  }
  const projectsText = projects.map( (project: any) => {
    return <Project key={project.id} project={project} />
  });

  return (
    <div className="columns is-multiline">
      { projectsText }
    </div>
  )
}

const getImage = (modifyProject: any) => {
  if(!modifyProject.custom_modified.media || !modifyProject.custom_modified.media.medium){
    return '';
  }
  return modifyProject.custom_modified.media.medium.source_url
}
const Project = ({project}: any) => {
  const modifyProject = modifyWordpressObject(project);

  return (
    <div className="column is-4">
      <Link as={modifyProject.custom_modified.postUrlPath} route={modifyProject.custom_modified.postUrlPath} prefetch>
        <a>
          <div className="project-item">
            <figure className="image">
              <img src={getImage(modifyProject)} 
                  alt={modifyProject.title.rendered} title={modifyProject.title.rendered} />
            </figure>
            <h2 className="title" dangerouslySetInnerHTML={{ __html: modifyProject.title.rendered }} />
            <div className="content">
              <div dangerouslySetInnerHTML={{ __html: modifyProject.excerpt.rendered }} />
            </div>
            { TagList(modifyProject.custom_modified.tags) }
          </div>
        </a>
      </Link>
    </div>
    )

}

const TagList = (tags: any) => {
  if(!tags){
    return '';
  }
  const tagsText = tags.map( (tag: any, index: number) => {
    return Tag(tag.name, index);
  })

  return (
    <div className="tags">
      { tagsText }
    </div>
  )
}
