import Link from 'next/link';
import * as React from 'react';
import { Socials } from '../components/Socials';

export const FooterContainer = () => {
    return (
        <div>
            <section className="section container contact-container has-text-centered">
                <div className="box hero is-dark2">
                    <div className="columns level">
                        <div className="column level-item">
                            <h2 className="title">Connect with me</h2>
                        </div>
                        <div className="column level-item">
                            <h2 className="subtitle">You can follow me or just send a message and say Hello</h2>
                        </div>
                        <div className="column level-item">
                            <a
                                className="button btn-message-me is-outlined is-rounded is-medium"
                                href="mailto:jrnoriel_56@yahoo.com"
                            >
                                Message me
                            </a>
                        </div>
                    </div>
                </div>
            </section>
            <footer className="hero footer section is-primary is-small">
                <div className="container has-text-centered">
                    <div className="content">
                        <Socials />
                        <p className="made-with">
                            <Link as={`/about`} href={`/page?name=about`} prefetch>
                                <a>About this website</a>
                            </Link>
                        </p>
                        <p className="copyright">
                            Created by Felix Noriel <i className="far fa-copyright" /> 2019
                        </p>
                    </div>
                </div>
                <script defer src="https://use.fontawesome.com/releases/v5.1.0/js/all.js" />
            </footer>
        </div>
    );
};
