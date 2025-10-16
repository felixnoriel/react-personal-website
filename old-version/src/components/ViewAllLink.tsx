import Link from 'next/link';
import * as React from 'react';

export const ViewAllLink = (route: any, indexPage: boolean = false) => {
    if (!indexPage) {
        return;
    }

    return (
        <div className="btn-view-all-container">
            <Link as={`${route}`} href={`/page?name=${route}`} prefetch>
                <a className="button-view-all is-link">
                    see all <i className="fas fa-arrow-right" />
                </a>
            </Link>
        </div>
    );
};
