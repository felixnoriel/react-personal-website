import * as React from 'react';

export const Tag = (title: string, className?: string) => {
  return (<p className={`tag ${className}`} dangerouslySetInnerHTML={{ __html: title }} />)
}
