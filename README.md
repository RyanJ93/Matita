# Matita
Matita is an example of a very simple blogging software written using Node.js, Express and MongoDB.
I created this software in order to learn more about Node.js world, working with the framework Express and MongoDB.
For now it provides only few basic featured, such article creations, comments and user registration/login.

# Installation and usage

Installation is pretty simple, just place the project in the website root and execute the file called "app.js".
Before running the application, make sure that the following dependencies are correctly installed:

* Express ([NPM](https://www.npmjs.com/package/express))
* Express Session ([NPM](https://www.npmjs.com/package/express-session))
* Body Parser ([NPM](https://www.npmjs.com/package/body-parser))
* Cookie Parser ([NPM](https://www.npmjs.com/package/cookie-parser))
* MongoDB client ([NPM](https://www.npmjs.com/package/mongodb))
* NodeMailer ([NPM](https://www.npmjs.com/package/nodemailer))

It requires Node.js version 8 or greater and MongoDB version 3.6 or greater.

Once the environment configuration is done, you need to change configuration and settings by editing the files "settings.json" and "config.json", note that to apply changes you need to restart the application.
To change contents in the "about" page you need to edit the HTML page itself.

After content configuration, you need to create an admin user to be able to create articles, to do this you need to register your account through the application, then you have to grant admin right to the created user, to do this you need to execute the following query on the database:

`db.users.update({'_id':[USER ID]}, {'$set':{admin: true}});`

# License

You are free to edit, redistribute and use this project for both commercial and non commercial purposes, backlinks are not required but appreciated.
If you're going to add a backlink to the author, make sure to point it to my [personal website](https://www.enricosola.com).