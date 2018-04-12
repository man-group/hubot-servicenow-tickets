"use strict";

var _ = require("underscore");
var Handlebars = require("handlebars");

var api = require("servicenow-lite");
var formatting = require("./formatting");

// Linkify replaces URLs and ticket cross-references with anchor tags, so
// they can be clicked.
Handlebars.registerHelper("linkify", function(text, recordId) {
  // Ensure we escape anything that could be confused with HTML.
  text = Handlebars.escapeExpression(text);

  // Convert URLs to clickable links.
  text = text.replace(/(https?:\/\/\S+)/gi, function(s) {
    return '<a href="' + s + '">' + s + "</a>";
  });

  // Convert ticket references to clickable links.
  _.each(api.config.PREFIXES, function(prefix) {
    // This matches strings like 'CR1234' but not 'ABCR123'.
    var ticketPattern = RegExp("\\b(" + prefix + "\\d+)\\b", "g");
    text = text.replace(ticketPattern, function(s) {
      if (s === recordId) {
        return s; // don't linkify references to the current record
      } else {
        return '<a href="' + formatting.url(s) + '">' + s + "</a>";
      }
    });
  });

  return new Handlebars.SafeString(text);
});

Handlebars.registerHelper("equal", require("handlebars-helper-strict-equal"));
