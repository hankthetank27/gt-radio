// init-db.js
db.createCollection("gt_posts");

db.gt_posts.insertMany([
  {
    user_name: "Brian Piñeyro",
    track_title: "Love Inc - Life's a Gas",
    link: "https://www.youtube.com/watch?v=QJTz5OE3h0c&fbclid=IwAR1KaUGeaPEVc_QO70ndTnisyo6yFklegq2f1YmRA_s4fiil-cwkJAYcOrM",
    link_source: "youtube",
    date_posted: new Date(1416793080000),
    reacts: 45,
    has_been_played: true,
    date_aired: new Date(1717991055862),
    s3_file_data: {
      bucket: "great-tunes-music",
      key: "Love Inc - Life's a Gas.mp3",
      etag: "\"c81c6799ec17facc0da14fc7e0f6a416-3\"",
      location: "https://great-tunes-music.s3.us-east-1.amazonaws.com/Love+Inc+-+Life%27s+a+Gas.mp3",
      duration: "907",
      channel: "http://www.youtube.com/@trashcandor",
      itag: 140,
      length: 14665575
    }
  },
  {
    user_name: "Forest Gilbakian",
    track_title: "Love Spirals Downwards - City Moon",
    text: "https://www.youtube.com/watch?v=5AYvyk2PLI0",
    link: "https://www.youtube.com/watch?v=5AYvyk2PLI0&fbclid=IwAR02c24R8yz_a5q1GySOzeIGI3yEd9ahYz7lVufLqvIsWxmBkcLk2a6yRe0",
    link_source: "youtube",
    date_posted: new Date(1675513080000),
    reacts: 2,
    has_been_played: false,
    date_aired: new Date(1714618046870),
    s3_file_data: {
      bucket: "great-tunes-music",
      key: "Love Spirals Downwards - City Moon.mp3",
      etag: "\"ce5888b955300c2828ee018e9a3fd5e1\"",
      location: "https://great-tunes-music.s3.us-east-1.amazonaws.com/Love%20Spirals%20Downwards%20-%20City%20Moon.mp3",
      duration: "258",
      channel: "http://www.youtube.com/@MorTunia",
      itag: 140,
      length: 4161053
    }
  },
  {
    user_name: "Nathan Albert",
    track_title: "Games People Play",
    text: "one long chorus",
    link: "https://www.youtube.com/watch?v=x7_UpepeK3E&fbclid=IwAR1lr3jhkUY75ggALgEUj5BLwLtkYYvD2myx-QR-E7bblApaX7pNEBclC6M",
    link_source: "youtube",
    date_posted: new Date(1647630660000),
    reacts: 1,
    has_been_played: false,
    date_aired: new Date(1716946808993),
    s3_file_data: {
      bucket: "great-tunes-music",
      key: "Games People Play.mp3",
      etag: "\"6590e0400159103d41931bbae7bb5edb\"",
      location: "https://great-tunes-music.s3.us-east-1.amazonaws.com/Games%20People%20Play.mp3",
      duration: "144",
      channel: "http://www.youtube.com/channel/UCXJscayh5BT8m2ZVFQSdeVw",
      itag: 251,
      length: 2413142
    }
  },
  {
    user_name: "Dan Lyke",
    track_title: "Playboy",
    text: "crushhh",
    link: "https://www.youtube.com/watch?v=w-R6zXshQxs&fbclid=IwAR0FifKDM5KsyDgbd_5ZA1qDM6ywupAmEcyq87XjySi-SuQ_cYxDxisOIJI",
    link_source: "youtube",
    date_posted: new Date(1633770360000),
    reacts: 3,
    has_been_played: true,
    date_aired: new Date(1723780103104),
    s3_file_data: {
      bucket: "great-tunes-music",
      key: "Playboy.mp3",
      etag: "\"ea49f6cbf535c0a6d7af389144dcc641\"",
      location: "https://great-tunes-music.s3.us-east-1.amazonaws.com/Playboy.mp3",
      duration: "322",
      channel: "http://www.youtube.com/channel/UCtMX1Y_zULLZ3hnyjWGM_yg",
      itag: 251,
      length: 5052836
    }
  },
  {
    user_name: "Marek Moskal",
    track_title: "Noel Silent Morning 12' Club Mix",
    link: "https://www.youtube.com/watch?v=rslemybSjT0&fbclid=IwAR2l7t0E-aXF4jjJ9MmtcvBPR8OV85S52awXPUp_j_8dKxU90sN7TVdmYEg",
    link_source: "youtube",
    date_posted: new Date(1641372960000),
    reacts: 3,
    has_been_played: false,
    date_aired: new Date(1722236909093),
    s3_file_data: {
      bucket: "great-tunes-music",
      key: "Noel  Silent Morning 12' Club Mix.mp3",
      etag: "\"957ee3b80cf06ad57c76ee0845635442-2\"",
      location: "https://great-tunes-music.s3.us-east-1.amazonaws.com/Noel++Silent+Morning+12%27+Club+Mix.mp3",
      duration: "421",
      channel: "http://www.youtube.com/@jeje12301",
      itag: 251,
      length: 6917525
    }
  },
  {
    user_name: "Dan Lyke",
    track_title: "Randy Newman, \"My Life Is Good\" on Letterman, May 10, 1984",
    text: "sigh",
    link: "https://www.youtube.com/watch?v=BVoV1fyMbWw&fbclid=IwAR3ZIRLMa6Y962LuOlgHVvGy5QXuG22SZbspT_N52qGSSNfzj0lvaaWeGH0",
    link_source: "youtube",
    date_posted: new Date(1619881440000),
    reacts: 1,
    has_been_played: false,
    date_aired: new Date(1717563968737),
    s3_file_data: {
      bucket: "great-tunes-music",
      key: "Randy Newman, \"My Life Is Good\" on Letterman, May 10, 1984.mp3",
      etag: "\"4f53f1e4735183ecaef947da28f60ec6-2\"",
      location: "https://great-tunes-music.s3.us-east-1.amazonaws.com/Randy+Newman%2C+%22My+Life+Is+Good%22+on+Letterman%2C+May+10%2C+1984.mp3",
      duration: "522",
      channel: "http://www.youtube.com/@dongiller",
      itag: 140,
      length: 8438721
    }
  },
  {
    user_name: "Anna Elisa",
    track_title: "Colleen - \"Hidden in the Current\" (official music video)",
    text: "This and a blunt",
    link: "https://youtu.be/BdFcZszuDBM?fbclid=IwAR3leilqW9R7maFgNlGOQDxzy3Lx1pOru2FtykHjNSaSsl9z6Xk8xw-AXyU",
    link_source: "youtube",
    date_posted: new Date(1621628640000),
    reacts: 1,
    has_been_played: false,
    date_aired: new Date(1718248761460),
    s3_file_data: {
      bucket: "great-tunes-music",
      key: "Colleen - \"Hidden in the Current\" (official music video).mp3",
      etag: "\"3836d755593d94e29d5c3c0e7e521e67\"",
      location: "https://great-tunes-music.s3.us-east-1.amazonaws.com/Colleen%20-%20%22Hidden%20in%20the%20Current%22%20%28official%20music%20video%29.mp3",
      duration: "297",
      channel: "http://www.youtube.com/@ThrillJockeyRecords",
      itag: 251,
      length: 4669732
    }
  }
]);
