import * as React from 'react';
import { ViewAllLink } from '../ViewAllLink';
import { modifyWordpressObject } from '../../helpers/helper';
import Link from 'next/link';
import './Blog.scss';

type BlogListProps = {
    blogList: any[];
    indexPage?: boolean;
};

export const BlogList: React.SFC<BlogListProps> = ({ blogList, indexPage }) => {
    return (
        <div>
            <section
                id="blog-section"
                key="blog-1"
                className="section-container-default is-light hero has-text-centered "
            >
                <div className="hero-body">
                    <div className="container">
                        <h1 className="title">Blog</h1>
                        <h2 className="subtitle">I am also a foodie and love traveling</h2>
                    </div>
                </div>
            </section>
            <section key="blog-2" className="section blog-list-container">
                <div className="container">
                    <BlogListText blogList={blogList} />
                    {ViewAllLink('blog', indexPage)}
                </div>
            </section>
        </div>
    );
};

type BlogListTextProps = {
    blogList: any[];
};
const BlogListText = ({ blogList }: BlogListTextProps) => {
    if (!blogList || !blogList.map) {
        return <div />;
    }
    return (
        <div className="columns is-multiline">
            {blogList.map((blog: any, index: number) => {
                return <BlogText key={index} blog={blog} />;
            })}
        </div>
    );
};

export const BlogText = ({ blog }: any) => {
    if (!blog) {
        return <div />;
    }
    const modifyBlog = modifyWordpressObject(blog);

    return (
        <div className="column is-4">
            <div className="blog-item">
                <Link
                    as={modifyBlog.custom_modified.postUrlPath}
                    href={`/page?name=blog&slug=${modifyBlog.slug}`}
                    prefetch
                >
                    <a>
                        <figure className="blog-image">
                            <img
                                className="image"
                                alt={modifyBlog.title.rendered}
                                title={modifyBlog.title.rendered}
                                src={modifyBlog.custom_modified.media.medium.source_url}
                            />
                        </figure>
                        <div className="blog-content">
                            <p className="title" dangerouslySetInnerHTML={{ __html: modifyBlog.title.rendered }} />
                            <div
                                className="content"
                                dangerouslySetInnerHTML={{ __html: modifyBlog.excerpt.rendered }}
                            />
                        </div>
                        <p className="is-link btn-read-more">
                            View
                            <i className="fas fa-arrow-right " />
                        </p>
                    </a>
                </Link>
            </div>
        </div>
    );
};
