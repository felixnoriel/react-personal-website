import React, { PureComponent } from 'react'
import { Link } from '../routes'
import helper from '../helpers/helper';
import Lightbox from 'react-images';
import Gallery from 'react-grid-gallery';
import Tag from './Tag';
import { Experience } from './CareerTimeline';

const ProjectView = ({project}) => {
  if(!project || !project[0]){
    return ''
  }
  const modifyProject = helper.modifyWordpressObject(project[0]);
  return (<section className="section container project-view-container">
            <section className="columns">
              <ProjectInfo className="column project-info is-four-fifths" project={modifyProject}/>
              <ProjectSideInfo className="column project-side-info" company={modifyProject.custom_meta.company} tags={modifyProject.custom_modified.tags}/>
            </section>
            <h2 className="title">Images</h2>
            <section className="columns gallery-lightbox-container is-multiline">
              <GalleryLightboxText project={modifyProject} />
            </section>
          </section>)
}

const ProjectInfo = ({project, className}) => {
    return (<div className={`${className}`}>
              <h1 className="title"  dangerouslySetInnerHTML={{ __html: project.title.rendered}} />
              <figure className="image"><img src={project.custom_modified.featuredImgSrc.source_url} /></figure>
              <div className="content" dangerouslySetInnerHTML={{ __html: project.custom_modified.content }} />
            </div>)
}
const ProjectSideInfo = ({tags, company, className}) => {
    return (<div className={className}>
              <TagList tags={tags} />
              <ProjectCompanyInfo company={company} />
            </div>)
}
const ProjectCompanyInfo = ({company}) => {
  const modifyCompany = helper.modifyWordpressObject(company);
  return (<div>
            <h3 className="subtitle">Company</h3>
            <Link as={modifyCompany.custom_modified.postUrlPath} route={modifyCompany.custom_modified.postUrlPath} prefetch>
              <a> <p>{modifyCompany.title.rendered}</p> </a>
            </Link>
          </div>)
}
const TagList = ({tags, className}) => {
  if(!tags){
    return '';
  }
  const tagsText = tags.map( tag => {
    return <Tag className="project-view" key={tag.id} title={tag.name} />
  })

  return ([<h3 key="taglist-header" className="subtitle">Tech stack</h3>,<div key="taglist-list" className={`tags`}>{tagsText}</div>])
}

const GalleryLightboxText = ({project}) => {
  if(!project.custom_modified.galleryImgs){
    return '';
  }

  return project.custom_modified.galleryImgs.map( gallery => {
    return <GalleryLightbox key={gallery.title} gallery={gallery} />
  })

}

class GalleryLightbox extends PureComponent{
  constructor(){
    super();

    this.state = { currentImage: 0, lightboxIsOpen: false};
    this.closeLightbox = this.closeLightbox.bind(this);
    this.openLightbox = this.openLightbox.bind(this);
    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrevious = this.gotoPrevious.bind(this);
  }

  openLightbox(event, obj) {
     this.setState({
       currentImage: obj.index,
       lightboxIsOpen: true,
     });

   }
   closeLightbox() {
     this.setState({
       currentImage: 0,
       lightboxIsOpen: false,
     });
   }
   gotoPrevious() {
     this.setState({
       currentImage: this.state.currentImage - 1,
     });
   }
   gotoNext() {
     this.setState({
       currentImage: this.state.currentImage + 1,
     });
   }

  render(){
    const { gallery } = this.props;
    return <div id={gallery.type} className="column is-half gallery-lightbox-item">
            <h3 className="subtitle">{gallery.title}</h3>
            <Gallery images={gallery.images}
                     enableImageSelection={false}
                     onClick={this.openLightbox}
                     backdropClosesModal={true}/>

            <Lightbox images={gallery.images}
                  onClose={this.closeLightbox}
                  onClickPrev={this.gotoPrevious}
                  onClickNext={this.gotoNext}
                  showLightboxThumbnails={true}
                  currentImage={this.state.currentImage}
                  isOpen={this.state.lightboxIsOpen}
                />
            </div>
  }
}

export default ProjectView;
