import React, { PureComponent } from 'react';
import { Link } from '../routes'
import helper from '../helpers/helper';
import Tag from './Tag';
import ViewAllLink from './ViewAllLink';

class ProjectList extends PureComponent {

 render() {
  const { projects, indexPage, viewType } = this.props;

  if(!projects || projects.length <= 0){
    return '';
  }
  return (
   [<ProjectListHeader key="project-1" viewType={viewType} />,
   <section key="project-2" className={`section ${viewType} container projects-container`}>
      <ProjectsListText projects={projects} />
      <ViewAllLink route="projects" indexPage={indexPage} />
   </section>]
  );
 }
}

const ProjectListHeader = ({viewType}) => {
  let title = "Projects";
  let subtitle = "Some of my past work";
  let heroSize = "is-medium";
  if(viewType == 'career'){
    title = "Some projects I've been involved with";
    subtitle = "";
    heroSize = "";
  }
  return (<section id="projects-section" className={`hero ${heroSize} is-darkturquoise is-long is-bold`}>
            <div className="hero-body">
            <div className="container has-text-centered">
              <h1 className="title"> { title } </h1>
              <h2 className="subtitle"> { subtitle } </h2>
            </div>
          </div>
        </section>)
}



const ProjectsListText = ({projects}) => {
  if(!projects || !projects.map){
    return '';
  }
  const projectsText = projects.map( project => {
    return <Project key={project.id} project={project} />
  });

  return (<div className="columns is-multiline">{projectsText}</div>)
}

const Project = ({project}) => {
  const modifyProject = helper.modifyWordpressObject(project);
  return (<div className="column is-4">
            <Link as={modifyProject.custom_modified.postUrlPath} route={modifyProject.custom_modified.postUrlPath} prefetch>
              <a>
                <div className="project-item">
                  <figure className="image">
                    <img src={modifyProject.custom_modified.media.medium.source_url} 
                        alt={modifyProject.title.rendered} title={modifyProject.title.rendered} />
                  </figure>
                  <h2 className="title" dangerouslySetInnerHTML={{ __html: modifyProject.title.rendered }} />
                  <div className="content">
                    <div dangerouslySetInnerHTML={{ __html: modifyProject.excerpt.rendered }} />
                  </div>
                  <TagList tags={modifyProject.custom_modified.tags}/>
                </div>
              </a>
            </Link>
          </div>)

}

const TagList = ({tags}) => {
  if(!tags){
    return '';
  }
  const tagsText = tags.map( tag => {
    return <Tag key={tag.id} title={tag.name} />
  })

  return (<div className="tags">{tagsText}</div>)
}



export default ProjectList;
