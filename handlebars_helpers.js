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

  // Iterate over all the space-separated strings in text.
  text = text.replace(/(\S+?)(\s|$)/g, function(_match, word, after) {
    // Convert URLs to clickable links.
    if (word.match(/^https?:/)) {
      word = '<a href="' + word + '">' + word + "</a>";
    } else {
      // Convert mentions of records to clickable links.
      _.each(api.config.PREFIXES, function(prefix) {
        // This matches strings like 'CR1234' but not 'ABCR123'.
        var ticketPattern = RegExp("\\b(" + prefix + "\\d+)\\b", "g");
        word = word.replace(ticketPattern, function(s) {
          if (s === recordId) {
            return s; // Don't linkify references to the current record.
          } else {
            return '<a href="' + formatting.url(s) + '">' + s + "</a>";
          }
        });
      });
    }

    return word + after;
  });

  return new Handlebars.SafeString(text);
});

Handlebars.registerHelper("equal", require("handlebars-helper-strict-equal"));
