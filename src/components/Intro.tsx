export function Intro() {
  const scrollToSkills = () => {
    const skillsSection = document.getElementById('skills-section')
    if (skillsSection) {
      skillsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-raleway">
          Hello, my name is <strong className="shadow pink">Felix Noriel</strong>
        </h1>
        <h2 className="text-xl md:text-2xl lg:text-3xl mb-8 leading-relaxed font-raleway">
          I am a <span className="shadow success font-semibold">Product-Focused Software Engineer</span> who loves{' '}
          <span className="shadow info font-semibold">solving problems</span> and getting my hands dirty with{' '}
          <span className="shadow purple font-semibold">new technologies</span>. Outside work, I'm a{' '}
          <span className="shadow pink font-semibold">big foodie</span>, loves cooking and traveling every once in a
          while.
        </h2>
        <h2 className="text-xl md:text-2xl lg:text-3xl mb-8 leading-relaxed font-raleway">
          In the past 3 years, I've been digital nomading in 12 different countries exploring the world and cultures.
          But now back and based in Sydney, ready for the next adventure.
        </h2>
        <p className="text-lg font-semibold">
          Learn more about me
          <button
            onClick={scrollToSkills}
            className="ml-2 text-2xl align-middle hover:translate-y-1 transition-transform inline-block"
            aria-label="Scroll to skills section"
          >
            <i className="fas fa-arrow-down" />
          </button>
        </p>
      </div>
    </section>
  )
}
