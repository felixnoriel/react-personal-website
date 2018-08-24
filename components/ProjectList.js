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
    title = "Projects I've been involved with";
    subtitle = "";
    heroSize = "";
  }
  return (<section id="projects-section" className={`hero ${heroSize} is-darkblue is-long is-bold`}>
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
    return 'Loading projects';
  }
  return projects.map( project => {
    return <Project key={project.id} project={project} />
  });
}

const Project = ({project}) => {
  const modifyProject = helper.modifyWordpressObject(project);
  return (<Link as={modifyProject.custom_modified.postUrlPath} route={modifyProject.custom_modified.postUrlPath} prefetch>
           <a>
            <div className="box columns project-item">
              <figure className="column is-one-fifth">
                <p className="image">
                  <img src={modifyProject.custom_modified.featuredImgSrc.source_url} />
                </p>
              </figure>
              <div className="column">
                <div className="content">
                  <h2 dangerouslySetInnerHTML={{ __html: modifyProject.title.rendered }} />
                  <TagList tags={modifyProject.custom_modified.tags}/>
                  <div dangerouslySetInnerHTML={{ __html: modifyProject.excerpt.rendered }} />
                </div>
              </div>
             </div>
            </a>
          </Link>)

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
