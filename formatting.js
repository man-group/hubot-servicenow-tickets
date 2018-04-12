"use strict";

var _ = require("underscore");
var os = require("os");
var moment = require("moment");
var api = require("servicenow-lite");

// Return a frontend URL if we're configured to render this record,
// otherwise a direct URL to service now.
function frontendUrl(recordId) {
  return "http://" + os.hostname() + ":8080/servicenow/" + recordId;
}

function directUrl(recordId) {
  return (
    api.config.ROOT_URL +
    "/nav_to.do?uri=" +
    api.config.tableName(recordId) +
    ".do?sys_id=" +
    recordId
  );
}

function url(recordId) {
  if (api.config.webFields(recordId)) {
    return frontendUrl(recordId);
  } else {
    return directUrl(recordId);
  }
}

function formatRows(rows) {
  rows = rows || [];

  var prettyRows = _.map(rows, function(row) {
    var shortDescription = row.short_description || "(no description)";
    var id = api.recordId(row);
    var endDateGmt = row[api.config.dateField(id)];
    var endDate = endDateGmt ? moment(endDateGmt).format("DD MMM YYYY") : null;

    var ticketUrl = url(id);
    if (endDate) {
      return id + ": " + shortDescription + " (" + endDate + ") " + ticketUrl;
    } else {
      return id + ": " + shortDescription + " " + ticketUrl;
    }
  });

  return prettyRows.join("\n");
}

module.exports = {
  url: url,
  frontendUrl: frontendUrl,
  directUrl: directUrl,
  formatRows: formatRows
};
