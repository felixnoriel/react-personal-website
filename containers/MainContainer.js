import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import FooterContainer from '../containers/FooterContainer';
import HeaderContainer from '../containers/HeaderContainer';

import "../design/index.scss";

class MainContainer extends PureComponent {


 render() {
  return (
   <div className="main-wrapper">
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
