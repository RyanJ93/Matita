'use strict';

var Utils = {
	/**
	* @var String CSRFToken A string containing the CSRF token that has been get from HTML meta tags.
	*/
	CSRFToken: null,
	
	/**
	* Create a new XHR object.
	*
	* @return object A XHR object used to manage AJAX connections.
	*/
	makeConnection: function(){
		try {
	        return new XMLHttpRequest();
	    }catch(e){}
	    try {
	        return new ActiveXObject('Msxml3.XMLHTTP');
	    }catch(e){}
	    try {
	        return new ActiveXObject('Msxml2.XMLHTTP.6.0');
	    }catch(e){}
	    try {
	        return new ActiveXObject('Msxml2.XMLHTTP.3.0');
	    }catch(e){}
	    try {
	        return new ActiveXObject('Msxml2.XMLHTTP');
	    }catch(e){}
	    try {
	        return new ActiveXObject('Microsoft.XMLHTTP');
	    }catch(e){}
	    return null;
	},
	
	/**
	* Gets a specified parameter from the query string sent with current URL.
	*
	* @param String name A string containing the parameter name.
	*
	* @return String A string containing the parameter value.
	*/
	getParam: function(name){
		var query = window.location.href.indexOf('?');
		if ( query < 0 ){
			return null;
		}
		query = window.location.href.substr(query + 1).split('&');
		for ( var i = 0 ; i < query.length ; i++ ){
			var buffer = query[i].split('=');
			if ( buffer[0] === name ){
				return decodeURIComponent(buffer[1]);
			}
		}
		return null;
	},
	
	/**
	* Prevents form submission.
	*
	* @param Object event The event object.
	*/
	preventFormSubmit: function(event){
		event.preventDefault();
		event.stopPropagation();
	},
	
	/**
	* Gets the CSRF token.
	*
	* @param Boolean url If set to "true", the token will be encoded as GET parameter, otherwise will be returned as it is.
	*
	* @return String A string containing the CSRF token.
	*/
	getCSRFToken: function(url){
		if ( this.CSRFToken === null ){
			this.CSRFToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
		}
		return url === true ? ( 'csrfToken=' + encodeURIComponent(this.CSRFToken) ) : this.CSRFToken;
	},
	
	/**
	* Checks if a CSRF token related error has been thrown.
	*
	* @param Object response An object containing the data sent by the server.
	*
	* @return Boolean If the response contains a CSRF token related error will be returned "true", otherwise "false".
	*/
	checkCSRFStatus: function(response){
		if ( typeof(response) === 'object' && response !== null && typeof(response.code) !== 'undefined' && response.code === 61 ){
			UI.alert.show('Session has expired', 'Current session has expired, the page needs to be reloaded.');
			window.location.reload(true);
			return false;
		}
		return true;
	},
	
	/**
	* Removes whitespaces from the start and the end of a given string.
	*
	* @param String string The string that shall be processed.
	*
	* @return String The processed string.
	*/
	trim: function(string){
		return string.replace(/^\s+|\s+$/g, '');
	}
};

var UI = {
	form: {
		/**
		* Shows login dialog.
		*/
		showLogin: function(){
			UI.menu.close();
			var form = document.getElementById('form-login');
			var overlay = document.getElementById('form-overlay');
			form.style.display = 'block';
			overlay.style.display = 'block';
			window.setTimeout(function(){
				form.style.opacity = '1';
				overlay.style.opacity = '1';
			}, 25);
		},
		
		/**
		* Hides login dialog.
		*
		* @param Boolean clean If set to "true" the form fields of the dialog will be cleaned, otherwise not.
		*/
		hideLogin: function(clean){
			var form = document.getElementById('form-login');
			var overlay = document.getElementById('form-overlay');
			overlay.style.opacity = '0';
			form.style.opacity = '0';
			window.setTimeout(function(){
				form.style.display = 'none';
				overlay.style.display = 'none';
				if ( clean === true ){
					document.getElementById('form-login-email').value = '';
					document.getElementById('form-login-password').value = '';
				}
			}, 250);
		},
		
		/**
		* Shows registration dialog.
		*/
		showRegistration: function(){
			UI.menu.close();
			var form = document.getElementById('form-register');
			var overlay = document.getElementById('form-overlay');
			form.style.display = 'block';
			overlay.style.display = 'block';
			window.setTimeout(function(){
				form.style.opacity = '1';
				overlay.style.opacity = '1';
			}, 25);
		},
		
		/**
		* Hides registration dialog.
		*
		* @param Boolean clean If set to "true" the form fields of the dialog will be cleaned, otherwise not.
		*/
		hideRegistration: function(clean){
			var form = document.getElementById('form-register');
			var overlay = document.getElementById('form-overlay');
			overlay.style.opacity = '0';
			form.style.opacity = '0';
			window.setTimeout(function(){
				form.style.display = 'none';
				overlay.style.display = 'none';
				if ( clean === true ){
					document.getElementById('form-register-name').value = '';
					document.getElementById('form-register-surname').value = '';
					document.getElementById('form-register-email').value = '';
					document.getElementById('form-register-password').value = '';
				}
			}, 250);
		},
		
		/**
		* Shows article creation dialog.
		*/
		showCreation: function(){
			var form = document.getElementById('form-post-creation');
			var overlay = document.getElementById('form-overlay');
			form.style.display = 'block';
			overlay.style.display = 'block';
			window.setTimeout(function(){
				form.style.opacity = '1';
				overlay.style.opacity = '1';
			}, 25);
		},
		
		/**
		* Hides article creation dialog.
		*
		* @param Boolean clean If set to "true" the form fields of the dialog will be cleaned, otherwise not.
		*/
		hideCreation: function(clean){
			var form = document.getElementById('form-post-creation');
			var overlay = document.getElementById('form-overlay');
			overlay.style.opacity = '0';
			form.style.opacity = '0';
			window.setTimeout(function(){
				form.style.display = 'none';
				overlay.style.display = 'none';
				if ( clean === true ){
					document.getElementById('form-post-creation-title').value = '';
					document.getElementById('form-post-creation-text').value = '';
					document.getElementById('form-post-creation-url').value = '';
					document.getElementById('form-post-creation-tags').value = '';
					Blog.resetUploader();
				}
			}, 250);
		},
		
		/**
		* Shows user edit dialog.
		*/
		showUserEdit: function(){
			var form = document.getElementById('profile-edit');
			var overlay = document.getElementById('form-overlay');
			form.style.display = 'block';
			overlay.style.display = 'block';
			window.setTimeout(function(){
				form.style.opacity = '1';
				overlay.style.opacity = '1';
			}, 25);
		},
		
		/**
		* Hides user edit dialog.
		*
		* @param Boolean clean If set to "true" the form fields of the dialog will be cleaned, otherwise not.
		*/
		hideUserEdit: function(clean){
			var form = document.getElementById('profile-edit');
			var overlay = document.getElementById('form-overlay');
			overlay.style.opacity = '0';
			form.style.opacity = '0';
			window.setTimeout(function(){
				form.style.display = 'none';
				overlay.style.display = 'none';
				if ( clean === true ){
					User.revertInfo();
					document.getElementById('profile-edit-field-current-password').value = '';
					document.getElementById('profile-edit-field-new-password').value = '';
					document.getElementById('profile-edit-field-confirm-password').value = '';
				}
			}, 250);
		},
		
		/**
		* Hides all dialogs.
		*/
		hideAll: function(){
			this.hideLogin();
			this.hideRegistration();
			this.hideCreation();
			UI.menu.close();
			this.hideUserEdit();
		}
	},
	
	menu: {
		/**
		* Toggles the menu for mobile devices.
		*/
		toggle: function(){
			var menu = document.getElementById('header-inner-menu');
			var overlay = document.getElementById('header-overlay');
			if ( menu.style.display === 'block' ){
				this.close();
				return;
			}
			if ( window.innerWidth <= 480 ){
				menu.style.display = 'block';
				overlay.style.display = 'block';
				window.setTimeout(function(){
					menu.style.opacity = '1';
					overlay.style.opacity = '1';
				}, 25);
			}
		},
		
		/**
		* Closes the menu for mobile devices.
		*/
		close: function(){
			var menu = document.getElementById('header-inner-menu');
			if ( menu.style.display !== 'block' ){
				return;
			}
			var overlay = document.getElementById('header-overlay');
			menu.style.opacity = '0';
			overlay.style.opacity = '0';
			window.setTimeout(function(){
				menu.style.display = 'none';
				overlay.style.display = 'none';
			}, 250);
		}
	},
	
	cookieLaw: {
		/**
		* Checks if the cookie agreement has been seen.
		*
		* @return Boolean If the agreement has been seen will be returned "true", otherwise "false".
		*/
		checkAgreement: function(){
			var cookies = decodeURIComponent(document.cookie).split(';');
			var value = false;
			for ( var i = 0 ; i < cookies.length ; i++ ){
				var buffer = cookies[i];
				while ( buffer.charAt(' ') === 0 ){
					buffer = buffer.substr(1, buffer.length);
				}
				if ( buffer.indexOf('cl') === 0 ){
					value = buffer === 'cl=1' ? true : false;
					break;
				}
			}
			return value;
		},
		
		/**
		* Shows the banner related to cookie policy.
		*/
		show: function(){
			document.getElementById('cookie-law').style.display = 'block';
		},
		
		/**
		* Closes the banner related to cookie policy and creates a cookie in order to indicate that the agreement has been seen.
		*/
		agree: function(){
			var date = new Date();
			date.setTime(date.getTime() + 2592000);
			document.cookie = 'cl=1; expires=' + ( date.toUTCString() ) + '; path=/';
			document.getElementById('cookie-law').style.display = 'none';
		}
	},
	
	alert: {
		/**
		* Shows an alert to the user.
		*
		* @param String text A string containing the message to be displayed.
		* @param String title A string containing an optional title.
		* @param String scope A string representing the alert's scope, such "error", "success" or "message".
		* @param Function onClose A function provided as callback that will be executed when the alert will be close.
		*/
		show: function(text, title, scope, onClose){
			var element = document.createElement('div');
			element.className = 'alert';
			element.setAttribute('scope', ( typeof(scope) === 'string' ? scope : '' ));
			if ( typeof(title) === 'string' && title !== '' ){
				var innerText = document.createElement('p');
				innerText.className = 'common-text alert-title';
				innerText.textContent = title;
				element.appendChild(innerText);
			}
			if ( typeof(onClose) === 'function' ){
				element.onClose = onClose;
			}
			var innerText = document.createElement('p');
			innerText.className = 'common-text alert-text';
			innerText.textContent = text;
			element.appendChild(innerText);
			var button = document.createElement('button');
			button.className = 'common-text alert-button';
			button.title = 'Close';
			button.textContent = 'Close';
			button.onclick = UI.alert.closeAll;
			element.appendChild(button);
			var closed = UI.alert.closeAll(false);
			var overlay = document.getElementById('alert-overlay');
			if ( overlay === null ){
				overlay = document.createElement('div');
				overlay.id = 'alert-overlay';
				overlay.className = 'alert-overlay';
				overlay.onclick = UI.alert.closeAll;
				document.body.appendChild(overlay);
			}
			document.body.appendChild(element);
			overlay.style.display = 'block';
			window.setTimeout(function(){
				element.style.opacity = '1';
				overlay.style.opacity = '0.5';
			}, ( closed === true ? 275 : 25 ));
		},
		
		/**
		* Hides all alerts.
		*
		* @param Boolean hideOverlay If set to "false" the overlay will not be hided, otherwise it will be hided as of all alerts.
		*
		* @return Boolean If at least one alert has been closed will be returned "true", otherwise "false".
		*/
		closeAll: function(hideOverlay){
			var executeCallbacks = typeof(hideOverlay) === 'object' ? true : false;
			var elements = document.body.querySelectorAll('div.alert');
			for ( var i = 0 ; i < elements.length ; i++ ){
				if ( executeCallbacks === true && typeof(elements[i].onClose) === 'function' ){
					elements[i].onClose.call(this);
				}
				elements[i].style.opacity = '0';
			}
			if ( elements.length > 0 ){
				window.setTimeout(function(){
					var elements = document.body.querySelectorAll('div.alert');
					for ( var i = 0 ; i < elements.length ; i++ ){
						elements[i].parentNode.removeChild(elements[i]);
					}
				}, 250);
			}
			if ( hideOverlay !== false ){
				var overlay = document.getElementById('alert-overlay');
				overlay.style.opacity = '0';
				window.setTimeout(function(){
					overlay.style.display = 'none';
				}, 250);
			}
			return elements.length === 0 ? false : true;
		}
	}
};

