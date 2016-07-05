/*jslint node: true */
'use strict';
var accountSID = process.env.WATCHMEN_AUTH_TWILIO_SID || '<your twilio account sid>';
var authToken = process.env.WATCHMEN_AUTH_TWILIO_AUTH_TOKEN || '<your twilio auth token>';
var fromPhoneNumber = process.env.WATCHMEN_AUTH_TWILIO_PHONE_NUMBER || '<your twilio phone number>';
var client = require('twilio')(accountSID, authToken);


var glob       = require('glob');
var handlebars = require('handlebars');
var path       = require('path');
var fs         = require('fs');
require('dotenv').load({ silent: true });

handlebars.registerHelper('date', function(timestamp) {
  return new Date(timestamp).toString();
});


/*
 * Load all templates into a nice object like…
 *
 * {
 *   body: {
 *     outage: $template
 *   },
 *   subject {
 *     outage: $template
 *   }
 * }
 */
function get_templates(base_directory) {
  var files     = glob.sync(path.join(base_directory, '**/*.hbs'));
  var templates = {};
  files.forEach(function(template_path) {
    var parts      = path.parse(template_path);
    var contents   = fs.readFileSync(template_path);
    var dir_parts  = path.parse(parts.dir);
    var parent_dir = dir_parts.base;
    //var parent_dir = parts.dir.split(path.sep).pop();

    if (!(parent_dir in templates)) {
      templates[parent_dir] = {};
    }
    templates[parent_dir][parts.name] = handlebars.compile(contents.toString());
    console.log('Found ' + parent_dir + ' template for ' + parts.name);
  });

  return templates;
}

/*
 * Check if using default template location or one defined in environment
 */
var p = path.join(__dirname, 'templates');
if ('WATCHMEN_TWILIO_TEMPLATE_DIRECTORY' in process.env) {
  p = process.env.WATCHMEN_TWILIO_TEMPLATE_DIRECTORY;
  console.log('Loading templates from ' + p + ' instead of default templates.');
}
var templates = get_templates(p);

/*
 * Handle events from watchmen! The fun stuff!
 */
function handleEvent(eventName) {
  return function(service, data) {
    // Don't bother if there's no template
    if (!(eventName in templates.body)) {
      return;
    }

    // Pass this stuff into the templates
    var context = { service: service, data: data };

    // Give us a template subject or default
    var subject = '[' + eventName + ']' + ' on ' + service.name;
    if (eventName in templates.subject) {
      subject = templates.subject[eventName](context);
    }

    var body = templates.body[eventName](context);

	var numbers = service.alertPhoneNumbers.split(',');
	for (var i in numbers) {
		var number = numbers[i];
		console.log('Sending alert notification to phone number: ' + number);
		client.sendMessage({
			to:number,
			from: fromPhoneNumber,
			body: body
		}, function(err, responseData) {
			if (!err) {
				console.log(responseData.from);
				console.log(responseData.body);
			} else {
				console.error(err);
			}
		});
	}
  };
}

/*
 * Any event from watchmen can have a template associated with it. If there's
 * one in templates/body/, a notification will be sent to notify support teams!
 */
function WatchmenTwilioPlugin(watchmen) {
  watchmen.on('latency-warning', handleEvent('latency-warning'));
  watchmen.on('new-outage',      handleEvent('new-outage'));
  watchmen.on('current-outage',  handleEvent('current-outage'));
  watchmen.on('service-back',    handleEvent('service-back'));
  watchmen.on('service-error',   handleEvent('service-error'));
  watchmen.on('service-ok',      handleEvent('service-ok'));
}

exports = module.exports = WatchmenTwilioPlugin;