// Description:
//   Respond to any mentions of servicenow tickets, according to the
//   prefixes defined in config.yaml.

'use strict';

var api = require('servicenow-lite');
var formatting = require('./formatting');
var _ = require('underscore');

// Matches 'CR1234', 'CR1234' and '(CR1234' but not '=CR1234' (because
// the latter tends to occur in direct URLs) and not 'CR01234'. Note
// that the record ID is the second regexp group.
function prefixRegexp(recordPrefix) {
  return RegExp("(^|\\s|\\()(" + recordPrefix + "\\d+)\\b", "g");
}

// Return an array of all the matches of regexp in string.
function allMatches(string, regexp) {
  var matches = [];
  var match = regexp.exec(string);
  while (match !== null) {
    matches.push(match);
    match = regexp.exec(string);
  }
  return matches;
}

// Given a hipchat message, and a record prefix (e.g. 'CR'), respond with a description.
function describeRecord(response, recordPrefix) {
  var matches = allMatches(response.message.text, prefixRegexp(recordPrefix));
  var recordIds = _.map(matches, function(match) {
    return match[2];
  });

  _.each(_.uniq(recordIds), function(recordId) {
    api.getRecordById(recordId, function(err, details) {
      if (err) {
        response.send("Failed to find " + recordPrefix + " data. See the log for more details.");
        return console.error(err);
      } else if (details) {
        response.send(formatting.formatRows([details]));
      } else {
        response.send("No such " + recordPrefix + ".");
      }
    });
  });
}

// Return true if the current message looks like an explicit command, e.g. "@hubot: foo".
function looksLikeCommand(message, robotName) {
  return message
    .toLowerCase()
    .match(RegExp("@?" + robotName.toLowerCase() + ":?"));
}

module.exports = function(robot) {
  // If a record with this prefix is mentioned in a room, fetch the
  // details and show a link.
  function makeRecordHandler(prefix) {
    robot.hear(prefixRegexp(prefix), function(response) {
      if (!looksLikeCommand(response.message.text, robot.name)) {
        describeRecord(response, prefix);
      }
    });
  }

  _.each(api.config.PREFIXES, function(prefix) {
    makeRecordHandler(prefix);

    // Ensure 'hubot help' works for these dynamically defined commands.
    robot.commands.push(
      prefix + "1234 - Reply with details and a link to this " + prefix + ".");
  });
};