var User = {
	/**
	* @var Integer page An integer number greater than zero containing the page number used in users listing.
	*/
	page: 1,
	
	Authenticator: {
		/**
		* Closes login dialog and clean form fields.
		*
		* @param Object event The event object.
		*/
		cancelLogin: function(event){
			event.preventDefault();
			event.stopPropagation();
			UI.form.hideLogin(true);
		},
		
		/**
		* Prevents form submit and does the user login using the provided credentials.
		*
		* @param Object event The event object.
		*/
		triggerLogin: function(event){
			event.preventDefault();
			event.stopPropagation();
			var email = Utils.trim(document.getElementById('form-login-email').value);
			if ( email === '' || email.length > 256 ){
				return UI.alert.show('Invalid e-mail address!', 'You must provide a valid e-mail address.', 'error');
			}
			var password = Utils.trim(document.getElementById('form-login-password').value);
			if ( password === '' || password.length > 30 ){
				return UI.alert.show('Invalid password!', 'You must provide a valid password, max allowed length for password is 30 chars.', 'error');
			}
			var remember = document.getElementById('form-login-remember').checked === true ? '1' : '0';
			var connection = Utils.makeConnection();
			connection.open('POST', '/user.login', true);
			connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			connection.onreadystatechange = function(){
				if ( connection.readyState > 3 ){
					try{
						var data = JSON.parse(connection.responseText);
						if ( Utils.checkCSRFStatus(data) === false ){
							return;
						}
						if ( typeof(data.result) === 'string' && data.result === 'success' ){
							UI.form.hideLogin(true);
							var name = data.data.name === '' || data.data.surname === '' ?  ( data.data.name + data.data.surname ) : ( data.data.name + ' ' + data.data.surname );
							UI.alert.show('User logged in!', 'You are now logged in as ' + name, 'success', function(){
								window.location.reload(true);
							});
							return window.setTimeout(function(){
								window.location.reload(true);
							}, 2000);
						}
						UI.alert.show('Wrong credentials!', 'The provided combination of e-mail and password is not correct.', 'error');
					}catch(ex){
						console.log(ex);
						UI.alert.show('Ops, an error occurred!', 'An unexpected error has occurred during the operation, please retry again.', 'error');
					}
				}
			};
			connection.send(Utils.getCSRFToken(true) + '&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password) + '&remember=' + remember);
		},
		
		/**
		* Closes registration dialog and clean form fields.
		*
		* @param Object event The event object.
		*/
		cancelRegistration: function(event){
			event.preventDefault();
			event.stopPropagation();
			UI.form.hideRegistration(true);
		},
		
		/**
		* Prevents form submit and registers the user.
		*
		* @param Object event The event object.
		*/
		triggerRegistration: function(event){
			event.preventDefault();
			event.stopPropagation();
			var name = Utils.trim(document.getElementById('form-register-name').value);
			if ( name === '' || name.length > 30 ){
				return UI.alert.show('Invalid name!', 'You must provide a valid name that must be up to 30 chars length.', 'error');
			}
			var surname = Utils.trim(document.getElementById('form-register-surname').value);
			if ( surname === '' || surname.length > 30 ){
				return UI.alert.show('Invalid surname!', 'You must provide a valid surname that must be up to 30 chars length.', 'error');
			}
			var email = Utils.trim(document.getElementById('form-register-email').value);
			if ( email === '' || email.length > 256 ){
				return UI.alert.show('Invalid e-mail address!', 'You must provide a valid e-mail address.', 'error');
			}
			var password = Utils.trim(document.getElementById('form-register-password').value);
			if ( password === '' || password.length > 30 ){
				return UI.alert.show('Invalid password!', 'You must provide a valid password, max allowed length for password is 30 chars.', 'error');
			}
			var connection = Utils.makeConnection();
			connection.open('POST', '/user.register', true);
			connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			connection.onreadystatechange = function(){
				if ( connection.readyState > 3 ){
					try{
						var data = JSON.parse(connection.responseText);
						if ( Utils.checkCSRFStatus(data) === false ){
							return;
						}
						if ( typeof(data.result) === 'string' && data.result === 'success' ){
							UI.form.hideRegistration(true);
							var name = data.data.name === '' || data.data.surname === '' ?  ( data.data.name + data.data.surname ) : ( data.data.name + ' ' + data.data.surname );
							UI.alert.show('Registration completed!', 'Welcome ' + name + '!', 'success', function(){
								window.location.reload(true);
							});
							return window.setTimeout(function(){
								window.location.reload(true);
							}, 2000);
						}
						if ( data.code === 63 ){
							return UI.alert.show('User already existing!', 'An user with the same e-mail address has been found.', 'error');
						}
						UI.alert.show('Ops, an error occurred!', 'An unexpected error has occurred during the operation, please retry again.', 'error');
					}catch(ex){
						console.log(ex);
						UI.alert.show('Ops, an error occurred!', 'An unexpected error has occurred during the operation, please retry again.', 'error');
					}
				}
			};
			connection.send(Utils.getCSRFToken(true) + '&name=' + encodeURIComponent(name) + '&surname=' + encodeURIComponent(surname) + '&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password));
		},
		
		/**
		* Logs out the signed in user.
		*/
		logout: function(){
			var connection = Utils.makeConnection();
			connection.open('POST', '/user.logout', true);
			connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			connection.onreadystatechange = function(){
				if ( connection.readyState > 3 ){
					try{
						var data = JSON.parse(connection.responseText);
						if ( Utils.checkCSRFStatus(data) === false ){
							return;
						}
						if ( typeof(data.result) === 'string' && data.result === 'success' ){
							UI.alert.show('Logged out', 'You are no more logged in, see you soon!', 'success', function(){
								window.location.reload(true);
							});
							return window.setTimeout(function(){
								window.location.reload(true);
							}, 2000);
						}
						UI.alert.show('Ops, an error occurred!', 'An unexpected error has occurred during the operation, please retry again.', 'error');
					}catch(ex){
						console.log(ex);
						UI.alert.show('Ops, an error occurred!', 'An unexpected error has occurred during the operation, please retry again.', 'error');
					}
				}
			};
			connection.send(Utils.getCSRFToken(true));
		},
		
		/**
		* Returns the logged in user.
		*
		* @return Object An object containing the user information, if no user is logged in, will be returned null.
		*/
		getCurrentUser: function(){
			if ( document.getElementById('variables-user-auth').value === '0' ){
				return null;
			}
			return {
				id: document.getElementById('variables-user-id').value,
				name: document.getElementById('variables-user-name').value,
				surname: document.getElementById('variables-user-surname').value
			};
		}
	},
	
	/**
	* Lists all registered users.
	*/
	getUsers: function(){
		var views = [
			document.getElementById('users-loader'),
			document.getElementById('users-error'),
			document.getElementById('users-list')
		];
		views[2].style.display = 'none';
		views[1].style.display = 'none';
		views[0].style.display = 'block';
		var append = this.page === 1 ? false : true;
		if ( append === true && views[2].querySelector('.users-list-element-loader') !== null ){
			var loader = document.createElement('div');
			loader.className = 'users-list-element-loader-spinner common-loader-spinner';
			loader.title = 'Loading users...';
			views[2].querySelector('.users-list-element-loader').appendChild(loader);
		}
		var connection = Utils.makeConnection();
		connection.open('POST', '/user.list', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) !== 'string' || data.result !== 'success' ){
						views[0].style.display = 'none';
						views[2].style.display = 'none';
						views[1].style.display = 'block';
						return;
					}
					User.parseUsers(data.data, append);
					views[0].style.display = 'none';
					views[1].style.display = 'none';
					views[2].style.display = 'block';
					if ( append === true || data.data.length > 0 ){
						var loader = views[2].querySelector('.users-list-element-loader');
						if ( loader === null ){
							loader = document.createElement('li');
							loader.className = 'users-list-element-loader users-element-loader';
							views[2].appendChild(loader);
						}
						loader.innerHTML = '';
						if ( data.data.length === 10 ){
							var button = document.createElement('a');
							button.className = 'users-list-element-loader-link users-element-loader-link common-text';
							button.textContent = 'Load more users';
							button.title = 'Load more users';
							button.href = 'javascript:void(0);';
							button.onclick = User.loadMoreUsers;
							loader.appendChild(button);
						}else{
							if ( append === true ){
								var text = document.createElement('span');
								text.className = 'users-list-element-loader-text users-element-loader-text common-text';
								text.textContent = 'No more users';
								loader.appendChild(text);
							}
						}
					}
				}catch(ex){
					console.log(ex);
					views[0].style.display = 'none';
					views[2].style.display = 'none';
					views[1].style.display = 'block';
				}
			}
		};
		connection.send(Utils.getCSRFToken(true) + '&page=' + encodeURIComponent(this.page.toString()));
	},
	
	/**
	* Loads next users page.
	*/
	loadMoreUsers: function(){
		User.page++;
		var wrapper = document.getElementById('users-list').querySelector('.users-list-element-loader');
		if ( wrapper !== null ){
			wrapper.innerHTML = '';
		}
		User.getUsers();
	},
	
	/**
	* Generates the HTML objects using the provided users.
	*
	* @param Array data A sequential array of objects where each object represents an user.
	* @param Boolean append If set to "true" new elements will be appended to the list, otherwise the list will be cleaned before adding items.
	*/
	parseUsers: function(data, append){
		var wrapper = document.getElementById('users-list');
		if ( append === false ){
			wrapper.innerHTML = '';
		}
		for ( var i = 0 ; i < data.length ; i++ ){
			if ( wrapper.querySelector('.users-list-element[uid="' + data[i].id + '"]') !== null ){
				continue;
			}
			var element = document.createElement('li');
			element.className = 'users-list-element';
			element.setAttribute('uid', data[i].id);
			var name = document.createElement('span');
			name.className = 'common-text users-element-name';
			name.textContent = data[i].name === '' || data[i].surname === '' ? ( data[i].name + data[i].surname ) : ( data[i].name + ' ' + data[i].surname );
			element.appendChild(name);
			var email = document.createElement('span');
			email.className = 'common-text users-element-email';
			email.textContent = data[i].email;
			element.appendChild(email);
			if ( data[i].admin === true ){
				var admin = document.createElement('span');
				admin.className = 'common-text users-element-admin';
				admin.textContent = 'Admin';
				element.appendChild(admin);
			}
			var date = document.createElement('span');
			date.className = 'common-text users-element-date';
			date.textContent = 'Member since: ' + new Date(data[i].date).toLocaleDateString('en', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
			element.appendChild(date);
			var button = document.createElement('button');
			button.className = 'users-element-button';
			button.title = 'Delete';
			button.textContent = 'Delete';
			button.style.marginLeft = '0';
			button.onclick = User.deleteUser;
			element.appendChild(button);
			var button = document.createElement('button');
			button.className = 'users-element-button';
			button.title = 'Delete and remove contents';
			button.textContent = 'Delete and remove contents';
			button.setAttribute('clear', 'true');
			button.onclick = User.deleteUser;
			element.appendChild(button);
			wrapper.appendChild(element);
		}
	},
	
	/**
	* Removes an user.
	*
	* @param Object event The event object.
	*/
	deleteUser: function(event){
		var id = event.target.parentNode.getAttribute('uid');
		if ( id === null || id === '' ){
			return;
		}
		var connection = Utils.makeConnection();
		connection.open('POST', '/user.remove', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) !== 'string' || data.result !== 'success' ){
						return UI.alert.show('Unable to remove the user.', 'An unexpected error has occurred while trying to remove the user.', 'error');
					}
					var user = document.getElementById('users-list').querySelector('.users-list-element[uid="' + id + '"]');
					if ( user !== null ){
						user.parentNode.removeChild(user);
					}
				}catch(ex){
					console.log(ex);
					return UI.alert.show('Unable to remove the user.', 'An unexpected error has occurred while trying to remove the user.', 'error');
				}
			}
		};
		connection.send(Utils.getCSRFToken(true) + '&id=' + encodeURIComponent(id) + '&clear=' + ( event.target.getAttribute('clear') === 'true' ? '1' : '0' ));
	},
	
	/**
	* Saves user information.
	*/
	edit: function(){
		var name = Utils.trim(document.getElementById('profile-edit-field-name').value);
		if ( name === '' || name.length > 30 ){
			return UI.alert.show('Invalid name!', 'You must provide a valid name that must be up to 30 chars length.', 'error');
		}
		var surname = Utils.trim(document.getElementById('profile-edit-field-surname').value);
		if ( surname === '' || surname.length > 30 ){
			return UI.alert.show('Invalid surname!', 'You must provide a valid surname that must be up to 30 chars length.', 'error');
		}
		var email = Utils.trim(document.getElementById('profile-edit-field-email').value);
		if ( email === '' || email.length > 256 ){
			return UI.alert.show('Invalid e-mail address!', 'You must provide a valid e-mail address.', 'error');
		}
		var connection = Utils.makeConnection();
		connection.open('POST', '/user.edit', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) !== 'string' || data.result !== 'success' ){
						return UI.alert.show('Unable to edit user data', 'An unexpected error has occurred while trying to edit user data.', 'error');
					}else{
						document.getElementById('profile-edit-field-name-old').value = name;
						document.getElementById('profile-edit-field-surname-old').value = surname;
						document.getElementById('profile-edit-field-email-old').value = email;
						UI.form.hideAll();
					}
				}catch(ex){
					console.log(ex);
					return UI.alert.show('Unable to edit user data', 'An unexpected error has occurred while trying to edit user data.', 'error');
				}
			}
		};
		connection.send(Utils.getCSRFToken(true) + '&name=' + encodeURIComponent(name) + '&surname=' + encodeURIComponent(surname) + '&email=' + encodeURIComponent(email));
	},
	
	/**
	* Reverts user information back to original.
	*/
	revertInfo: function(){
		document.getElementById('profile-edit-field-name').value = document.getElementById('profile-edit-field-name-old').value;
		document.getElementById('profile-edit-field-surname').value = document.getElementById('profile-edit-field-surname-old').value;
		document.getElementById('profile-edit-field-email').value = document.getElementById('profile-edit-field-email-old').value;
	},
	
	/**
	* Changes user password.
	*/
	changePassword: function(){
		var current = Utils.trim(document.getElementById('profile-edit-field-current-password').value);
		if ( current === '' || current.length > 30 ){
			return UI.alert.show('Invalid password!', 'You must provide a valid password, max allowed length for password is 30 chars.', 'error');
		}
		var newPassword = Utils.trim(document.getElementById('profile-edit-field-new-password').value);
		if ( newPassword === '' || newPassword.length > 30 ){
			return UI.alert.show('Invalid new password!', 'You must provide a valid password, max allowed length for password is 30 chars.', 'error');
		}
		var confirm = Utils.trim(document.getElementById('profile-edit-field-confirm-password').value);
		if ( confirm === '' || newPassword !== confirm ){
			return UI.alert.show('Passwords mismatch!', 'The inserted password appears to be misspelled.', 'error');
		}
		var connection = Utils.makeConnection();
		connection.open('POST', '/user.changePassword', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) !== 'string' || data.result !== 'success' ){
						if ( data.code === 56 ){
							return UI.alert.show('Current password is not correct.', 'The provided password doesn\'t match with the current one.', 'error');
						}
						return UI.alert.show('Unable to change user password.', 'An unexpected error occurred while trying to change user password.', 'error');
					}
					document.getElementById('profile-edit-field-current-password').value = '';
					document.getElementById('profile-edit-field-new-password').value = '';
					document.getElementById('profile-edit-field-confirm-password').value = '';
					UI.alert.show('Password changed successfully!', 'Your password has been changed successfully.', 'success');
				}catch(ex){
					console.log(ex);
					return UI.alert.show('Unable to change user password.', 'An unexpected error occurred while trying to change user password.', 'error');
				}
			}
		};
		connection.send(Utils.getCSRFToken(true) + '&current=' + encodeURIComponent(current) + '&newPassword=' + encodeURIComponent(newPassword));
	},
	
	/**
	* Deletes the user who is currently logged in.
	*/
	deleteCurrentUser: function(){
		if ( window.confirm('Your account and all contents created by your will be removed, do you want to continue?') === true ){
			var connection = Utils.makeConnection();
			connection.open('POST', '/user.removeAccount', true);
			connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			connection.onreadystatechange = function(){
				if ( connection.readyState > 3 ){
					try{
						var data = JSON.parse(connection.responseText);
						if ( Utils.checkCSRFStatus(data) === false ){
							return;
						}
						if ( typeof(data.result) !== 'string' || data.result !== 'success' ){
							return UI.alert.show('Unable to remove your account.', 'An error has occurred while trying to remove your account.', 'error');
						}
						UI.alert.show('Your account has been removed.', 'Your account has successfully been removed, we will miss you!', 'success', function(){
							window.location.href = '/';
						});
						window.setTimeout(function(){
							window.location.href = '/';
						}, 2000);
					}catch(ex){
						console.log(ex);
						UI.alert.show('Unable to remove your account.', 'An error has occurred while trying to remove your account.', 'error');
					}
				}
			};
			connection.send(Utils.getCSRFToken(true));
		}
	}
};

