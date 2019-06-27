import * as React from 'react';

export const AboutWebsite = () => {
    return (
        <section className="section container about-website-section">
            <h2 className="title">About me</h2>
            <div className="content">
                <ul className="">
                    <li>
                        I'm a <strong>Senior Software Engineer</strong> based in Sydney, Australia
                    </li>
                    <li>
                        When I'm not in front of my computer, I like to cook, trying out different restaurants and
                        cuisines, and traveling every once in a while
                    </li>
                </ul>
            </div>

            <h2 className="title">About this website</h2>
            <p>
                Developed by <strong>Felix Noriel</strong>
            </p>
            <h2 className="subtitle">Front end</h2>
            <ul>
                <li>
                    <strong>ReactJs</strong> and <strong>NextJs(SSR)</strong> for front end framework
                </li>
                <li>
                    <strong>Redux</strong> for state management
                </li>
                <li>
                    <strong>Typescript</strong>
                </li>
                <li>
                    <strong>Bulma, HTML & CSS 3</strong> for Responsive Design
                </li>
                <li>
                    <strong>Webpack</strong> for bundling/running assets
                </li>
            </ul>

            <h2 className="subtitle">Back end</h2>
            <ul>
                <li>
                    <strong>Wordpress</strong> for CMS
                </li>
                <li>
                    <strong>Wordpress API</strong> for all API payload
                </li>
                <li>
                    <strong>PHP</strong> as main back end OOP language
                </li>
                <li>
                    <strong>NodeJs</strong> server to run application
                </li>
                <li>
                    <strong>MySQL</strong> for RDBMS
                </li>
            </ul>

            <h2 className="subtitle">Hosted on Zeit platform</h2>
        </section>
    );
};
