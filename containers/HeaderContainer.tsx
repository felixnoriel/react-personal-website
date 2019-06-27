import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '../store';
import { action as toggleMenu } from 'redux-burger-menu';
import { elastic as Menu } from 'react-burger-menu';
import { Link as LinkScroll } from 'react-scroll';
import { Dispatch } from 'redux';
import NProgress from 'nprogress';
import Head from 'next/head';
import { modifyWordpressObject } from '../helpers/helper';
import { Socials } from '../components/Socials';
import { GoogleTagManager } from '../components/google/GoogleTagManager';

import Link from 'next/link';
import Router from 'next/router';

Router.onRouteChangeStart = (url: string) => NProgress.start();
Router.onRouteChangeComplete = () => NProgress.done();
Router.onRouteChangeError = () => NProgress.done();

type HeaderProps = {};
type ReduxProps = {};
type ReduxActionProps = {
    toggleMenu?: (isOpen: boolean) => any;
};
type Props = HeaderProps & ReduxProps & ReduxActionProps;
class HeaderContainer extends React.Component<Props> {
    constructor(props: any) {
        super(props);
        this.state = {
            showBurgerMenu: false,
            showUpButton: false,
            showTestLinks: false,
        };
        this.bmChangeState = this.bmChangeState.bind(this);
    }

    bmChangeState(state: any) {
        this.props.toggleMenu!(state.isOpen);
        return state.isOpen;
    }

    componentDidMount() {
        if (window.location && window.location.search.indexOf('?qwe') > -1) {
            this.setState({
                showTestLinks: true,
            });
        }
        document.addEventListener('scroll', () => {
            let windowPosition = window.pageYOffset;
            if (windowPosition >= 300) {
                this.setState({
                    showBurgerMenu: true,
                });
            } else {
                this.setState({
                    showBurgerMenu: false,
                });
            }
            if (windowPosition >= 1200) {
                this.setState({
                    showUpButton: true,
                });
            } else {
                this.setState({
                    showUpButton: false,
                });
            }
        });
    }

    componentWillUnmount() {
        document.removeEventListener('scroll', () => {});
    }

    render() {
        const { burgerMenu, blog }: any = this.props;
        const { showBurgerMenu, showUpButton, showTestLinks }: any = this.state;
        const menuHasFadeIn = showBurgerMenu ? 'show-background' : ''; //- enable during production
        const upButtonHasFadeIn = showUpButton ? '' : 'hide'; //- enable during production

        return (
            <div>
                <HeadCustom blog={blog.blog} key="header-1" />
                <MenuSidebar showTestLinks={showTestLinks} bmChangeState={this.bmChangeState} burgerMenu={burgerMenu} />
                ,
                <section className={`${menuHasFadeIn} fade-in top-nav-container`}>
                    <p className="btn-burger-menu pointer" onClick={() => this.props.toggleMenu!(true)}>
                        <i className="fa fas fa-bars"></i>
                    </p>
                </section>
                <LinkScroll to="main-wrapper" className={`${upButtonHasFadeIn}`} smooth={true} duration={750}>
                    <p className="btn-up">
                        <i className="fas fa-arrow-up"></i>
                    </p>
                </LinkScroll>
            </div>
        );
    }
}

const HeadCustom = ({ blog }: any) => {
    let metaDescription =
        'Felix Noriel is a Software Engineer who loves food, traveling and cooking! He loves to challenge himself everyday. He is exploring the world, one country at a time. ';
    let metaTitle =
        'Felix Noriel | Foodie | Technology Enthusiast | Mixing life between food, traveling and technology';

    let ogType = 'blog';
    let ogImg = '';
    let ogSiteName = '';
    let ogUpdatedTime = '';
    let publishedTime = '';
    let ogUrl = '//whoisfelix.com';

    if (blog && blog[0]) {
        const modifyBlog = modifyWordpressObject(blog[0]);
        metaDescription = modifyBlog.excerpt.rendered;
        metaTitle = modifyBlog.title.rendered;
        ogImg = modifyBlog.custom_modified.featuredImgSrc.source_url;
        ogUpdatedTime = modifyBlog.modified;
        ogUrl = modifyBlog.custom_modified.postUrlPath;
        ogType = 'article';
        publishedTime = modifyBlog.custom_modified.date;
    }

    return (
        <Head>
            <title>{metaTitle}</title>

            <script async src="//www.googletagmanager.com/gtag/js?id=UA-80189799-2"></script>
            <script async src="//www.googletagservices.com/tag/js/gpt.js"></script>
            <GoogleTagManager scriptId="google-tag-manager" gtmId="GTM-PKHZBV4" type="script" />

            <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            <meta name="author" content="Felix Noriel" itemProp="author" />
            <meta name="dcterms.rightsHolder" content="Felix Noriel" />
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

            <link rel="canonical" href={`${ogUrl}`} />
            <link href="//fonts.googleapis.com/css?family=Oxygen|Raleway" rel="stylesheet" />
        </Head>
    );
};

const MenuSidebar = ({ burgerMenu, bmChangeState, showTestLinks }: any) => {
    //<LinkScroll to="contact-container" smooth={true} duration={500} >Contact</LinkScroll>

    const showTestLinksText = () => {
        if (showTestLinks) {
            return (
                <div className="hide">
                    <a href="/?qwe">Home</a>
                    <a href="/blog?qwe">Blog</a>
                    <a href="/career?qwe">Career</a>
                    <a href="/projects?qwe">Projects</a>
                </div>
            );
        }
        return '';
    };
    return (
        <Menu right isOpen={burgerMenu.isOpen} customBurgerIcon={false} onStateChange={bmChangeState}>
            <div className="menu-links">
                <Link as="/" href="/" prefetch>
                    <a>Home</a>
                </Link>
                <Link as="/projects" href="/page?name=projects" prefetch>
                    <a>Projects</a>
                </Link>
                <Link as="/career" href="/page?name=career" prefetch>
                    <a>Career</a>
                </Link>
                <Link as="/blog" href="/page?name=blog" prefetch>
                    <a>Blog</a>
                </Link>
                <Link as="/about" href="/page?name=about" prefetch>
                    <a>About</a>
                </Link>
                <a href="mailto:jrnoriel_56@yahoo.com">Contact Me</a>
            </div>
            <div className="menu-socials">
                <Socials />
            </div>
            {showTestLinksText()}
        </Menu>
    );
};

const mapStateToProps = (state: RootState) => ({
    ...state,
});
const mapDispatchToProps = (dispatch: Dispatch<any>): ReduxActionProps => ({
    toggleMenu: (isOpen: boolean) => dispatch(toggleMenu(isOpen)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(HeaderContainer);
