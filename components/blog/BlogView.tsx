import * as React from 'react';
import { modifyWordpressObject } from '../../helpers/helper';
import routes from '../../routes';
const Link = routes.Link;

type BlogViewProps = {
  blog: any;
}
export const BlogView: React.SFC<BlogViewProps> = ({blog}) => {
  if(!blog || !blog[0]){ return <div/>};
  const modifyBlog = modifyWordpressObject(blog[0]);
  return (
      <section>
        <section id="blog-section" className="container blog-view-banner">
            <h1 className="title has-text-centered" dangerouslySetInnerHTML={{ __html: modifyBlog.title.rendered }} />
            <h2 className="subtitle has-text-centered" dangerouslySetInnerHTML={{ __html: modifyBlog.excerpt.rendered }} />
              <img className="image"
                   src={modifyBlog.custom_modified.featuredImgSrc.source_url} 
                   alt={modifyBlog.title.rendered} title={modifyBlog.title.rendered}/>
              <div className="info">
              </div>
          </section>
          <section className="blog-view-content">
            <div className="container">
              <div className="content" dangerouslySetInnerHTML={{ __html: modifyBlog.content.rendered }} />
              <SharePost blog={modifyBlog}/>
              <div className="back-to-blog">
                <Link as={`blog`} route={`/blog`} prefetch>
                  <a className=""><i className="fas fa-arrow-left"></i>Back to blog</a>
                </Link>
              </div>
            </div>
        </section>
      </section>
  )
}

const SharePost = ({blog}: any) => {
  return (
    <div className="social-share">
      <p className="subtitle">Share this post</p>
      <ul className="level is-mobile">
        <li className="level-item">
          <a className="fb-bg" onClick={ ()=>{
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + location.href, 'sharer', 'width=626,height=436');
          } } href="javascript: void(0)" target="_blank" >
              <i className="fab fa-facebook-f"></i>
          </a>
        </li>
        <li className="level-item">
          <a className="twitter-bg"
              onClick={ () => {
                window.open('https://twitter.com/share?url=' + location.href + '&text=' + blog.title.rendered, 'sharer', 'width=626,height=436');
              } } href="javascript: void(0)" target="_blank">
              <i data-type="twitter" className="fab fa-twitter"></i>
          </a>
        </li>
        <li className="level-item">
          <a className="linkedin-bg"
              onClick={ ()=> {
                window.open('https://www.linkedin.com/shareArticle?mini=true&url=' + location.href, 'sharer', 'width=626,height=436');
              } } href="javascript: void(0)" target="_blank">
              <i data-type="linkedin" className="fab fa-linkedin-in"></i>
          </a>
        </li>
        <li className="level-item">
          <a className="google-plus-bg"
              onClick={ ()=> {
                window.open('https://plus.google.com/share?url=' + location.href, 'sharer', 'width=626,height=436');
              }} href="javascript: void(0)" target="_blank">
              <i data-type="googleplus" className="fab fa-google-plus-g"></i>
          </a>
        </li>

      </ul>
    </div>
  )
}
