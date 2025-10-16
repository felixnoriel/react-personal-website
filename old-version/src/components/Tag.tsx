import * as React from 'react';

export const Tag = (title: string, key: any, className?: string) => {
    return <p key={key} className={`tag ${className}`} dangerouslySetInnerHTML={{ __html: title }} />;
};
