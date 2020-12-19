# [cdn.pxseu.com](https://[cdn.pxseu.com)

[![forthebadge](https://forthebadge.com/images/badges/contains-tasty-spaghetti-code.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/made-with-typescript.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/ctrl-c-ctrl-v.svg)](https://forthebadge.com)

### About

This repo contains the full content of file uploader for free!
Please check it out and contribute if you wish to do so!

### Installation

The website requires [Node.js](https://nodejs.org/) v14+ to run.

Install the dependencies and devDependencies and start the server.
To use it to it's full potential it requires a [MongoDB](https://www.mongodb.com/) database.
Optionally if you use Cloudflare you will need to get an [Api Token](https://dash.cloudflare.com/profile/api-tokens).
For development use:

```sh
$ nano .env
MONGODB_URI =  # (Your database for development)
$ npm install  # or yarn
$ npm run dev  # or yarn dev
```

And for production please do:

```sh
$ nano .env
CDN_BASE_URL =  # (Base url for the file uploader)
MONGODB_URI =  # (Your database)
CF_API =  # (Cloudflare Api Token)  # If not using leave empty
CF_ZONE =  # (Cloudflare Zone Id)  # If not using leave empty
$ npm install # or yarn
$ npm run deploy # or yarn deploy
$ npm run prod # or yarn prod
```
