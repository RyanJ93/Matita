const VERSION = '1.1.0';
//Loading required modules.
const express = require('express');
const expressSession = require('express-session');
const expressCookie = require('cookie-parser')
const mongodb = require('mongodb');
const filesystem = require('fs');
const bodyParser = require('body-parser');
const nodeMailer = require('nodemailer');
const https = require('https');
//Initializing Express framework.
const app = express();
//Loading main library.
const application = require('./library.js');
console.log('Starting up...');
//Setting up middlewares used to manage POST data, cookies and sessions.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true,
	limit: '5mb'
}));
app.use(expressSession({
	secret: 'NODEJS_SESSION_ID',
	resave: true,
    saveUninitialized: true
}));
app.use(expressCookie());
//Setting up directories containg static files.
app.use('/Resources', express.static(__dirname + '/Resources'));
app.use('/covers', express.static(__dirname + '/covers'));
console.log('Loading resources and configuration...');
try{
	//Loading settings.
	var settings = JSON.parse(filesystem.readFileSync(__dirname + '/settings.json').toString());
	//Loading supported social networks and relative icons and names.
	let socialIcons = JSON.parse(filesystem.readFileSync(__dirname + '/Resources/social.json').toString());
	//Coping configuration object.
	var variables = Object.assign({}, settings.configuration);
	var components = {};
	//Loading HTML components.
	if ( typeof(settings.components) === 'object' && settings.components !== null ){
		for ( let key in settings.components ){
			if ( typeof(settings.components[key]) === 'string' && settings.components[key] !== '' ){
				components[key] = filesystem.readFileSync(__dirname + '/' + settings.components[key]).toString();
			}
		}
		if ( typeof(settings.components.lateral) === 'string' && settings.components.lateral !== '' ){
			components.social = {
				count: 0,
				html: ''
			};
			let buffer = '';
			let socialNetworks = new Array();
			//Generating HTML code for social links.
			for ( let i = 0 ; i < settings.social.length ; i++ ){
				//Checking if the social network is supported according with "social.json".
				if ( typeof(socialIcons[settings.social[i].id]) !== 'undefined' && settings.social[i].link !== '' ){
					components.social.count++;
					components.social.html += '<li class="common-slide-lateral-section-social-element"><a class="common-slide-lateral-section-social-element-link" target="_blank" href="' + settings.social[i].link + '" title="' + socialIcons[settings.social[i].id].name + '"><div class="common-slide-lateral-section-social-element-link-icon lateral-social-icon" social="' + settings.social[i].id + '"></div></a><a class="common-slide-lateral-section-social-element-name common-text lateral-social-name" target="_blank" href="' + settings.social[i].link + '" title="' + socialIcons[settings.social[i].id].name + '">' + socialIcons[settings.social[i].id].name + '</a></li>';
					//Avoid dupplicate CSS code for social icons.
					if ( socialNetworks.indexOf() < 0 ){
						socialNetworks.push(settings.social[i].id);
						//Adding CSS code for social icon as Base64 encoded image.
						buffer += 'div[social="' + settings.social[i].id + '"]{background-image:url(\'data:image/png;base64,' + socialIcons[settings.social[i].id].icon + '\');}';
					}
				}
			}
			//Including the generated HTML and relative CSS code within 
			if ( components.social.count > 0 ){
				components.social.html = '<ul id="common-slide-lateral-section-social">' + components.social.html + '</ul>';
				components.lateral += '<style type="text/css">' + buffer + '</style>';
			}
			components.social.count = components.social.count.toString();
		}
	}
	//Processing information for RSS feed.
	if ( typeof(settings.feed) === 'object' && settings.feed !== null && typeof(settings.feed.enabled) !== 'undefined' && settings.feed.enabled === true ){
		if ( typeof(settings.feed.title) !== 'string' || settings.feed.title === '' ){
			settings.feed.title = '';
		}
		if ( typeof(settings.feed.description) !== 'string' || settings.feed.description === '' ){
			settings.feed.description = '';
		}
	}else{
		settings.feed = {
			enabled: false
		};
	}
	//Loading configuration for the server.
	var configuration = JSON.parse(filesystem.readFileSync(__dirname + '/config.json').toString());
	if ( typeof(configuration.domain) !== 'string' || configuration.domain === '' ){
		console.log('No domain specified in configuration file.');
		process.exit();
	}
	configuration.contacts.info = typeof(configuration.contacts) === 'object' && typeof(configuration.contacts.info) === 'string' && application.utils.validateEmailAddress(configuration.contacts.info) === true ? configuration.contacts.info : null;
	variables.meta.keywords = variables.meta.keywords.length === 0 ? '' : variables.meta.keywords.join(', ');
	if ( typeof(components.metatags) === 'string' ){
		//Generating HTML code for icons (favicons, mobile icons, tile theme for Microsoft).
		if ( typeof(variables.meta.icons) === 'object' && variables.meta.icons !== null ){
			//Processing mobile icons for Apple devices.
			if ( typeof(variables.meta.icons.apple) === 'object' && variables.meta.icons.apple !== null ){
				for ( let key in variables.meta.icons.apple ){
					if ( key !== '' && typeof(key) === 'string' && typeof(variables.meta.icons.apple[key]) === 'string' && variables.meta.icons.apple[key] !== '' ){
						components.metatags += '<link rel="apple-touch-icon" sizes="' + key + '" href="' + variables.meta.icons.apple[key] + '">';
					}
				}
			}
			//Processing icons and settings for Android devices.
			if ( typeof(variables.meta.icons.android) === 'object' && variables.meta.icons.android !== null ){
				for ( let key in variables.meta.icons.android ){
					if ( key !== '' && key !== 'manifest' && key !== 'themeColor' && typeof(key) === 'string' && typeof(variables.meta.icons.android[key]) === 'string' && variables.meta.icons.android[key] !== '' ){
						components.metatags += '<link rel="icon" type="image/png" sizes="' + key + '" href="' + variables.meta.icons.android[key] + '">';
					}
				}
				if ( typeof(variables.meta.icons.android.manifest) === 'string' && variables.meta.icons.android.manifest !== '' ){
					components.metatags += '<link rel="manifest" href="' + variables.meta.icons.android.manifest + '">';
				}
				if ( typeof(variables.meta.icons.android.themeColor) === 'string' && variables.meta.icons.android.themeColor !== '' ){
					components.metatags += '<meta name="theme-color" content="' + variables.meta.icons.android.themeColor + '">';
				}
			}
			//Processing icons and settings for Microsoft systems.
			if ( typeof(variables.meta.icons.microsoft) === 'object' && variables.meta.icons.microsoft !== null ){
				if ( typeof(variables.meta.icons.microsoft.tileImage) === 'string' && variables.meta.icons.microsoft.tileImage !== '' ){
					components.metatags += '<meta name="msapplication-TileImage" content="' + variables.meta.icons.microsoft.tileImage + '">';
				}
				if ( typeof(variables.meta.icons.microsoft.TileColor) === 'string' && variables.meta.icons.microsoft.TileColor !== '' ){
					components.metatags += '<meta name="msapplication-TileColor" content="' + variables.meta.icons.microsoft.TileColor + '">';
				}
			}
			//Processing favicons.
			if ( typeof(variables.meta.icons.favicon) === 'object' && variables.meta.icons.favicon !== null ){
				for ( let key in variables.meta.icons.favicon ){
					if ( key !== '' && typeof(key) === 'string' && typeof(variables.meta.icons.favicon[key]) === 'string' && variables.meta.icons.favicon[key] !== '' ){
						components.metatags += '<link rel="icon" type="image/png" sizes="' + key + '" href="' + variables.meta.icons.favicon[key] + '">';
					}
				}
			}
			delete variables.meta.icons;
		}
		//Adding RSS link
		if ( settings.feed.enabled === true ){
			components.metatags += '<link rel="alternate" type="application/rss+xml" href="/feed.rss" />';
		}
		//Adding sitemap link
		components.metatags += '<link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />';
	}
}catch(ex){
	console.log(ex);
	process.exit();
}
console.log('Establishing a connection with the database...');
//Establishing a connection with MongoDB
let connection = 'mongodb://';
if ( typeof(configuration.database) !== 'object' || configuration.database === null ){
	console.log('Invalid database configuration.');
	process.exit();
}
connection += typeof(configuration.database.address) === 'string' && configuration.database.address !== '' ? configuration.database.address : '127.0.0.1';
connection += typeof(configuration.database.port) === 'string' && configuration.database.port !== '' ? ':' + configuration.database.port : ':27017';
if ( typeof(configuration.database.name) !== 'string' && configuration.database.name === '' ){
	console.log('Invalid database name.');
	process.exit();
}
mongodb.connect(connection, function(error, client){
	if ( error ){
		console.log(error);
		process.exit();
	}
	//According to newer driver versions, a client is now returned, then we need to switch to the database using this method.
	var database = client.db(configuration.database.name);
	//Setting up database connection for external library.
	application.utils.setConnection(database);
	//Ensuring indexes.
	database.collection('users').ensureIndex({
		'email': 1
	}, {
		'unique': true
	});
	database.collection('articles').ensureIndex({
		'url': 1
	}, {
		'unique': true
	});
	database.collection('subscribers').ensureIndex({
		'email': 1
	}, {
		'unique': true
	});
	database.collection('articles').createIndex({
		title: 'text',
		text: 'text'
	});
	database.collection('tags').ensureIndex({
		'tag': 1
	}, {
		'unique': true
	});
	database.collection('visitors').ensureIndex({
		'identifier': 1
	}, {
		'unique': true
	});
	app.get(['/', '/search', '/articles', /\/author\/[\d]*/, /\/tag\/[\da-zA-Z-_]*/, '/about', /\/profile\/[\d]*/, '/profile'], function(request, handler){
		//Setting the content type to HTML.
		handler.setHeader('Content-Type', 'text/html');
		if ( request.path !== '/' && request.path !== '/search' && request.path !== '/about' ){
			//Checking if the requested page is an user profile.
			let profile = request.path.indexOf('/profile') === 0 ? true : false;
			//Loading HTML content.
			try{
				var page = profile === true ? filesystem.readFileSync(__dirname + '/profile.html').toString() : filesystem.readFileSync(__dirname + '/articles.html').toString();
			}catch(ex){
				console.log(ex);
				return handler.redirect('/503');
			}
			if ( request.path !== '/articles' ){
				//Checking if the page contains an author ID.
				if ( request.path.indexOf('/author') === 0 ){
					//Getting and validating author ID.
					let author = decodeURIComponent(request.path.substr(8));
					if ( author === '' || application.utils.validateID(author) === false ){
						return handler.redirect('/');
					}
					//Checking if the specified author exists and getting his data.
					database.collection('users').findOne({
						'_id': new mongodb.ObjectID(author)
					}, function(error, author){
						if ( error ){
							return handler.redirect('/503');
						}
						if ( author === null ){
							return handler.redirect('/404');
						}
						//Processing author complete name.
						author.name = author.name === '' || author.surname === '' ? ( author.name + author.surname ) : ( author.name + ' ' + author.surname );
						//Getting authenticated user (from session or cookie) and checking for his existence and validity.
						application.user.getAuthenticatedUser(request, handler).then(function(user){
							//Creating a copy of the global variables merging variables, HTML components and user data.
							let instance = application.utils.getInstanceVariables(request.session, variables, components, {
								title: settings.configuration.meta.title + ' | Articles written by ' + author.name,
								url: '/author/' + author['_id']
							});
							//Adding some variables used on client side within HTML code.
							instance.commons += '<input type="hidden" id="author-id" value="' + author['_id'] + '" /><input type="hidden" id="author-name" value="' + application.utils.escapeHTML(author.name) + '" />';
							//Sending response to the client.
							handler.send(application.utils.replaceVariables(page, instance));
						}).catch(function(error){
							console.log(error);
							return handler.redirect('/503');
						});
					});
					return;
				}else if ( profile === true ){
					//Getting and validating user ID.
					let user = decodeURIComponent(request.path.substr(9));
					if ( user === '' ){
						//If no user ID is passed using current user ID, if no user is authenticated redirect to home page.
						user = typeof(request.session) === 'object' && typeof(request.session.user) === 'object' && request.session.user !== null ? request.session.user.id : null;
					}
					if ( user === null || application.utils.validateID(user) === false ){
						return handler.redirect('/');
					}
					//Checking if the specified user exists and getting his data.
					let userID = new mongodb.ObjectID(user);
					database.collection('users').findOne({
						'_id': userID
					}, function(error, user){
						if ( error ){
							return handler.redirect('/503');
						}
						if ( user === null ){
							return handler.redirect('/404');
						}
						//Getting user's comments count.
						database.collection('comments').count({
							author: userID
						}, function(error, count){
							if ( error ){
								return handler.redirect('/503');
							}
							//Merging all user's information into a single object.
							let profile = {
								id: user['_id'].toString(),
								completeName: user.name === '' || user.surname === '' ? ( user.name + user.surname ) : ( user.name + ' ' + user.surname ),
								name: user.name,
								surname: user.surname,
								email: user.email,
								date: new Date(user.date).toLocaleDateString('en', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								}),
								admin: user.admin === true ? '1' : '0',
								commentsCount: application.utils.stringifyCounterValue(count)
							};
							//If the user is an admin get the articles count.
							if ( profile.admin === '1' ){
								database.collection('articles').count({
									author: userID
								}, function(error, count){
									if ( error ){
										return handler.redirect('/503');
									}
									profile.articlesCount = application.utils.stringifyCounterValue(count);
									application.user.getAuthenticatedUser(request, handler).then(function(user){
										//If the user ID is not the same of the authenticated user hide e-mail address.
										if ( user !== null && user.id === profile.id ){
											profile.loggedIn = '1';
										}else{
											profile.loggedIn = '0';
											profile.email = '';
										}
										let instance = application.utils.getInstanceVariables(request.session, variables, components, {
											title: settings.configuration.meta.title + ' | ' + profile.completeName,
											url: '/profile/' + profile.id,
											profile: profile
										});
										instance.commons += '<input type="hidden" id="user-id" value="' + application.utils.escapeHTML(profile.id) + '" />';
										handler.send(application.utils.replaceVariables(page, instance));
									}).catch(function(error){
										console.log(error);
										return handler.redirect('/503');
									});
								});
								return;
							}
							application.user.getAuthenticatedUser(request, handler).then(function(user){
								if ( user !== null && user.id === buffer.profile.id ){
									buffer.profile.loggedIn = '1';
								}else{
									buffer.profile.loggedIn = '0';
									buffer.profile.email = '';
								}
								let instance = application.utils.getInstanceVariables(request.session, variables, components, {
									title: settings.configuration.meta.title + ' | ' + profile.completeName,
									url: '/profile/' + profile.id,
									profile: profile
								});
								instance.commons += '<input type="hidden" id="user-id" value="' + application.utils.escapeHTML(profile.id) + '" />';
								handler.send(application.utils.replaceVariables(page, instance));
							}).catch(function(error){
								console.log(error);
								return handler.redirect('/503');
							});
						});
					});
					return;
				}
			}else{
				var title = settings.configuration.meta.title + ' | Articles';
			}
		}else{
			try{
				//Loading the HTML code of the requested page.
				switch ( request.path ){
					case '/':{
						var page = filesystem.readFileSync(__dirname + '/index.html').toString();
						var title = settings.configuration.meta.title;
					}break;
					case '/search':{
						var page = filesystem.readFileSync(__dirname + '/search.html').toString();
						var title = settings.configuration.meta.title + ' | Search';
					}break;
					case '/about':{
						var page = filesystem.readFileSync(__dirname + '/about.html').toString();
						var title = settings.configuration.meta.title + ' | About';
					}break;
				}
			}catch(ex){
				console.log(ex);
				return handler.redirect('/503');
			}
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			if ( request.path.indexOf('/tag') === 0 ){
				var tag = decodeURIComponent(request.path.substr(5));
			}
			let options = {
				title: typeof(tag) === 'string' ? ( settings.configuration.meta.title + ' | Articles tagged with "' + tag + '"' ) : title,
				url: request.path
			};
			if ( request.path === '/about' ){
				options.generic = user === null ? {
					name: '',
					email: ''
				} : {
					name: user.name === '' || user.surname === '' ? ( user.name + user.name ) : ( user.name + ' ' + user.surname ),
					email: user.email
				};
			}
			let instance = application.utils.getInstanceVariables(request.session, variables, components, options);
			if ( typeof(tag) === 'string' ){
				instance.commons += '<input type="hidden" id="tag-id" value="' + application.utils.escapeHTML(decodeURIComponent(tag)) + '" />';
			}
			handler.send(application.utils.replaceVariables(page, instance));
		}).catch(function(error){
			console.log(error);
			handler.redirect('/503');
		});
	});
	app.get(/\/article\/[\da-zA-Z-_]*/, function(request, handler){
		//Get article URL from the request URL.
		let url = request.url.substr(request.url.indexOf('/', 1)).replace('/', '');
		//If no article URL has been passed redirect to the home page.
		if ( url === '' ){
			return handler.redirect('/');
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			//Check if the article exists and get its data.
			application.article.getArticleByURL(url, user).then(function(article){
				try{
					//Load HTML code of the article page.
					var page = filesystem.readFileSync(__dirname + '/article.html').toString();
				}catch(ex){
					console.log(ex);
					return handler.redirect('/503');
				}
				//Incrementing the views counter.
				application.article.incrementViewsCounter(article.id, ( user === null ? application.utils.getClientIP(request) : user.id )).catch(function(error){
					console.log(error);
				});
				handler.setHeader('Content-Type', 'text/html');
				//Preparing article's data.
				article.text = article.text.replace(/(?:\r\n|\r|\n)/g, '<br />');
				article.date = article.date.toLocaleDateString('en', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
				article.appreciations.like = article.appreciations.like === true ? 'true' : 'false';
				article.appreciations.dislike = article.appreciations.dislike === true ? 'true' : 'false';
				article.likes = application.utils.stringifyCounterValue(article.likes);
				article.dislikes = application.utils.stringifyCounterValue(article.dislikes);
				article.comments = application.utils.stringifyCounterValue(article.comments);
				article.views = application.utils.stringifyCounterValue(article.views);
				let buffer = '<input type="hidden" id="variables-tags" value="' + application.utils.escapeHTML(article.tags.join()) + '" /><input type="hidden" id="variables-article" value="' + article.id + '" />';
				let tags = article.tags;
				article.tags = '';
				//Processing tags.
				for ( let i = 0 ; i < tags.length ; i++ ){
					article.tags += '<a class="article-tags-element" title="' + application.utils.escapeHTML(tags[i]) + '" href="/tag/' + encodeURIComponent(tags[i]) + '">' + application.utils.escapeHTML(tags[i]) + '</a>';
				}
				if ( article.tags !== '' ){
					article.tags = 'Tags: ' + article.tags;
				}
				//Processing author's complete name.
				article.author.completeName = article.author.name === '' || article.author.surname === '' ? ( article.author.name + article.author.surname ) : ( article.author.name + ' ' + article.author.surname );
				let instance = application.utils.getInstanceVariables(request.session, variables, components, {
					title: settings.configuration.meta.title + ' | ' + article.title,
					url: request.path,
					article: article,
					generic: {
						userName: 'Post as ' + ( user === null ? 'anonimous user' : application.utils.escapeHTML(article.author.completeName) )
					}
				});
				instance.commons += buffer;
				handler.send(application.utils.replaceVariables(page, instance));
			}).catch(function(error){
				switch ( error ){
					case 1:{
						handler.redirect('/404');
					}break;
					default:{
						console.log(error);
						handler.redirect('/503');
					}break;
				}
			});
		}).catch(function(error){
			console.log(error);
			handler.redirect('/503');
		});
	});
	app.get(/\/[\d]+/, function(request, handler){
		let error = {
			code: parseInt(request.url.substr(1))
		};
		switch ( error.code ){
			case 404:{
				error.message = 'The requested page was not found.';
				error.title = 'Page not found.';
			}break;
			case 503:{
				error.message = 'An internal error has occurred.';
				error.title = 'Internal server error.';
			}break;
			default:{
				return handler.redirect('/');
			}break;
		}
		try{
			//Load HTML code of the error page.
			var page = filesystem.readFileSync(__dirname + '/error.html').toString();
		}catch(ex){
			console.log(ex);
			return;
		}
		handler.setHeader('Content-Type', 'text/html');
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			let instance = application.utils.getInstanceVariables(request.session, variables, components, {
				title: settings.configuration.meta.title + ' | ' + error.title,
				url: request.path,
				error: error
			});
			handler.send(application.utils.replaceVariables(page, instance));
		}).catch(function(error){
			console.log(error);
			let instance = application.utils.getInstanceVariables(request.session, variables, components, {
				title: settings.configuration.meta.title + ' | ' + error.title,
				url: request.path,
				error: error
			});
			handler.send(application.utils.replaceVariables(page, instance));
		});
	});
	app.post('/user.login', function(request, handler){
		//Checking the CSRF token in order to prevent CSRF attacks (https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)).
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		//Validating e-mail address.
		if ( typeof(request.body.email) !== 'string' ){
			return application.logger.returnError(handler, 1, 'Invalid e-mail address.');
		}
		request.body.email = request.body.email.trim();
		if ( request.body.email === '' || application.utils.validateEmailAddress(request.body.email) === false ){
			return application.logger.returnError(handler, 1, 'Invalid e-mail address.');
		}
		//Validating password.
		if ( typeof(request.body.password) !== 'string' ){
			return application.logger.returnError(handler, 2, 'Invalid password.');
		}
		request.body.password = request.body.password.trim();
		if ( request.body.password === '' || request.body.email.password > 30 ){
			return application.logger.returnError(handler, 2, 'Invalid password.');
		}
		//Checking user credentials.
		application.user.authenticator.login(request.body.email, request.body.password).then(function(user){
			//Create user session and writing "remember" token to cookie if "remember me" option is enabled.
			application.user.authenticator.createUserSession(user, request, handler, ( request.body.remember === '1' ? true : false ));
			application.logger.returnSuccess(handler, 2, 'User logged in.', {
				name: user.name,
				surname: user.surname
			});
		}).catch(function(error){
			switch ( error ){
				case 1:{
					//No user with the specified e-mail address has been found.
					application.logger.returnError(handler, 8, 'Undefined user.');
				}break;
				case 2:{
					//The given password is not correct.
					application.logger.returnError(handler, 9, 'Invalid password.');
				}break;
				default:{
					//Unable to complete the login due to an unexpected error.
					console.log(error);
					application.logger.returnSuccess(handler, 62, 'Unexpected error.');
				}break;
			}
		});
	});
	app.post('/user.register', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.name) !== 'string' ){
			return application.logger.returnError(handler, 5, 'Invalid name.');
		}
		request.body.name = request.body.name.trim();
		if ( request.body.name === '' || request.body.name.length > 30 ){
			return application.logger.returnError(handler, 5, 'Invalid name.');
		}
		if ( typeof(request.body.surname) !== 'string' ){
			return application.logger.returnError(handler, 6, 'Invalid surname.');
		}
		request.body.surname = request.body.surname.trim();
		if ( request.body.surname === '' || request.body.surname.length > 30 ){
			return application.logger.returnError(handler, 6, 'Invalid surname.');
		}
		if ( typeof(request.body.email) !== 'string' ){
			return application.logger.returnError(handler, 3, 'Invalid e-mail address.');
		}
		request.body.email = request.body.email.trim();
		if ( request.body.email === '' || application.utils.validateEmailAddress(request.body.email) === false ){
			return application.logger.returnError(handler, 3, 'Invalid e-mail address.');
		}
		request.body.password = request.body.password.trim();
		if ( typeof(request.body.password) !== 'string' ){
			return application.logger.returnError(handler, 4, 'Invalid password.');
		}
		if ( request.body.password === '' || request.body.email.password > 30 ){
			return application.logger.returnError(handler, 4, 'Invalid password.');
		}
		//Creating a new user using the given information.
		application.user.create(request.body.name, request.body.surname, request.body.email, request.body.password).then(function(user){
			//Creating the user session using the new user ID.
			application.user.authenticator.createUserSession(user, request, handler, false);
			application.logger.returnSuccess(handler, 1, 'User created successfully.', {
				name: user.name,
				surname: user.surname
			});
		}).catch(function(error){
			switch ( error ){
				case 1:{
					//An user with the same e-mail address has been found.
					application.logger.returnError(handler, 63, 'User already existing.');
				}break;
				default:{
					//Unable to complete the user creation due to an unexpected error.
					console.log(error);
					application.logger.returnError(handler, 7, 'Unable to create user.')
				}break;
			}
		});
	});
	app.post('/user.logout', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		//Removing user session and deleting cookie if found.
		application.user.authenticator.logout(request, handler);
		application.logger.returnSuccess(handler, 3, 'User logged out.');
	});
	app.post('/article.list', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		//Getting and validating page number, page number must start from 1.
		let page = typeof(request.body.page) === 'string' ? parseInt(request.body.page) : 1;
		if ( isNaN(page) === true || page <= 0 ){
			page = 1;
		}
		let mode = typeof(request.body.action) === 'string' && request.body.action.trim() !== '' ? request.body.action.trim() : 'showcase';
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			switch ( mode ){
				case 'suggested':{
					//Suggested articles are selected according to given tags.
					if ( typeof(request.body.tags) !== 'string' || typeof(request.body.article) !== 'string' ){
						return application.logger.returnError(handler, 26, 'Invalid request.');
					}
					request.body.tags = request.body.tags.trim();
					request.body.article = request.body.article.trim();
					if ( request.body.tags === '' || application.utils.validateID(request.body.article) === false ){
						return application.logger.returnError(handler, 26, 'Invalid request.');
					}
					var params = {
						tags: request.body.tags.split(','),
						id: request.body.article
					};
				}break;
				case 'author':{
					if ( typeof(request.body.author) !== 'string' ){
						return application.logger.returnError(handler, 26, 'Invalid request.');
					}
					request.body.author = request.body.author.trim();
					if ( request.body.author === '' ){
						return application.logger.returnError(handler, 26, 'Invalid request.');
					}
					var params = {
						author: request.body.author,
						user: user
					};
				}break;
				case 'tag':{
					if ( typeof(request.body.tag) !== 'string' ){
						return application.logger.returnError(handler, 26, 'Invalid request.');
					}
					request.body.tag = request.body.tag.trim();
					if ( request.body.tag === '' ){
						return application.logger.returnError(handler, 26, 'Invalid request.');
					}
					var params = {
						tag: request.body.tag,
						user: user
					};
				}break;
				case 'search':{
					if ( typeof(request.body.q) !== 'string' ){
						return application.logger.returnError(handler, 26, 'Invalid request.');
					}
					request.body.q = request.body.q.trim();
					if ( request.body.q === '' ){
						return application.logger.returnError(handler, 26, 'Invalid request.');
					}
					var params = {
						query: request.body.q,
						user: user
					};
				}break;
				default:{
					var params = {
						user: user
					};
				}break;
			}
			//Getting articles according to the specified mode and params.
			application.article.getArticles(mode, page, params).then(function(elements){
				//If the parameter "includeCount" has been set, the total articles count will be added to returned data.
				if ( typeof(request.body.includeCount) !== 'undefined' && request.body.includeCount === '1' ){
					return application.article.getArticlesCount(mode, params).then(function(count){
						//Setting the content type to JSON.
						handler.set({
							'Content-Type': 'application/json'
						});
						handler.send(JSON.stringify({
							result: 'success',
							code: 1,
							description: 'Articles fetched successfully.',
							data: elements,
							count: count
						}));
					}).catch(function(error){
						console.log(error);
						application.logger.returnError(handler, 8, 'Unable to fetch articles.');
					});
				}
				application.logger.returnSuccess(handler, 1, 'Articles fetched successfully.', elements);
			}).catch(function(error){
				console.log(error);
				application.logger.returnError(handler, 8, 'Unable to fetch articles.');
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 8, 'Unable to fetch articles.');
		});
	});
	app.post('/article.create', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.title) !== 'string' ){
			return application.logger.returnError(handler, 9, 'Invalid title.');
		}
		request.body.title = request.body.title.trim();
		if ( request.body.title === '' ){
			return application.logger.returnError(handler, 9, 'Invalid title.');
		}
		if ( typeof(request.body.text) !== 'string' ){
			return application.logger.returnError(handler, 10, 'Invalid text.');
		}
		request.body.text = request.body.text.trim();
		if ( request.body.text === '' ){
			return application.logger.returnError(handler, 10, 'Invalid text.');
		}
		if ( typeof(request.body.url) !== 'string' ){
			return application.logger.returnError(handler, 11, 'Invalid URL.');
		}
		request.body.url = request.body.url.trim();
		if ( request.body.url === '' ){
			return application.logger.returnError(handler, 11, 'Invalid URL.');
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			//Checking if an admin user is logged in.
			if ( user === null ){
				return application.logger.returnError(handler, 12, 'User not authenticated.');
			}
			if ( user.admin !== true ){
				return application.logger.returnError(handler, 13, 'The authenticated user is not an admin.');
			}
			//Preparing tags.
			let buffer = typeof(request.body.tags) !== 'string' || request.body.tags === '' ? new Array() : request.body.tags.split(',');
			let tags = new Array();
			for ( let i = 0 ; i < buffer.length ; i++ ){
				buffer[i] = buffer[i].trim();
				if ( buffer[i] !== '' ){
					tags.push(buffer[i]);
				}
			}
			//Checking is a cover image has been send, if found, upload the file encoded as Base64 string.
			let cover = null;
			if ( typeof(request.body.cover) === 'string' && request.body.cover !== '' ){
				cover = application.utils.writeImage(request.body.cover);
			}
			//Creating the article using the given information.
			application.article.create(request.body.title, request.body.text, tags, request.body.url, request.session.user, cover).then(function(element){
				application.logger.returnSuccess(handler, 1, 'Article created successfully.', element);
			}).catch(function(error){
				switch ( error ){
					case 1:{
						//Another article with the same URL has been found.
						application.logger.returnError(handler, 19, 'URL already existing.');
					}break;
					case 2:{
						application.logger.returnError(handler, 12, 'User not authenticated.');
					}break;
					case 3:{
						application.logger.returnError(handler, 13, 'The authenticated user is not an admin.');
					}break;
					default:{
						//Unable to create the article due to an unexpected error.
						console.log(error);
						application.logger.returnError(handler, 14, 'Unable to create the article.');
					}break;
				}
				//In case of error, the cover image is removed from the server.
				if ( cover !== null ){
					try{
						filesystem.unlinkSync(__dirname + '/files/' + cover);
					}catch(ex){
						console.log(ex);
					}
				}
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 14, 'Unable to create the article.');
		});
	});
	app.post('/article.remove', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.id) !== 'string' ){
			return application.logger.returnError(handler, 15, 'Invalid article ID.');
		}
		request.body.id = request.body.id.trim();
		if ( request.body.id === '' || application.utils.validateID(request.body.id) === false ){
			return application.logger.returnError(handler, 15, 'Invalid article ID.');
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			//Checking if an admin user is logged in, only admin users can remove articles.
			if ( user === null ){
				return application.logger.returnError(handler, 64, 'User not authenticated.');
			}
			if ( user.admin !== true ){
				return application.logger.returnError(handler, 65, 'The authenticated user is not an admin.');
			}
			//Removing the article
			application.article.remove(request.body.id).then(function(){
				application.logger.returnSuccess(handler, 1, 'Article removed successfully.');
			}).catch(function(error){
				console.log(error);
				application.logger.returnError(handler, 16, 'Unable to remove the article.');
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 16, 'Unable to remove the article.');
		});
	});
	app.post('/newsletter.subscribe', function(request, handler){
		if ( typeof(request.body.email) !== 'string' ){
			return application.logger.returnError(handler, 17, 'Invalid email address.');
		}
		request.body.email = request.body.email.trim();
		if ( request.body.email === '' || application.utils.validateEmailAddress(request.body.email) === false ){
			return application.logger.returnError(handler, 17, 'Invalid email address.');
		}
		//Adding the given e-mail address to the mailing list.
		application.newsletter.addAddress(request.body.email).then(function(){
			application.logger.returnSuccess(handler, 1, 'Address added successfully.');
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 18, 'Unable to add the address.');
		});
	});
	app.post('/comment.load', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.article) !== 'string' ){
			return application.logger.returnError(handler, 19, 'Invalid article ID.');
		}
		request.body.article = request.body.article.trim();
		if ( request.body.article === '' || application.utils.validateID(request.body.article) === false ){
			return application.logger.returnError(handler, 19, 'Invalid article ID.');
		}
		let page = typeof(request.body.page) === 'string' ? parseInt(request.body.page) : 1;
		if ( isNaN(page) === true || page <= 0 ){
			page = 1;
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			//Loading comments.
			application.comment.loadComments(request.body.article, page, user).then(function(elements){
				application.logger.returnSuccess(handler, 1, 'Comments fetched successfully.', elements);
			}).catch(function(error){
				console.log(error);
				application.logger.returnError(handler, 20, 'Unable to load comments.');
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 20, 'Unable to load comments.');
		});
	});
	app.post('/comment.loadUser', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.user) !== 'string' ){
			return application.logger.returnError(handler, 45, 'Invalid user ID.');
		}
		request.body.user = request.body.user.trim();
		if ( request.body.user === '' || application.utils.validateID(request.body.user) === false ){
			return application.logger.returnError(handler, 45, 'Invalid user ID.');
		}
		let page = typeof(request.query.page) === 'string' ? parseInt(request.query.page) : 1;
		if ( isNaN(page) === true || page <= 0 ){
			page = 1;
		}
		//Loading all comments created by a given user.
		application.comment.loadUserComments(request.body.user, page).then(function(elements){
			application.logger.returnSuccess(handler, 1, 'Comments fetched successfully.', elements);
		}).catch(function(error){
			switch ( error ){
				case 1:{
					application.logger.returnError(handler, 65, 'Undefined user.');
				}break;
				default:{
					console.log(error);
					application.logger.returnError(handler, 46, 'Unable to load comments.');
				}break;
			}
		});
	});
	app.post('/comment.create', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.article) !== 'string' ){
			return application.logger.returnError(handler, 21, 'Invalid article ID.');
		}
		request.body.article = request.body.article.trim();
		if ( request.body.article === '' || application.utils.validateID(request.body.article) === false ){
			return application.logger.returnError(handler, 21, 'Invalid article ID.');
		}
		if ( typeof(request.body.text) !== 'string' ){
			return application.logger.returnError(handler, 22, 'Invalid comment text.');
		}
		request.body.text = request.body.text.trim();
		if ( request.body.text === '' || request.body.text.length > 10000 ){
			return application.logger.returnError(handler, 22, 'Invalid comment text.');
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			//Creating a new comment.
			application.comment.create(request.body.article, request.body.text, user).then(function(comment){
				application.logger.returnSuccess(handler, 1, 'Comment created successfully.', comment);
			}).catch(function(error){
				console.log(error);
				application.logger.returnError(handler, 23, 'Unable to create the comment.');
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 23, 'Unable to create the comment.');
		});
	});
	app.post('/comment.remove', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.id) !== 'string' ){
			return application.logger.returnError(handler, 24, 'Invalid comment ID.');
		}
		request.body.id = request.body.id.trim();
		if ( request.body.id === '' || application.utils.validateID(request.body.id) === false ){
			return application.logger.returnError(handler, 24, 'Invalid comment ID.');
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			//Checking if an user is logged in.
			if ( user === null ){
				return application.logger.returnError(handler, 26, 'Anonimous users cannot remove comments.');
			}
			//Removing the specified comment.
			application.comment.remove(request.body.id, user).then(function(){
				application.logger.returnSuccess(handler, 1, 'Comment removed successfully.');
			}).catch(function(error){
				switch ( error ){
					case 1:{
						//Only admin users and the comment's creator are allowed to remove a comment.
						application.logger.returnError(handler, 66, 'You are not allowed to remove this comment.');
					}break;
					default:{
						console.log(error);
						application.logger.returnError(handler, 25, 'Unable to remove the comment.');
					}break;
				}
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 25, 'Unable to remove the comment.');
		});
	});
	app.post('/appreciation.toggle', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.article) !== 'string' ){
			return application.logger.returnError(handler, 27, 'Invalid article ID.');
		}
		request.body.article = request.body.article.trim();
		if ( request.body.article === '' || application.utils.validateID(request.body.article) === false ){
			return application.logger.returnError(handler, 27, 'Invalid article ID.');
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			if ( user === null ){
				return application.logger.returnError(handler, 28, 'Anonimous users cannot use this feature.');
			}
			//Toggling the appreciation (positive => like, negative => dislike).
			application.appreciation.toggle(( typeof(request.body.value) !== 'string' || request.query.value !== '1' ? false : true ), request.query.article, user).then(function(value){
				application.logger.returnSuccess(handler, 1, 'Appreciation created successfully.', value);
			}).catch(function(error){
				console.log(error);
				application.logger.returnError(handler, 29, 'Unable to create the appreciation.');
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 29, 'Unable to create the appreciation.');
		});
	});
	app.post('/tag.get', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		//Getting the first 10 most popular tags.
		application.article.getTags().then(function(tags){
			application.logger.returnSuccess(handler, 1, 'Tags fetched successfully.', tags);
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 30, 'Unable to fetch tags.');
		})
	});
	app.post('/contact', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.email) !== 'string' ){
			return application.logger.returnError(handler, 31, 'Invalid email address.');
		}
		request.body.email = request.body.email.trim();
		if ( request.body.email === '' || application.utils.validateEmailAddress(request.body.email) === false ){
			return application.logger.returnError(handler, 31, 'Invalid email address.');
		}
		if ( typeof(request.body.text) !== 'string' ){
			return application.logger.returnError(handler, 32, 'Invalid text.');
		}
		request.body.text = request.body.text.trim();
		if ( request.body.text === '' || request.body.text.length > 10000 ){
			return application.logger.returnError(handler, 32, 'Invalid text.');
		}
		let name = '';
		if ( typeof(request.body.name) === 'string' ){
			request.body.name = request.body.name.trim();
			if ( request.body.name.length > 50 ){
				request.body.name = '';
			}
		}
		if ( typeof(configuration.contacts.info) === 'string' && configuration.contacts.info !== '' ){
			try{
				nodeMailer.createTransport({
					sendmail: true,
					newline: 'unix',
					path: '/usr/sbin/sendmail'
				}).sendMail({
					from: 'info@myblog.com',
					to: configuration.contacts.info,
					subject: 'Message from your blog.',
					text: ( request.body.name === 'Hello! You have got a new message:' + request.body.text ? '' : 'Hello! You have got a new message by ' + name + ': ' + request.body.text ) + '\nSent by ' + request.body.email
				}, function(error){
					//An error has occurred while sending the e-mail message.
					if ( error ){
						return application.logger.returnError(handler, 33, 'Unable to send the message.');
					}
					//Message sent successfully.
					application.logger.returnSuccess(handler, 1, 'The message has been sent successfully.');
				});
			}catch(ex){
				console.log(ex);
				return application.logger.returnError(handler, 33, 'Unable to send the message.');
			}
		}
	});
	app.post('/user.list', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			if ( user === null || user.admin !== true ){
				return application.logger.returnError(handler, 34, 'This feature is available for admins only.');
			}
			let page = typeof(request.params.page) === 'string' && request.params.page !== '' ? parseInt(request.params.page) : 1;
			if ( isNaN(page) === true || page <= 0 ){
				page = 1;
			}
			//Getting all registered users.
			application.user.getUsers(page).then(function(elements){
				application.logger.returnSuccess(handler, 1, 'Users fetched succesfully.', elements);
			}).catch(function(error){
				console.log(error);
				application.logger.returnError(handler, 35, 'Unable to fetch users.');
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 35, 'Unable to fetch users.');
		});
	});
	app.post('/user.delete', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.id) !== 'string' ){
			return application.logger.returnError(handler, 37, 'This feature is available for admins only.');
		}
		request.body.id = request.body.id.trim();
		if ( request.body.id === '' || application.utils.validateID(request.body.id) === false ){
			return application.logger.returnError(handler, 37, 'This feature is available for admins only.');
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			//Checking if an user is logged in and if that user is an admin.
			if ( user === null || user.admin !== true ){
				return application.logger.returnError(handler, 36, 'This feature is available for admins only.');
			}
			//Admin users cannot remove themselves.
			if ( request.body.id === user.id ){
				return application.logger.returnError(handler, 39, 'You cannot remove yourself.');
			}
			//Removing the specified user.
			application.user.remove(request.body.id, ( typeof(request.body.clear) === 'string' && request.body.clear === '1' ? true : false )).then(function(){
				application.logger.returnSuccess(handler, 1, 'Users removed succesfully.');
			}).catch(function(error){
				console.log(error);
				application.logger.returnError(handler, 38, 'Unable to remove the user.');
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 38, 'Unable to remove the user.');
		});
	});
	app.get('/users', function(request, handler){
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			//Checking if an user is logged in and if that user is an admin.
			if ( user === null || user.admin === false ){
				return handler.redirect('/');
			}
			try{
				//Loading HTML content.
				let page = filesystem.readFileSync(__dirname + '/users.html').toString();
				handler.setHeader('Content-Type', 'text/html');
				let instance = application.utils.getInstanceVariables(request.session, variables, components, {
					title: settings.configuration.meta.title + ' | Registered users and admins',
					url: request.path
				});
				handler.send(application.utils.replaceVariables(page, instance));
			}catch(ex){
				console.log(ex);
				return handler.redirect('/503');
			}
		}).catch(function(error){
			console.log(error);
			return handler.redirect('/503');
		});
	});
	app.get('/unsubscribe', function(request, handler){
		if ( typeof(request.query.token) !== 'string' ){
			return handle.redirect('/');
		}
		request.query.token = request.query.token.trim();
		if ( request.query.token === '' ){
			return handle.redirect('/');
		}
		//Removing the e-mail address which corresponds to the given revocation token from the mailing list.
		application.newsletter.removeAddressByRevocationToken(request.query.token).then(function(){
			handle.redirect('/#unsubscribe.success');
		}).catch(function(error){
			console.log(error);
			handle.redirect('/#unsubscribe.error');
		});
	});
	app.get('/newsletter.listAddresses', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			//Checking if an user is logged in and if that user is an admin.
			if ( user === null || user.admin !== true ){
				return application.logger.returnError(handler, 40, 'This feature is available for admins only.');
			}
			let page = typeof(request.params.page) === 'string' && request.params.page !== '' ? parseInt(request.params.page) : 1;
			if ( isNaN(page) === true || page < 1 ){
				page = 1;
			}
			//Getting all e-mail addresses from the mailing list.
			application.newsletter.listAddresses(page).then(function(elements){
				application.logger.returnSuccess(handler, 1, 'E-mail addresses fetched succesfully.', elements);
			}).catch(function(error){
				console.log(error);
				application.logger.returnError(handler, 41, 'Unable to fetch e-mail addresses.');
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 41, 'Unable to fetch e-mail addresses.');
		});
	});
	app.post('/newsletter.removeAddress', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.email) !== 'string' ){
			return application.logger.returnError(handler, 68, 'Invalid e-mail address.');
		}
		request.body.email = request.body.email.trim();
		if ( request.body.email === '' || application.utils.validateEmailAddress(request.body.email) === false ){
			return application.logger.returnError(handler, 68, 'Invalid e-mail address.');
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			if ( user === null || user.admin !== true ){
				return application.logger.returnError(handler, 67, 'This feature is available for admins only.');
			}
			//Removing the specified e-mail address form the mailing list.
			application.newsletter.removeAddress(request.body.email).then(function(){
				application.logger.returnSuccess(handler, 1, 'E-mail address removed succesfully.');
			}).catch(function(error){
				console.log(error);
				application.logger.returnError(handler, 44, 'Unable to remove the e-mail address.');
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 44, 'Unable to remove the e-mail address.');
		});
	});
	app.post('/user.edit', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.name) !== 'string' ){
			return application.logger.returnError(handler, 48, 'Invalid name.');
		}
		request.body.name = request.body.name.trim();
		if ( request.body.name === '' || request.body.name > 30 ){
			return application.logger.returnError(handler, 48, 'Invalid name.');
		}
		if ( typeof(request.body.surname) !== 'string' ){
			return application.logger.returnError(handler, 49, 'Invalid surname.');
		}
		request.body.surname = request.body.surname.trim();
		if ( request.body.surname === '' || request.body.surname > 30 ){
			return application.logger.returnError(handler, 49, 'Invalid surname.');
		}
		if ( typeof(request.body.email) !== 'string' ){
			return application.logger.returnError(handler, 50, 'Invalid e-mail.');
		}
		request.body.email = request.body.email.trim();
		if ( request.body.email === '' || application.utils.validateEmailAddress(request.body.email) === false ){
			return application.logger.returnError(handler, 50, 'Invalid e-mail.');
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			if ( user === null ){
				return application.logger.returnError(handler, 47, 'User not logged in.');
			}
			//Saving updated user information.
			application.user.edit({
				name: request.body.name,
				surname: request.body.surname,
				email: request.body.email
			}, user).then(function(){
				application.logger.returnSuccess(handler, 1, 'User data edited successfully.');
			}).catch(function(error){
				console.log(error);
				application.logger.returnError(handler, 51, 'Unable to edit user data.');
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 51, 'Unable to edit user data.');
		});
	});
	app.post('/user.changePassword', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		if ( typeof(request.body.current) !== 'string' ){
			return application.logger.returnError(handler, 53, 'Invalid current password.');
		}
		request.body.current = request.body.current.trim();
		if ( request.body.current === '' || request.body.current > 30 ){
			return application.logger.returnError(handler, 53, 'Invalid current password.');
		}
		if ( typeof(request.body.newPassword) !== 'string' ){
			return application.logger.returnError(handler, 54, 'Invalid new password.');
		}
		request.body.newPassword = request.body.newPassword.trim();
		if ( request.body.newPassword === '' || request.body.newPassword > 30 ){
			return application.logger.returnError(handler, 54, 'Invalid new password.');
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			if ( user === null ){
				return application.logger.returnError(handler, 52, 'User not logged in.');
			}
			//Updating user password.
			application.user.changePassword(request.body.current, request.body.newPassword, user).then(function(){
				application.logger.returnSuccess(handler, 1, 'User password changed successfully.');
			}).catch(function(error){
				switch ( error ){
					case 1:{
						//The specified user doesn't exist.
						application.logger.returnError(handler, 55, 'Undefined user.');
					}break;
					case 2:{
						//The given password is not correct.
						application.logger.returnError(handler, 56, 'Current password is not correct.');
					}break;
					default:{
						//Was not possible to change user password due to an unexpected error.
						console.log(error);
						application.logger.returnError(handler, 57, 'Unable to change user password.');
					}break;
				}
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 57, 'Unable to change user password.');
		});
	});
	app.post('/user.removeAccount', function(request, handler){
		if ( application.utils.checkCSRFToken(request, handler) === false ){
			return;
		}
		application.user.getAuthenticatedUser(request, handler).then(function(user){
			if ( user === null ){
				return application.logger.returnError(handler, 58, 'User not logged in.');
			}
			//Admin users cannot remove themself.
			if ( user.admin === true ){
				return application.logger.returnError(handler, 59, 'Cannot remove this user.');
			}
			//Removing current user.
			application.user.remove(user, true).then(function(){
				application.user.authenticator.logout(request, handler);
				application.logger.returnSuccess(handler, 1, 'User removed successfully.');
			}).catch(function(error){
				switch ( error ){
					case 1:{
						application.logger.returnError(handler, 59, 'Cannot remove this user.');
					}break;
					default:{
						console.log(error);
						application.logger.returnError(handler, 60, 'Unable to remove the user.');
					}break;
				}
			});
		}).catch(function(error){
			console.log(error);
			application.logger.returnError(handler, 60, 'Unable to remove the user.');
		});
	});
	app.get('/sitemap.xml', function(request, handler){
		//Fetching all articles from the database.
		database.collection('articles').find(null, {
			sort: {
				date: -1
			}
		}).toArray(function(error, elements){
			if ( error ){
				return handler.end();
			}
			//Setting the content type to XML.
			handler.setHeader('Content-Type', 'application/xml');
			//Sending data to client piece by piece.
			let url = application.utils.escapeHTML(configuration.completeURL);
			handler.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
			handler.write('<loc>' + url + '/</loc><changefreq>daily</changefreq><priority>1</priority>');
			handler.write('<loc>' + url + '/articles</loc><changefreq>daily</changefreq><priority>0.9</priority>');
			handler.write('<loc>' + url + '/about</loc><changefreq>monthly</changefreq><priority>0.9</priority>');
			handler.write('<loc>' + url + '/search</loc><changefreq>never</changefreq><priority>0.9</priority>');
			for ( let i = 0 ; i < elements.length ; i++ ){
				let date = elements[i].date.getFullYear() + '/' + ( elements[i].date.getMonth() + 1 ) + '/' + elements[i].date.getDate();
				handler.write('<loc>' + url + '/' + encodeURIComponent(elements[i].url) + '</loc><changefreq>never</changefreq><lastmod>' + date + '</lastmod><priority>0.75</priority>');
			}
			handler.write('</urlset>');
			//Closing the connection with the client.
			handler.end();
		});
	});
	app.get('/feed.rss', function(request, handler){
		if ( settings.feed.enabled === false ){
			return handler.end();
		}
		//Fetching most recent articles from the database.
		let date = new Date();
		date.setMonth(date.getMonth() - 1);
		database.collection('articles').find({
			date: {
				'$gt': date
			}
		}, {
			sort: {
				date: -1
			}
		}).toArray(function(error, elements){
			if ( error ){
				return handler.end();
			}
			let url = application.utils.escapeHTML(settings.feed.link) + '/';
			let content = '<?xml version="1.0"?><rss version="2.0"><channel><title>' + application.utils.escapeHTML(settings.feed.title) + '</title>';
			content += '<link>' + url + '</link><description>' + application.utils.escapeHTML(settings.feed.description) + '</description>';
			let authors = new Array();
			for ( let i = 0 ; i < elements.length ; i++ ){
				if ( authors.indexOf(elements[i].author.toString()) < 0 ){
					authors.push(elements[i].author.toString());
				}
			}
			//Fetching corresponding authors' information.
			database.collection('users').find({
				'_id': {
					'$in': application.utils.toIDArray(authors)
				}
			}).toArray(function(error, authors){
				if ( error ){
					return handler.end();
				}
				for ( let i = 0 ; i < elements.length ; i++ ){
					let buffer = '';
					content += '<item><title>' + application.utils.escapeHTML(elements[i].title) + '</title>';
					content += '<link>' + url + encodeURIComponent(elements[i].url) + '</link>';
					content += '<pubDate>' + elements[i].date.toUTCString() + '</pubDate>';
					content += '<description>' + application.utils.escapeHTML(elements[i].text.substr(0, 250)) + '</description>';
					content += '<guid>' + elements[i]['_id'].toString() + '</guid>';
					for ( let n = 0 ; n < authors.length ; n++ ){
						if ( authors[n]['_id'].toString() === elements[i].author.toString() ){
							buffer = authors[n].name === '' || authors[n].surname === '' ? ( authors[n].name + authors[n].surname ) : ( authors[n].name + ' ' + authors[n].surname );
							break;
						}
					}
					if ( buffer !== '' ){
						content += '<author>' + application.utils.escapeHTML(buffer) + '</author>';
					}
					content += '</item>';
				}
				//Setting the content type to RSS feed.
				handler.setHeader('Content-Type', 'application/rss+xml');
				handler.send(content + '</channel></rss>');
			});
		})
	});
	//Checking for HTTPS configuration.
	let options = null;
	if ( typeof(configuration.https) === 'object' && configuration.https !== null ){
		options = {};
		try{
			//Loading HTTPS files.
			if ( typeof(configuration.https.key) === 'string' && configuration.https.key !== '' ){
				options.key = filesystem.readFileSync(__dirname + '/' + configuration.https.key).toString();
			}
			if ( typeof(configuration.https.certificate) === 'string' && configuration.https.certificate !== '' ){
				options.cert = filesystem.readFileSync(__dirname + '/' + configuration.https.certificate).toString();
			}
		}catch(ex){
			console.log(ex);
			process.exit();
		}
		if ( typeof(options.key) === 'string' && options.key !== '' && typeof(options.cert) === 'string' && options.cert !== '' ){
			//Starting HTTPS server.
			https.createServer(options, app).listen(configuration.port);
			configuration.secure = true;
			console.log('Application started and listening on port ' + configuration.port);
		}else{
			options = null;
		}
	}
	if ( options === null ){
		//Starting server.
		app.listen(configuration.port);
		configuration.secure = false;
		console.log('Application started and listening on port ' + configuration.port);
	}
	configuration.completeURL = ( configuration.secure === true ? 'https://' : 'http://' ) + configuration.domain;
	if ( typeof(settings.feed.link) !== 'string' || settings.feed.link === '' ){
		settings.feed.link = configuration.completeURL;
	}
	//Processing configuration data for e-mails.
	if ( typeof(configuration.mail) !== 'object' || configuration.mail === null ){
		configuration.mail = {
			sendmail: '/usr/sbin/sendmail',
			from: {
				generic: '',
				newsletter: ''
			}
		};
	}else{
		if ( typeof(configuration.mail.from) === 'object' && configuration.mail.from !== null ){
			configuration.mail.from.generic = typeof(configuration.mail.from.generic) === 'string' ? configuration.mail.from.generic : '';
			configuration.mail.from.newsletter = typeof(configuration.mail.from.newsletter) === 'string' ? configuration.mail.from.newsletter : '';
		}else{
			configuration.mail.from = {
				generic: '',
				newsletter: ''
			};
		}
	}
	configuration.mail.contents = {
		generic: {
			header: ''
		},
		newsletter: {
			header: '',
			subject: ''
		}
	};
	if ( typeof(settings.mail) === 'object' && settings.mail !== null ){
		if ( typeof(settings.mail.generic) === 'object' && settings.mail.generic !== null ){
			if ( typeof(settings.mail.generic.coverImage) === 'string' && settings.mail.generic.coverImage !== '' ){
				configuration.mail.contents.generic.header += '<a id="main-link" href="' + configuration.completeURL + '" title="Visit the website" style="background-image:url(' + configuration.completeURL + '/' + settings.mail.generic.coverImage + ');"><div id="main-logo"></div></a>';
			}
			if ( typeof(settings.mail.generic.title) === 'string' && settings.mail.generic.title !== '' ){
				configuration.mail.contents.generic.header += '<a id="main-title" href="' + configuration.completeURL + '" title="Visit the website">' + settings.mail.generic.title + '</a>';
			}
			if ( typeof(settings.mail.generic.subtitle) === 'string' && settings.mail.generic.subtitle !== '' ){
				configuration.mail.contents.generic.header += '<p id="main-subtitle">' + settings.mail.generic.subtitle + '</p>';
			}
		}
		if ( typeof(settings.mail.newsletter) === 'object' && settings.mail.newsletter !== null ){
			if ( typeof(settings.mail.newsletter.coverImage) === 'string' && settings.mail.newsletter.coverImage !== '' ){
				configuration.mail.contents.newsletter.header += '<a id="main-link" href="' + configuration.completeURL + '" title="Visit the website" style="background-image:url(' + configuration.completeURL + '/' + settings.mail.newsletter.coverImage + ');"><div id="main-logo"></div></a>';
			}
			if ( typeof(settings.mail.newsletter.title) === 'string' && settings.mail.newsletter.title !== '' ){
				configuration.mail.contents.newsletter.header += '<a id="main-title" href="' + configuration.completeURL + '" title="Visit the website">' + settings.mail.newsletter.title + '</a>';
			}
			if ( typeof(settings.mail.newsletter.subtitle) === 'string' && settings.mail.newsletter.subtitle !== '' ){
				configuration.mail.contents.newsletter.header += '<p id="main-subtitle">' + settings.mail.newsletter.subtitle + '</p>';
			}
			if ( typeof(settings.mail.newsletter.subtitle) === 'string' && settings.mail.newsletter.subtitle !== '' ){
				configuration.mail.contents.newsletter.subject = settings.mail.newsletter.subject;
			}
		}
	}
	application.utils.setConfiguration(configuration);
});