var Blog = {
	/**
	* @var Integer page An integer number greater than zero containing the page number used in articles listing.
	*/
	page: 1,
	
	/**
	* @var String lateralScope A string containg the mode used in articles listing.
	*/
	lateralScope: null,
	
	/**
	* @var String cover A string containg the cover image as Base64 encoded image.
	*/
	cover: null,
	
	/**
	* Searches within all articles using the given keywords and cleaning previous results.
	*
	* @param Object event The event object.
	*/
	resetSearch: function(event){
		if ( typeof(event) !== 'undefined' ){
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		this.page = 1;
		this.loadArticles('search');
	},
	
	/**
	* Lists articles according to the given mode.
	*
	* @param String mode A string used to set the listing mode.
	*/
	loadArticles: function(mode){
		if ( typeof(mode) !== 'string' ){
			var buffer = document.getElementById('author-id');
			if ( buffer !== null ){
				mode = 'author';
			}else{
				buffer = document.getElementById('tag-id');
				if ( buffer !== null ){
					mode = 'tag';
				}else{
					if ( document.getElementById('search-input') !== null ){
						mode = 'search';
					}else{
						if ( window.location.pathname.indexOf('/articles') === 0 ){
							mode = 'all';
						}
					}
				}
			}
		}
		switch ( mode ){
			case 'featured':
			case 'suggested':{
				this.lateralScope = mode;
				var views = [
					document.getElementById('common-slide-lateral-section-loader'),
					document.getElementById('common-slide-lateral-section-error'),
					document.getElementById('common-slide-lateral-section-list')
				];
			}break;
			case 'author':
			case 'tag':
			case 'all':{
				var views = [
					document.getElementById('articles-loader'),
					document.getElementById('articles-error'),
					document.getElementById('articles-list')
				];
			}break;
			case 'search':{
				var views = [
					document.getElementById('search-loader'),
					document.getElementById('search-error'),
					document.getElementById('search-list')
				];
				var buffer = document.getElementById('search-input');
			}break;
			default:{
				var views = [
					document.getElementById('home-articles-loader'),
					document.getElementById('home-articles-error'),
					document.getElementById('home-articles-list')
				];
			}break;
		}
		var params = Utils.getCSRFToken(true);
		switch ( mode ){
			case 'featured':{
				params += '&action=featured';
			}break;
			case 'suggested':{
				params += '&action=suggested&tags=' + encodeURIComponent(document.getElementById('variables-tags').value) + '&article=' + encodeURIComponent(document.getElementById('variables-article').value);
			}break;
			case 'author':{
				params += '&action=author&page=' + this.page + '&author=' + encodeURIComponent(buffer.value);
				var title = document.getElementById('articles-title');
				title.style.display = 'block';
				title.textContent = 'Showing all articles written by ' + document.getElementById('author-name').value;
				if ( this.page === 1 ){
					params += '&includeCount=1';
				}
			}break;
			case 'tag':{
				params += '&action=tag&page=' + this.page + '&tag=' + encodeURIComponent(buffer.value);
				var title = document.getElementById('articles-title');
				title.style.display = 'block';
				title.textContent = 'Showing all articles tagged with "' + buffer.value + '"';
				if ( this.page === 1 ){
					params += '&includeCount=1';
				}
			}break;
			case 'search':{
				buffer = buffer.value;
				if ( buffer === '' ){
					buffer = Utils.getParam('q');
					if ( buffer !== '' && buffer !== null ){
						document.getElementById('search-input').value = buffer;
					}
				}
				if ( buffer === '' || buffer === null ){
					views[1].style.display = 'none';
					views[2].style.display = 'none';
					views[0].style.display = 'none';
					return this;
				}
				params += '&action=search&page=' + this.page + '&q=' + encodeURIComponent(buffer);
			}break;
			case 'all':{
				params += '&action=all&page=' + this.page;
			}break;
			default:{
				params += '&action=showcase&page=' + this.page;
			}break;
		}
		var appendMode = this.page === 1 ? 0 : 1;
		if ( appendMode === 1 && views[2].querySelector('.articles-list-element-loader') !== null ){
			var loader = document.createElement('div');
			loader.className = 'articles-list-element-loader-spinner common-loader-spinner';
			loader.title = 'Loading articles...';
			views[2].querySelector('.articles-list-element-loader').appendChild(loader);
		}else{
			views[1].style.display = 'none';
			views[2].style.display = 'none';
			views[0].style.display = 'block';
		}
		var connection = Utils.makeConnection();
		connection.open('POST', '/article.list', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) === 'undefined' || data.result !== 'success' ){
						views[0].style.display = 'none';
						views[2].style.display = 'none';
						views[1].style.display = 'block';
						return;
					}
					if ( mode === 'featured' || mode === 'suggested' ){
						views[2].innerHTML = '';
						if ( data.data.length === 0 ){
							var element = document.createElement('li');
							element.className = 'common-slide-lateral-section-list-element-empty common-text lateral-articles-empty-element';
							element.textContent = 'No featured article found.';
							views[2].appendChild(element);
						}else{
							for ( var i = 0 ; i < data.data.length ; i++ ){
								var element = document.createElement('li');
								element.className = 'common-slide-lateral-section-list-element lateral-articles-element';
								element.setAttribute('aid', data.data[i].id);
								var header = document.createElement('div');
								header.className = 'common-slide-lateral-section-list-element-header lateral-articles-element-header';
								var title = document.createElement('a');
								title.className = 'common-slide-lateral-section-list-element-header-title common-text lateral-articles-element-title';
								title.textContent = data.data[i].title;
								title.title = 'Read more...';
								title.href = '/article/' + encodeURIComponent(data.data[i].url);
								header.appendChild(title);
								element.appendChild(header);
								if ( data.data[i].cover !== null ){
									var link = document.createElement('a');
									link.className = 'common-slide-lateral-section-list-element-link';
									link.title = 'Read more...';
									link.href = '/article/' + encodeURIComponent(data.data[i].url);
									var cover = document.createElement('div');
									cover.className = 'common-slide-lateral-section-list-element-link-cover lateral-articles-element-cover';
									cover.style.backgroundImage = 'url(/covers/' + data.data[i].cover + ')';
									link.appendChild(cover);
									element.appendChild(link);
								}
								var author = document.createElement('a');
								author.className = 'common-slide-lateral-section-list-element-author common-text lateral-articles-element-author';
								author.textContent = data.data[i].author.name === '' || data.data[i].author.surname === '' ? ( data.data[i].author.name + data.data[i].author.surname ) : ( data.data[i].author.name + ' ' + data.data[i].author.surname );
								author.title = 'More articles from this author...';
								author.href = '/author/' + data.data[i].author.id;
								element.appendChild(author);
								var date = document.createElement('span');
								date.className = 'common-slide-lateral-section-list-element-date common-text lateral-articles-element-date';
								date.textContent = ' - ' + ( new Date(data.data[i].date).toLocaleDateString('en', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								}) );
								element.appendChild(date);
								views[2].appendChild(element);
							}
						}
					}else{
						if ( ( mode === 'author' || mode === 'tag' ) && appendMode === 0 && data.data.length === 0 ){
							return window.location.href = '/';
						}
						if ( typeof(data.count) !== 'undefined' ){
							var subtitle = document.getElementById('articles-subtitle');
							subtitle.style.display = 'block';
							subtitle.textContent = data.count === 1 ? 'Found one article.' : 'Found ' + data.count.toString() + ' articles.';
						}
						Blog.parseArticles(data.data, views[2], appendMode);
						if ( appendMode === 1 || data.data.length > 0 ){
							var loader = views[2].querySelector('.articles-list-element-loader');
							if ( loader === null ){
								loader = document.createElement('li');
								loader.className = 'articles-list-element-loader articles-element-loader';
								views[2].appendChild(loader);
							}
							loader.innerHTML = '';
							if ( data.data.length === 10 ){
								var button = document.createElement('a');
								button.className = 'articles-list-element-loader-link articles-element-loader-link common-text';
								button.textContent = 'Load more articles';
								button.title = 'Load more articles';
								button.href = 'javascript:void(0);';
								button.onclick = Blog.loadMoreArticles;
								loader.appendChild(button);
							}else{
								if ( appendMode === 1 ){
									var text = document.createElement('span');
									text.className = 'articles-list-element-loader-text articles-element-loader-text common-text';
									text.textContent = 'No more articles';
									loader.appendChild(text);
								}
							}
						}
					}
					views[0].style.display = 'none';
					views[1].style.display = 'none';
					views[2].style.display = 'block';
				}catch(ex){
					console.log(ex);
					views[0].style.display = 'none';
					views[2].style.display = 'none';
					views[1].style.display = 'block';
				}
			}
		};
		connection.send(params);
		return this;
	},
	
	/**
	* Loads next articles page.
	*/
	loadMoreArticles: function(){
		var wrapper = document.getElementById('articles-list');
		if ( wrapper === null ){
			wrapper = document.getElementById('home-articles-list');
			if ( wrapper === null ){
				wrapper = document.getElementById('search-list');
				if ( wrapper === null ){
					return;
				}
			}
		}
		Blog.page++;
		wrapper = wrapper.querySelector('.articles-list-element-loader');
		if ( wrapper !== null ){
			wrapper.innerHTML = '';
		}
		Blog.loadArticles();
	},
	
	/**
	* Generates the HTML objects using the provided articles.
	*
	* @param Array data A sequential array of objects where each object represents an article.
	* @param Object wrapper A DOM object representing the list in where articles shall be appended.
	* @param Integer appendMode An integer number representing the mode according to which the article shall be inserted into the list.
	*/
	parseArticles: function(elements, wrapper, appendMode){
		if ( appendMode === 0 ){
			wrapper.innerHTML = '';
			if ( elements.length === 0 ){
				var element = document.createElement('li');
				element.className = 'articles-list-element-empty articles-empty-element common-text';
				element.textContent = 'No article found';
				wrapper.appendChild(element);
				return;
			}
		}
		var buffer = document.querySelector('.articles-list-element-empty');
		if ( buffer !== null ){
			buffer.parentNode.removeChild(buffer);
		}
		if ( typeof(elements[0].author) === 'undefined' ){
			var authorInfo = {
				name: document.getElementById('author-name').value,
				id: document.getElementById('author-id').value
			};
		}
		var admin = document.getElementById('variables-admin').value === '1' ? true : false;
		for ( var i = 0 ; i < elements.length ; i++ ){
			if ( wrapper.querySelector('.articles-list-element[aid="' + elements[i].id + '"]') !== null ){
				continue;
			}
			var element = document.createElement('li');
			element.className = 'articles-list-element articles-element';
			element.setAttribute('aid', elements[i].id)
			var titleWrapper = document.createElement('div');
			titleWrapper.className = 'articles-list-element-title';
			var title = document.createElement('a');
			title.className = 'articles-list-element-title-text articles-element-title common-text';
			title.textContent = elements[i].title;
			title.href ='/article/' + encodeURIComponent(elements[i].url);
			title.title = 'Read the article.';
			titleWrapper.appendChild(title);
			element.appendChild(titleWrapper);
			if ( admin === true ){
				var controls = document.createElement('div');
				controls.className = 'articles-list-element-controls';
				var remove = document.createElement('div');
				remove.className = 'articles-list-element-controls-icon';
				remove.setAttribute('scope', 'remove');
				remove.title = 'Remove this article.';
				remove.onclick = Blog.removeArticle;
				controls.appendChild(remove);
				element.appendChild(controls);
			}
			var dateWrapper = document.createElement('div');
			dateWrapper.className = 'articles-list-element-date-wrapper';
			var date = document.createElement('span');
			date.className = 'articles-list-element-date common-text articles-element-date';
			date.textContent = ' - ' + ( new Date(elements[i].date).toLocaleDateString('en', {
				month: 'long',
				day: 'numeric'
			}) );
			var author = document.createElement('a');
			author.className = 'articles-list-element-author common-text articles-element-author';
			author.title = 'More articles from this author...';
			if ( typeof(authorInfo) === 'object' ){
				author.textContent = authorInfo.name;
				author.href = '/author/' + authorInfo.id;
			}else{
				author.textContent = elements[i].author.name === '' || elements[i].author.surname === '' ? ( elements[i].author.name + elements[i].author.surname ) : ( elements[i].author.name + ' ' + elements[i].author.surname );
				author.href = '/author/' + elements[i].author.id;
			}
			dateWrapper.appendChild(author);
			dateWrapper.appendChild(date);
			element.appendChild(dateWrapper);
			if ( elements[i].cover !== null ){
				var cover = document.createElement('div');
				cover.className = 'articles-list-element-cover';
				cover.style.backgroundImage = 'url(/covers/' + elements[i].cover + ')';
				element.appendChild(cover);
			}
			var text = document.createElement('p');
			text.className = 'articles-list-element-text common-text articles-element-text';
			text.innerHTML = elements[i].text.replace(/(?:\r\n|\r|\n)/g, '<br />');
			element.appendChild(text);
			element.appendChild(document.createElement('br'));
			var link = document.createElement('a');
			link.className = 'articles-list-element-continue-reading common-text articles-element-continue-reading';
			link.textContent = 'Read more';
			link.href = '/article/' + encodeURIComponent(elements[i].url);
			element.appendChild(link);
			if ( elements[i].tags.length > 0 ){
				var tags = document.createElement('span');
				tags.className = 'articles-list-element-tags articles-element-tags common-text';
				tags.textContent = 'Tags: ';
				for ( var n = 0 ; n < elements[i].tags.length ; n++ ){
					var tag = document.createElement('a');
					tag.className = 'articles-list-element-tags-element common-text articles-element-tags-element';
					tag.title = 'More articles with this tag...';
					tag.textContent = elements[i].tags[n];
					tag.href = '/tag/' + encodeURIComponent(elements[i].tags[n]);
					tags.appendChild(tag);
				}
				element.appendChild(tags);
			}
			var counters = document.createElement('div');
			counters.className = 'articles-list-element-counters articles-element-counter-group';
			var counter = document.createElement('span');
			counter.className = 'articles-list-element-counters-counter common-text articles-element-counter';
			counter.textContent = elements[i].likes;
			counter.setAttribute('scope', 'like');
			counters.appendChild(counter);
			var icon = document.createElement('div');
			icon.className = 'articles-list-element-counters-icon';
			if ( typeof(elements[i].appreciations) !== 'undefined' && elements[i].appreciations.like === true ){
				icon.setAttribute('selected', 'true');
			}
			icon.onclick = Appreciation.toggleLike;
			icon.setAttribute('scope', 'like');
			counters.appendChild(icon);
			var counter = document.createElement('span');
			counter.className = 'articles-list-element-counters-counter common-text articles-element-counter';
			counter.textContent = elements[i].dislikes;
			counter.setAttribute('scope', 'dislike');
			counters.appendChild(counter);
			var icon = document.createElement('div');
			icon.className = 'articles-list-element-counters-icon';
			icon.setAttribute('scope', 'dislike');
			if ( typeof(elements[i].appreciations) !== 'undefined' && elements[i].appreciations.dislike === true ){
				icon.setAttribute('selected', 'true');
			}
			icon.onclick = Appreciation.toggleDislike;
			counters.appendChild(icon);
			var counter = document.createElement('span');
			counter.className = 'articles-list-element-counters-counter common-text articles-element-counter';
			counter.textContent = elements[i].comments;
			counters.appendChild(counter);
			var icon = document.createElement('div');
			icon.className = 'articles-list-element-counters-icon';
			icon.setAttribute('scope', 'comment');
			counters.appendChild(icon);
			element.appendChild(counters);
			if ( appendMode === 2 ){
				wrapper.insertBefore(element, wrapper.firstChild);
			}else{
				wrapper.appendChild(element);
			}
		}
	},
	
	/**
	* Sets the attribute used to change CSS style applied to the uploader.
	*
	* @param Object event The event object.
	*/
	dragOverUploader: function(event){
		event.preventDefault();
		event.stopPropagation();
		document.getElementById('form-post-creation-cover').setAttribute('dragover', 'true');
	},
	
	/**
	* Removes the attribute used to change CSS style applied to the uploader.
	*
	* @param Object event The event object.
	*/
	dragLeaveUploader: function(event){
		event.preventDefault();
		event.stopPropagation();
		document.getElementById('form-post-creation-cover').setAttribute('dragover', 'false');
	},
	
	/**
	* Triggers the click event upon the file input in order to open the file picker.
	*
	* @param Object event The event object.
	*/
	openUploaderPicker: function(event){
		event.preventDefault();
		event.stopPropagation();
		document.getElementById('form-post-creation-cover-input').click();
	},
	
	/**
	* Sets the cover image into the preview image.
	*
	* @param Object event The event object.
	*/
	setUploaderFile: function(event){
		event.preventDefault();
		event.stopPropagation();
		var uploader = document.getElementById('form-post-creation-cover');
		uploader.setAttribute('dragover', 'false');
		if ( event.type === 'drop' ){
			var dataTransfer = typeof(event.dataTransfer) !== 'undefined' ? event.dataTransfer : ( typeof(event.originalEvent.dataTransfer) === 'undefined' ? null : event.originalEvent.dataTransfer );
			if ( dataTransfer === null || typeof(dataTransfer.files) === 'undefined' || dataTransfer.files.length === 0 ){
				return;
			}
			var file = dataTransfer.files[0];
			var type = file.type.toLowerCase();
		}else{
			var files = document.getElementById('form-post-creation-cover-input').files;
			if ( files.length === 0 ){
				return;
			}
			var type = files[0].type;
			var file = files[0];
		}
		if ( type !== 'image/png' && type !== 'image/jpg' && type !== 'image/jpeg' ){
			return UI.alert.show('Unsupported image format!', 'The provided image is not supported.', 'error');
		}
		var reader = new FileReader();
		reader.onload = function(event){
			uploader.setAttribute('preview', 'true');
			Blog.cover = event.target.result.substr(5);
			document.getElementById('form-post-creation-cover-wrapper').style.display = 'none';
			document.getElementById('form-post-creation-cover-preview').style.display = 'block';
			document.getElementById('form-post-creation-cover-preview-image').style.backgroundImage = 'url(' + event.target.result + ')';
		};
		reader.readAsDataURL(file);
	},
	
	/**
	* Removes the cover image from the preview image.
	*/
	resetUploader: function(){
		this.cover = null;
		var uploader = document.getElementById('form-post-creation-cover');
		uploader.setAttribute('dragover', 'false');
		uploader.setAttribute('preview', 'false');
		document.getElementById('form-post-creation-cover-preview').style.display = 'none';
		document.getElementById('form-post-creation-cover-wrapper').style.display = 'block';
		document.getElementById('form-post-creation-cover-preview-image').style.backgroundImage = '';
	},
	
	/**
	* Creates a new article using the provided information.
	*
	* @param Object event The event object.
	*/
	triggerCreation: function(event){
		event.preventDefault();
		event.stopPropagation();
		var data = Utils.getCSRFToken(true);
		var buffer = Utils.trim(document.getElementById('form-post-creation-title').value);
		if ( buffer === '' ){
			return UI.alert.show('Invalid title!', 'You cannot provide an empty title.', 'error');
		}
		data += '&title=' + encodeURIComponent(buffer);
		buffer = Utils.trim(document.getElementById('form-post-creation-text').value);
		if ( buffer === '' ){
			return UI.alert.show('Invalid text!', 'You cannot provide an empty text.', 'error');
		}
		data += '&text=' + encodeURIComponent(buffer);
		buffer = Utils.trim(document.getElementById('form-post-creation-url').value);
		if ( buffer === '' ){
			return UI.alert.show('Invalid URL!', 'You cannot provide an empty URL.', 'error');
		}
		data += '&url=' + encodeURIComponent(buffer) + '&tags=' + encodeURIComponent(document.getElementById('form-post-creation-tags').value);
		if ( this.cover !== null ){
			data += '&cover=' + encodeURIComponent(this.cover);
		}
		var connection = Utils.makeConnection();
		connection.open('POST', '/article.create', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) === 'string' && data.result === 'success' ){
						var buffer = new Array();
						buffer.push(data.data); 
						UI.form.hideCreation(true);
						var wrapper = document.getElementById('articles-list');
						if ( wrapper === null ){
							wrapper = document.getElementById('home-articles-list');
							if ( wrapper === null ){
								wrapper = document.getElementById('search-list');
								if ( wrapper === null ){
									return;
								}
							}
						}
						return Blog.parseArticles(buffer, wrapper, 2);
					}
					UI.alert.show('Unable to create the article.', 'An error occurred while trying to create the article.', 'error');
				}catch(ex){
					console.log(ex);
					UI.alert.show('Unable to create the article.', 'An error occurred while trying to create the article.', 'error');
				}
			}
		};
		connection.send(data);
	},
	
	/**
	* Closes the dialog used to create a new article and clean its fields.
	*
	* @param Object event The event object.
	*/
	cancelCreation: function(event){
		event.preventDefault();
		event.stopPropagation();
		UI.form.hideCreation(true);
	},
	
	/**
	* Removes an article.
	*
	* @param Object event The event object.
	*/
	removeArticle: function(event){
		var element = event.target.parentNode.parentNode;
		var connection = Utils.makeConnection();
		connection.open('POST', '/article.remove', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) === 'string' && data.result === 'success' ){
						var element = event.target.parentNode.parentNode;
						var id = element.getAttribute('aid');
						if ( element.parentNode.childNodes.length === 1 ){
							var element = document.createElement('li');
							element.className = 'articles-list-element-empty articles-empty-element common-text';
							element.textContent = 'No article found';
							element.parentNode.appendChild(element);
						}
						element.parentNode.removeChild(element);
						var buffer = document.getElementById('common-slide-lateral-section-list').querySelector('common-slide-lateral-section-list-element[aid="' + id + '"]');
						if ( buffer !== null ){
							buffer.parentNode.removeChild(buffer);
							if ( buffer.parentNode.childNodes.length === 0 ){
								var element = document.createElement('li');
								element.className = 'common-slide-lateral-section-list-element-empty common-text lateral-articles-empty-element';
								element.textContent = 'No featured article found.';
								buffer.parentNode.appendChild(element);
							}
						}
						return;
					}
					UI.alert.show('Unable to remove the article.', 'An error occurred while trying to remove the article.', 'error');
				}catch(ex){
					console.log(ex);
					UI.alert.show('Unable to remove the article.', 'An error occurred while trying to remove the article.', 'error');
				}
			}
		};
		connection.send(Utils.getCSRFToken(true) + '&id=' + encodeURIComponent(element.getAttribute('aid')));
	},
	
	/**
	* Loads 10 from the most famous tags.
	*/
	loadTags: function(){
		document.getElementById('common-slide-lateral-section-tags-error').style.display = 'none';
		document.getElementById('common-slide-lateral-section-tags-list').style.display = 'none';
		document.getElementById('common-slide-lateral-section-tags-loader').style.display = 'block';
		var connection = Utils.makeConnection();
		connection.open('POST', '/tag.get', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) !== 'string' || data.result !== 'success' ){
						document.getElementById('common-slide-lateral-section-tags-loader').style.display = 'none';
						document.getElementById('common-slide-lateral-section-tags-list').style.display = 'none';
						document.getElementById('common-slide-lateral-section-tags-error').style.display = 'block';
					}else{
						var wrapper = document.getElementById('common-slide-lateral-section-tags-list');
						wrapper.innerHTML = '';
						if ( data.data.length === 0 ){
							var element = document.createElement('li');
							element.className = 'common-slide-lateral-section-tags-list-element-empty common-text lateral-tags-empty-element';
							element.textContent = 'No tag found.';
							wrapper.appendChild(element);
						}else{
							for ( var i = 0 ; i < data.data.length ; i++ ){
								var element = document.createElement('li');
								element.className = 'common-slide-lateral-section-tags-list-element lateral-tags-element';
								var link = document.createElement('a');
								link.className = 'common-slide-lateral-section-tags-list-element-link common-text lateral-tags-element-link';
								link.title = data.data[i].tag;
								link.textContent = data.data[i].tag + ' (' + data.data[i].count + ')';
								link.href = '/tag/' + encodeURIComponent(data.data[i].tag);
								element.appendChild(link);
								wrapper.appendChild(element);
							}
						}
						document.getElementById('common-slide-lateral-section-tags-error').style.display = 'none';
						document.getElementById('common-slide-lateral-section-tags-loader').style.display = 'none';
						wrapper.style.display = 'block';
					}
				}catch(ex){
					console.log(ex);
					document.getElementById('common-slide-lateral-section-tags-loader').style.display = 'none';
					document.getElementById('common-slide-lateral-section-tags-list').style.display = 'none';
					document.getElementById('common-slide-lateral-section-tags-error').style.display = 'block';
				}
			}
		};
		connection.send(Utils.getCSRFToken(true));
		return this;
	}
};

