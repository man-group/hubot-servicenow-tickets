// Description:
//   Respond to mentions of servicenow tickets.
//
// Commands:
//   hubot dump CR1234 - Raw data associated with this ticket.
//   hubot dump CR1234 <key> - Raw data for this key associated with this ticket.

'use strict';

var api = require('servicenow-lite');

module.exports = function(robot) {
  // TODO: find a way/file a bug to get Hubot to read help
  // descriptions from the header for packages installed from npm.
  // Cf https://github.com/hubot-scripts/hubot-thank-you/blob/master/index.coffee
  robot.commands.push("hubot dump CR1234 - Raw data associated with this ticket.");
  robot.commands.push("hubot dump CR1234 <key> - Raw data for this key associated with this ticket.");

  robot.respond(/dump ([^ ]+)( [^ ]+)?/i, function(response) {
    var recordId = response.match[1];
    var key = response.match[2];

    api.getRecordById(recordId, function(err, details) {
      if (err) {
        response.send("Failed to fetch " + recordId + ". See the log for more details.");
        console.error(err);
        return;
      }

      if (!details) {
        response.send("No such ticket: " + recordId);
        return;
      }

      if (key) {
        key = key.trim();
        // Just show the key requested. Ensure we wrap strings in
        // double quotes to avoid confusion with other values.
        response.send("/code " + JSON.stringify(details[key]));
      } else {
        // Show the whole record, plus work notes.
        response.send("/code " + JSON.stringify(details, null, 2));
        api.workNotesBySysId(details.sys_id, function(err, workNotes) {
          if (err) {
            response.send("Could not load work notes.");
            return;
          }
          response.send("/code Work notes: " + JSON.stringify(workNotes, null, 2));
        });
      }
    });
  });
};

