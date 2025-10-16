export function Skills() {
  return (
    <div>
      <section id="skills-section" className="bg-teal-gradient text-white py-20">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            I have over 12 years of experience as a Full-Stack Software Engineer
          </h1>
          <h2 className="text-lg md:text-xl lg:text-2xl opacity-90">
            Strategising, designing, and developing big scalable applications from end to end
          </h2>
        </div>
      </section>

      <section className="py-12 container mx-auto max-w-7xl px-4 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card border rounded-lg shadow-sm p-8">
          <div className="p-6">
            <p className="text-5xl mb-4 text-muted-foreground">
              <i className="far fa-file-code" />
            </p>
            <h2 className="text-2xl font-semibold mb-6">Front end</h2>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">frameworks</h4>
            <ul className="space-y-1 text-sm">
              <li>React (Hooks, NextJs)</li>
              <li>TypeScript</li>
              <li>JavaScript</li>
              <li>AngularJs</li>
              <li>JQuery</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Responsive design</h4>
            <ul className="space-y-1 text-sm">
              <li>Tailwind</li>
              <li>HTML 5 & CSS 3 (SASS)</li>
              <li>Flexbox, Grid Layout</li>
              <li>Bulma, Ant Design, Bootstrap</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Tools</h4>
            <ul className="space-y-1 text-sm">
              <li>Turborepo</li>
              <li>Webpack</li>
            </ul>
          </div>

          <div className="p-6 border-l border-r border-border">
            <p className="text-5xl mb-4 text-muted-foreground">
              <i className="fas fa-code-branch" />
            </p>
            <h2 className="text-2xl font-semibold mb-6">Back end</h2>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">languages</h4>
            <ul className="space-y-1 text-sm">
              <li>Node (NestJS, Express, Koa)</li>
              <li>PHP</li>
              <li>Java</li>
              <li>.NET, C#</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Tracing/Monitoring</h4>
            <ul className="space-y-1 text-sm">
              <li>New relic</li>
              <li>Sentry</li>
              <li>Opentracing, Jaeger Tracing</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">DB/Storage</h4>
            <ul className="space-y-1 text-sm">
              <li>PostgreSQL</li>
              <li>Firebase</li>
              <li>Convex</li>
              <li>MySQL</li>
            </ul>
          </div>

          <div className="p-6">
            <p className="text-5xl mb-4 text-muted-foreground">
              <i className="fas fa-terminal" />
            </p>
            <h2 className="text-2xl font-semibold mb-6">Dev Ops / Infra</h2>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Google Cloud Services</h4>
            <ul className="space-y-1 text-sm">
              <li>Cloud Run</li>
              <li>Cloud Functions</li>
              <li>Cloud BigQuery</li>
              <li>Cloud Pub/Sub</li>
            </ul>
            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">AWS Services</h4>
            <ul className="space-y-1 text-sm">
              <li>ECS</li>
              <li>API Gateway</li>
              <li>Lambda</li>
              <li>Cloudfront</li>
              <li>EC2, ELB, etc</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">CI/CD</h4>
            <ul className="space-y-1 text-sm">
              <li>Circle CI</li>
              <li>Vercel</li>
              <li>Serverless framework</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Docker</h4>
            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Server Management</h4>
            <ul className="space-y-1 text-sm">
              <li>Linux, Ubuntu</li>
              <li>Web servers like Apache, NGINX</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