var Newsletter = {
	/**
	* Adds the given e-mail address into the mailing list.
	*
	* @param Object event The event object.
	*/
	triggerSubscribe: function(event){
		event.preventDefault();
		event.stopPropagation();
		var email = Utils.trim(document.getElementById('common-slide-lateral-section-form-input-email').value);
		if ( email === '' || email.length > 256 ){
			return UI.alert.show('Invalid e-mail address!', 'You must provide a valid e-mail address.', 'error');
		}
		var connection = Utils.makeConnection();
		connection.open('POST', '/newsletter.subscribe', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) === 'string' && data.result === 'success' ){
						document.getElementById('common-slide-lateral-section-form-input-email').value = '';
						return UI.alert.show('Thank you for your subscribtion!', 'You are now subscribed to our news feed.', 'success');
					}
					UI.alert.show('Unable to subscribe!', 'An unexpected error occurred while trying to add your e-mail address to the mailing list.', 'error');
				}catch(ex){
					console.log(ex);
					UI.alert.show('Unable to subscribe!', 'An unexpected error occurred while trying to add your e-mail address to the mailing list.', 'error');
				}
			}
		};
		connection.send(Utils.getCSRFToken(true) + '&email=' + encodeURIComponent(email));
	}
};

var Comment = {
	/**
	* @var Integer page An integer number greater than zero containing the page number used in comments listing.
	*/
	page: 1,
	
	/**
	* Loads the user's or article's comments.
	*
	* @param Boolean user If set to "true" user's comments will be loaded, otherwise article's comments will be loaded instead.
	*/
	loadComments: function(user){
		var params = Utils.getCSRFToken(true);
		if ( user === true ){
			params += '&user=' + encodeURIComponent(document.getElementById('user-id').value) + '&page=' + this.page;
			var views = [
				document.getElementById('profile-comments-loader'),
				document.getElementById('profile-comments-error'),
				document.getElementById('profile-comments-list')
			];
			var appendMode = this.page === 1 ? false : true;
			var loader = views[2].querySelector('.profile-comments-list-element-loader');
		}else{
			params += '&article=' + encodeURIComponent(document.getElementById('variables-article').value) + '&page=' + this.page;
			var views = [
				document.getElementById('article-comments-loader'),
				document.getElementById('article-comments-error'),
				document.getElementById('article-comments-list')
			];
			var appendMode = this.page === 1 ? 0 : 1;
			var loader = views[2].querySelector('.article-comments-list-element-loader');
		}
		if ( ( appendMode === true || appendMode === 1 ) && loader !== null ){
			var loader = document.createElement('div');
			loader.className = user === true ? 'profile-comments-list-element-loader-spinner profile-comments-element-loader-spinner common-loader-spinner' : 'article-comments-list-element-loader-spinner article-comment-element-loader-spinner common-loader-spinner';
			loader.title = 'Loading comments...';
			loader.appendChild(loader);
		}else{
			views[1].style.display = 'none';
			views[2].style.display = 'none';
			views[0].style.display = 'block';
		}
		var connection = Utils.makeConnection();
		connection.open('POST', ( user === true ? '/comment.loadUser' : '/comment.load' ), true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) === 'string' && data.result === 'success' ){
						if ( user === true ){
							Comment.parseUserComments(data.data, appendMode);
							var loader = views[2].querySelector('.profile-comments-list-element-loader');
							if ( loader === null ){
								loader = document.createElement('li');
								loader.className = 'profile-comments-list-element-loader profile-comments-element-loader';
								views[2].appendChild(loader);
							}
							loader.innerHTML = '';
							if ( data.data.length === 10 ){
								var button = document.createElement('a');
								button.className = 'profile-comments-list-element-loader-link profile-comments-element-loader-link common-text';
								button.textContent = 'Load more comments';
								button.title = 'Load more comments';
								button.href = 'javascript:void(0);';
								button.onclick = Blog.loadMoreArticles;
								loader.appendChild(button);
							}else{
								if ( appendMode === true ){
									var text = document.createElement('span');
									text.className = 'profile-comments-list-element-loader-text profile-comments-element-loader-text common-text';
									text.textContent = 'No more comments';
									loader.appendChild(text);
								}
							}
						}else{
							Comment.parseComments(data.data, appendMode);
							var loader = views[2].querySelector('.article-comments-list-element-loader');
							if ( loader === null ){
								loader = document.createElement('li');
								loader.className = 'article-comments-list-element-loader article-comment-element-loader';
								views[2].appendChild(loader);
							}
							loader.innerHTML = '';
							if ( data.data.length === 10 ){
								var button = document.createElement('a');
								button.className = 'article-comments-list-element-loader-link article-comment-element-loader-link common-text';
								button.textContent = 'Load more comments';
								button.title = 'Load more comments';
								button.href = 'javascript:void(0);';
								button.onclick = Blog.loadMoreArticles;
								loader.appendChild(button);
							}else{
								if ( appendMode !== 0 ){
									var text = document.createElement('span');
									text.className = 'article-comments-list-element-loader-text article-comment-element-loader-text common-text';
									text.textContent = 'No more comments';
									loader.appendChild(text);
								}
							}
						}
						views[0].style.display = 'none';
						views[1].style.display = 'none';
						return views[2].style.display = 'block';
					}
					views[0].style.display = 'none';
					views[2].style.display = 'none';
					views[1].style.display = 'block';
				}catch(ex){
					console.log(ex);
					views[0].style.display = 'none';
					views[2].style.display = 'none';
					views[1].style.display = 'block';
				}
			}
		};
		connection.send(params);
	},
	
	/**
	* Loads next comments page.
	*/
	loadMoreComments: function(){
		if ( document.getElementById('variables-article') === null ){
			var user = true;
			var wrapper = document.getElementById('profile-comments-list').querySelector('.article-comments-list-element-loader');
		}else{
			var user = false;
			var wrapper = document.getElementById('article-comments-list').querySelector('.profile-comments-list-element-loader');
		}
		Comment.page++;
		if ( wrapper !== null ){
			wrapper.innerHTML = '';
		}
		Comment.loadComments(user);
	},
	
	/**
	* Generates the HTML objects using the provided comments.
	*
	* @param Array elements A sequential array of objecs where each object represents a comment.
	* @param Integer appendMode An integer number representing the mode according to which the comment shall be inserted into the list.
	*/
	parseComments: function(elements, appendMode){
		var wrapper = document.getElementById('article-comments-list');
		if ( isNaN(appendMode) === true || appendMode === 0 ){
			wrapper.innerHTML = '';
		}
		if ( elements.length === 0 && wrapper.querySelector('.article-comments-list-element-empty') === null ){
			var element = document.createElement('li');
			element.className = 'article-comments-list-element-empty common-text article-comment-empty';
			element.textContent = 'No comment found.';
			wrapper.appendChild(element);
			return;
		}
		var buffer = wrapper.querySelector('.article-comments-list-element-empty');
		if ( buffer !== null ){
			buffer.parentNode.removeChild(buffer);
		}
		var admin = document.getElementById('variables-admin').value === '1' ? true : false;
		for ( var i = 0 ; i < elements.length ; i++ ){
			if ( wrapper.querySelector('.article-comments-list-element[cid="' + elements[i].id + '"]') !== null ){
				continue;
			}
			var element = document.createElement('li');
			element.className = 'article-comments-list-element article-comment-element';
			element.setAttribute('cid', elements[i].id);
			var header = document.createElement('div');
			header.className = 'article-comments-list-element-header';
			if ( elements[i].author === null ){
				var name = document.createElement('span');
				name.className = 'article-comments-list-element-header-name common-text article-comment-element-name';
				name.textContent = 'Anonimous user';
			}else{
				var name = document.createElement('a');
				name.className = 'article-comments-list-element-header-name-link common-text article-comment-element-name-link';
				name.textContent = elements[i].author.name === '' || elements[i].author.surname === '' ? ( elements[i].author.name + elements[i].author.surname ) : ( elements[i].author.name + ' ' + elements[i].author.surname );
				name.title = elements[i].author.name === '' || elements[i].author.surname === '' ? ( elements[i].author.name + elements[i].author.surname ) : ( elements[i].author.name + ' ' + elements[i].author.surname );
				name.href = '/profile/' + elements[i].author.id;
			}
			header.appendChild(name);
			var date = document.createElement('span');
			date.className = 'article-comments-list-element-header-date common-text article-comment-element-date';
			date.textContent = new Date(elements[i].date).toLocaleDateString('en', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
			header.appendChild(date);
			element.appendChild(header);
			if ( elements[i].owner === true || admin === true ){
				var controls = document.createElement('div');
				controls.className = 'article-comments-list-element-controls';
				var remove = document.createElement('div');
				remove.className = 'article-comments-list-element-controls-remove';
				remove.title = 'Remove this comment.';
				remove.onclick = Comment.remove;
				remove.setAttribute('scope', 'remove');
				controls.appendChild(remove);
				element.appendChild(controls);
			}
			var comment = document.createElement('p');
			comment.className = 'article-comments-list-element-comment common-text article-comment-element-text';
			comment.textContent = elements[i].text;
			element.appendChild(comment);
			if ( appendMode === 2 ){
				wrapper.insertBefore(element, wrapper.firstChild);
			}else{
				wrapper.appendChild(element);
			}
		}
	},
	
	/**
	* Generates the HTML objects using the provided comments.
	*
	* @param Array elements A sequential array of objecs where each object represents a comment.
	* @param Boolean append If set to "true" new elements will be appended to the list, otherwise the list will be cleaned before adding items.
	*/
	parseUserComments: function(elements, append){
		var wrapper = document.getElementById('profile-comments-list');
		if ( append !== true ){
			wrapper.innerHTML = '';
			if ( elements.length === 0 ){
				var element = document.createElement('li');
				element.className = 'profile-comments-list-element-empty profile-comments-empty-element';
				element.textContent = 'No comment found';
				wrapper.appendChild(element);
				return;
			}
		}
		for ( var i = 0 ; i < elements.length ; i++ ){
			var element = document.createElement('li');
			element.className = 'profile-comments-list-element profile-comments-element';
			element.setAttribute('cid', elements[i].id);
			var text = document.createElement('p');
			text.className = 'common-text profile-comments-list-element-text profile-comments-element-text';
			text.textContent = elements[i].text;
			element.appendChild(text);
			var date = document.createElement('span');
			date.className = 'common-text profile-comments-list-element-date profile-comments-element-date';
			date.textContent = new Date(elements[i].date).toLocaleDateString('en', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
			element.appendChild(date);
			var article = document.createElement('a');
			article.className = 'common-text profile-comments-list-element-article profile-comments-element-article';
			article.textContent = 'Go to article...';
			article.title = 'Go to article...';
			article.href = '/article/' + encodeURIComponent(elements[i].article);
			element.appendChild(article);
			wrapper.appendChild(element);
		}
	},
	
	/**
	* Creates a new comment.
	*
	* @param Object event The event object.
	*/
	triggerCreation: function(event){
		if ( event.keyCode !== 13 || event.shiftKey === true ){
			return;
		}
		var text = Utils.trim(document.getElementById('article-comments-editor-textarea').value);
		if ( text === '' ){
			return false;
		}
		if ( text.length > 10000 ){
			return UI.alert.show('Your comment is too long.', 'The max allowed length for comments is 10000 chars.', 'error');
		}
		var id = encodeURIComponent(document.getElementById('variables-article').value);
		var connection = Utils.makeConnection();
		connection.open('POST', '/comment.create', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) === 'string' && data.result === 'success' ){
						document.getElementById('article-comments-editor-textarea').value = '';
						var counter = document.getElementById('article-counters-counter-comments');
						counter.textContent = parseInt(counter.textContent) + 1;
						return Comment.parseComments([data.data], 2);
					}
					UI.alert.show('Unable to create the comment!', 'An unexpected error uccerred while trying to add your comment.', 'error');
				}catch(ex){
					console.log(ex);
					UI.alert.show('Unable to create the comment!', 'An unexpected error uccerred while trying to add your comment.', 'error');
				}
			}
		};
		connection.send(Utils.getCSRFToken(true) + '&article=' + id + '&text=' + text);
	},
	
	/**
	* Removes a comment.
	*
	* @param Object event The event object.
	*/
	remove: function(event){
		var connection = Utils.makeConnection();
		connection.open('POST', '/comment.remove', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) === 'string' && data.result === 'success' ){
						var element = event.target.parentNode.parentNode;
						element.parentNode.removeChild(element);
						if ( document.getElementById('article-comments-list').querySelector('.article-comments-list-element') === null ){
							var element = document.createElement('li');
							element.className = 'article-comments-list-element-empty common-text article-comment-empty';
							element.textContent = 'No comment found.';
							document.getElementById('article-comments-list').appendChild(element);
							var counter = document.getElementById('article-counters-counter-comments');
							counter.textContent = parseInt(counter.textContent) - 1;
						}
						return;
					}
					UI.alert.show('Unable to remove the comment!', 'An unexpected error uccerred while trying to remove the comment.', 'error');
				}catch(ex){
					console.log(ex);
					UI.alert.show('Unable to remove the comment!', 'An unexpected error uccerred while trying to remove the comment.', 'error');
				}
			}
		};
		connection.send(Utils.getCSRFToken(true) + '&id=' + encodeURIComponent(event.target.parentNode.parentNode.getAttribute('cid')));
	}
};

