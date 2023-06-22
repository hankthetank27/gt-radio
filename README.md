# Great Tunes Radio

Great Tunes Radio is an archival project, broadcasting music posted in the seminal Great Tunes Facebook group between 2012 - 2023. The broadcast livestreams songs at random from the archive. After playing a song which has not previously been aired, the audio link and additional information about the original post will be available to view and listen back to on the archive page, incrementally rolling out each song and post to the public as the radio plays new music. Users can also join a live chat that accompanies the stream. For more information about the project and to see/listen to it in action, visit [greattunes.net](https://greattunes.net).

## Requirements

To run locally, you will need Node.js version 16 or higher installed.

A connection to a MongoDB database is also required, and since this project it intended grab information about posts to broadcast from the database, it's recommended that you run [this](https://github.com/hankthetank27/facebook-group-media-scraper) script to populate your database with some dummy data from any Facebook group with some YouTube links.

## Usage

To get started, install the dependencies by running

```
npm i
```

You will also need to create a `.env` file in the root directory in order to create environment variables for the MongoDB connection string, and a JSON Web Token key (this can be anything).

Example:

```env
DEV_ARCHIVE_CONNECTION_STRING=mongodb+srv://mymongouri
JWT_KEY=a8d6d88040eyb9b5aa13a132d930be08766b2e80164b04235cf3d87f13d54b30f1da1908700f8
```

To start the server run

```
npm run dev
```

It is not recommended that you run it production mode at the time being, as it will try to fetch resources for streaming from the deployed project.

