const fs = require("fs");
const path = require("path");

function mergeConfiguration(target, source) {

  /*
   * Function mergeConfiguration
   * Recursively overrides the configuration with a local configuration object
   */

  Object.keys(source).forEach(function(key) {

    if(source[key] !== null && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if(typeof target[key] !== "object" || target[key] === null) {
        target[key] = {};
      }

      return mergeConfiguration(target[key], source[key]);
    }

    target[key] = source[key];

  });

  return target;

}

// Base configuration, optionally overridden by an untracked local file that
// holds secrets or machine specific settings (see config.local.json)
global.CONFIG = require("./config");

const localConfiguration = path.join(__dirname, "config.local.json");

if(fs.existsSync(localConfiguration)) {
  mergeConfiguration(CONFIG, JSON.parse(fs.readFileSync(localConfiguration, "utf8")));
}

// Create some useful global functions
global.getDataFile = function() {

  /*
   * Function global.getDataFile
   * Returns a file from the base data directory
   */

  return path.join(__dirname, "data", CONFIG.SERVER.CLIENT_VERSION, ...arguments);

}

global.requireData = function() {

  /*
   * Function global.requireData
   * Requires a module from the base data directory
   */

  return require(getDataFile(...arguments))

}

global.requireModule = function() {

  /*
   * Function global.requireModule
   * Requires a module from the base source directory
   */

  return require(path.join(__dirname, "src", ...arguments));

}

// Requires the prototype modifications
requireModule("__proto__");

// Load constants
global.CONST = require("./" + path.join("client", "data", CONFIG.SERVER.CLIENT_VERSION, "constants.json"))

// Check the NodeJS version
let [ major, minor, patch ] = process.versions.node.split(".");

// Confirm major NodeJS version
if(major < 16) {
  console.log("Could not launch gameserver: required version > 16.0.0 and current version: %s.".format(process.versions.node));
  return process.exit(1);
}
