import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { action as toggleMenu } from 'redux-burger-menu';
import { elastic as Menu } from 'react-burger-menu'
import { Link, Router } from '../routes'
import NProgress from 'nprogress'
import Head from 'next/head';
import helper from '../helpers/helper';

Router.onRouteChangeStart = (url) => {
  NProgress.start()
}
Router.onRouteChangeComplete = () => {
  NProgress.done();
}
Router.onRouteChangeError = () => NProgress.done()

class HeaderContainer extends PureComponent {
  //Router.onRouteChangeComplete = () => NProgress.done()
   constructor(props){
     super(props);
     this.state = {
       showBurgerMenu: false
     }
     this.bmChangeState = this.bmChangeState.bind(this);
   }

   bmChangeState(state){
     this.props.toggleMenu(state.isOpen);
     return state.isOpen;
   }

   componentDidMount(){
     document.addEventListener('scroll', () => {
         let windowPosition = window.pageYOffset;
         if(windowPosition >= 300){
           this.setState({
             showBurgerMenu: true
           })
         }else{
           this.setState({
             showBurgerMenu: false
           })
         }
     });
   }

   componentWillUnmount(){
    document.removeEventListener('scroll', ()=>{});
   }

   render() {
     const { burgerMenu, reducer } = this.props;
     const { showBurgerMenu } = this.state;
     //const hasFadeIn = showBurgerMenu ? '' : 'hide'; - enable during production
     const hasFadeIn = showBurgerMenu ? '' : '';
     return (
        [ <HeadCustom blog={reducer.blog} key="header-1"/>,
          <MenuSidebar key="header-2" bmChangeState={this.bmChangeState} burgerMenu={burgerMenu}/>,
          <section key="header-3"  className={`${hasFadeIn} fade-in top-nav-container`}>
            <p className="btn-burger-menu pointer" onClick={()=>{this.props.toggleMenu(true)}}>
              <i className="fa fas fa-bars"></i>
            </p>
          </section>]
    );
 }
}
const HeadCustom = ({blog}) => {


  let metaDescription = "I am a Software Engineer who loves food, traveling and cooking!";
  let metaTitle = "Felix Noriel";

  let ogType = "blog";
  let ogImg = "";
  let ogSiteName = "";
  let ogUpdatedTime = "";
  let publishedTime = "";
  let ogUrl = "felixnoriel.com";

  if(blog && blog[0]){
    const modifyBlog = helper.modifyWordpressObject(blog[0]);
    metaDescription = modifyBlog.excerpt.rendered;
    metaTitle = modifyBlog.title.rendered;
    ogImg = modifyBlog.custom_modified.featuredImgSrc.source_url;
    ogUpdatedTime = modifyBlog.modified;
    ogUrl = modifyBlog.custom_modified.postUrlPath;
    ogType = "article";
    publishedTime = modifyBlog.custom_modified.date;
  }

  return <Head>
          <title>{metaTitle}</title>
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
          <meta name="author" content="Felix Noriel" itemProp="author" />
          <meta name="dcterms.rightsHolder" content="Felix Noriel"/>
          <meta name="robots" content="index, follow" />
          <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
          <meta name="dc.language" content="en-US" />

          <meta name="description" content={metaDescription} />
          <meta property="og:locale" content="en_AU" />
          <meta property="og:type" content={ogType} />
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:image" content={ogImg} />
          <meta property="og:url" content={ogUrl} />
          <meta property="og:site_name" content="felix noriel" />
          <meta property="og:updated_time" content={ogUpdatedTime} />

          <meta name="twitter:site" content="felixnoriel.com" />
          <meta name="twitter:title" content={metaTitle} />
          <meta name="twitter:image" itemProp="image" content={ogImg} />
          <meta name="twitter:card" content="summary_large_image" />

          <meta property="article:publisher" content="Felix Noriel" />
          <meta property="article:published_time" content={publishedTime} />
          <meta property="article:modified_time" content={ogUpdatedTime} />
          <meta property="article:tag" content="blog, article" />
          <meta property="article:section" content="blog" />

          <link rel="canonical" href={ogUrl}/>
         </Head>
}

const MenuSidebar = ({burgerMenu, bmChangeState}) => {
  //<button onClick={()=>{Router.pushRoute('/projects')}} className="button">test projects</button>
  return (<Menu
            right
            isOpen={ burgerMenu.isOpen }
            customBurgerIcon={ false }
            onStateChange={ bmChangeState }>
              <Link as="/" href='/' prefetch>
                <a>Home</a>
              </Link>
              <Link as="projects" route='/projects' prefetch>
                <a>Projects</a>
              </Link>
              <Link as="career" route='/career' prefetch>
                <a>Career</a>
              </Link>
              <Link as="blog" route='/blog' prefetch>
                <a>Blog</a>
              </Link>
           </Menu>)
}

const mapStateToProps = state => ({
 ...state
})
const mapDispatchToProps = dispatch => ({
  toggleMenu: (isOpen) => dispatch(toggleMenu(isOpen))
})

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContainer);