# kindle-periodical-sender

**kindle-periodical-sender** is a NodeJS application to create a service for reading RSS feeds regularly and deliver content to Kindle devices. 

Content is delivered using _Amazon&#39;s Send to Kindle service_. See more at [https://www.amazon.com/gp/sendtokindle/email](https://www.amazon.com/gp/sendtokindle/email).


## Requirements
1. SMTP server and e-mail to post and convert articles to Kindle e-mail;
2. Configure Send to Kindle to receive messages from your e-mail;
3. MySQL server;


## Installation
Clone the project and them run to install Node packages.
```bash
npm install
```

After that, you must create an .env file _(like the template bellow)_, entering the appropriate values for your environment.
```bash
#aplication config
DEBUG=<eg:true/false>

#service config
SERVICE_NAME=<Service name of application, eg: Kindle Periodical Sender>
SERVICE_EMAIL_SUBJECT=

#kindle config
KINDLE_EMAIL=<eg:user@kindle.com>

#database config
DB_HOST=<eg:localhost>
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
DB_PORT=

#smtp config
EMAIL_SMTP_SERVER=<eg:smtp.server.com>
EMAIL_SMTP_USER=
EMAIL_SMTP_EMAIL=
EMAIL_SMTP_PASSWORD=
EMAIL_SMTP_PORT=
```

Now you must run database migrations.
```bash
npx sequelize-cli db:migrate
```

Change seed file _(in &#39;seeders&#39; folder)_ inserting your feeds _(like the model bellow)_.
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Feeds', [
      {
        name: 'My Feed',
        url: 'https://www.user.com/feed',
        author: 'User',
        partial: false,
        subject: 'Daily Message',
        locale: 'en-US',
        articleSelector: null,
        maxPosts: 1,
        updatePeriodicity: Feed.PERIODICITY.DAILY,
        dayOfWeek: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      /*
      {   
          name: ..........................
          //Insert more feeds, as you wish...
      }
      */
    ], {});   
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Feeds', null, {});
  }
};
```

After that, run command to seed database with your feeds.
```bash
npx sequelize-cli db:seed:all
```

## Usage
Configure the environment variables where you will run the service. Create a cronjob to run the sender service. It must run daily: `npm run jobs`.

You can run the web server with command: `npm start` _(although the project has not your microservice architecture yet)_.

## Project Status
🚀 _Under construction_ 🚧

## Version
_0.2.1: Experimental version._

## Features
- [x] Read feed content and post articles to a single Kindle user;
- [x] Registration of multiple feeds;
- [ ] Improve and implement all necessary tests;
- [ ] Log of submitted articles to improve the delivery verification _(today it is very simple)_;


- _(optional)_ The application currently sends 1 file for each article. It can allow sending a file containing multiple related articles;
-  _(optional)_ This application is currently single user. But it can become a scalable service/support multiple users, for instance.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
Please make sure to update tests as appropriate.

## Credits
[Diego Queres](https://github.com/diegoqueres)

## License
[MIT](https://choosealicense.com/licenses/mit/)
