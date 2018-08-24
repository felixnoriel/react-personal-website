import React, { PureComponent } from 'react';
import { connect } from 'react-redux';


class FooterContainer extends PureComponent {

 componentWillMount(){

 }

 render() {

  return (
     [<section key="footer-1" className="section container contact-container has-text-centered">
        <div className="box hero is-dark">
          <div className="columns level">
            <div className="column level-item">
              <h2 className="title">Want to say hi?</h2>
            </div>
            <div className="column level-item"><a className="button is-primary is-outlined is-rounded is-medium" href="#">Message me</a></div>
          </div>
        </div>
      </section>,
      <footer key="footer-2" className="hero footer section is-primary is-small">
         <div className="container has-text-centered">
          <div className="content">
            <p className="copyright">Created by Felix Noriel <i className="far fa-copyright"></i> 2018</p>
            <p className="socials">
              <a target="_blank" href="https://www.linkedin.com/in/felixnoriel/"><span className="social-item"><i className="fab fa-linkedin-in"></i></span></a>
              <a target="_blank" href="https://github.com/felixnoriel"><span className="social-item"><i className="fab fa-github"></i></span></a>
              <a target="_blank" href="https://www.facebook.com/felixnoriel"><span className="social-item"><i className="fab fa-facebook-f"></i></span></a>
              <a target="_blank" href="https://www.instagram.com/felixnoriel/"><span className="social-item"><i className="fab fa-instagram"></i></span></a>
            </p>
            <p className="made-with">This website is made with <span>ReactJs, NextJs, Redux, Wordpress API, Bulma</span></p>
          </div>
         </div>
         <script defer src="https://use.fontawesome.com/releases/v5.1.0/js/all.js"></script>
       </footer>]
  );

 }
}

const mapStateToProps = state => ({
 ...state
})
const mapDispatchToProps = dispatch => ({

})

export default connect(mapStateToProps, mapDispatchToProps)(FooterContainer);
