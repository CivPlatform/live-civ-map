# Live Civ Map

Log in with Discord and edit a map, live updating changes between all connected users.

Multiple layers for different access restrictions.

## Set up your own Map Server

Easy setup: [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Manual setup:
- install the dependencies: `yarn --cwd=server --production=false install`
- build the server: `yarn --cwd=server build`
- deploy `server/dist/` as well as `server/node_modules/` to your server
- set the `DATABASE_URL` environment variable, for example `postgres://localhost:5432/postgres`
- launch the server: `node sever/dist/main.js`

## Set up a Map Website

- create a [Discord App](https://discord.com/developers/applications)
	- copy the App id for later, it looks like `123123123123123123`
	- configure an OAuth2 Redirect URI matching your website domain, for example `https://live-civ-map.netlify.app/`
- if you want to host it on Netlify, use the following settings:
	- "use subdirectory": `web/`
	- "build command": `yarn build`
	- "publish directory": `web/build/`
	- configure the environment variables as below
- if you want to build it yourself and host the static files, e.g. on Github Pages:
	- set up the environment variables as below
	- `yarn --cwd=web build`
	- copy everything under `web/build/` into your web root

#### Environment variables
```properties
# replace with your own values
REACT_APP_DISCORD_APP_ID=123123123123123123
REACT_APP_DISCORD_OAUTH2_REDIRECT_URI=https://live-civ-map.netlify.app/
```

> The `REACT_APP_` prefix is required by ReactJS; other environment variables are not acessible. ([More info](https://create-react-app.dev/docs/adding-custom-environment-variables/))
>
> **WARNING:** Do not store any secrets (such as private API keys) in your React app!
>
> These environment variables are embedded into the build, meaning anyone can view them by inspecting your app's files.

## Development setup

- install Postgresql, NodeJS, Yarn
- the following commands assume they are run in the project root; you can leave out the `--cwd=server` if you `cd server/` first
- create a database: `yarn --cwd=server pg:init`
- start the database: `yarn --cwd=server pg:start`
	- to stop it later: `yarn --cwd=server pg:stop`
	- to run queries: `yarn --cwd=server psql`
- install the server dependencies: `yarn --cwd=server install`
- build and launch the server: `yarn --cwd=server build && yarn --cwd=server start`
	- this reads the `DATABASE_URL` environment variable if set, defaulting to `postgres://localhost:5432/postgres` which matches the setup above
- install the web dependencies: `yarn --cwd=web install`
- create a [Discord App](https://discord.com/developers/applications) for the login functionality
	- add the OAuth2 Redirect URI `http://localhost:3000` (ReactJS development server default port)
- create a `web/.env` file like [here](#environment-variables)
- start the web app in development mode: `yarn --cwd=web start`
