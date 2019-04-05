import { RouterAction, LocationChangeAction } from 'react-router-redux';

import { BlogAction } from './blog/state';
import { CareerAction } from './career/state';
import { ProjectAction } from './project/state';

type ReactRouterAction = RouterAction | LocationChangeAction;
export type RootAction = ReactRouterAction | ProjectAction | CareerAction | BlogAction;
