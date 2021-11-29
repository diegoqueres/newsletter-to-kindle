# newsletter-to-kindle

**newsletter-to-kindle** is a NodeJS application to create a service for reading newsletter RSS feed regularly and deliver content to Kindle devices. 

Content is delivered using _Amazon&#39;s Send to Kindle service_. See more at [https://www.amazon.com/gp/sendtokindle/email](https://www.amazon.com/gp/sendtokindle/email).

## Motivation
Like most people, I get a lot of newsletters in my email inbox talking about very interesting subjects _(and others not so)_. But as a regular Kindle user, I was unhappy about having to read these newsletters on my cell phone or computer. I missed reading this content on my Kindle device!
So I was thinking about creating a project for this purpose, researching how it could work. I saw that most newsletters had RSS feeds to subscribe and there is also Amazon's Send to Kindle service. 
I developed an initial prototype to send the content of one newsletter to my Kindle device only. And when I was checking the results, little by little, new ideas were emerging and I made more improvements until the project we have today. 
This api can be used soon by content creators who wish to make their newsletter content available to this audience.

## How it works?
![Infographic](/images/infographic.gif)

## Requirements
1. NodeJS;
2. MySQL server;
3. SMTP server and an email address to post and convert articles to Kindle email;
4. Configure *Amazon Send to Kindle* service to receive messages from this email;

### External services
Services that are not mandatory to run in a development environment, but to have the application running with all functionalities, they must be used.
The application is ready for the services below, but you can use services from anothers providers _(as long as you make adaptations, of course)_.
1. Loggly;
2. Microsoft Translation API.

## Installation
Clone the project and them run to install Node packages.
```bash
npm install
```
You must create a local MySQL database _(by the official installer or docker, as you wish)_.

After that, you must create an **.env file**, entering the appropriate values for your environment. 
See _.env.example_ to see all environment variables must be filled. This can help you to create your own _.env_ file.

Now you must run database migrations.
```bash
npx sequelize-cli db:migrate
```

Run seeders to create initial settings. It will create the first user of api, _an admin user_, which must be created when the application is installed.
```bash
npx sequelize-cli db:seed:all
```

After that, run the following command to start api in development mode. 
```bash
npm run dev
```

To run api delivery job of newsletters, run the following command:
```bash
npm run jobs
```

## Usage

You must publish api and start api service with command:
```bash
npm run api
```

You must now manipulate the API. We haven't finalized a frontend project yet. See the Postman api documentation in _docs/postman_ for more information.

Now login to the API through the authentication endpoint: **Auth -> Login** _(if you don't have a registered user, you will have to create one or use the default admin user)_.

Create a new newsletter through the appropriate endpoint: **Newsletter -> Create**.

Provide to your subscribers with a page where they can subscribe for the service (**Subscriptions -> Create**), and instructions about how to use _Amazon&#39;s Send to Kindle service_. Providing all the necessary information, especially **the email address of the application** that will deliver the newsletters. See more at [https://www.amazon.com/gp/sendtokindle/email](https://www.amazon.com/gp/sendtokindle/email), to help you to create the instructions page.

You can include an acceptance to the terms of use and explain that the user will receive a post to confirm enrollment on their Kindle. All newsletters received will contain links for the user to unsubscribe from the service. Please note that your newsletter subscription and this service are treated as separate mechanisms. But you can subscribe/unsubscribe then from both, as you wish.

You can enable/disable delivery of newsletters and also delete newsletters/subscriptions at any time using the appropriate endpoints.

## Avaiable Languages
- Brazilian Portuguese;
- English.

## Project Status
🚀 _Beta version_ 🚧

## Version
_0.9.2: Beta version._

## Features
- [x] Read newsletter feed content and post articles to kindle delivery email;
- [x] Registration of multiple feeds;
- [x] Article translations _(full or bilingual translation, based on Microsoft Translator API)_;
- [x] Rest API to manage newsletters, users and subscriptions;
- [x] Log of submitted articles to improve the delivery verification;


- _(optional)_ Allow sending article images _(Need better tests of Amazon Send to Kindle. Apparently it fails to deliver a portion of the images)_.
- _(optional)_ The application currently sends 1 file for each article. Perhaps this can be improved in the future.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Please make sure to update tests as appropriate.

### Frontend Project
It is under development by [Samuel Mota](https://github.com/samuel-mota) .
**Frontend Project**: [https://github.com/samuel-mota/newsletter-to-kindle-front](https://github.com/samuel-mota/newsletter-to-kindle-front) 

## Credits
[Diego Queres](https://github.com/diegoqueres)

## License
[MIT](https://choosealicense.com/licenses/mit/)
