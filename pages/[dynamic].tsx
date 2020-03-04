import * as React from 'react';
import { connect } from 'react-redux';
// @ts-ignore
import { action as toggleMenu } from 'redux-burger-menu';
import { getBlogList, getBlog } from '../src/store/blog/state';
import { getCareerList, getCareer } from '../src/store/career/state';
import { getProjectList, getProject, getProjectsByCareerId } from '../src/store/project/state';

import { MainContainer } from '../src/containers/MainContainer';
import { ProjectList } from '../src/components/project/ProjectList';
import { ProjectView } from '../src/components/project/ProjectView';
import { BlogList } from '../src/components/blog/BlogList';
import { BlogView } from '../src/components/blog/BlogView';
import { CareerTimeline } from '../src/components/career/CareerTimeline';
import { CareerView } from '../src/components/career/CareerView';
import { AboutWebsite } from '../src/components/about/AboutWebsite';

class Page extends React.Component {
    // second to be called
    constructor(props: any) {
        super(props);
    }

    public componentWillUnmount() {
        console.log('list.js unmount');
    }
    // first to be called
    /*
    params pathname = url
    query - quer string section of url
    asPath - string of actual path
    req - http request (server only)
    res - http response (server only)
    jsonPageRes - fetch response ( client only)
    err - error object
  */
    public static async getInitialProps({ req, store, pathname, params, query, asPath }: any) {
        await store.dispatch(toggleMenu(false));
        const PostTypeName = query.name;
        const slug = query.slug;

        if (PostTypeName === 'projects') {
            if (slug) {
                await store.dispatch(getProject(slug));
            } else {
                await store.dispatch(getProjectList(99));
            }
        } else if (PostTypeName === 'career') {
            if (slug) {
                await store.dispatch(getCareer(query.slug));
                const career = store.getState().career;
                if (career && career.career[0]) {
                    const careerId = store.getState().career.career[0].id;
                    await store.dispatch(getProjectsByCareerId(careerId));
                }
            } else {
                await store.dispatch(getCareerList(99));
            }
        } else if (PostTypeName === 'blog') {
            if (slug) {
                await store.dispatch(getBlog(slug));
            } else {
                await store.dispatch(getBlogList(99));
            }
        }

        return { PostTypeName, slug };
    }

    public render() {
        const { PostTypeName }: any = this.props;

        // Dynamic Component
        const Component = components[PostTypeName];
        return (
            <MainContainer>
                <Component {...this.props} />
            </MainContainer>
        );
    }
}

const components: any = {
    projects: ({ project, slug }: any) => {
        if (slug) {
            return <ProjectView project={project.project} />;
        }
        return <ProjectList indexPage={false} projects={project.projectList} />;
    },
    career: ({ career, project, slug }: any) => {
        if (slug) {
            return <CareerView experience={career.career} projects={project.projectList} />;
        }
        return <CareerTimeline indexPage={false} experiences={career.careerList} />;
    },
    blog: ({ blog, slug }: any) => {
        if (slug) {
            return <BlogView blog={blog.blog} />;
        }
        return <BlogList indexPage={false} blogList={blog.blogList} />;
    },
    about: () => <AboutWebsite />,
};

const mapStateToProps = state => ({
    ...state,
});
const mapDispatchToProps = (dispatch: any) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Page);
