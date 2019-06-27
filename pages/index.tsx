import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { RootState } from '../store';
import { getBlogList } from '../store/blog/state';
import { getCareerList } from '../store/career/state';
import { getProjectList } from '../store/project/state';
// @ts-ignore
import { action as toggleMenu } from 'redux-burger-menu';

import { MainContainer } from '../containers/MainContainer';
import { Intro } from '../components/Intro';
import { CareerTimeline } from '../components/career/CareerTimeline';
import { ProjectList } from '../components/project/ProjectList';
import { BlogList } from '../components/blog/BlogList';
import { Skills } from '../components/skills/Skills';

type ReduxActionProps = {};
class Index extends React.PureComponent {
    //second to be called
    constructor(props: any) {
        super(props);
    }

    componentWillUnmount() {}
    //first to be called
    /*
    params pathname = url
    query - quer string section of url
    asPath - string of actual path
    req - http request (server only)
    res - http response (server only)
    jsonPageRes - fetch response ( client only)
    err - error object
  */
    static async getInitialProps({ req, store, pathname, params, query }: any) {
        await store.dispatch(toggleMenu(false));
        await store.dispatch(getCareerList(3));
        await store.dispatch(getProjectList(3));
        await store.dispatch(getBlogList(3));

        return {};
    }

    //third to be called
    //
    render() {
        const { career, project, blog }: any = this.props;

        return (
            <MainContainer>
                <Intro />
                <Skills />
                <CareerTimeline indexPage={true} experiences={career.careerList} />
                <ProjectList indexPage={true} projects={project.projectList} />
                <BlogList indexPage={true} blogList={blog.blogList} />
            </MainContainer>
        );
    }
}
const mapStateToProps = (state: RootState) => ({
    career: state.career,
    project: state.project,
    blog: state.blog,
});
const mapDispatchToProps = (dispatch: Dispatch<any>): ReduxActionProps => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Index);
