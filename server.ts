const next = require('next')
import routes from './routes';
import { NowRequest, NowResponse } from '@now/node'
const app = next({dev: (process.env.NODE_ENV !== 'production' ) })
const express = require('express');
const path = require('path');
const server = express();
const fetchData = require('isomorphic-unfetch');
const moment = require('moment');

app.prepare()
  .then(() => {

    type ServerTypes = {
      req: NowRequest;
      res: NowResponse;
      route: any;
      query: any;
    }
    const handler = routes.getRequestHandler(app, ({req, res, route, query}: ServerTypes) => {
      app.render(req, res, route.page, query)
    })

    const bodyParser = require('body-parser')
    const cors = require('cors')
    const compression = require('compression')

    server.use(handler)
          .use(compression)
          .use(cors)
          .use(bodyParser.json())
          .listen();

    })
.catch((ex: any) => {
  console.error(ex.stack)
  process.exit(1)
})

async function generateJSONData({posttype}: any){
  const url = `https://whoisfelix.com/wordpress/wp-json/wp/v2/${posttype}?_embed=true&orderby=menu_order&per_page=99`;
  console.log(url);
  const promise =  await fetchData(url);
  const data = await promise.json();
  writeFile({text: JSON.stringify(data), filename: `${posttype}.json`});
}

function writeFile(data: any){
  try{
    const fs = require('fs');
    fs.writeFile( path.resolve(`${__dirname}/static/${data.filename}`), data.text , (error: any) => { console.log(error); });
  }catch(error){ console.log('error writefile: ' + data)}
}

async function generateSitemap(){

  let finalXmlText = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                        <url>
                          <loc>
                            https://whoisfelix.com/blog/
                          </loc>
                          <lastmod>2018-08-27</lastmod>
                        </url>
                        <url>
                          <loc>
                            https://whoisfelix.com/career/
                          </loc>
                          <lastmod>2018-08-27</lastmod>
                        </url>
                        <url>
                          <loc>
                            https://whoisfelix.com/about/
                          </loc>
                          <lastmod>2018-08-27</lastmod>
                        </url>
                        <url>
                          <loc>
                            https://whoisfelix.com/projects/
                          </loc>
                          <lastmod>2018-08-27</lastmod>
                        </url>
                      `;
    try{
      const sitemapDataPromiseBlog =  await fetchData(`https://whoisfelix.com/blog.json`);
      const sitemapDataBlog = await sitemapDataPromiseBlog.json();
      finalXmlText += structureSitemapUrls(sitemapDataBlog);

      const sitemapDataPromiseCareer =  await fetchData(`https://whoisfelix.com/career.json`);
      const sitemapDataCareer = await sitemapDataPromiseCareer.json();
      finalXmlText += structureSitemapUrls(sitemapDataCareer);

      const sitemapDataPromiseProjects =  await fetchData(`https://whoisfelix.com/projects.json`);
      const sitemapDataProjects = await sitemapDataPromiseProjects.json();
      finalXmlText += structureSitemapUrls(sitemapDataProjects);

    }catch(error){ console.log(error); console.log('error sitemap');}
    finalXmlText += `</urlset>`;

  writeFile({text: finalXmlText, filename: 'sitemap.xml'});
}

function structureSitemapUrls(data: any){
    if(!data){
      return '';
    }
    let urlsetText = '';
    for(let i in data){
      const obj = data[i];
      urlsetText += `<url><loc>${getPostUrlPath(obj)}</loc><lastmod>${moment(obj.post_modified).format('YYYY-MM-DD')}</lastmod></url>`;
    }
   return urlsetText;
}
function getPostUrlPath(post: any){
  if(!post){
    return '';
  }
  return `https://whoisfelix.com/${post.type}/${post.slug}/`;
}
