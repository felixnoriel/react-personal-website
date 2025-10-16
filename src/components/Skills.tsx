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
              <li>React (Hooks, Vite, NextJs)</li>
              <li>AngularJs/JQuery</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">UI</h4>
            <ul className="space-y-1 text-sm">
              <li>Tailwind, Chakra, Material, Shadcn</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Others</h4>
            <ul className="space-y-1 text-sm">
              <li>GraphQL</li>
              <li>Storybook</li>
              <li>Turborepo</li>
              <li>Webpack</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Testing</h4>
            <ul className="space-y-1 text-sm">
              <li>Jest</li>
              <li>Playwright</li>
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
              <li>Java, .NET, C#, PHP</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Databases</h4>
            <ul className="space-y-1 text-sm">
              <li>PostgreSQL</li>
              <li>MySQL</li>
              <li>Firebase/DocumentDB</li>
              <li>Convex</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Monitoring</h4>
            <ul className="space-y-1 text-sm">
              <li>New relic</li>
              <li>Sentry</li>
            </ul>
          </div>

          <div className="p-6">
            <p className="text-5xl mb-4 text-muted-foreground">
              <i className="fas fa-terminal" />
            </p>
            <h2 className="text-2xl font-semibold mb-6">DevOps</h2>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Google Cloud</h4>
            <ul className="space-y-1 text-sm">
              <li>Cloud Run, Functions</li>
              <li>Cloud Tasks, Pub/Sub</li>
              <li>Cloud BigQuery, SQL, Storage</li>
              <li>Cloud Build</li>
            </ul>
            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">AWS</h4>
            <ul className="space-y-1 text-sm">
              <li>CDK, Cloudformation</li>
              <li>ECS, EC2</li>
              <li>SNS, SQS, Lambda</li>
              <li>S3, Cloudfront</li>
              <li>RDS, API Gateway, ELB, etc</li>
            </ul>

            <h4 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Others</h4>
            <ul className="space-y-1 text-sm">
              <li>Secrets Management</li>
              <li>Redis, Elasticache, Algolia, Typesense</li>
              <li>Circle CI, GitHub Actions</li>
              <li>Vercel</li>
              <li>Docker</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
