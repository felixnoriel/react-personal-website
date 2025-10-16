import * as React from 'react';
import { modifyWordpressObject } from '../../helpers/helper';
import { Tag } from '../Tag';
// @ts-ignore
import Lightbox from 'react-images';
import Link from 'next/link';
// @ts-ignore
import Gallery from 'react-grid-gallery';
import './Project.scss';

type ProjectViewProps = {
    project: any;
    className?: string;
};

export const ProjectView: React.SFC<ProjectViewProps> = ({ project }) => {
    if (!project || !project[0]) {
        return <div />;
    }

    const modifyProject = modifyWordpressObject(project[0]);

    return (
        <section className="section container project-view-container">
            <section className="columns">
                <ProjectInfo className="column project-info is-four-fifths" project={modifyProject} />
                <ProjectSideInfo
                    className="column project-side-info"
                    company={modifyProject.custom_meta.company}
                    tags={modifyProject.custom_modified.tags}
                />
            </section>
            <h2 className="title">Images</h2>
            <section className="columns gallery-lightbox-container is-multiline">
                <GalleryLightboxText project={modifyProject} />
            </section>
        </section>
    );
};

const ProjectInfo = ({ project, className }: ProjectViewProps) => {
    return (
        <div className={`${className}`}>
            <h1 className="title" dangerouslySetInnerHTML={{ __html: project.title.rendered }} />
            <figure className="image">
                <img
                    alt={project.title.rendered}
                    title={project.title.rendered}
                    src={project.custom_modified.featuredImgSrc.source_url}
                />
            </figure>
            <div className="content" dangerouslySetInnerHTML={{ __html: project.custom_modified.content }} />
        </div>
    );
};

const ProjectSideInfo = ({ tags, company, className }: any) => {
    return (
        <div className={className}>
            {TagList(tags, className)}
            {ProjectCompanyInfo(company)}
        </div>
    );
};

const ProjectCompanyInfo = (company: any) => {
    if (!company) {
        return <div />;
    }
    const modifyCompany = modifyWordpressObject(company);
    return (
        <div>
            <h3 className="subtitle">Company</h3>
            <Link
                as={modifyCompany.custom_modified.postUrlPath}
                href={`/page?name=career&slug=${modifyCompany.slug}`}
                prefetch
            >
                <a>
                    {' '}
                    <p>{modifyCompany.title.rendered}</p>{' '}
                </a>
            </Link>
        </div>
    );
};

const TagList = (tags: any[], className: any) => {
    if (!tags || !tags.map) {
        return '';
    }
    const tagsText = tags.map((tag: any, index: number) => {
        return Tag(tag.name, index);
    });

    return (
        <div>
            <h3 className="subtitle">Tech stack</h3>
            <div className={`tags`}>{tagsText}</div>
        </div>
    );
};

const GalleryLightboxText = ({ project }: any) => {
    if (!project.custom_modified.galleryImgs) {
        return <div />;
    }

    return project.custom_modified.galleryImgs.map((gallery: any, index: number) => {
        return <GalleryLightbox key={index} gallery={gallery} />;
    });
};

type GalleryLightboxProps = {
    key: any;
    gallery: any;
};
class GalleryLightbox extends React.Component<GalleryLightboxProps> {
    public state: {
        currentImage: number;
        lightboxIsOpen: boolean;
    };
    constructor(props: any) {
        super(props);

        this.state = {
            currentImage: 0,
            lightboxIsOpen: false,
        };
        this.closeLightbox = this.closeLightbox.bind(this);
        this.openLightbox = this.openLightbox.bind(this);
        this.gotoNext = this.gotoNext.bind(this);
        this.gotoPrevious = this.gotoPrevious.bind(this);
    }

    private openLightbox(event: any, obj: any) {
        this.setState({
            currentImage: obj.index,
            lightboxIsOpen: true,
        });
    }
    private closeLightbox() {
        this.setState({
            currentImage: 0,
            lightboxIsOpen: false,
        });
    }
    private gotoPrevious() {
        this.setState({
            currentImage: this.state.currentImage - 1,
        });
    }
    private gotoNext() {
        this.setState({
            currentImage: this.state.currentImage + 1,
        });
    }

    public render() {
        const { gallery }: any = this.props;
        return (
            <div id={gallery.type} className="column is-half gallery-lightbox-item">
                <h3 className="subtitle">{gallery.title}</h3>
                <Gallery
                    images={gallery.images}
                    enableImageSelection={false}
                    onClick={this.openLightbox}
                    backdropClosesModal={true}
                />

                <Lightbox
                    images={gallery.images}
                    onClose={this.closeLightbox}
                    onClickPrev={this.gotoPrevious}
                    onClickNext={this.gotoNext}
                    showLightboxThumbnails={true}
                    currentImage={this.state.currentImage}
                    isOpen={this.state.lightboxIsOpen}
                />
            </div>
        );
    }
}
