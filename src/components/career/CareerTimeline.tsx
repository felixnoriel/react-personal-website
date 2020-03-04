import * as React from 'react';
import { modifyWordpressObject } from '../../helpers/helper';
import { ViewAllLink } from '../ViewAllLink';
import Link from 'next/link';
import './Career.scss';

type CareerTimelineProps = {
    experiences: any[];
    indexPage?: boolean;
};

export const CareerTimeline: React.SFC<CareerTimelineProps> = ({ experiences, indexPage }) => {
    return (
        <section>
            <section id="career-section" className="hero has-text-centered  is-bold">
                <div className="hero-body">
                    <div className="container">
                        <h1 className="title">Career Timeline</h1>
                        <h2 className="subtitle">Companies I have been a part of</h2>
                    </div>
                </div>
            </section>
            <section className="section container section-container-default timeline-container">
                <ExperienceList experiences={experiences} />
                {ViewAllLink('career', indexPage)}
            </section>
        </section>
    );
};

type ExperiencesListProps = {
    experiences: any[];
};
const ExperienceList = ({ experiences }: ExperiencesListProps) => {
    if (!experiences || experiences.length === 0) {
        return <div />;
    }
    return (
        <div className="timeline is-centered">
            <header className="timeline-header">
                <span className="tag tag-laptop is-medium is-dark">
                    <i className="fas fa-laptop" />
                </span>
            </header>
            {experiences.map((exp: any, index: number) => (
                <Experience key={index} experience={exp} />
            ))}
        </div>
    );
};

type ExperienceProps = {
    experience: any;
};
export const Experience = ({ experience }: ExperienceProps) => {
    if (!experience) {
        return <div />;
    }
    const modifyExperience = modifyWordpressObject(experience);
    return (
        <div className="timeline-item is-dark ">
            <div className="timeline-marker is-dark" />
            <div className="timeline-content">
                <Link
                    as={modifyExperience.custom_modified.postUrlPath}
                    href={`/page?name=career&slug=${modifyExperience.slug}`}
                >
                    <a>
                        <p
                            className="heading heading-1"
                            dangerouslySetInnerHTML={{
                                __html: `${modifyExperience.custom_meta.custom_meta_job_title} | ${modifyExperience.title.rendered}`,
                            }}
                        />
                        <p className="heading">
                            {modifyExperience.custom_meta.custom_meta_start_date} -{' '}
                            {modifyExperience.custom_meta.custom_meta_end_date}
                        </p>
                    </a>
                </Link>
                <Link
                    as={modifyExperience.custom_modified.postUrlPath}
                    href={`/page?name=career&slug=${modifyExperience.slug}`}
                >
                    <a>
                        <figure className="image company-logo">
                            <img
                                src={modifyExperience.custom_modified.featuredImgSrc.source_url}
                                alt={modifyExperience.title.rendered}
                                title={modifyExperience.title.rendered}
                            />
                        </figure>
                    </a>
                </Link>
                <em
                    className=""
                    dangerouslySetInnerHTML={{ __html: `${modifyExperience.custom_meta.custom_meta_location}` }}
                />
            </div>
        </div>
    );
};
