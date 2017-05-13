import {createStore, applyMiddleware} from 'redux';
import makeReducer from 'universal/redux/makeReducer';
import thunkMiddleware from 'redux-thunk';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Html from './Html';
import printStyles from 'universal/styles/theme/printStyles';
import getWebpackPublicPath from 'server/utils/getWebpackPublicPath';

const metaAndTitle = `
  <meta charSet="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta property="description" content="Team transparency, made easy."/>
  <title>Action | Parabol Inc</title>
  <style>${printStyles}</style>
`;

const clientIds = {
  auth0: process.env.AUTH0_CLIENT_ID,
  auth0Domain: process.env.AUTH0_DOMAIN,
  cdn: getWebpackPublicPath(),
  github: process.env.GITHUB_CLIENT_ID,
  sentry: process.env.SENTRY_DSN_PUBLIC,
  slack: process.env.SLACK_CLIENT_ID,
  stripe: process.env.STRIPE_PUBLISHABLE_KEY
};

const clientKeyLoader = `window.__ACTION__ = ${JSON.stringify(clientIds)}`;

let cachedPage;
export default function createSSR(req, res) {
  const finalCreateStore = applyMiddleware(thunkMiddleware)(createStore);
  const store = finalCreateStore(makeReducer(), {});
  if (process.env.NODE_ENV === 'production') {
    if (!cachedPage) {/* eslint-disable global-require */
    const  assets = require('../../build/assets.json');
    /* eslint-enable */

        const htmlString = renderToStaticMarkup(
          // eslint-disable-next-line max-len<Html store={store} assets={assets}  clientKeyLoader={clientKeyLoader} />
        );
        cachedPage =`<!DOCTYPE html>${htmlString}`.replace('<head>', `<head>${metaAndTitle}`);
      }
        res.send(cachedPage);
  } else {
    const devHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" type="text/css" href="/static/css/font-awesome.css"/>
    </head>
    <body>
      <div id="root"></div>
      <script src="/static/vendors.dll.js"></script>
      <script src="/static/app.js"></script>
      <script>${clientKeyLoader}</script>
    </body>
    </html>
    `;
    res.send(devHtml.replace('<head>', `<head>${metaAndTitle}`));
  }
}
