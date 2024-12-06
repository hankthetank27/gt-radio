# Great Tunes Radio

Great Tunes Radio is an archival project, broadcasting music posted in the seminal Great Tunes Facebook group between 2012 - 2023. The broadcast livestreams songs at random from the archive. After playing a song which has not previously been aired, the audio link and additional information about the original post will be available to view and listen back to on the archive page, incrementally rolling out each song and post to the public as the radio plays new music. Users can also join a live chat that accompanies the stream. For more information about the project and to see/listen to it in action, visit [greattunes.net](https://greattunes.net).

## Requirements

To run locally, you will need [Node.js](https://nodejs.org/en/download/package-manager) version 16 or higher, and [Docker](https://www.docker.com/) installed and configured.

## Usage

To get started, first install the dependencies
```console
npm i
```

Next you will need to set up a mongoDB database. This repo provides a Docker container with some pre-configured dummy data to work with.

Build the container and run in locally at `mongodb://127.0.0.1:27017`
```console
docker build -t gt-dev-db -f Dockerfile-dev-db .
docker run -d -p 27017:27017 --name mongodb gt-dev-db
```

Now you will need to create a `.env` file in the root directory with the following variables

- `GT_ARCHIVE_CONNECTION_STRING`: MongoDB connection uri for production build.
- `DEV_ARCHIVE_CONNECTION_STRING`: MongoDB connection uri for development build.
- `JWT_KEY`: JSON Web Token key (this can be anything specific or secure for local dev).
- `ARCHIVE_KEY`: a password for users to access the 'secret archive' page.

For example
```env
GT_ARCHIVE_CONNECTION_STRING="mongodb://127.0.0.1:27017"
DEV_ARCHIVE_CONNECTION_STRING="mongodb://127.0.0.1:27017"
JWT_KEY=a8d6d88040eyb9b5aa13a132d930be08766b2e80164b04235cf3d87f13d54b30f1da1908700f8
ARCHIVE_KEY=somefunnypassword
```
And with that, you should be ready to run the thing!


To start the server in development mode
```console
npm run dev
```

Or for a production build
```console
npm run build
npm start
```

