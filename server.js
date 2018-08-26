// server.js
const next = require('next')
const routes = require('./routes')
const app = next({dev: (process.env.NODE_ENV !== 'production' ) })
const handler = routes.getRequestHandler(app)
const express = require('express');
const path = require('path');
const server = express();
const fetch = require('isomorphic-unfetch');

  app.prepare()
    .then(() => {

      server.use('/blog.json', express.static(path.join(__dirname, '/static/blog.json')));
      server.use('/career.json', express.static(path.join(__dirname, '/static/career.json')));
      server.use('/projects.json', express.static(path.join(__dirname, '/static/projects.json')));
      server.use('/robots.txt', express.static(path.join(__dirname, '/static/robots.txt')));
      server.use('/sitemap.xml', express.static(path.join(__dirname, '/static/sitemap.txt')));

      const handler = routes.getRequestHandler(app, ({req, res, route, query}) => {
        app.render(req, res, route.page, query)
      })

        server.get('/generate-data',  async (req, res) => {
          await generateJSONData({posttype:'blog'});
          await generateJSONData({posttype:'career'});
          await generateJSONData({posttype:'projects'});
          await generateJSONData({posttype:'projects_by_career'});

          res.send('...');
        });

        //if (process.env.NODE_ENV === 'production') {
          const bodyParser = require('body-parser')
          const cors = require('cors')
          const compression = require('compression')
          console.log('Production '+process.env.NODE_ENV+' env..');

          server.use(handler)
                .use(compression)
                .use(cors)
                .use(bodyParser.json())
                .listen(3000);
        /*}else{
          console.log('development environment..')

          server
          .use(handler)
          .listen(3000);
        }*/

      })
.catch((ex) => {
  console.error(ex.stack)
  process.exit(1)
})

async function generateJSONData({posttype}){
  const url = `http://whoisfelix.com/wordpress/wp-json/wp/v2/${posttype}?_embed=true&orderby=menu_order&per_page=99`;
  console.log(url);
  const promise =  await fetch(url);
  const data = await promise.json();
  writeFile({text: JSON.stringify(data), filename: `${posttype}.json`});
}

function writeFile(data){
  try{
    const fs = require('fs');
    fs.writeFile( path.resolve(`${__dirname}/static/${data.filename}`), data.text , (error) => { console.log(error); });
  }catch(error){ console.log('error writefile: ' + data)}
}
