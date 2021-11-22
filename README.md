# newsletter-to-kindle

**newsletter-to-kindle** is a NodeJS application to create a service for reading RSS feeds regularly and deliver content to Kindle devices. 

Content is delivered using _Amazon&#39;s Send to Kindle service_. See more at [https://www.amazon.com/gp/sendtokindle/email](https://www.amazon.com/gp/sendtokindle/email).

## Motivation
I get a lot of mailings in my email talking about very interesting subjects. But as a regular Kindle user, I was unhappy about having to read them on my cell phone or computer. I missed reading this content on my Kindle device.
So I was thinking about creating a project for this purpose, researching how it could work. I saw that most mailings had RSS feeds to subscribe and also Amazon's Send to Kindle service. 
I developed an initial prototype to send the content of a Mailing only. And when I was checking the results, little by little, new ideas were emerging and I made more improvements until the project we have today. 
The application may be used in the future by content creators who wish to make their newsletter content available to their audience.

## How it works?
![Infographic](/images/infographic.gif)

## Requirements
1. SMTP server and e-mail to post and convert articles to Kindle e-mail;
2. Configure Send to Kindle to receive messages from your e-mail;
3. MySQL server;

## Installation
Clone the project and them run to install Node packages.
```bash
npm install
```

After that, you must create an .env file, entering the appropriate values for your environment. See _.env.example_ to see all environment variables must be filled and helping you to create your own .env file.

Now you must run database migrations.
```bash
npx sequelize-cli db:migrate
```

Change seed file _(in &#39;seeders&#39; folder)_ inserting your newsletters _(like the model bellow)_.
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Newsletters', [
      {
        name: 'My Newsletter',
        feedUrl: 'https://www.user.com/newsletter/feed',
        author: 'User',
        partial: false,
        subject: 'Daily Message',
        locale: 'en-US',
        articleSelector: null,
        maxPosts: 1,
        updatePeriodicity: Newsletter.PERIODICITY.DAILY,
        dayOfWeek: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        translationTarget: 'pt-BR',
        translationMode: Translator.MODE.FULL
      },
      /*
      {   
          name: ..........................
          //Insert more newsletters, as you wish...
      }
      */
    ], {});   
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Newsletters', null, {});
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
_0.9.0: Experimental version._

## Features
- [x] Read newsletter feed content and post articles to kindle delivery e-mail;
- [x] Registration of multiple feeds;
- [x] Article translations (full or bilingual translation, based on Azure Translator API);
- [x] Rest API to manage newsletters, users and subscriptions;
- [x] Log of submitted articles to improve the delivery verification;


- _(optional)_ Allow sending article images _(Need better tests of Amazon Send to Kindle. Apparently it fails to deliver a portion of the images)_.
- _(optional)_ The application currently sends 1 file for each article. It can allow sending a file containing multiple related articles.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
Please make sure to update tests as appropriate.

## Credits
[Diego Queres](https://github.com/diegoqueres)

## License
[MIT](https://choosealicense.com/licenses/mit/)
