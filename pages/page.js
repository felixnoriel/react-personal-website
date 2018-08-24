import { PureComponent } from 'react'
import { connect } from 'react-redux'

import { getProjects, getProjectsByCareerId, getProject,
         getExperiences, getExperience,
         getBlogList, getBlog } from '../actions/action'
import { action as toggleMenu } from 'redux-burger-menu';

import MainContainer from '../containers/MainContainer'
import ProjectList from '../components/ProjectList';
import ProjectView from '../components/ProjectView';
import BlogList from '../components/BlogList';
import BlogView from '../components/BlogView';
import CareerTimeline from '../components/CareerTimeline';
import CareerView from '../components/CareerView';

import routes from '../routes';

class List extends PureComponent{

  //second to be called
  constructor(props){
    super(props)
  }

  componentWillUnmount(){
    console.log('list.js unmount');
  }
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
  static async getInitialProps ({ req, reduxStore, pathname, params, query, asPath }) {
    await reduxStore.dispatch(toggleMenu(false))

    const route = routes.match(asPath);
    const PostTypeName = route.route.name;



    if(PostTypeName == 'projects'){
        await reduxStore.dispatch(getProjects({per_page:99, order_by: 'menu_order'}))
    }else if (PostTypeName == 'career'){
        await reduxStore.dispatch(getExperiences({per_page: 99}))
    }else if (PostTypeName == 'blog'){
        await reduxStore.dispatch(getBlogList({per_page: 99}))
    }else if(PostTypeName == 'projectview'){
        await reduxStore.dispatch(getProject({slug: query.slug}))
    }else if(PostTypeName == 'careerview'){
        await reduxStore.dispatch(getExperience({slug: query.slug}))
        if(reduxStore.getState().reducer && reduxStore.getState().reducer.experience[0]){
          const careerId = reduxStore.getState().reducer.experience[0].id;
          await reduxStore.dispatch(getProjectsByCareerId({per_page: 4, career_id: careerId}))
        }
    }else if(PostTypeName == 'blogview'){
        await reduxStore.dispatch(getBlog({slug: query.slug}))
    }

    return { PostTypeName: PostTypeName };
  }

  //third to be called
  //
  render(){
    const { projects } = this.props.reducer;
    const { PostTypeName } = this.props;

    //Dynamic Component
    const Component = components[PostTypeName];
    return (<MainContainer>
              <Component {...this.props} />
            </MainContainer>)
  }
}

const components = {
  projects: ({reducer}) => <ProjectList projects={reducer.projects}/>,
  career: ({reducer}) => <CareerTimeline experiences={reducer.experiences}/>,
  blog: ({reducer}) => <BlogList blogList={reducer.blogList}/>,
  projectview: ({reducer}) => <ProjectView project={reducer.project}/>,
  careerview: ({reducer}) => <CareerView experience={reducer.experience} projects={reducer.projects_by_career}/>,
  blogview: ({reducer}) => <BlogView blog={reducer.blog}/>,
}

const mapStateToProps = state => ({
 ...state
})
const mapDispatchToProps = dispatch => ({

})

export default connect(mapStateToProps, mapDispatchToProps)(List);
