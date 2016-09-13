// Description:
//  Command for cloning servicenow CRs.

'use strict';

var api = require('servicenow-lite');
var formatting = require('./formatting');
var _ = require('underscore');

module.exports = function(robot) {
  // For every ticket prefix that we know how to clone, define a help command.
  _.each(api.config.PREFIXES, function(prefix) {
    var cloneFields = api.config.cloneFieldsFromPrefix(prefix);
    if (cloneFields) {
      robot.commands.push("hubot clone " + prefix + "1234 - Create a new " + prefix +
                          " whose fields match " + prefix + "1234.");
    }
  });

  robot.respond(/clone ([A-Z]+\d+)/i, function(response) {
    var recordId = response.match[1];
    var prefix = api.config.getPrefix(recordId);
    var cloneFields = api.config.cloneFieldsFromPrefix(prefix);
    if (!cloneFields) {
      response.send("I don't know how to clone a " + prefix +
                    " (you need to see cloneFields in config.yaml).");
      return;
    }

    api.getRecordById(recordId, function(err, details) {
      var hipchatUsername, knownUsers, newRecordDetails, servicenowUsername;
      if (err) {
        response.send("Failed to clone " + recordId + ". See the log for more details.");
        console.error(err);
        return;
      }
      if (!details) {
        response.send("No such " + prefix + ".");
        return;
      }
      newRecordDetails = _.pick(details, cloneFields);

      // Assign the CR to the user who requested us to clone it.
      hipchatUsername = response.message.user.name;
      knownUsers = robot.brain.knownUsers || {};
      servicenowUsername = knownUsers[hipchatUsername];
      if (!servicenowUsername) {
        response.send("I don't know your servicenow username. Please use:\n@" + robot.name +
                      " my username is yournamehere");
        return;
      }
      api.getUser(servicenowUsername, function(err, user) {
        if (err) {
          response.send("Could not find a servicenow user ID for " + servicenowUsername +
                        ". See the log for more details.");
          console.error(err);
          return;
        }
        newRecordDetails.requested_by = user.sys_id;
        newRecordDetails.opened_by = user.sys_id;
        newRecordDetails.u_opened_by_group = user.u_opened_by_group;
        api.createTicket(newRecordDetails, prefix, function(err, details) {
          var newTicketId;
          newTicketId = api.recordId(details);
          if (err) {
            response.send("Failed to create " + prefix + ". See the log for more details.");
            console.error(err);
          } else {
            response.send(
              "Success! " + newTicketId + " created: " + formatting.directUrl(newTicketId),
              "Amend your instructions, set the date, then submit!");
          }
        });
      });
    });
  });
};
