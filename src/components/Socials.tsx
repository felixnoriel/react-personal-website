import * as React from 'react';

export const Socials = () => {
    return (
        <p className="socials">
            <a target="_blank" href="https://www.linkedin.com/in/felixnoriel/">
                <span className="social-item">
                    <i className="fab fa-linkedin-in" />
                </span>
            </a>
            <a target="_blank" href="https://github.com/felixnoriel">
                <span className="social-item">
                    <i className="fab fa-github" />
                </span>
            </a>
            <a target="_blank" href="https://www.facebook.com/felixnoriel">
                <span className="social-item">
                    <i className="fab fa-facebook-f" />
                </span>
            </a>
            <a target="_blank" href="https://www.instagram.com/felixnoriel/">
                <span className="social-item">
                    <i className="fab fa-instagram" />
                </span>
            </a>
        </p>
    );
};
