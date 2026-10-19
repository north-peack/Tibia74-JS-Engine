"use strict";

const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "data", "740", "world", "Tibia74-spawns.xml");
const TARGET = path.join(ROOT, "data", "740", "spawns", "definitions.json");
const MONSTERS = path.join(ROOT, "data", "740", "monsters");

// Read the monster names that have a definition available
let known = new Set();

Object.values(JSON.parse(fs.readFileSync(path.join(MONSTERS, "definitions.json")))).forEach(function(file) {
  let data = JSON.parse(fs.readFileSync(path.join(MONSTERS, "definitions", file)));
  known.add(data.creatureStatistics.name.toLowerCase());
});

// Parse the RME spawn file
xml2js.parseString(fs.readFileSync(SOURCE), function(error, result) {

  if(error) {
    throw error;
  }

  let spawns = [];

  result.spawns.spawn.forEach(function(area) {

    let centerX = Number(area.$.centerx);
    let centerY = Number(area.$.centery);
    let centerZ = Number(area.$.centerz);

    (area.monster || []).forEach(function(monster) {

      let name = monster.$.name;

      // Skip monsters without a definition: they cannot be spawned
      if(!known.has(name.toLowerCase())) {
        return;
      }

      // The engine inverts the depth of the OTBM positions (15 - z), so the
      // spawn coordinates from the map editor need the same conversion.
      let z = monster.$.z !== undefined ? Number(monster.$.z) : centerZ;

      spawns.push({
        "respawnTime": Number(monster.$.spawntime) || 60,
        "mid": name,
        "position": {
          "x": centerX + Number(monster.$.x),
          "y": centerY + Number(monster.$.y),
          "z": 15 - z
        }
      });

    });

  });

  fs.writeFileSync(TARGET, JSON.stringify(spawns));

  let counts = new Map();

  spawns.forEach(function(spawn) {
    counts.set(spawn.mid, (counts.get(spawn.mid) || 0) + 1);
  });

  console.log("Imported %s spawns of %s monster types into %s", spawns.length, counts.size, TARGET);

  Array.from(counts.entries()).sort(function(a, b) { return b[1] - a[1]; }).forEach(function([name, count]) {
    console.log("  %s: %s", name, count);
  });

});
