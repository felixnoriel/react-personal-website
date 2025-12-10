import type { Project } from '../types/data';

export const projects: Project[] = [
  {
    "slug": "genopets",
    "title": "Genopets",
    "excerpt": "Senior Full-Stack Engineer at Genoverse.",
    "content": "<p>At Genopets, I wear all the hats as a full stack dev, owning the full lifecycle of features from architecture to production maintenance. We used Typescript - React, NestJS, Google Cloud Services, Vercel, Firebase, Solana Blockchain (Rust, Anchor)</p><h3>Architecture</h3><ul><li>Built an event-driven data pipeline (Pub/Sub, Cloud Functions, BigQuery) handling 7.5M+ messages/day that powered 50+ analytics dashboards for product/marketing decisions. These data are also used by other features like autobahn, rewards system, etc.</li><li>Optimized performance to handle 60k DAU, 150k MAU at 300+ req/sec at peak, improving p95 latency by 80% through strategic caching and async processing.</li></ul><h3>Feature Work</h3><ul><li>Designed and deployed \"Autobahn\" a robust anti-fraud system leveraging proprietary game data and player behaviour analysis to identify and manage bots and fraud</li><li>Created config-driven frameworks for game mechanics (leaderboards, achievements) that empowered product managers to iterate independently without engineering work.</li><li>Engineered secure Web2/Web3 auth bridges and OTP login flows for both web and mobile clients, hardening critical user access paths. This fixed all login bugs and issues resulting in better UX.</li><li>Implemented & optimised a notification system that sends 1.8m+ users efficiently.</li></ul><h3>DevOps</h3><ul><li>Maintained & improved CI/CD, cutting build/deploy times by 50%.</li><li>Integrated observability tooling (Sentry, Cloud Alerts) enabling rapid issue detection.</li><li>Established E2E testing framework achieving 70%+ code coverage, significantly boosting developer confidence and reducing post-deployment issues.</li></ul><h3>AI</h3><ul><li>Implemented a flexible framework for users to build personalized AI agents capable of executing custom tasks via MCP servers & tool-calling</li></ul><h3>Cost Optimisation</h3><ul><li>Migrated infra from AppEngine to Cloud Run, reducing infra costs by 50%+ while improving system reliability.</li><li>Migrated leaderboard mechanism from Redis to Firestore, improving performance and reducing costs</li></ul>",
    "image": {
      "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/genopets-banner-v2.png",
      "alt": "Genopets",
      "width": 397,
      "height": 72
    },
    "tags": [
      { "name": "TypeScript", "slug": "typescript" },
      { "name": "React", "slug": "react" },
      { "name": "NestJS", "slug": "nestjs" },
      { "name": "Google Cloud", "slug": "google-cloud" },
      { "name": "Firebase", "slug": "firebase" },
      { "name": "Solana", "slug": "solana" },
      { "name": "Rust", "slug": "rust" },
      { "name": "Vercel", "slug": "vercel" }
    ],
    "gallery": [
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/mobile1.png", "alt": "mobile1", "category": "Mobile" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/mobile2.png", "alt": "mobile2", "category": "Mobile" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/mobile3.png", "alt": "mobile3", "category": "Mobile" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/mobile4.png", "alt": "mobile4", "category": "Mobile" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/mobile5.png", "alt": "mobile5", "category": "Mobile" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/mobile6.png", "alt": "mobile6", "category": "Mobile" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/mobile7.png", "alt": "mobile7", "category": "Mobile" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/mobile8.png", "alt": "mobile8", "category": "Mobile" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/mobile9.png", "alt": "mobile9", "category": "Mobile" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/telegram1.png", "alt": "telegram1", "category": "Telegram" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/telegram2.png", "alt": "telegram2", "category": "Telegram" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/telegram3.png", "alt": "telegram3", "category": "Telegram" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/telegram4.png", "alt": "telegram4", "category": "Telegram" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/web1.png", "alt": "web1", "category": "Web" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/web2.png", "alt": "web2", "category": "Web" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/web3.png", "alt": "web3", "category": "Web" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/web4.png", "alt": "web4", "category": "Web" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/web5.png", "alt": "web5", "category": "Web" }
    ],
    "company": {
      "title": "Genopets",
      "slug": "genopets",
      "image": {
        "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/genopets/genopets.png",
        "alt": "Genopets"
      }
    }
  },
  {
    "slug": "dashify",
    "title": "Dashify",
    "excerpt": "Built dashify.com.au from scratch which serves 20+ hospitality venues and a wholesale supplier to help them with all their digital presence and workflow needs.",
    "content": "<p>As the technical co-founder, I built <a href='https://dashify.com.au/' target='_blank'>dashify.com.au</a> from scratch (started during covid 2020) which serves 20+ hospitality venues and a wholesale supplier, 5k MAU, to help them manage all their digital workflow in one app. Simplified & cost efficient version instead of using different & disconnected services.</p><h3>Services Offered</h3><ul><li>Employee Management & Rostering (Kiosk Time-in & Time-out), Paperless Employee Onboarding</li><li>Table Reservation, Restaurant Booking Management</li><li>Purchase Ordering, Invoicing & Inventory Management</li><li>Task Management</li><li>CRM</li></ul><h3>Technologies</h3><ul><li>Typescript, React, Node/Nest.js, Material UI, Vercel, CDK/AWS, PostgreSQL</li></ul>",
    "image": {
      "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/dashify-banner.png",
      "alt": "Dashify",
      "width": 397,
      "height": 72
    },
    "tags": [
      { "name": "TypeScript", "slug": "typescript" },
      { "name": "React", "slug": "react" },
      { "name": "NestJS", "slug": "nestjs" },
      { "name": "AWS", "slug": "aws" },
      { "name": "AWS CDK", "slug": "aws-cdk" },
      { "name": "PostgreSQL", "slug": "postgresql" },
      { "name": "Material UI", "slug": "material-ui" },
      { "name": "Vercel", "slug": "vercel" }
    ],
    "gallery": [
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/articles.png", "alt": "articles", "category": "Articles" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/articles2.png", "alt": "articles2", "category": "Articles" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/bookings.png", "alt": "bookings", "category": "Bookings" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/bookings1.png", "alt": "bookings1", "category": "Bookings" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/bookings2.png", "alt": "bookings2", "category": "Bookings" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/bookings3.png", "alt": "bookings3", "category": "Bookings" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/cash-management.png", "alt": "cash-management", "category": "Cash Management" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/cash-management2.png", "alt": "cash-management2", "category": "Cash Management" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/crm.png", "alt": "crm", "category": "CRM" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/crm2.png", "alt": "crm2", "category": "CRM" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/crm3.png", "alt": "crm3", "category": "CRM" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/crm4.png", "alt": "crm4", "category": "CRM" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/crm5.png", "alt": "crm5", "category": "CRM" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/employee-rostering.png", "alt": "employee-rostering", "category": "Employee Rostering" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/employee-rostering2.png", "alt": "employee-rostering2", "category": "Employee Rostering" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/employee-rostering3.png", "alt": "employee-rostering3", "category": "Employee Rostering" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/employee.png", "alt": "employee", "category": "Employee" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/employee2.png", "alt": "employee2", "category": "Employee" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/employee3.png", "alt": "employee3", "category": "Employee" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/employee4.png", "alt": "employee4", "category": "Employee" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/inventory.png", "alt": "inventory", "category": "Inventory" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/inventory2.png", "alt": "inventory2", "category": "Inventory" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/inventory3.png", "alt": "inventory3", "category": "Inventory" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/inventory4.png", "alt": "inventory4", "category": "Inventory" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/projects3.png", "alt": "projects3", "category": "Projects" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/projects4.png", "alt": "projects4", "category": "Projects" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/projects5.png", "alt": "projects5", "category": "Projects" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/purchase-orders.png", "alt": "purchase-orders", "category": "Purchase Orders" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/purchase-orders2.png", "alt": "purchase-orders2", "category": "Purchase Orders" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/purchase-orders3.png", "alt": "purchase-orders3", "category": "Purchase Orders" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/purchase-orders4.png", "alt": "purchase-orders4", "category": "Purchase Orders" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/purchase-orders5.png", "alt": "purchase-orders5", "category": "Purchase Orders" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/purchase-orders6.png", "alt": "purchase-orders6", "category": "Purchase Orders" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/kiosk.png", "alt": "kiosk", "category": "Kiosk" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/kiosk2.png", "alt": "kiosk2", "category": "Kiosk" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/kiosk3.png", "alt": "kiosk3", "category": "Kiosk" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/dashify/kiosk4.png", "alt": "kiosk4", "category": "Kiosk" }
    ],
    "company": {
      "title": "Dashify",
      "slug": "dashify",
      "image": {
        "url": "https://www.dashify.com.au/wp-content/themes/dashify/images/logo.png",
        "alt": "Dashify"
      }
    }
  },
  {
    "slug": "zookal",
    "title": "Zookal Platform",
    "excerpt": "Architected and built Zookal's homework help app and core student platform, establishing modern engineering practices and scaling to millions of users.",
    "content": "<p>Led the end-to-end creation of the homework help mobile app (React Native) and bootstrapped the new core student web app (React). Established modern architecture with React Query, Zustand, and a custom design system.</p><h3>Key Achievements</h3><ul><li>Architected and implemented in-app purchase (IAP) subscription flow with webhook integrations.</li><li>Integrated product subscriptions into Shopify checkout, boosting subscriber conversion.</li><li>Established monitoring/observability with Sentry and New Relic.</li><li>Bootstrapped CI/CD pipelines (CircleCI, CodePush) for rapid mobile releases.</li></ul>",
    "image": {
      "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/zookal/zookal1.png",
      "alt": "Zookal Platform",
      "width": 800,
      "height": 600
    },
    "tags": [
      { "name": "TypeScript", "slug": "typescript" },
      { "name": "React", "slug": "react" },
      { "name": "React Native", "slug": "react-native" },
      { "name": "AWS CDK", "slug": "aws-cdk" },
      { "name": "PostgreSQL", "slug": "postgresql" }
    ],
    "gallery": [
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/zookal/zookal1.png", "alt": "Zookal App Interface", "category": "Web" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/zookal/zookal2.png", "alt": "Zookal Features", "category": "Web" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/zookal/zookal3.png", "alt": "Student Platform", "category": "Web" },
      { "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/zookal/zookal4.png", "alt": "Study Tools", "category": "Web" }
    ],
    "company": {
      "title": "Zookal",
      "slug": "zookal",
      "image": {
        "url": "https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/zookal/zookal.png",
        "alt": "Zookal"
      }
    }
  },
  {
    "slug": "the-ceo-magazine-website",
    "title": "The CEO Magazine Website",
    "excerpt": "Developed the whole website from end to end including server side. Migrated everything from old server (siteground) all the data, files into AWS. Applied different latest technologies to improve speed, optimisation and user experience.",
    "content": "<p>Developed the whole website from end to end including server side. Migrated everything from old server (siteground) all the data, files into AWS. Applied different latest technologies to improve speed, optimisation and user experience.</p>\n<h2>Front End technologies</h2>\n<ul>\n<li><strong>ReactJs</strong> and <strong>NextJs</strong>(SSR framework)</li>\n<li><strong>MobX</strong> for state management</li>\n<li><strong>HTML</strong>, <strong>CSS 3 technology</strong>, <strong>Bootstrap</strong> for Responsive Design</li>\n<li><strong>Webpack</strong> for running/bundling assets</li>\n</ul>\n<h2>Back End technologies</h2>\n<ul>\n<li><strong>WordPress</strong> as CMS</li>\n<li><strong>WordPress API</strong> for the payload</li>\n<li><strong>PHP</strong> for the wordpress programming language</li>\n<li><strong>NodeJs</strong> as a custom server to run the application</li>\n</ul>\n<h2>AWS technologies</h2>\n<ul>\n<li><strong>NGINX and Apache</strong> as web servers</li>\n<li><strong>Cloudfront</strong> for <em>geolocation</em>, additional <em>caching</em>, and <em>CDN</em> for files (images, pdf) etc</li>\n<li><strong>API Gateway</strong> as proxy for all API + <em>data caching</em> technology </li>\n<li><strong>ELB</strong> for load balancing requests</li>\n<li>Please see <a href=\"https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_infrastructure.png\" target=\"_blank\"> this </a> for a better view of how I strategised our AWS cloud infrastructure</li>\n</ul>\n<h2>Involvement</h2>\n<ul>\n<li>September 2016 to August 2018</li>\n<li>Built everything from scratch using latest technologies</li>\n<li>Develop and improve features and processes</li>\n<li>Maintain and make sure everything is working as per the requirement</li>\n</ul>\n",
    "image": {
      "url": "https://felixstatic.s3.amazonaws.com/uploads/2018/08/Screen-Shot-2018-08-14-at-3.04.44-PM-768x668.png",
      "alt": "The CEO Magazine Website",
      "width": 768,
      "height": 668
    },
    "tags": [
      {
        "name": "AWS",
        "slug": "aws"
      },
      {
        "name": "HTML 5 &amp; CSS 3",
        "slug": "html-5-css-3"
      },
      {
        "name": "MobX",
        "slug": "mobx"
      },
      {
        "name": "NextJs",
        "slug": "nextjs"
      },
      {
        "name": "NodeJs",
        "slug": "nodejs"
      },
      {
        "name": "ReactJs",
        "slug": "reactjs"
      },
      {
        "name": "Wordpress API",
        "slug": "wordpress-api"
      }
    ],
    "gallery": [
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_website/website1.png",
        "alt": "Default",
        "category": "Website"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_website/website2.png",
        "alt": "Home",
        "category": "Website"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_website/website_mobile1.png",
        "alt": "Archive",
        "category": "Mobile"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_website/website_mobile2.png",
        "alt": "Mobile",
        "category": "Mobile"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_website/website7.png",
        "alt": "Home",
        "category": "Website"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_website/website8.png",
        "alt": "Post",
        "category": "Website"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_website/website3.png",
        "alt": "Post View",
        "category": "Website"
      }
    ],
    "company": {
      "title": "The CEO Magazine",
      "slug": "the-ceo-magazine",
      "image": {
        "url": "https://via.placeholder.com/800x600",
        "alt": ""
      }
    }
  },
  {
    "slug": "the-ceo-magazine-intranet",
    "title": "The CEO Magazine Intranet",
    "excerpt": "Custom built Intranet to automate manual workflows, integrate all company third party platforms, produce statistics, analytics and reports.",
    "content": "<p>Custom built Intranet to automate manual workflows, integrate all company third party platforms, produce statistics, analytics and reports.</p>\n<ul>\n<li>Company internal system for employees across the globe</li>\n<li>Middle man for all the integrations with other platforms. See <a href=\"#intranet-dashboard\">Cloud Infastructure</a></li>\n<li>Integrated with Microsoft Office 365 for SSO</li>\n<li>Integrated with different 3rd-party platforms such as Salesforce, Google, Chargify, Magento, etc</li>\n<li>Automates manual workflows</li>\n</ul>\n<p><strong>Includes features but not limited to:</strong></p>\n<ul>\n<li>\n     <a href=\"#intranet-dashboard\"> Dashboard</a> &#8211; includes sales, reports, analytics, statistics, social media followers count, etc\n   </li>\n<li>\n    <a href=\"#intranet-tickets\">Ticketing &#038; Project Management Tool</a> &#8211; smaller scale JIRA application\n   </li>\n<li>\n     <a href=\"#intranet-sprintboard\"> Sprint board</a> &#8211; similar with Trello application\n   </li>\n<li>\n     <a href=\"#intranet-custom\"> Asset Management Tool</a> &#8211; for tracking company assets (history, receipt, etc)\n   </li>\n<li>\n     <a href=\"#intranet-custom\"> Calendar Booking Tool</a> &#8211; ability to reserve boardroom\n   </li>\n<li>\n      <a href=\"#intranet-kb\">Centralised Knowledge base</a>\n   </li>\n<li>\n      <a href=\"#intranet-custom\">Employee details, history, etc</a>\n   </li>\n<li>Company news, rules &#038; policies, etc</li>\n<li>Company wide survey with reporting</li>\n</ul>\n<h2>Involvement</h2>\n<ul>\n<li>September 2016 to August 2018</li>\n<li>Built everything from scratch using different technologies</li>\n<li>Develop and improve features and processes</li>\n<li>Integrated everything with every platform the company use</li>\n<li>Maintain and make sure everything is working as per the requirement</li>\n</ul>\n",
    "image": {
      "url": "https://felixstatic.s3.amazonaws.com/uploads/2018/08/Screen-Shot-2018-08-14-at-2.56.45-PM-768x530.png",
      "alt": "The CEO Magazine Intranet",
      "width": 768,
      "height": 530
    },
    "tags": [
      {
        "name": "AWS",
        "slug": "aws"
      },
      {
        "name": "Chargify API",
        "slug": "chargify-api"
      },
      {
        "name": "HTML 5 &amp; CSS 3",
        "slug": "html-5-css-3"
      },
      {
        "name": "jQuery",
        "slug": "jquery"
      },
      {
        "name": "Magento API",
        "slug": "magento-api"
      },
      {
        "name": "PHP",
        "slug": "php"
      },
      {
        "name": "Salesforce",
        "slug": "salesforce"
      },
      {
        "name": "Wordpress API",
        "slug": "wordpress-api"
      }
    ],
    "gallery": [
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag-db.png",
        "alt": "Dashboard, Cloud Infrastructure",
        "category": "Dashboard"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_infrastructure.png",
        "alt": "Dashboard",
        "category": "Infrastructure"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_it2.png",
        "alt": "Cloud Infastructure",
        "category": "IT Support"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_it1.png",
        "alt": "Ticketing system",
        "category": "IT Support"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_it4.png",
        "alt": "Tickets Portal",
        "category": "IT Support"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_it6.png",
        "alt": "submitting ticket",
        "category": "IT Support"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_ticket1.png",
        "alt": "viewing ticket",
        "category": "IT Support"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_ticket2.png",
        "alt": "viewing ticket 2",
        "category": "IT Support"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_ticket3.png",
        "alt": "Project Management tool",
        "category": "IT Support"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_custom5.png",
        "alt": "Projects Portal",
        "category": "Custom Tools"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/sprintboard2.png",
        "alt": "Project List",
        "category": "Sprintboard"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_kb1.png",
        "alt": "Project view",
        "category": "Knowledge Base"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/kb-2.png",
        "alt": "Sprintboard",
        "category": "Knowledge Base"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_it3.png",
        "alt": "sprint board 1",
        "category": "IT Support"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_custom1.png",
        "alt": "sprint board 2",
        "category": "Custom Tools"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_custom3.png",
        "alt": "Knowledge base",
        "category": "Custom Tools"
      }
    ],
    "company": {
      "title": "The CEO Magazine",
      "slug": "the-ceo-magazine",
      "image": {
        "url": "https://via.placeholder.com/800x600",
        "alt": ""
      }
    }
  },
  {
    "slug": "the-ceo-magazine-shop",
    "title": "The CEO Magazine Shop",
    "excerpt": "An e-commerce (Magento Platform) website the company use to sell magazines and subscriptions. ",
    "content": "<p>An e-commerce (Magento Platform) website the company use to sell magazines and subscriptions. </p>\n<h2>Functionalities</h2>\n<ul>\n<li>List and filter products</li>\n<li>View specific product</li>\n<li>Buy product using <em>Eway payment gateway</em> and ship to your address</li>\n<li>Login as user &#8211; view your history, subscriptions, newsletters, etc</li>\n</ul>\n<h2>AWS technologies</h2>\n<ul>\n<li><strong>Apache</strong> for web server</li>\n<li><strong>Cloudfront</strong> for <em>geolocation</em>, additional <em>caching</em>, and <em>CDN</em> for files (images, pdf) etc</li>\n<li><strong>API Gateway</strong> as proxy for all API + <em>data caching</em> technology </li>\n<li><strong>ELB</strong> for load balancing requests</li>\n<li>Please see <a href=\"https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_intranet/ceomag_infrastructure.png\" target=\"_blank\"> this </a> for a better view of how I strategised our AWS cloud infrastructure</li>\n</ul>\n<h2>Involvement</h2>\n<ul>\n<li>September 2016 to August 2018</li>\n<li>Migrated everything from old server (Siteground) to AWS</li>\n<li>Develop and improve features and processes</li>\n<li>Maintain and make sure everything is working as per the requirement</li>\n</ul>\n",
    "image": {
      "url": "https://felixstatic.s3.amazonaws.com/uploads/2018/08/Screen-Shot-2018-08-14-at-3.02.48-PM-768x600.png",
      "alt": "The CEO Magazine Shop",
      "width": 768,
      "height": 600
    },
    "tags": [
      {
        "name": "AWS",
        "slug": "aws"
      },
      {
        "name": "HTML 5 &amp; CSS 3",
        "slug": "html-5-css-3"
      },
      {
        "name": "Javascript",
        "slug": "javascript"
      },
      {
        "name": "jQuery",
        "slug": "jquery"
      },
      {
        "name": "Magento",
        "slug": "magento"
      },
      {
        "name": "PHP",
        "slug": "php"
      },
      {
        "name": "Salesforce",
        "slug": "salesforce"
      }
    ],
    "gallery": [
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_shop/shop_1.png",
        "alt": "Shop",
        "category": "Shop"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_shop/shop2.png",
        "alt": "List",
        "category": "Shop"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/ceomag_shop/shop3.png",
        "alt": "Checkout",
        "category": "Shop"
      }
    ],
    "company": {
      "title": "The CEO Magazine",
      "slug": "the-ceo-magazine",
      "image": {
        "url": "https://via.placeholder.com/800x600",
        "alt": ""
      }
    }
  },
  {
    "slug": "dot-acs",
    "title": "DOT &#8211; ACS",
    "excerpt": "Company Internal Web based system used for getting surveys, registration to be an accredited establishment, track of events/festivals, and for tracking of tourists and shipping ports who go in and out in the Philippines. ",
    "content": "<p>Company Internal Web based system used for getting surveys, registration to be an accredited establishment, track of events/festivals, and for tracking of tourists and shipping ports who go in and out in the Philippines. </p>\n<h2>Involvement</h2>\n<ul>\n<li>March to October 2014</li>\n<li>Whole team is composed of 10 developers with 6 modules</li>\n<li>Lead a whole module with one additional resource</li>\n<li>Presented the project to the managers and client</li>\n</ul>\n",
    "image": {
      "url": "https://felixstatic.s3.amazonaws.com/uploads/2018/08/acs7-440x314.jpeg",
      "alt": "DOT &#8211; ACS",
      "width": 440,
      "height": 314
    },
    "tags": [
      {
        "name": ".NET",
        "slug": "net"
      },
      {
        "name": "AngularJs",
        "slug": "angularjs"
      },
      {
        "name": "Entity Framework",
        "slug": "entity-framework"
      },
      {
        "name": "HTML 5 &amp; CSS 3",
        "slug": "html-5-css-3"
      },
      {
        "name": "Javascript",
        "slug": "javascript"
      }
    ],
    "gallery": [
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/acs/acs1.png",
        "alt": "Default"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/acs/acs2.jpeg",
        "alt": ""
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/acs/acs3.jpeg",
        "alt": ""
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/acs/acs4.png",
        "alt": ""
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/acs/acs5.png",
        "alt": ""
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/acs/acs6.png",
        "alt": ""
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/acs/acs7.jpeg",
        "alt": ""
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/acs/acs8.jpeg",
        "alt": ""
      }
    ],
    "company": {
      "title": "Yondu",
      "slug": "yondu",
      "image": {
        "url": "https://via.placeholder.com/800x600",
        "alt": ""
      }
    }
  },
  {
    "slug": "health-maintenance-system",
    "title": "Health Maintenance System",
    "excerpt": "Health Insurance Web based system for internal/external processes. Features includes creation of contracts, benefits, services, payments and refunds.",
    "content": "<p>Health Insurance Web based system for internal/external processes. </p>\n<h2>Some features include</h2>\n<ul>\n<li>creation of account contracts</li>\n<li>benefits</li>\n<li>services</li>\n<li>payments</li>\n<li>refunds</li>\n</ul>\n<h2>Involvement</h2>\n<ul>\n<li>June 2013 to January 2014</li>\n<li>Whole team is composed of 8 developers with 5 modules</li>\n<li>Lead a whole module with one additional resource</li>\n<li>Presented the project to the managers and client</li>\n</ul>\n",
    "image": {
      "url": "https://felixstatic.s3.amazonaws.com/uploads/2018/08/hmi1-768x354.png",
      "alt": "Health Maintenance System",
      "width": 768,
      "height": 354
    },
    "tags": [
      {
        "name": "Hibernate",
        "slug": "hibernate"
      },
      {
        "name": "HTML 5 &amp; CSS 3",
        "slug": "html-5-css-3"
      },
      {
        "name": "Java",
        "slug": "java"
      },
      {
        "name": "Javascript",
        "slug": "javascript"
      },
      {
        "name": "jQuery",
        "slug": "jquery"
      },
      {
        "name": "Spring",
        "slug": "spring"
      }
    ],
    "gallery": [
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/hmi/hmi1.png",
        "alt": "Default"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/hmi/hmi2.png",
        "alt": "first"
      },
      {
        "url": "https://felixstatic.s3.amazonaws.com/uploads/images/hmi/hmi3.png",
        "alt": "second"
      }
    ],
    "company": {
      "title": "Yondu",
      "slug": "yondu",
      "image": {
        "url": "https://via.placeholder.com/800x600",
        "alt": ""
      }
    }
  }
];
