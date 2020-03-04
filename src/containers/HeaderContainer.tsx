import Head from 'next/head';
// @ts-ignore
import NProgress from 'nprogress';
import * as React from 'react';
import { elastic as Menu } from 'react-burger-menu';
import { connect } from 'react-redux';
import { Link as LinkScroll } from 'react-scroll';
import { Dispatch } from 'redux';
// @ts-ignore
import { action as toggleMenu } from 'redux-burger-menu';
import { GoogleTagManager } from '../components/google/GoogleTagManager';
import { Socials } from '../components/Socials';
import { modifyWordpressObject } from '../helpers/helper';
import { RootState } from '../store/root-reducer';
import { RootAction } from '../store/root-action';

import Link from 'next/link';
import Router from 'next/router';

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

type HeaderProps = {};
type ReduxProps = {};
type ReduxActionProps = {
    toggleMenu?: (isOpen: boolean) => any;
};
type Props = HeaderProps & ReduxProps & ReduxActionProps;
class HeaderContainer extends React.Component<Props> {
    private isMounted: boolean = false;

    constructor(props: any) {
        super(props);
        this.state = {
            showBurgerMenu: false,
            showUpButton: false,
            showTestLinks: false,
        };
        this.bmChangeState = this.bmChangeState.bind(this);
    }

    public bmChangeState(state: any) {
        this.props.toggleMenu!(state.isOpen);
        return state.isOpen;
    }

    public componentDidMount() {
        this.isMounted = true;
        if (window.location && window.location.search.indexOf('?qwe') > -1) {
            this.setState({
                showTestLinks: true,
            });
        }
        document.addEventListener('scroll', () => {
            if (!this.isMounted) {
                return;
            }
            const windowPosition = window.pageYOffset;
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

    public componentWillUnmount() {
        this.isMounted = false;
        document.removeEventListener('scroll', () => {
            /* */
        });
    }

    public render() {
        const { burgerMenu, blog }: any = this.props;
        const { showBurgerMenu, showUpButton }: any = this.state;
        const menuHasFadeIn = showBurgerMenu ? 'show-background' : ''; // - enable during production
        const upButtonHasFadeIn = showUpButton ? '' : 'hide'; // - enable during production

        return (
            <div>
                <HeadCustom blog={blog.blog} key="header-1" />
                <MenuSidebar bmChangeState={this.bmChangeState} burgerMenu={burgerMenu} />
                <section className={`${menuHasFadeIn} fade-in top-nav-container`}>
                    <p className="btn-burger-menu pointer" onClick={() => this.props.toggleMenu!(true)}>
                        <i className="fa fas fa-bars" />
                    </p>
                </section>
                <LinkScroll to="main-wrapper" className={`${upButtonHasFadeIn}`} smooth={true} duration={750}>
                    <p className="btn-up">
                        <i className="fas fa-arrow-up" />
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
    const ogSiteName = '';
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

            <script async src="//www.googletagmanager.com/gtag/js?id=UA-80189799-2" />
            <script async src="//www.googletagservices.com/tag/js/gpt.js" />
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

const MenuSidebar = ({ burgerMenu, bmChangeState }: any) => {
    return (
        <Menu right isOpen={burgerMenu.isOpen} customBurgerIcon={false} onStateChange={bmChangeState}>
            <div className="menu-links">
                <Link as="/" href="/">
                    <a>Home</a>
                </Link>
                <Link as="/projects" href="/page?name=projects">
                    <a>Projects</a>
                </Link>
                <Link as="/career" href="/page?name=career">
                    <a>Career</a>
                </Link>
                <Link as="/blog" href="/page?name=blog">
                    <a>Blog</a>
                </Link>
                <Link as="/about" href="/page?name=about">
                    <a>About</a>
                </Link>
                <a href="mailto:jrnoriel_56@yahoo.com">Contact Me</a>
            </div>
            <div className="menu-socials">
                <Socials />
            </div>
        </Menu>
    );
};

const mapStateToProps = (state: RootState) => ({
    ...state,
});
const mapDispatchToProps = (dispatch: Dispatch<RootAction>): ReduxActionProps => ({
    toggleMenu: (isOpen: boolean) => dispatch(toggleMenu(isOpen)),
});

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContainer);