var Appreciation = {
	/**
	* Toggles the positive appreciation of the article.
	*
	* @param Object event The event object.
	*/
	toggleLike: function(event){
		Appreciation.toggle(true, event.target.parentNode.parentNode.getAttribute('aid'));
	},
	
	/**
	* Toggles the negative appreciation of the article.
	*
	* @param Object event The event object.
	*/
	toggleDislike: function(event){
		Appreciation.toggle(false, event.target.parentNode.parentNode.getAttribute('aid'));
	},
	
	/**
	* Toggles the appreciation of the article, both positive or negative.
	*
	* @param Boolean value If set to "true" the positive appreciation will be toggled, otherwise the negative.
	* @param String element A string containing the article ID, if set to null the article ID will be obtained from the HTML hidden input.
	*/
	toggle: function(value, element){
		if ( document.getElementById('variables-user-auth').value === '0' ){
			return UI.alert.show('You must log-in first!', 'Before to add appreciations to articles you must have logged in.', 'error');
		}
		if ( element === null ){
			element = document.getElementById('variables-article').value;
		}
		if ( element === '' ){
			return;
		}
		var connection = Utils.makeConnection();
		connection.open('POST', '/appreciation.toggle', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) === 'string' && data.result === 'success' ){
						element = document.querySelector('.articles-list-element[aid="' + element + '"]');
						if ( element === null ){
							return;
						}
						var buffer = element.querySelector('.articles-list-element-counters-icon[scope="like"]');
						if ( data.data.like === true ){
							if ( buffer.getAttribute('selected') !== 'true' ){
								buffer.setAttribute('selected', 'true');
								var counter = element.querySelector('.articles-list-element-counters-counter[scope="like"]');
								counter.textContent = parseInt(counter.textContent) + 1;
							}
						}else{
							if ( buffer.getAttribute('selected') === 'true' ){
								buffer.setAttribute('selected', 'false');
								var counter = element.querySelector('.articles-list-element-counters-counter[scope="like"]');
								counter.textContent = parseInt(counter.textContent) - 1 < 0 ? 0 : ( parseInt(counter.textContent) - 1 );
							}
						}
						var buffer = element.querySelector('.articles-list-element-counters-icon[scope="dislike"]');
						if ( data.data.dislike === true ){
							if ( buffer.getAttribute('selected') !== 'true' ){
								buffer.setAttribute('selected', 'true');
								var counter = element.querySelector('.articles-list-element-counters-counter[scope="dislike"]');
								counter.textContent = parseInt(counter.textContent) + 1;
							}
						}else{
							if ( buffer.getAttribute('selected') === 'true' ){
								buffer.setAttribute('selected', 'false');
								var counter = element.querySelector('.articles-list-element-counters-counter[scope="dislike"]');
								counter.textContent = parseInt(counter.textContent) - 1 < 0 ? 0 : ( parseInt(counter.textContent) - 1 );
							}
						}
						return;
					}
					UI.alert.show('Ops, an error occurred!', 'An unexpected error has occurred during the operation, please retry again.', 'error');
				}catch(ex){
					console.log(ex);
					UI.alert.show('Ops, an error occurred!', 'An unexpected error has occurred during the operation, please retry again.', 'error');
				}
			}
		};
		connection.send(Utils.getCSRFToken(true) + '&value=' + ( value === true ? '1' : '0' ) + '&article=' + encodeURIComponent(element));
	}
};

