import * as React from 'react';
import { Link } from 'react-scroll';

export const Intro = () => {
    return (
        <section className="hero is-fullheight">
            <div className="hero-body">
                <div className="intro container">
                    <h1 className="title">
                        Hello, my name is <strong className="shadow pink">Felix Noriel</strong>
                    </h1>
                    <h2 className="subtitle">
                        {' '}
                        I am a <span className="shadow success">Software Engineer</span> who loves{' '}
                        <span className="shadow info">solving problems</span> and getting my hands dirty with{' '}
                        <span className="shadow purple">new technologies</span>. Outside work, I'm a{' '}
                        <span className="shadow pink">big foodie</span>, loves cooking and traveling every once in a
                        while.
                    </h2>
                    <p className="learn-more">
                        Learn more about me
                        <Link className="btn-learn-more" to="skills-section" smooth={true} duration={500}>
                            <i className="fas fa-arrow-down"></i>
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
};
