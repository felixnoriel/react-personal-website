import * as React from 'react';

export const Socials = () => {
    return (
        <p className="socials">
            <a target="_blank" href="https://www.linkedin.com/in/felixnoriel/">
                <span className="social-item">
                    <i className="fab fa-linkedin-in"></i>
                </span>
            </a>
            <a target="_blank" href="https://github.com/felixnoriel">
                <span className="social-item">
                    <i className="fab fa-github"></i>
                </span>
            </a>
            <a target="_blank" href="https://www.facebook.com/felixnoriel">
                <span className="social-item">
                    <i className="fab fa-facebook-f"></i>
                </span>
            </a>
            <a target="_blank" href="https://www.instagram.com/felixnoriel/">
                <span className="social-item">
                    <i className="fab fa-instagram"></i>
                </span>
            </a>
        </p>
    );
};
