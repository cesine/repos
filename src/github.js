"use strict";
var request = require("request-promise");
var fs = require("fs");

var GITHUB_API = "https://api.github.com";

var USERS_REPOS = GITHUB_API + "/users/" + process.env.GITHUB_USERNAME + "/repos";
var repos = [];

var clean = function(value) {
  if (!value || typeof value.replace !== "function") {
    return value;
  }
  value = value
    .replace(/[_.,-]+/g, " ");
  // .replace(/"/g, "\\\"");
  value = value[0].toUpperCase() + value.substring(1, value.length);
  return value;
};

var save = function(data, filename) {
  console.log("Saving " + repos.length);
  filename = filename || process.env.GITHUB_USERNAME + ".json";
  fs.writeFile(filename, data, function(error) {
    if (error) {
      console.log("Unable to save results", error);
      return;
    }
    console.log("Saved results in " + filename);
  });
};

var convertJSONtoCSV = function(filename) {
  filename = filename || process.env.GITHUB_USERNAME + ".json";
  fs.readFile(filename, 'utf8', function(error, data) {
    if (error || !data) {
      console.log("Error reading " + filename, error);
      return;
    }
    var csv = exportAsCSV(JSON.parse(data));
    save(csv.join("\n"), process.env.GITHUB_USERNAME + ".csv");
  });
};

var exportAsCSV = function(repos) {
  var matrix = [
    [
      "name",
      "description",
      "size",
      "language",
      "created_at",
      "pushed_at",
      "fork",
      "stargazers_count",
      "watchers_count",
      "forks",
      "open_issues",
    ]
  ];
  repos.map(function(repo) {
    var row = [];
    var value;
    matrix[0].map(function(attribute) {
      value = clean(repo[attribute]);
      row.push(value);
    });
    matrix.push(row.join(","));
    // matrix.push("\"" + row.join("\",\"") + "\"");
  });
  return matrix;
};


var requestPage = function(page) {
  request({
      method: "GET",
      url: "https://api.github.com/users/" + process.env.GITHUB_USERNAME + "/repos?access_token=" + process.env.GITHUB_API_TOKEN + "&type=sources&page=" + page,
      headers: {
        "User-Agent": "Request-Promise"
      },
      json: true // Automatically parses the JSON string in the response
    }).then(function(results) {
      // console.log("User ", user);
      console.log("User has %d repos", results.length);
      results.map(function(repo) {
        console.log(repo.full_name);
        // console.log(repo.description);
        // console.log("");
      });
      if (results.length && page < 100) {
        repos = repos.concat(results);
        page = page + 1;
        requestPage(page);
      } else {
        save(JSON.stringify(repos, null, 2));
      }
    })
    .catch(function(error) {
      console.log("Unable to contact api ", error.error);
      save(JSON.stringify(repos, null, 2));
    });
};


// requestPage(1);
convertJSONtoCSV();
