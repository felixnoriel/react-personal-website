import * as React from 'react';

export const Skills = () => {
    return (
        <div>
            <section id="skills-section" className="hero is-medium is-primary is-long is-bold">
                <div className="hero-body">
                    <div className="container has-text-centered">
                        <h1 className="title">I have over six years experience as a Full-Stack Software Engineer</h1>
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
                            <li>ReactJs</li>
                            <li>TypeScript</li>
                            <li>JavaScript</li>
                            <li>EcmaScript</li>
                            <li>AngularJs</li>
                            <li>JQuery</li>
                        </ul>
                        <h4 className="list-title">Responsive design</h4>
                        <ul>
                            <li>HTML 5 & CSS 3 (SASS)</li>
                            <li>Flexbox, Grid Layout</li>
                            <li>Bulma, Ant Design, Bootstrap</li>
                        </ul>
                        <h4 className="list-title">Build/Running tools</h4>
                        <ul>
                            <li>Webpack</li>
                        </ul>
                    </div>
                    <div className="column ">
                        <p className="skills-icon">
                            <i className="fas fa-code-branch" />
                        </p>
                        <h2 className="title is-size-4 is-spaced">Back end </h2>
                        <h4 className="list-title">OOP languages</h4>
                        <ul>
                            <li>NodeJs</li>
                            <li>PHP</li>
                            <li>Java</li>
                            <li>.NET, C#</li>
                        </ul>
                        <h4 className="list-title">Microservices</h4>
                        <ul>
                            <li>Opentracing, Jaeger Tracing</li>
                            <li>Prometheus for monitoring</li>
                        </ul>

                        <h4 className="list-title">DB/Storage</h4>
                        <ul>
                            <li>MySQL</li>
                            <li>PostgreSQL</li>
                            <li>MSSQL</li>
                        </ul>
                    </div>
                    <div className="column ">
                        <p className="skills-icon">
                            <i className="fas fa-terminal" />
                        </p>
                        <h2 className="title is-size-4 is-spaced">Dev Ops </h2>
                        <h4 className="list-title">AWS Services</h4>
                        <ul>
                            <li>EC2 Instance</li>
                            <li>API Gateway</li>
                            <li>VPC, Route53</li>
                            <li>Cloudfront</li>
                            <li>Elastic Load Balancing</li>
                            <li>S3 Bucket</li>
                        </ul>

                        <h4 className="list-title">Google Cloud Services</h4>
                        <h4 className="list-title">Containers</h4>
                        <ul>
                            <li>Docker</li>
                        </ul>
                        <h4 className="list-title">Server Management</h4>
                        <ul>
                            <li>Linux, Ubuntu</li>
                            <li>Web servers like Apache, NGINX</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
};
