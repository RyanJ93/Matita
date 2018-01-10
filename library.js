//Loading required modules.
const express = require('express');
const expressSession = require('express-session');
const expressCookie = require('cookie-parser')
const mongodb = require('mongodb');
const filesystem = require('fs');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const nodeMailer = require('nodemailer');
var application = {
	/**
	* @var Object database An object representing the connection with the database.
	*/
	database: null,
	
	/**
	* @var Object configuration An object containing the configuration properties.
	*/
	configuration: null,
	
	logger: {
		/**
		* Sends an error message to the client as JSON encoded string.
		*
		* @param Object handler An object used to handle current connection.
		* @param Integer code An integer number used to identify the error.
		* @param String description A string containing a textual description of the error.
		*/
		returnError: function(handler, code, description){
			handler.set({
				'Content-Type': 'application/json'
			});
			handler.send(JSON.stringify({
				result: 'error',
				code: code,
				description: description
			}));
		},
		
		/**
		* Sends a message to the client as JSON encoded string.
		*
		* @param Object handler An object used to handle current connection.
		* @param Integer code An integer number used to identify the result.
		* @param String description A string containing a textual description of the result.
		* @param Mixed data A variable containing some optional data which shall be sent to the client as result.
		*/
		returnSuccess: function(handler, code, description, data){
			handler.set({
				'Content-Type': 'application/json'
			});
			handler.send(JSON.stringify(typeof(data) !== 'undefined' ? {
				result: 'success',
				code: code,
				description: description,
				data: data
			} : {
				result: 'success',
				code: code,
				description: description
			}));
		}
	},
	
	utils: {
		/**
		* Sets the connection with the database within the main object.
		*
		* @param Object connection An object representing the connection with the database.
		*/
		setConnection: function(connection){
			application.database = connection;
		},
		
		/**
		* Sets the configuration properties within the main object.
		*
		* @param Object connection An object containing the configuration properties.
		*/
		setConfiguration: function(configuration){
			application.configuration = configuration;
		},
		
		/**
		* Creates a random string.
		*
		* @param Integer length An integer number greater than zero representing the string length.
		*/
		createToken: function(length){
			let pattern = 'abcdefghijklmnopqrstuvxywz0123456789';
			let ret = '';
			for ( let i = 0 ; i < length ; i++ ){
				ret += pattern.charAt(Math.random() * pattern.length);
			}
			return ret;
		},
		
		/**
		* Merges the global variables, HTML components and settings creating a copy of these objects and adding the given additional parameters.
		*
		* @param Object session An object representing the data contained in the HTTP session.
		* @param Object variables An object containing the global variables loaded during application initialization.
		* @param Object components An object containing the HTML components.
		* @param Object options An object containing the additional parameters that shall be merged with other objects.
		*
		* @return Object An object containing merged properties.
		*/
		getInstanceVariables: function(session, variables, components, options){
			if ( typeof(session.csrfToken) !== 'string' || session.csrfToken === '' ){
				session.csrfToken = this.createToken(32);
			}
			let buffer = Object.assign({}, variables);
			buffer.meta = Object.assign({}, variables.meta);
			buffer.meta.url = typeof(options.url) === 'string' ? this.escapeHTML(options.url) : '';
			buffer.meta.image = typeof(options.image) === 'string' ? this.escapeHTML(options.image) : '';
			buffer.meta.csrfToken = '<meta name="csrf-token" content="' + session.csrfToken + '" />';
			if ( typeof(options.title) === 'string' ){
				buffer.meta.title = this.escapeHTML(options.title);
			}
			if ( typeof(options.profile) === 'object' && options.profile !== null ){
				buffer.profile = this.escapeHTML(options.profile);
			}
			if ( typeof(options.article) === 'object' && options.article !== null ){
				buffer.article = options.article;
				buffer.article.title = this.escapeHTML(buffer.article.title);
				buffer.article.url = this.escapeHTML(buffer.article.url);
				if ( buffer.article.cover !== null ){
					buffer.meta.image = this.escapeHTML(application.configuration.completeURL + '/covers/' + buffer.article.cover);
				}
				buffer.article.cover = this.escapeHTML(buffer.article.cover);
			}
			if ( typeof(options.generic) === 'object' && options.generic !== null ){
				buffer.generic = options.generic;
			}
			if ( typeof(options.error) === 'object' && options.error !== null ){
				buffer.error = options.error;
			}
			
			buffer.user = typeof(session.user) === 'object' && session.user !== null ? {
				'id': session.user.id,
				'name': this.escapeHTML(session.user.name),
				'surname': this.escapeHTML(session.user.surname),
				'admin': session.user.admin === true ? '1' : '0',
				'auth': '1',
				'html': '<input type="hidden" id="variables-user-auth" value="1" /><input type="hidden" id="variables-user-id" value="' + this.escapeHTML(session.user.id) + '" /><input type="hidden" id="variables-user-name" value="' + this.escapeHTML(session.user.name) + '" /><input type="hidden" id="variables-user-surname" value="' + this.escapeHTML(session.user.surname) + '" />'
			} : {
				'admin': '0',
				'auth': '0',
				'html': '<input type="hidden" id="variables-user-auth" value="0" />'
			};
			let ret = Object.assign({}, components);
			for ( let key in ret ){
				if ( typeof(ret[key]) === 'string' ){
					ret[key] = this.replaceVariables(ret[key], buffer, null, true);
				}
			}
			delete buffer.header;
			return Object.assign(ret, buffer);
		},
		
		/**
		* Checks if the CSRF token is present and if it match with the token stored in HTTP session.
		*
		* @param Object request An object representing currect request.
		* @param Object handler An object used to handle current conenction.
		*
		* @return Boolean If the token is present and matches with the token stored in HTTP session will be returned "true", otherwise an error will be sent to the client and will be returned "false".
		*/
		checkCSRFToken: function(request, handler){
			if ( typeof(request.session.csrfToken) !== 'string' || request.session.csrfToken === '' || typeof(request.body.csrfToken) !== 'string' || request.body.csrfToken === '' || request.body.csrfToken !== request.session.csrfToken ){
				application.logger.returnError(handler, 61, 'CSRF token mismatch.');
				return false;
			}
			return true;
		},
		
		/**
		* Replaces variables' placeholders with the corresponding value within the given string.
		*
		* @param String data The string containing the placeholders.
		* @param Object variables An object containing variables values.
		* @param String context A string used as namespace during object's loop.
		*
		* @return String the processed string.
		*/
		replaceVariables: function(data, variables, context){
			context = typeof(context) !== 'string' ? '' : context + '.';
			for ( let key in variables ){
				if ( typeof(variables[key]) === 'object' && variables[key] !== null ){
					data = this.replaceVariables(data, variables[key], context + key);
					continue;
				}
				data = data.replace(new RegExp('\{' + context + key + '\}', 'g'), variables[key]);
			}
			return data;
		},
		
		/**
		* Validates a given e-mail address.
		*
		* @param String email A string containing the e-mail address that shall be validated.
		*
		* @return Boolean If the given e-mail address is valid will be returned "true", otherwise "false".
		*/
		validateEmailAddress: function(email){
			if ( email === '' ){
				return false;
			}
			let regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return regex.test(email);
		},
		
		/**
		* Validates a given MongoDB ID.
		*
		* @param String id A string containing the ID that shall be validated.
		*
		* @return Boolean If the given ID is valid will be returned "true", otherwise "false".
		*/
		validateID: function(id){
			if ( id === '' ){
				return false;
			}
			let regex = new RegExp('^[0-9a-fA-F]{24}$');
			return regex.test(id) === true ? true : false;
		},
		
		/**
		* Converts special chars into the corresponding HTML entities.
		*
		* @param String string The string that shall be processed.
		*
		* @return String The processed string.
		*/
		escapeHTML: function(string){
			switch ( typeof(string) ){
				case 'function':{
					return '';
				}break;
				case 'object':{
					for ( let key in string ){
						string[key] = this.escapeHTML(string[key]);
					}
					return string;
				}break;
				default:{
					string = '' + string;
					return '' + string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\'/g, '&apos;').replace(/\"/g, '&quot;');
				}break;
			}
		},
		
		/**
		* Writes a given image to a file.
		*
		* @param String data A string representing the image encoded as Base64.
		*
		* @return String A string containing the generated filename, if no file has been written, will be returned null.
		*/
		writeImage: function(data){
			let extension = null;
			switch ( data.substr(0, data.indexOf(';')).toLowerCase() ){
				case 'image/jpg':
				case 'image/jpeg':{
					extension = '.jpg';
				}break;
				case 'image/png':{
					extension = '.png';
				}break;
				default:{
					return null;
				}break;
			}
			try{
				let filename = this.createToken(32) + extension;
				filesystem.writeFileSync('covers/' + filename, data.substr(data.indexOf('base64,') + 7), 'base64');
				return filename;
			}catch(ex){
				console.log(ex);
				return null;
			}
		},
		
		/**
		* Converts a counter value into a human readable string.
		*
		* @param Integer value An integer number greater or equal than zero.
		*
		* @return String A string containing the counter value.
		*/
		stringifyCounterValue: function(value){
			value = parseInt(value);
			if ( isNaN(value) === true || value <= 0 ){
				return '0';
			}
			value = Math.abs(value);
			if ( Math.floor( value / 1000 ) > 0 ){
				value = value / 1000;
				if ( Math.floor( value / 1000 ) > 0 ){
					value = value / 1000;
					if ( Math.floor( value / 1000 ) > 0 ){
						value = value / 1000;
						if ( Math.floor( value / 1000 ) > 0 ){
							value = value / 1000;
							return Math.floor( value / 1000 ) > 0 ? ( Math.floor( value / 1000 ) + ' P' ) : ( Math.floor(value) + ' T' );
						}
						return Math.floor(value) + ' G';
					}
					return Math.floor(value) + ' M';
				}
				return Math.floor(value) + ' K';
			}
			return value.toString();
		},
		
		/**
		* Converts the elements inside the given array from plain string to instances of "mongodb.ObjectID".
		*
		* @param Array elements A sequential array of strings.
		*
		* @return Array A sequential array of instances of the class "mongodb.ObjectID".
		*/
		toIDArray: function(elements){
			for ( let i = 0 ; i < elements.length ; i++ ){
				elements[i] = new mongodb.ObjectID(elements[i]);
			}
			return elements;
		},
		
		/**
		* Returns the IP address of the client.
		*
		* @param Object request An object representing current client connection.
		*
		* @return String A string containing the IP address.
		*/
		getClientIP: function(request){
			let address = request.header('x-forwarded-for');
			return address ? address.split(',')[0] : request.connection.remoteAddress;
		},
		
		/**
		* Sends an e-mail message to a given e-mail address.
		*
		* @param String address A string containing the e-mail address of the recipient.
		* @param String title A string containing the title of the message, note that this will be used both for message title and subject.
		* @param String text A string containing the message.
		*/
		sendGenericEmail: function(address, title, text){
			try{
				let template = filesystem.readFileSync(__dirname + '/generic_mail.html').toString();
				if ( template === '' ){
					return;
				}
				template = template.replace('{header}', application.configuration.mail.contents.generic.header).replace('{url}', application.configuration.completeURL).replace('{title}', title).replace('{text}', text);
				nodeMailer.createTransport({
					sendmail: true,
					newline: 'unix',
					path: application.configuration.mail.sendmail
				}).sendMail({
					from: application.configuration.mail.from.generic,
					to: address,
					subject: title,
					html: template
				});
			}catch(ex){
				console.log(ex);
				return;
			}
		}
	},
	
	user: {
		authenticator: {
			/**
			* Checks if the given password matches to the user's password.
			*
			* @param String email A string containing the e-mail address of the user.
			* @param String password A string containng the password that will be tested.
			*/
			login: function(email, password){
				return new Promise(function(resolve, reject){
					application.database.collection('users').findOne({
						email: email
					}, function(error, element){
						if ( error ){
							console.log(error);
							return reject(0);
						}
						if ( element === null ){
							return reject(1);
						}
						if ( crypto.createHash('sha512').update(password).digest('hex') !== element.password ){
							return reject(2);
						}
						resolve({
							name: element.name,
							surname: element.surname,
							completeName: element.name === '' || element.surname === '' ? ( element.name + element.surname ) : ( element.name + ' ' + element.surname ),
							email: element.email,
							admin: element.admin,
							id: element['_id'].toString(),
							remember: element.remember,
							admin: element.admin === true ? true : false
						});
					});
				});
			},
			
			/**
			* Inserts user information within current HTTP session and, if requested, create a cookie used to allow automatic login.
			*
			* @param Object user An object containing user informations.
			* @param Object request An object representing current client connection.
			* @param Object handler An object used to handle current conenction.
			* @param Boolean remember If set to "true" a cookie used to allow automatic login will be created, otherwise not.
			*/
			createUserSession: function(user, request, handler, remember){
				request.session.user = user;
				if ( remember === true ){
					handler.cookie('user', user.remember, {
						maxAge: 2592000,
						httpOnly: true
					});
				}
			},
			
			/**
			* Removes user information form current HTTP session end, if found, from cookies.
			*
			* @param Object request An object representing current client connection.
			* @param Object handler An object used to handle current conenction.
			*/
			logout: function(request, handler){
				request.session.user = null;
				handler.clearCookie('user');
			}
		},
		
		/**
		* Returns the authenticated user checking data from current HTTP session and cookie and then validating it.
		*
		* @param Object request An object representing current client connection.
		* @param Object handler An object used to handle current conenction.
		*/
		getAuthenticatedUser: function(request, handler){
			return new Promise(function(resolve, reject){
				if ( typeof(request.session) !== 'undefined' && typeof(request.session.user) === 'object' && request.session.user !== null ){
					application.database.collection('users').findOne({
						'_id': new mongodb.ObjectID(request.session.user.id)
					}, function(error, element){
						if ( error ){
							console.log(error);
							return reject();
						}
						if ( element === null ){
							request.session.user = null;
							return resolve(null);
						}
						element.id = element['_id'].toString();
						delete element['_id'];
						resolve(element);
					});
				}else{
					if ( typeof(request.cookies) !== 'undefined' && typeof(request.cookies.user) === 'string' && request.cookies.user !== '' ){
						application.database.collection('users').findOne({
							'remember': request.cookies.user
						}, function(error, element){
							if ( error ){
								console.log(error);
								return reject();
							}
							if ( element === null ){
								handler.clearCookie('user');
								return resolve(null);
							}
							let user = {
								name: element.name,
								surname: element.surname,
								completeName: element.name === '' || element.surname === '' ? ( element.name + element.surname ) : ( element.name + ' ' + element.surname ),
								email: element.email,
								admin: element.admin,
								id: element['_id'].toString(),
								remember: element.remember,
								admin: element.admin === true ? true : false
							};
							application.user.authenticator.createUserSession(user, request, handler, true);
							resolve(user);
						});
					}else{
						resolve(null);
					}
				}
			});
		},
		
		/**
		* Returns registered users.
		*
		* @param Integer page An integer number greater than zero used to paginate through results, each page can contain max 20 elements.
		*/
		getUsers: function(page){
			return new Promise(function(resolve, reject){
				application.database.collection('users').find(null, {
					limit: page * 20,
					sort: {
						name: -1
					},
					skip: ( page - 1 ) * 20
				}).toArray(function(error, elements){
					if ( error ){
						console.log(error);
						return reject();
					}
					let ret = new Array();
					for ( let i = 0 ; i < elements.length ; i++ ){
						ret.push({
							id: elements[i]['_id'],
							name: elements[i].name,
							surname: elements[i].surname,
							email: elements[i].email,
							date: elements[i].date,
							admin: elements[i].admin
						});
					}
					resolve(ret);
				});
			});
		},
		
		/**
		* Removes a given user.
		*
		* @param String user A string containng the ID of the user that shall be removed.
		* @param Boolean removeContents If set to "true" all containents created by this user, such articles, comments and appreciations, will be removed from the database.
		*/
		remove: function(user, removeContents){
			return new Promise(function(resolve, reject){
				let id = typeof(user) === 'string' ? user : user.id;
				user = new mongodb.ObjectID(id);
				application.database.collection('users').findOne({
					'_id': {
						'$ne': user
					},
					admin: true
				}, function(error, element){
					if ( error ){
						console.log(error);
						return reject(0);
					}
					if ( element === null ){
						return reject(1);
					}
					application.database.collection('users').deleteOne({
						'_id': user
					}, function(error){
						if ( error ){
							console.log(error);
							return reject(0);
						}
						if ( removeContents !== true ){
							return resolve();
						}
						application.database.collection('articles').find({
							author: user
						}).toArray(function(error, elements){
							if ( error ){
								console.log(error);
								return reject(0);
							}
							for ( let i = 0 ; i < elements.length ; i++ ){
								application.article.remove(elements[i]['_id'].toString());
							}
							application.comment.removeUserComments(id);
							application.appreciation.removeUserAppreciations(id);
							resolve();
						});
					});
				});
			});
		},
		
		/**
		* Edits user information.
		*
		* @param Object data An object containg the new user information.
		* @param String user A string containg the ID of the user that shall be edited.
		*/
		edit: function(data, user){
			return new Promise(function(resolve, reject){
				user = new mongodb.ObjectID(user);
				application.database.collection('users').findOne({
					'_id': user
				}, function(error, element){
					if ( error ){
						console.log(error);
						return reject(0);
					}
					if ( element === null ){
						console.log(error);
						return reject(1);
					}
					application.database.collection('users').update({
						'_id': new mongodb.ObjectID(user)
					}, {
						'$set': {
							name: data.name,
							surname: data.surname,
							email: data.email
						}
					}, function(error){
						if ( error ){
							console.log(error);
							return reject(0);
						}
						if ( element.email !== data.email ){
							let title = 'E-mail address changed.';
							let text = 'Hello ' + ( element.name === '' || element.surname === '' ? ( element.name + element.surname ) : ( element.name + ' ' + element.surname ) ) + '!';
							text += 'The e-mail address associated to your account has been changed, according to our information, this is your new e-mail address: ' + data.email;
							application.utils.sendGenericEmail(element.email, title, text);
							application.utils.sendGenericEmail(data.email, title, text);
						}
						resolve();
					});
				});
			});
		},
		
		/**
		* Changes user password.
		*
		* @param String oldPassword A string containing current user password.
		* @param String newPassword A string containg the new password.
		* @param String user A string containg the ID of the user that shall be edited.
		*/
		changePassword: function(oldPassword, newPassword, user){
			return new Promise(function(resolve, reject){
				user = new mongodb.ObjectID(user);
				application.database.collection('users').findOne({
					'_id': user
				}, function(error, element){
					if ( error ){
						console.log(error);
						return reject(0);
					}
					if ( element === null ){
						return reject(1);
					}
					if ( crypto.createHash('sha512').update(oldPassword).digest('hex') !== element.password ){
						return reject(2);
					}
					application.database.collection('users').update({
						'_id': user
					}, {
						'$set': {
							password: crypto.createHash('sha512').update(newPassword).digest('hex')
						}
					}, function(error){
						if ( error ){
							console.log(error);
							return reject(0);
						}
						let text = 'Hello ' + ( element.name === '' || element.surname === '' ? ( element.name + element.surname ) : ( element.name + ' ' + element.surname ) ) + '!';
						text += 'Your password has recently been updated.';
						application.utils.sendGenericEmail(element.email, 'Password change.', text);
						resolve();
					});
				});
			});
		},
		
		/**
		* Creates a new user.
		*
		* @param String name A string containing the user name.
		* @param String surname A string containing the user surname.
		* @param String email A string containing the user e-mail address.
		* @param String password A string containing the user password.
		*/
		create: function(name, surname, email, password){
			return new Promise(function(resolve, reject){
				let user = {
					name: name,
					surname: surname,
					email: email,
					password: crypto.createHash('sha512').update(password).digest('hex'),
					date: new Date(),
					remember: application.utils.createToken(256),
					admin: false
				};
				application.database.collection('users').insertOne(user, function(error){
					if ( error ){
						console.log(error);
						return reject(( error.code === 11000 ? 1 : 0 ));
					}
					delete user.password;
					delete user.date;
					let text = 'Hello ' + ( user.name === '' || user.surname === '' ? ( user.name + user.surname ) : ( user.name + ' ' + user.surname ) ) + '!';
					text += 'Your account has successfully been created!';
					application.utils.sendGenericEmail(user.email, 'Welcome!', text);
					resolve(user);
				});
			});
		}
	},
	
	article: {
		/**
		* Creates a new article.
		*
		* @param String title A string containing the article title.
		* @param String text A string containing the article body.
		* @param Array tags A sequential array of strings containing the tags, this may be an empty array.
		* @param String url A string containng the URL assigned to the article, note that this string must be unique.
		* @param String author An object representing the user who is going to create the article, the user must be an admin.
		* @param String cover A string containing the path to the cover image, if set to null, no cover image will be set. 
		*/
		create: function(title, text, tags, url, author, cover){
			return new Promise(function(resolve, reject){
				authorID = new mongodb.ObjectID(author.id);
				application.database.collection('users').findOne({
					'_id': authorID
				}, function(error, element){
					if ( error ){
						console.log(error);
						return reject(0);
					}
					if ( element === null ){
						return reject(2);
					}
					if ( element.admin !== true ){
						return reject(3);
					}
					let article = {
						title: title,
						text: text,
						url: url,
						tags: tags,
						cover: cover,
						date: new Date(),
						author: authorID,
						likes: 0,
						dislikes: 0,
						comments: 0,
						views: 0
					};
					application.database.collection('articles').insertOne(article, function(error, element){
						if ( error ){
							console.log(error);
							return reject(( error.code === 11000 ? 1 : 0 ));
						}
						if ( tags !== null ){
							application.database.collection('tags').update({
								tag: {
									'$in': tags
								}
							}, {
								'$inc': {
									count: 1
								}
							}, {
								upsert: true
							});
						}
						article.id = element.ops[0]['_id'].toString();
						article.author = {
							id: author.id,
							name: author.name,
							surname: author.surname
						};
						application.newsletter.sendArticle(article);
						return resolve(article);
					});
				});
			});
		},
		
		/**
		* Returns the articles according to given parameters and mode.
		*
		* @param String mode A string containing the mode name, if no mode is specified all articles will be returned from the most recent to the oldest one.
		* @param Integer page An integer number greater than zero used to paginate through articles.
		* @param Object params An object containing the additional parameters according to the given mode.
		*/
		getArticles: function(mode, page, params){
			return new Promise(function(resolve, reject){
				let request = application.database.collection('articles');
				switch ( mode ){
					case 'featured':{
						request = request.find(typeof(params) === 'object' && params !== null ? {
							_id: {
								'$ne': new mongodb.ObjectID(params.id)
							}
						} : {}, {
							limit: 3,
							sort: {
								likes: -1
							}
						});
					}break;
					case 'suggested':{
						request = request.find({
							tags: params.tags,
							_id: {
								'$ne': new mongodb.ObjectID(params.id)
							}
						}, {
							limit: 3,
							sort: {
								likes: -1
							}
						});
					}break;
					case 'author':{
						request = request.find({
							author: new mongodb.ObjectID(params.author)
						}, {
							limit: page * 10,
							sort: {
								date: -1
							},
							skip: ( page - 1 ) * 10
						});
					}break;
					case 'tag':{
						request = request.find({
							tags: params.tag
						}, {
							limit: page * 10,
							sort: {
								date: -1
							},
							skip: ( page - 1 ) * 10
						});
					}break;
					case 'search':{
						request = request.find({
							'$text': {
								'$search': params.query
							}
						}, {
							limit: page * 10,
							sort: {
								date: -1
							},
							skip: ( page - 1 ) * 10
						});
					}break;
					case 'showcase':{
						request = request.find({}, {
							limit: page * 10,
							sort: {
								views: 1
							},
							skip: ( page - 1 ) * 10
						});
					}break;
					default:{
						mode = null;
						request = request.find({}, {
							limit: page * 10,
							sort: {
								date: -1
							},
							skip: ( page - 1 ) * 10
						});
					}break;
				}
				request.toArray(function(error, elements){
					if ( error ){
						console.log(error);
						return reject(error);
					}
					if ( mode === 'suggested' && elements.length === 0 ){
						return application.article.getArticles('featured', null, {
							id: params.id
						}).then(resolve).catch(reject);
					}
					var ret = new Array(), authors = new Array(), appreciations = new Array();
					if ( elements.length === 0 ){
						return resolve(ret);
					}
					for ( let i = 0 ; i < elements.length ; i++ ){
						elements[i].id = elements[i]['_id'].toString();
						if ( mode === 'featured' || mode === 'suggested' ){
							delete elements[i].text;
							delete elements[i].likes;
							delete elements[i].dislikes;
							delete elements[i].comments;
							delete elements[i].views;
							delete elements[i].tags;
						}else{
							if ( mode === 'showcase' ){
								elements[i].text = elements[i].text.substr(0, 500);
							}
							elements[i].appreciations = {
								like: false,
								unlike: false
							};
						}
						elements[i].author = elements[i].author.toString();
						appreciations.push(elements[i]['_id']);
						if ( authors.indexOf(elements[i].author) < 0 ){
							authors.push(elements[i].author);
						}
						delete elements[i]['_id'];
						ret.push(elements[i]);
					}
					application.database.collection('users').find({
						'_id': {
							'$in': application.utils.toIDArray(authors)
						}
					}).toArray(function(error, elements){
						if ( error ){
							console.log(error);
							return reject(error);
						}
						for ( let i = 0 ; i < ret.length ; i++ ){
							let found = false;
							for ( let n = 0 ; n < elements.length ; n++ ){
								if ( elements[n]['_id'].toString() === ret[i].author ){
									ret[i].author = {
										id: elements[n]['_id'].toString(),
										name: elements[n].name,
										surname: elements[n].surname
									};
									found = true;
									break;
								}
							}
							if ( found === false ){
								delete ret[i];
							}
						}
						if ( mode !== 'featured' && mode !== 'suggested' && typeof(params.user) === 'object' && params.user !== null ){
							application.database.collection('appreciations').find({
								reference: {
									'$in': appreciations
								},
								user: new mongodb.ObjectID(params.user.id)
							}).toArray(function(error, elements){
								if ( error ){
									console.log(error);
									return reject(error);
								}
								for ( let i = 0 ; i < elements.length ; i++ ){
									for ( let n = 0 ; n < ret.length ; n++ ){
										if ( elements[i].reference.toString() === ret[n].id ){
											ret[n].appreciations[( elements[i].positive === true ? 'like' : 'unlike' )] = true;
											break;
										}
									}
								}
								resolve(ret);
							});
						}else{
							resolve(ret);
						}
					});
				});
			});
		},
		
		/**
		* Removes an article.
		*
		* @param String id A string containing the article ID. 
		*/
		remove: function(id){
			return new Promise(function(resolve, reject){
				let article = new mongodb.ObjectID(id);
				application.database.collection('articles').findOne({
					'_id': article
				}, function(error, element){
					if ( error ){
						console.log(error);
						return reject();
					}
					if ( element === null ){
						return resolve();
					}
					if ( element.tags !== null ){
						application.database.collection('tags').update({
							count: {
								'$gt': 0
							},
							tag: {
								'$in': element.tags
							}
						}, {
							'$inc': {
								count: -1
							}
						});
					}
					application.database.collection('articles').deleteOne({
						'_id': article
					}, function(error){
						if ( error ){
							console.log(error);
							return reject();
						}
						application.database.collection('comments').deleteMany({
							'reference': article
						}, function(error){
							if ( error ){
								console.log(error);
								return reject();
							}
							application.database.collection('appreciations').deleteMany({
								'reference': article
							}, function(error){
								if ( error ){
									console.log(error);
									return reject();
								}
								application.database.collection('tags').deleteMany({
									count: {
										'$lte': 0
									}
								}, function(error){
									if ( error ){
										console.log(error);
										return reject();
									}
									resolve();
								});
							});
						});
					});
				});
			});
		},
		
		/**
		* Returns an article based upon the given URL.
		*
		* @param String url A string containing the article URL.
		* @param Object user An object representing the user who is currently logged in.
		*/
		getArticleByURL: function(url, user){
			return new Promise(function(resolve, reject){
				application.database.collection('articles').findOne({
					url: url
				}, function(error, element){
					if ( error ){
						console.log(error);
						return reject(0);
					}
					if ( element === null ){
						return reject(1);
					}
					application.database.collection('users').findOne({
						_id: element.author
					}, function(error, author){
						if ( error ){
							console.log(error);
							return reject(0);
						}
						if ( author === null ){
							return reject(0);
						}
						element.author = {
							id: element.author.toString(),
							name: author.name,
							surname: author.surname
						};
						element.id = element['_id'];
						element.appreciations = {
							like: false,
							unlike: false
						};
						if ( user !== null ){
							application.database.collection('appreciations').findOne({
								reference: element['_id'],
								user: new mongodb.ObjectID(user.id)
							}, function(error, appreciation){
								if ( error ){
									console.log(error);
									return reject(0);
								}
								if ( appreciation !== null ){
									element.appreciations[( appreciation.positive === true ? 'like' : 'unlike' )] = true;
								}
								delete element['_id'];
								resolve(element);
							});
						}else{
							delete element['_id'];
							resolve(element);
						}
					});
				});
			});
		},
		
		/**
		* Returns the 10 most popular tags.
		*/
		getTags: function(){
			return new Promise(function(resolve, reject){
				application.database.collection('tags').find(null, {
					limit: 10,
					sort: {
						count: -1
					}
				}).toArray(function(error, elements){
					if ( error ){
						console.log(error);
						return reject();
					}
					let ret = new Array();
					for ( let i = 0 ; i < elements.length ; i++ ){
						ret.push({
							tag: elements[i].tag,
							count: elements[i].count
						});
					}
					resolve(ret);
				});
			});
		},
		
		/**
		* Returns the articles count according to the given mode and parameters.
		*
		* @param String mode A string specifying the mode, if not specified all articles will be counted instead.
		* @param Object params An object containing the additional parameters.
		*/
		getArticlesCount: function(mode, params){
			return new Promise(function(resolve, reject){
				let handle = function(error, count){
					if ( error ){
						console.log(error);
						return reject();
					}
					return resolve(count);
				};
				let request = application.database.collection('articles');
				switch ( mode ){
					case 'author':{
						request = request.count({
							author: new mongodb.ObjectID(params.author)
						}, handle);
					}break;
					case 'tag':{
						request = request.count({
							tags: params.tag
						}, handle);
					}break;
					default:{
						request = request.count(null, handle);
					}break;
				}
			});
		},
		
		/**
		* Increments the views counter of a given article.
		*
		* @param String article A string containing the article ID.
		* @param String identifier A string containing an unique identifier of the viewer, it should be the user ID or the client IP address.
		*/
		incrementViewsCounter: function(article, identifier){
			return new Promise(function(resolve, reject){
				article = new mongodb.ObjectID(article);
				application.database.collection('visitors').findOne({
					reference: article,
					identifier: identifier
				}, function(error, element){
					if ( error ){
						console.log(error);
						return reject();
					}
					if ( element !== null ){
						return resolve();
					}
					application.database.collection('visitors').insertOne({
						reference: article,
						identifier: identifier,
						date: new Date()
					}, function(error){
						if ( error ){
							console.log(error);
							return reject();
						}
						application.database.collection('articles').update({
							'_id': article
						}, {
							'$inc':{
								views: 1
							}
						}, function(error){
							if ( error ){
								console.log(error);
								return reject();
							}
							resolve();
						});
					});
				});
			});
		}
	},
	
	newsletter: {
		/**
		* Adds a given e-mail address to the mailing list.
		*
		* @param String email A string containing the e-mail address.
		*/
		addAddress: function(email){
			return new Promise(function(resolve, reject){
				application.database.collection('subscribers').insert({
					email: email,
					date: new Date(),
					revocation: application.utils.createToken(32)
				}, function(error, collection){
					if ( error ){
						console.log(error);
						return reject();
					}
					resolve();
				});
			});
		},
		
		/**
		* Removes a given e-mail address from the mailing list.
		*
		* @param String email A string containing the e-mail address.
		*/
		removeAddress: function(email){
			return new Promise(function(resolve, reject){
				application.database.collection('subscribers').deleteOne({
					email: email
				}, function(error){
					if ( error ){
						console.log(error);
						return reject();
					}
					resolve();
				});
			});
		},
		
		/**
		* Removes a given e-mail address from the mailing list using the revocation token.
		*
		* @param String token A string containing the revocation token.
		*/
		removeAddressByRevocationToken: function(token){
			return new Promise(function(resolve, reject){
				application.database.collection('subscribers').deleteOne({
					revocation: token
				}, function(error){
					if ( error ){
						console.log(error);
						return reject();
					}
					resolve();
				});
			});
		},
		
		/**
		* Sends an article to the entire mailing list.
		*
		* @param Object article An object representing the article.
		*/
		sendArticle: function(article){
			return new Promise(function(resolve, reject){
				try{
					let template = filesystem.readFileSync(__dirname + '/mail.html').toString();
					if ( template === '' ){
						return reject();
					}
					let link = application.configuration.completeURL + '/article/' + encodeURIComponent(article.url);
					let cover = article.cover !== null ? '<a id="main-article-cover-link" href="' + link + '" title="Read the article."><div id="main-article-cover" style="background-image:url(' + application.configuration.completeURL + '/covers/' + article.cover + ');"></div></a>' : '';
					template = template.replace('{header}', application.configuration.mail.contents.newsletter.header);
					template = template.replace('{url}', application.configuration.completeURL);
					template = template.replace('{title}', application.utils.escapeHTML(article.title));
					template = template.replace('{text}', article.text.replace(/(?:\r\n|\r|\n)/g, '<br />'));
					template = template.replace('{cover}', cover);
					template = template.replace('{link}', link);
					template = template.replace('{readMore}', link);
					let transport = nodeMailer.createTransport({
						sendmail: true,
						newline: 'unix',
						path: application.configuration.mail.sendmail
					});
					let tags = '';
					if ( article.tags !== null && article.tags.length > 0 ){
						tags = '<span id="main-article-tags">Tags: ';
						for ( let i = 0 ; i < article.tags.length ; i++ ){
							tags += ( i === 0 ? '' : ', ' ) + '<a class="main-article-tags-element" title="More articles with this tag..." href="' + application.configuration.completeURL + '/tag/' + encodeURIComponent(article.tags[i]) + '">' + application.utils.escapeHTML(article.tags[i]) + '</a>';
						}
						tags += '</span><br />';
					}
					let author = article.author.name === '' || article.author.surname === '' ? ( article.author.name + article.author.surname ) : ( article.author.name + ' ' + article.author.surname );
					author = '<a id="main-article-author" title="More articles from this author..." "href="' + application.configuration.completeURL + '/author/' + article.author.id + '">' + author + '</a><br />';
					template = template.replace('{tags}', tags).replace('{author}', author);
					application.database.collection('subscribers').find(null).toArray(function(error, elements){
						if ( error ){
							console.log(error);
							return reject();
						}
						for ( let i = 0 ; i < elements.length ; i++ ){
							transport.sendMail({
								from: application.configuration.mail.from.generic,
								to: elements[i].email,
								subject: application.configuration.mail.contents.newsletter.subject,
								html: template.replace('{token}', elements[i].revocation)
							});
						}
						resolve();
					});
				}catch(ex){
					console.log(ex);
					return reject();
				}
			});
		},
		
		/**
		* Returns all the e-mail addresses contained in the mailing list.
		*
		* @param Integer page An integer number greater than zero used to paginate through elements.
		*/
		listAddresses: function(page){
			return new Promise(function(resolve, reject){
				application.database.collection('subscribers').find(null, {
					limit: page * 20,
					sort: {
						email: -1
					},
					skip: ( page - 1 ) * 20
				}).toArray(function(error, elements){
					if ( error ){
						console.log(error);
						return reject();
					}
					let ret = new Array();
					for ( let i = 0 ; i < elements.length ; i++ ){
						ret.push({
							email: elements[i].email,
							date: elements[i].date
						});
					}
					resolve(ret);
				});
			});
		}
	},
	
	comment: {
		/**
		* Returns all the comments for a given article.
		*
		* @param String article A string representing the article ID.
		* @param Integer page An integer number greater than zero used to paginate through comments.
		* @param Object user An object representing the user who is currently logged in.
		*/
		loadComments: function(article, page, user){
			return new Promise(function(resolve, reject){
				application.database.collection('comments').find({
					reference: new mongodb.ObjectID(article)
				}, {
					limit: page * 20,
					sort: {
						date: -1
					},
					skip: ( page - 1 ) * 20
				}).toArray(function(error, elements){
					if ( error ){
						console.log(error);
						return reject();
					}
					var ret = new Array(), authors = new Array();
					if ( elements.length === 0 ){
						return resolve(ret);
					}
					for ( let i = 0 ; i < elements.length ; i++ ){
						ret.push(elements[i]);
						elements[i].id = elements[i]['_id'];
						elements[i].owner = false;
						if ( user !== null && elements[i].author.toString() === user.id ){
							elements[i].author = {
								id: user.id,
								name: user.name,
								surname: user.surname
							};
							elements[i].owner = true;
						}
						delete elements[i]['_id'];
						delete elements[i]['reference'];
						if ( elements[i].author instanceof mongodb.ObjectID ){
							elements[i].author = elements[i].author.toString();
							if ( authors.indexOf(elements[i].author) < 0 ){
								authors.push(elements[i].author);
							}
						}
					}
					if ( authors.length === 0 ){
						return resolve(ret);
					}
					application.database.collection('users').find({
						'_id': {
							'$in': application.utils.toIDArray(authors)
						}
					}).toArray(function(error, elements){
						if ( error ){
							console.log(error);
							return reject();
						}
						for ( let i = 0 ; i < ret.length ; i++ ){
							if ( ret[i].author !== null ){
								let buffer = false;
								for ( let n = 0 ; n < elements.length ; n++ ){
									if ( ret[i].author === elements[n]['_id'].toString() ){
										ret[n].author = {
											id: elements[n]['_id'].toString(),
											name: elements[n].name,
											surname: elements[n].surname
										};
										buffer = true;
										break;
									}
								}
								if ( buffer === false ){
									ret[i].author = null;
								}
							}
						}
						resolve(ret);
					});
				});
			});
		},
		
		/**
		* Returns all the comments for a given user.
		*
		* @param Object user The user who own the comments that will be returned.
		* @param Integer page An integer number greater than zero used to paginate through comments.
		*/
		loadUserComments: function(user, page){
			return new Promise(function(resolve, reject){
				user = new mongodb.ObjectID(user);
				application.database.collection('users').findOne({
					'_id': user
				}, function(error, element){
					if ( error ){
						console.log(error);
						return reject(0);
					}
					if ( element === null ){
						return reject(1);
					}
					application.database.collection('comments').find({
						author: user
					}, {
						limit: page * 20,
						sort: {
							date: -1
						},
						skip: ( page - 1 ) * 20
					}).toArray(function(error, elements){
						if ( error ){
							console.log(error);
							return reject(0);
						}
						let ret = new Array(), articles = new Array();
						for ( let i = 0 ; i < elements.length ; i++ ){
							let buffer = elements[i].reference.toString();
							if ( articles.indexOf(buffer) < 0 ){
								articles.push(buffer);
							}
							ret.push({
								id: elements[i]['_id'].toString(),
								text: elements[i].text,
								article: buffer,
								date: elements[i].date
							});
						}
						application.database.collection('articles').find({
							'_id':{
								'$in': application.utils.toIDArray(articles)
							}
						}).toArray(function(error, elements){
							if ( error ){
								console.log(error);
								return reject(0);
							}
							for ( let i = 0 ; i < ret.length ; i++ ){
								let buffer = false;
								for ( let n = 0 ; n < elements.length ; n++ ){
									if ( ret[i].article === elements[n]['_id'].toString() ){
										ret[i].article = elements[n].url;
										buffer = true;
										break;
									}
								}
								if ( buffer === false ){
									delete ret[i];
								}
							}
							resolve(ret);
						});
					});
				})
			});
		},
		
		/**
		* Creates a new comment.
		*
		* @param String article A string containing the article ID.
		* @param String text A string containing the text of the comment.
		* @param Object user An object representing the comment author, if null the comment will be created anonymously.
		*/
		create: function(article, text, user){
			return new Promise(function(resolve, reject){
				article = new mongodb.ObjectID(article);
				application.database.collection('articles').findOne({
					'_id': article
				}, function(error, element){
					if ( error ){
						console.log(error);
						return reject(0);
					}
					if ( element === null ){
						return reject(1);
					}
					let author = user === null ? null : new mongodb.ObjectID(user.id);
					let comment = {
						text: text,
						reference: article,
						date: new Date(),
						author: author
					};
					if ( author !== null ){
						application.database.collection('users').findOne({
							'_id': author
						}, function(error, element){
							if ( error ){
								console.log(error);
								return reject(0);
							}
							if ( element === null ){
								return reject(2);
							}
							application.database.collection('comments').insertOne(comment, function(error, element){
								if ( error ){
									console.log(error);
									return reject(0);
								}
								application.database.collection('articles').update({
									'_id': article
								}, {
									'$inc': {
										comments: 1
									}
								}, function(error){
									if ( error ){
										console.log(error);
										return reject(0);
									}
									comment.id = element.ops[0]['_id'].toString();
									delete comment.reference;
									delete comment['_id'];
									comment.author = {
										id: user.id,
										name: user.name,
										surname: user.surname
									};
									resolve(comment);
								});
							});
						});
					}else{
						application.database.collection('comments').insertOne(comment, function(error, element){
							if ( error ){
								console.log(error);
								return reject(0);
							}
							application.database.collection('articles').update({
								'_id': article
							}, {
								'$inc': {
									comments: 1
								}
							}, function(error){
								if ( error ){
									console.log(error);
									return reject(0);
								}
								comment.id = element.ops[0]['_id'].toString();
								delete comment.reference;
								delete comment['_id'];
								if ( comment.author !== null ){
									comment.author = {
										id: user.id,
										name: user.name,
										surname: user.surname
									};
								}
								resolve(comment);
							});
						});
					}
				});
			});
		},
		
		/**
		* Removes a comment.
		*
		* @param String id A string representing the comment ID.
		* @param Object user An object representing the comment author.
		*/
		remove: function(id, user){
			return new Promise(function(resolve, reject){
				id = new mongodb.ObjectID(id);
				application.database.collection('comments').findOne({
					'_id': id
				}, function(error, element){
					if ( error ){
						console.log(error);
						return reject(0);
					}
					if ( user.admin !== true && user.id !== ( element.author === null ? null : element.author.toString() ) ){
						return reject(1);
					}
					application.database.collection('comments').deleteOne({
						'_id': id
					}, function(error){
						if ( error ){
							console.log(error);
							return reject(0);
						}
						application.database.collection('articles').update({
							'_id': element.reference
						}, {
							'$inc': {
								comments: -1
							}
						}, function(error){
							if ( error ){
								console.log(error);
								return reject(0);
							}
							resolve();
						});
					});
				});
			});
		},
		
		/**
		* Removes all comments created by a given user.
		*
		* @param String user A string representing the user ID.
		* @param String article A string representing an article ID, this is an optional parameter used to remove all comments created by a given user and attached to a given article.
		*/
		removeUserComments: function(user, article){
			return new Promise(function(resolve, reject){
				application.database.collection('comments').find(( typeof(article) === 'object' && article !== null ? {
					reference: new mongodb.ObjectID(article),
					author: new mongodb.ObjectID(user)
				} : {
					author: new mongodb.ObjectID(user)
				} )).toArray(function(error, elements){
					if ( error ){
						console.log(error);
						return reject();
					}
					for ( let i = 0 ; i < elements.length ; i++ ){
						application.database.collection('articles').update({
							'_id': elements[i].reference
						}, {
							'$inc': {
								comments: -1
							}
						}, function(error){
							if ( !error ){
								application.database.collection('comments').deleteOne({
									'_id': elements[i]['_id']
								});
							}
						});
					}
					resolve();
				});
			});
		}
	},
	
	appreciation: {
		/**
		* Toggles an apprecciation for an article.
		*
		* @param Boolean positive If set to "true" it will toggle a positive apprecciation, otherwise a negative one.
		* @param String article A string containing the article ID.
		* @param Object user An object representing the user.
		*/
		toggle: function(positive, article, user){
			return new Promise(function(resolve, reject){
				let appreciation = {
					like: false,
					unlike: false
				};
				article = new mongodb.ObjectID(article);
				user = new mongodb.ObjectID(user.id);
				application.database.collection('appreciations').findOne({
					reference: article,
					positive: positive
				}, function(error, collection){
					if ( error ){
						console.log(error);
						return reject();
					}
					if ( collection === null ){
						application.database.collection('appreciations').findOne({
							reference: article,
							positive: !positive
						}, function(error, collection){
							if ( error ){
								console.log(error);
								return reject();
							}
							if ( collection !== null ){
								application.database.collection('appreciations').deleteOne({
									reference: article,
									positive: !positive
								}, function(error){
									if ( error ){
										console.log(error);
										return reject();
									}
									application.database.collection('articles').update({
										'_id': article
									}, {
										'$inc': positive === true ? {
											dislikes: -1
										} : {
											likes: -1
										}
									}, function(error){
										if ( error ){
											console.log(error);
											return reject();
										}
										application.database.collection('appreciations').insertOne({
											reference: article,
											user: user,
											date: new Date(),
											positive: positive
										}, function(error){
											if ( error ){
												return reject();
											}
											appreciation[( positive === true ? 'like' : 'unlike' )] = true;
											application.database.collection('articles').update({
												'_id': article
											}, {
												'$inc': positive === true ? {
													likes: 1
												} : {
													dislikes: 1
												}
											}, function(error){
												if ( error ){
													console.log(error);
													return reject();
												}
												resolve(appreciation);
											});
										});
									});
								});
							}else{
								application.database.collection('appreciations').insertOne({
									reference: article,
									user: user,
									date: new Date(),
									positive: positive
								}, function(error){
									if ( error ){
										console.log(error);
										return reject();
									}
									appreciation[( positive === true ? 'like' : 'unlike' )] = true;
									application.database.collection('articles').update({
										'_id': article
									}, {
										'$inc': positive === true ? {
											likes: 1
										} : {
											dislikes: 1
										}
									}, function(error){
										if ( error ){
											console.log(error);
											return reject();
										}
										resolve(appreciation);
									});
								});
							}
						});
					}else{
						application.database.collection('appreciations').deleteOne({
							reference: article,
							positive: positive
						}, function(error){
							if ( error ){
								console.log(error);
								return reject();
							}
							application.database.collection('articles').update({
								'_id': article
							}, {
								'$inc': positive === true ? {
									likes: -1
								} : {
									dislikes: -1
								}
							}, function(error){
								if ( error ){
									console.log(error);
									return reject();
								}
								resolve(appreciation);
							});
						});
					}
				});
			});
		},
		
		/**
		* Removes all appreciations for a given user.
		*
		* @param String user A string containing the user ID.
		* @param String article A string representing an article ID, this is an optional parameter used to remove all appreciations created by a given user and attached to a given article.
		*/
		removeUserAppreciations: function(user, article){
			return new Promise(function(resolve, reject){
				application.database.collection('appreciations').find(( typeof(article) === 'object' && article !== null ? {
					reference: new mongodb.ObjectID(article),
					author: new mongodb.ObjectID(user)
				} : {
					author: new mongodb.ObjectID(user)
				} )).toArray(function(error, elements){
					if ( error ){
						console.log(error);
						return reject();
					}
					for ( let i = 0 ; i < elements.length ; i++ ){
						application.database.collection('articles').update({
							'_id': elements[i].reference
						}, {
							'$inc': elements[i].reference === true ? {
								likes: -1
							} : {
								dislikes: -1
							}
						}, function(error){
							if ( !error ){
								application.database.collection('appreciations').deleteOne({
									'_id': elements[i]['_id']
								});
							}
						});
					}
					resolve();
				});
			});
		}
	}
};
//Export objects to make them available to the application.
exports.logger = application.logger;
exports.utils = application.utils;
exports.user = application.user;
exports.article = application.article;
exports.newsletter = application.newsletter;
exports.comment = application.comment;
exports.appreciation = application.appreciation;