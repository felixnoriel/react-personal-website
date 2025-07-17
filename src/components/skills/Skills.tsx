import * as React from 'react';

export const Skills = () => {
    return (
        <div>
            <section id="skills-section" className="hero is-medium is-primary is-long is-bold">
                <div className="hero-body">
                    <div className="container has-text-centered">
                        <h1 className="title">I have over 12 years of experience as a Full-Stack Software Engineer</h1>
                        <h2 className="subtitle">
                            Strategising, designing, and developing big scalable applications from end to end
                        </h2>
                    </div>
                </div>
            </section>
            <section className="section container skills-content has-text-centered">
                <div className="columns box">
                    <div className="column ">
                        <p className="skills-icon">
                            <i className="far fa-file-code" />
                        </p>
                        <h2 className="title is-size-4 is-spaced">Front end</h2>
                        <h4 className="list-title">frameworks</h4>
                        <ul>
                            <li>React, Next.js</li>
                            <li>Vite</li>
                            <li>GraphQL</li>
                            <li>Tailwind</li>
                            <li>Storybook</li>
                        </ul>
                    </div>
                    <div className="column ">
                        <p className="skills-icon">
                            <i className="fas fa-code-branch" />
                        </p>
                        <h2 className="title is-size-4 is-spaced">Back end </h2>
                        <h4 className="list-title">languages</h4>
                        <ul>
                            <li>Node (NestJS, Express, Koa)</li>
                            <li>Convex</li>
                        </ul>
                        <h4 className="list-title">Database</h4>
                        <ul>
                            <li>MySQL</li>
                            <li>PostgreSQL</li>
                            <li>Firebase</li>
                            <li>DocumentDB</li>
                        </ul>
                    </div>
                    <div className="column ">
                        <p className="skills-icon">
                            <i className="fas fa-terminal" />
                        </p>
                        <h2 className="title is-size-4 is-spaced">DevOps</h2>
                        <ul>
                            <li>AWS</li>
                            <li>Google Cloud</li>
                            <li>CircleCI</li>
                            <li>Vercel</li>
                            <li>Github Actions</li>
                            <li>Docker</li>
                            <li>Serverless</li>
                        </ul>
                        <h4 className="list-title">Observability</h4>
                        <ul>
                            <li>Sentry</li>
                            <li>New Relic</li>
                        </ul>
                        <h2 className="title is-size-4 is-spaced">Caching</h2>
                        <ul>
                            <li>Redis</li>
                            <li>Typesense</li>
                            <li>Algolia</li>
                            <li>Elasticache</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
};
