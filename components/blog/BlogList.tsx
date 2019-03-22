import ViewAllLink from '../ViewAllLink';
import { Link } from '../../routes'
import helper from '../../helpers/helper';

const BlogList = ({blogList, indexPage}) => {

  return ([<section id="blog-section" key="blog-1" className="section-container-default is-light hero has-text-centered ">
              <div className="hero-body">
                <div className="container">
                  <h1 className="title">Blog</h1>
                  <h2 className="subtitle">I am also a foodie and love traveling</h2>
                </div>
              </div>
            </section>,
            <section key="blog-2" className="section blog-list-container">
              <div className="container">
                <div className="columns is-multiline ">
                  <BlogListText blogList={blogList} />
                </div>
                <ViewAllLink route="blog" indexPage={indexPage} />
              </div>
            </section>])
}

const BlogListText = ({blogList}) => {
  if(!blogList || !blogList.map){
    return '';
  }

  return blogList.map( blog => {
    return (<BlogText key={blog.id} blog={blog} />)
  })
}

export const BlogText = ({blog}) => {
  const modifyBlog = helper.modifyWordpressObject(blog);

  //<Link as={modifyBlog.custom_modified.postUrlPath} route={modifyBlog.custom_modified.postUrlPath} prefetch><a>
  return (<div className="column is-4">
            <div className="blog-item">
              <Link as={modifyBlog.custom_modified.postUrlPath} route={modifyBlog.custom_modified.postUrlPath} prefetch><a>
                <figure className="blog-image">
                    <img className="image" alt={modifyBlog.title.rendered} title={modifyBlog.title.rendered}
                         src={modifyBlog.custom_modified.media.medium.source_url} />
                </figure>
                <div className="blog-content">
                  <p className="title" dangerouslySetInnerHTML={{ __html: modifyBlog.title.rendered }} />
                  <div className="content" dangerouslySetInnerHTML={{ __html: modifyBlog.excerpt.rendered }} />
                </div>
                <p className="is-link btn-read-more">Read More<i className="fas fa-arrow-right "></i></p>
                </a>
              </Link>
            </div>
          </div>
            )
}

export default BlogList;
