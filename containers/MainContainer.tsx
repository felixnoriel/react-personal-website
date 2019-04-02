import * as React from 'react';

import { FooterContainer } from './FooterContainer';
import HeaderContainer from './HeaderContainer';
import "../design/index.scss";

export class MainContainer extends React.PureComponent {
   render() {
      return (
         <div id="main-wrapper" className="main-wrapper">
            <HeaderContainer />
            { this.props.children }
            <FooterContainer />
         </div>
      );
   }
}

