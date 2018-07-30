import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { get } from '../actions/action'

class MainContainer extends PureComponent {

 componentWillMount(){
    this.props.get();
 }

 render() {

  return (
   <div className="main-wrapper">
   <pre>{ JSON.stringify(this.props) }</pre>
    <h1>This is a react with redux template</h1>
   </div>
  );

 }
}

const mapStateToProps = state => ({
 ...state
})
const mapDispatchToProps = dispatch => ({
 get: () => dispatch(get())
})

export default connect(mapStateToProps, mapDispatchToProps)(MainContainer);