var Contact = {
	/**
	* Sends a message to the website admin.
	*
	* @param Object event The event object.
	*/
	sendMessage: function(event){
		event.preventDefault();
		event.stopPropagation();
		var name = Utils.trim(document.getElementById('about-contact-name').value);
		if ( name.length > 30 ){
			return UI.alert.show('Invalid name!', 'You must provide a valid name that must be up to 30 chars length.', 'error');
		}
		var email = Utils.trim(document.getElementById('about-contact-email').value);
		if ( email === '' || email.length > 256 ){
			return UI.alert.show('Invalid e-mail address!', 'You must provide a valid e-mail address.', 'error');
		}
		var text = Utils.trim(document.getElementById('about-contact-message').value);
		if ( text === '' ){
			return UI.alert.show('Invalid message!', 'C\'mon, you cannot send an empty message!', 'error');
		}
		if ( text.length > 10000 ){
			return UI.alert.show('Your message is too long.', 'The max allowed length for messages is 10000 chars.', 'error');
		}
		var connection = Utils.makeConnection();
		connection.open('POST', '/contact', true);
		connection.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		connection.onreadystatechange = function(){
			if ( connection.readyState > 3 ){
				try{
					var data = JSON.parse(connection.responseText);
					if ( Utils.checkCSRFStatus(data) === false ){
						return;
					}
					if ( typeof(data.result) === 'string' && data.result === 'success' ){
						document.getElementById('about-contact-name').value = '';
						document.getElementById('about-contact-email').value = '';
						document.getElementById('about-contact-message').value = '';
						return UI.alert.show('Message sent!', 'Your message has successfully been sent.', 'success');
					}
					UI.alert.show('Unable to send the message.', 'An error occurred while trying to send the message.', 'error');
				}catch(ex){
					console.log(ex);
					return UI.alert.show('Unable to send the message.', 'An error occurred while trying to send the message.', 'error');
				}
			}
		};
		connection.send(Utils.getCSRFToken(true) + '&name=' + encodeURIComponent(name) + '&email=' + encodeURIComponent(email) + '&text=' + encodeURIComponent(text));
	}
}

window.addEventListener('load', function(){
	switch ( window.location.hash ){
		case '#unsubscribe.success':{
			UI.alert.show('Address removed!', 'Your e-mail address has successfully been removed from mailing list.');
		}break;
		case '#unsubscribe.error':{
			UI.alert.show('Unable to removev the address.', 'Was not possible to remove your e-mail address from mailing list due to an unexpected error.');
		}break;
	}
	if ( UI.cookieLaw.checkAgreement() !== true ){
		UI.cookieLaw.show();
	}
});