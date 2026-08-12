// services/groupsStore.js
//
// Handles all reading/writing of data/groups.json.
// Never crashes — falls back to a fixed array if the file is missing or invalid.

const fs = require("fs");
const path = require("path");

const groupsFile = path.join(__dirname, "..", "data", "groups.json");

const fallbackGroups = [
  {
    id: "group-001",
    orderNumber: "ORD-12345",
    phoneNumbers: ["+15516550939", "+15516550940", "+15516550941"],
  },
];

function readGroups() {
  if (!fs.existsSync(groupsFile)) {
    console.log("groups.json not found. Using fallback data.");
    return fallbackGroups;
  }
  try {
    const data = fs.readFileSync(groupsFile, "utf8");
    if (!data.trim()) {
      console.log("groups.json is empty. Using fallback data.");
      return fallbackGroups;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      console.error("groups.json is not an array. Using fallback data.");
      return fallbackGroups;
    }
    return parsed;
  } catch (error) {
    console.error("groups.json read/parse failed. Using fallback data.");
    return fallbackGroups;
  }
}

function writeGroups(groups) {
  fs.writeFileSync(groupsFile, JSON.stringify(groups, null, 2), "utf8");
}

function generateId(groups) {
  // Find the highest existing numeric suffix and increment it.
  let maxNum = 0;
  for (const g of groups) {
    const match = /^group-(\d+)$/.exec(g.id || "");
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const next = maxNum + 1;
  return `group-${String(next).padStart(3, "0")}`;
}

module.exports = {
  readGroups,
  writeGroups,
  generateId,
};
