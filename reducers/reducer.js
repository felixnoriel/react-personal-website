import { GET_EXPERIENCES, GET_SINGLE_EXPERIENCE,
         GET_PROJECTS, GET_PROJECTS_BY_CAREER_ID, GET_SINGLE_PROJECT,
         GET_SINGLE_BLOG, GET_BLOG } from '../helpers/variables';

export default (state = {}, action) => {
 switch (action.type) {
  case GET_EXPERIENCES:
   return {
    ...state,
    experiences: action.experiences
   }
   case GET_SINGLE_EXPERIENCE:
    return {
     ...state,
     experience: action.experience
    }
  case GET_PROJECTS:
   return {
    ...state,
    projects: action.projects
   }
   case GET_PROJECTS_BY_CAREER_ID:
    return {
     ...state,
     projects_by_career: action.projects_by_career
    }
   case GET_SINGLE_PROJECT:
    return {
     ...state,
     project: action.project
    }
    case GET_BLOG:
     return {
      ...state,
      blogList: action.blogList
     }
     case GET_SINGLE_BLOG:
      return {
       ...state,
       blog: action.blog
      }
  default:
   return state
 }
}
