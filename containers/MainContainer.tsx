import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import FooterContainer from './FooterContainer';
import HeaderContainer from './HeaderContainer';

import "../design/index.scss";

class MainContainer extends PureComponent {


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


const mapStateToProps = state => ({
 ...state
})
const mapDispatchToProps = dispatch => ({

})

export default connect(mapStateToProps, mapDispatchToProps)(MainContainer);
