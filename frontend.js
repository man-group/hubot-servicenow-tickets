// Description:
//   Shows a friendly, simplified web page describing CRs.

"use strict";

var api = require("servicenow-lite");
var formatting = require("./formatting");

var path = require("path");
var _ = require("underscore");
var moment = require("moment");
var express = require("express");
var consolidate = require("consolidate");

require("./handlebars_helpers");

// Return true for strings like 'None', 'N/A', 'None.' and '.', where
// there's no point showing them.
function shouldHide(stepStr) {
  var cleaned;
  if (!stepStr) {
    return true;
  }
  cleaned = stepStr.toLowerCase().replace(/[^a-z0-9]+/i, " ").trim();
  return cleaned.length <= 4;
}

// Ensure we use unix line endings and collapse excessive newlines.
function cleanLineEndings(str) {
  return str.replace(/\r\n/g, "\n").replace(/\n\n\n/g, "\n\n");
}

function formatDate(d) {
  if (d) {
    // 14 Jun 2018
    return moment(d).format("DD MMM YYYY");
  } else {
    return "";
  }
}

function formatDateTime(d) {
  if (d) {
    // Sunday, February 14th 2010, 3:25:50 pm
    return moment(d).format("dddd, MMMM Do YYYY, H:mm:ss ZZ");
  } else {
    return "";
  }
}

function fetchWorkNotes(sysId, callback) {
  api.workNotesBySysId(sysId, function(err, workNotes) {
    if (err) {
      return callback(err);
    }
    _.each(workNotes, function(note) {
      note.date = formatDate(note.sys_created_on);
    });
    callback(null, workNotes);
  });
}

// Return a single object containing all the record details we're interested in.
function fetchDetails(recordId, callback) {
  api.getRecordById(recordId, function(err, recordDetails) {
    if (err) {
      // Probably bad credentials.
      return callback(err);
    }
    if (!recordDetails) {
      // No such record.
      return callback(null, recordDetails);
    }

    // Read out the fields that config.yaml has specified.
    var steps = [];
    _.each(api.config.webFields(recordId), function(webField) {
      var friendlyName = _.keys(webField)[0];
      var fields = webField[friendlyName];

      var values = [];
      _.each(fields, function(field) {
        var value = cleanLineEndings(recordDetails[field]);
        if (!shouldHide(value)) {
          values.push(value);
        }
      });

      if (!_.isEmpty(values)) {
        steps.push([friendlyName, values]);
      }
    });

    fetchWorkNotes(recordDetails.sys_id, function(err, workNotes) {
      if (err) {
        return callback(err);
      }
      callback(null, {
        recordId: recordId,
        url: formatting.directUrl(recordId),
        short_description:
          recordDetails.short_description || "(no description)",
        description: recordDetails.description,
        creator: recordDetails.sys_created_by,
        end_date: formatDateTime(recordDetails[api.config.dateField(recordId)]),
        state: recordDetails.state,
        approval: recordDetails.approval,
        steps: steps,
        work_notes: workNotes
      });
    });
  });
}

module.exports = function(robot) {
  robot.router.engine("html", consolidate.handlebars);
  robot.router.set("view engine", "html");
  robot.router.set("views", __dirname + "/views");

  // Serve our own static content.
  robot.router.use("/static", express.static(__dirname + "/static"));

  // Serve font-awesome from node_modules.
  var fontAwesomePath = path.dirname(
    require.resolve("font-awesome/package.json")
  );

  robot.router.use("/static_font_awesome", express.static(fontAwesomePath));

  // Simple ticket web frontend that doesn't overwhelm the user.
  return robot.router.get(/\/servicenow\/([A-Z]+\d+)/, function(
    request,
    response
  ) {
    var recordId = request.params[0];
    var prefix = api.config.getPrefix(recordId);
    if (!api.config.webFields(recordId)) {
      response.end(
        "I don't know how to display a " +
          prefix +
          " (you need to set web_fields in config.yaml)."
      );
      return;
    }
    fetchDetails(recordId, function(err, details) {
      if (err) {
        response.end(
          "Failed to fetch " +
            prefix +
            " details. See the log for more details."
        );
        console.error(err);
        return;
      }
      if (details) {
        response.render("view_record", details);
      } else {
        response.end("No such " + prefix + ".");
      }
    });
  });
};
