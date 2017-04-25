// Description:
//   Teach Hubot who you are, so it can search/create servicenow
//   tickets on your behalf.
//
// Commands:
//   hubot known users - List all the windows users associated with hipchat users.
//   hubot my username is <username> - Save your username.

'use strict';

var _ = require('underscore');

function describeUsers(users) {
  if (users.length == 0) {
    return "I don't know any servicenow usernames.";
  }
  if (users.length == 1) {
    return "I know 1 username:\n" + users[0];
  }
  return "I know " + users.length + " usernames:\n" + users.join('\n');
}

module.exports = function(robot) {
  robot.commands.push("hubot known users - List all the windows users associated with hipchat users.");
  robot.commands.push("hubot my username is <username> - Save your username.");

  robot.respond(/known users/i, function(response) {
    var knownUsers = robot.brain.knownUsers || {};
    var hipchatNames = _.keys(knownUsers);
    hipchatNames.sort();

    var rows = hipchatNames.map(function(hipchatName) {
      return hipchatName + " -- " + knownUsers[hipchatName];
    });
    response.send(describeUsers(rows) + "\nTo add your username:\n@" + robot.name +
                  " my username is yourusernamehere");
  });

  robot.respond(/my username is (.*)/i, function(response) {
    var knownUsers = robot.brain.knownUsers || {};
    var hipchatName = response.message.user.name;
    var servicenowName = response.match[1];
    knownUsers[hipchatName] = servicenowName;
    robot.brain.knownUsers = knownUsers;

    // Log this, so we have a record if users impersonate others.
    /* eslint-disable no-console */
    console.log(['saved chatroom user', hipchatName, 'to servicenow user', servicenowName]);
    response.send('OK, saved.');
  });
};
