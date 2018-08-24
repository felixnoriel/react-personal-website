import service from '../helpers/service';
import { GET_EXPERIENCES, GET_SINGLE_EXPERIENCE,
         GET_PROJECTS, GET_PROJECTS_BY_CAREER_ID, GET_SINGLE_PROJECT,
         GET_BLOG, GET_SINGLE_BLOG } from '../helpers/variables';



export const getExperiences = ({per_page}) => async dispatch => {
     dispatch({
      type: GET_EXPERIENCES,
      experiences: []
     })

     const experiencesPromise = await service.getWPApi('career', {orderby:'menu_order', per_page: per_page});
     const experiences = await experiencesPromise.json();

     //for static data json file
     const filteredData = filterPerPage({per_page: per_page, list: experiences});

     dispatch({
       type: GET_EXPERIENCES,
       experiences: filteredData
     })
}


export const getExperience = ({slug}) => async dispatch => {
     dispatch({
      type: GET_SINGLE_EXPERIENCE,
      experience: {}
     })

     const experiencePromise = await service.getWPApi('career', {slug:slug});
     const experience = await experiencePromise.json();

     //for static data json file
     const filteredSlug = filterBySlug({slug: slug, list: experience});
     dispatch({
       type: GET_SINGLE_EXPERIENCE,
       experience: filteredSlug
     })
}

export const getBlogList = ({per_page}) => async dispatch => {
     dispatch({
      type: GET_BLOG,
      blogList: []
     })

     const blogPromise = await service.getWPApi('blog', {orderby:'menu_order', per_page: per_page});
     const blogList = await blogPromise.json();

     //for static data json file
     const filteredData = filterPerPage({per_page: per_page, list: blogList});

     dispatch({
       type: GET_BLOG,
       blogList: filteredData
     })
}


export const getBlog = ({slug}) => async dispatch => {
     dispatch({
      type: GET_SINGLE_BLOG,
      blog: {}
     })

     const blogPromise = await service.getWPApi('blog', {slug:slug});
     const blog = await blogPromise.json();

     //for static data json file
     const filteredSlug = filterBySlug({slug: slug, list: blog});
     dispatch({
       type: GET_SINGLE_BLOG,
       blog: filteredSlug
     })
}

export const getProjects = ({per_page}) => async dispatch => {
  dispatch({
   type: GET_PROJECTS,
   projects: {}
  })

  const projectsPromise = await service.getWPApi('projects', {orderby:'menu_order', per_page:per_page});
  const projects = await projectsPromise.json();

  //for static data json file
  const filteredData = filterPerPage({per_page: per_page, list: projects});

  dispatch({
    type: GET_PROJECTS,
    projects: filteredData
  })

}

export const getProjectsByCareerId = ({career_id}) => async dispatch => {

  dispatch({
   type: GET_PROJECTS_BY_CAREER_ID,
   projects_by_career: {}
  })

  //const projectsPromise = await service.getWPApi('projects_by_career', {orderby:'menu_order', career_id});
  //const projects = await projectsPromise.json();
  const projectsPromise = await service.getWPApi('projects', {orderby:'menu_order'});
  const projects = await projectsPromise.json();

  //for static data json file
  const filteredData = filterProjectsByCareerId({career_id: career_id, list: projects});
  dispatch({
    type: GET_PROJECTS_BY_CAREER_ID,
    projects_by_career: filteredData
  })

}

export const getProject = ({slug}) => async dispatch => {

     dispatch({
      type: GET_SINGLE_PROJECT,
      project: {}
     })

     const projectPromise = await service.getWPApi('projects', {slug:slug});
     const project = await projectPromise.json();

     //for static data json file
     const filteredSlug = filterBySlug({slug: slug, list: project});
     dispatch({
       type: GET_SINGLE_PROJECT,
       project: filteredSlug
     })

}

function filterProjectsByCareerId({career_id, list}){
  if(!list.map){
    return false;
  }

  return list.filter( obj => {

    if(obj && obj.custom_meta && obj.custom_meta.custom_meta_company_id){
      if(career_id == obj.custom_meta.custom_meta_company_id){
        return obj;
      }
    }
  });
}
function filterPerPage({per_page, list}){
  if(!list.map){
    return false;
  }
  if(list.length <= per_page){
    return list;
  }

  let counter = 0;
  return list.filter( obj => {
    if(counter++ < per_page){
      return obj;
    }
  });
}

function filterBySlug({ slug, list }){
  if(!list.map){
    return false;
  }

  return list.filter( obj => {
    if(slug === obj.slug){
      return obj;
    }
  });
}
