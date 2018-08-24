import { Link } from 'react-scroll'

const Intro = () => {
  return (<section className="hero is-fullheight">
              <div className="hero-body">
                <div className="intro container">
                  <h1 className="title">
                  Hello, my name is <strong className="shadow pink">Felix Noriel</strong>
                  </h1>
                  <h2 className="subtitle"> I am a <span className="shadow success">Software Engineer</span> who loves <span className="shadow info">food</span>, <span className="shadow warning">traveling</span> and <span className="shadow purple">cooking</span> to name a few. </h2>
                  Learn more about me <Link className="btn-learn-more" to="skills-section" smooth={true} duration={500} ><i className="fas fa-arrow-down"></i></Link>
                </div>
              </div>
            </section>)
}

export default Intro;
