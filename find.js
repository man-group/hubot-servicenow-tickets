// Description:
//   Servicenow searching commands.
//
// Commands:
//   hubot find <text> - Find the latest tickets containing this text
//   hubot created by <user/me> - Find the last tickets created by a user.

'use strict';

var api = require('servicenow-lite');
var formatting = require('./formatting');
var _ = require('underscore');

// Remove records that don't have a date associated.
function dropUndatedRecords(records) {
  var datedRecords = [];
  _.each(records || [], function(record) {
    var dateField = api.config.dateFieldFromId(api.recordId(record));
    if (record[dateField]) {
      datedRecords.push(record);
    }
  });

  return datedRecords;
}

module.exports = function(robot) {
  robot.commands.push("hubot find <text> - Find the latest tickets containing this text");
  robot.commands.push("hubot created by <user/me> - Find the last tickets created by a user.");

  // List all the records created by a user.
  robot.respond(/created by (.*)/i, function(response) {
    var creator = response.match[1];
    if (creator == "me") {
      var knownUsers = robot.brain.knownUsers || {};
      var windowsUsername = knownUsers[response.message.user.name];

      if (!windowsUsername) {
        response.send(
          "I don't know your windows username. Please use:\n" +
          `@${robot.name} my username is yournamehere`);
        return;
      }
      creator = windowsUsername;
    }

    api.recordsCreatedBy(creator, function(err, results) {
      if (err) {
        response.send("Failed to find any results. See the log for more details.");
        console.error(err);
        return;
      }
      results = dropUndatedRecords(results);
      if (_.isEmpty(results)) {
        response.send("Nothing found for " + creator + ".");
      } else {
        response.send(formatting.formatRows(_.first(results, 15)));
      }
    });
  });

  robot.respond(/find (.*)/i, function(response) {
    var searchTerm = response.match[1];
    api.search(searchTerm, function(err, results) {
      if (err) {
        response.send("Failed to find any results. See the log for more details.");
        console.error(err);
        return;
      }

      results = dropUndatedRecords(results);
      if (results && results.length > 0) {
        response.send(formatting.formatRows(_.first(results, 15)));
      } else {
        response.send("No tickets found matching '" + searchTerm + "'.");
      }
    });
  });
};
