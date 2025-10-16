export function AboutWebsite() {
  return (
    <section className="container mx-auto max-w-4xl px-4 py-12">
      <h2 className="text-3xl font-bold mb-6">About me</h2>
      <div className="prose prose-lg mb-12">
        <ul>
          <li>
            I'm a Product-focused <strong>Senior Software Engineer</strong> based in Sydney, Australia
          </li>
          <li>
            When I'm not in front of my computer, I like to cook, trying out different restaurants and cuisines, and
            traveling every once in a while
          </li>
        </ul>
      </div>

      <h2 className="text-3xl font-bold mb-6">About this website</h2>
      <p className="mb-6">
        Developed by <strong>Felix Noriel</strong>
      </p>

      <h3 className="text-2xl font-semibold mb-4">Front end</h3>
      <ul className="list-disc list-inside mb-8 space-y-2">
        <li>
          <strong>React 18</strong> with functional components and hooks
        </li>
        <li>
          <strong>Vite</strong> for blazing fast development and build
        </li>
        <li>
          <strong>React Router 7</strong> for client-side routing
        </li>
        <li>
          <strong>Context API</strong> for state management
        </li>
        <li>
          <strong>TypeScript</strong>
        </li>
        <li>
          <strong>Tailwind CSS & Shadcn/ui</strong> for modern, responsive design
        </li>
      </ul>

      <h3 className="text-2xl font-semibold mb-4">Back end</h3>
      <ul className="list-disc list-inside mb-8 space-y-2">
        <li>
          <strong>WordPress</strong> for CMS (legacy)
        </li>
        <li>
          <strong>Static JSON files</strong> for data serving
        </li>
        <li>
          <strong>WordPress API</strong> for original data structure
        </li>
      </ul>

      <h3 className="text-2xl font-semibold mb-4">Hosted on modern platforms</h3>
      <p className="text-muted-foreground">Vercel</p>
    </section>
  )
}
