require("dotenv").config();

const express = require("express");
const path = require("path");

const { readGroups, writeGroups, generateId } = require("./services/groupsStore");
const { executeGroup } = require("./services/twilioService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Validation helpers ----------

// Basic E.164-ish check: + followed by 8-15 digits
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

function validateGroupPayload(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return ["Invalid request body."];
  }

  const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
  if (!orderNumber) {
    errors.push("Order number is required.");
  }

  if (!Array.isArray(body.phoneNumbers) || body.phoneNumbers.length === 0) {
    errors.push("At least one phone number is required.");
  } else {
    const cleaned = body.phoneNumbers
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter((p) => p.length > 0);

    if (cleaned.length === 0) {
      errors.push("Phone numbers cannot be empty.");
    } else {
      for (const p of cleaned) {
        if (!PHONE_REGEX.test(p)) {
          errors.push(`Invalid phone number format: "${p}". Use E.164 format, e.g. +15516550939`);
        }
      }
    }
  }

  return errors;
}

function cleanPayload(body) {
  return {
    orderNumber: body.orderNumber.trim(),
    phoneNumbers: body.phoneNumbers.map((p) => p.trim()).filter((p) => p.length > 0),
  };
}

// ---------- API routes ----------

// GET all groups
app.get("/api/groups", (req, res) => {
  const groups = readGroups();
  res.json(groups);
});

// GET single group
app.get("/api/groups/:id", (req, res) => {
  const groups = readGroups();
  const group = groups.find((g) => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found." });
  }
  res.json(group);
});

// CREATE group
app.post("/api/groups", (req, res) => {
  const errors = validateGroupPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  const groups = readGroups();
  const { orderNumber, phoneNumbers } = cleanPayload(req.body);

  const newGroup = {
    id: generateId(groups),
    orderNumber,
    phoneNumbers,
  };

  groups.push(newGroup);

  try {
    writeGroups(groups);
  } catch (error) {
    return res.status(500).json({ error: "Failed to save group." });
  }

  res.status(201).json(newGroup);
});

// UPDATE group
app.put("/api/groups/:id", (req, res) => {
  const errors = validateGroupPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  const groups = readGroups();
  const index = groups.findIndex((g) => g.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Group not found." });
  }

  const { orderNumber, phoneNumbers } = cleanPayload(req.body);

  groups[index] = {
    id: groups[index].id,
    orderNumber,
    phoneNumbers,
  };

  try {
    writeGroups(groups);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update group." });
  }

  res.json(groups[index]);
});

// DELETE group
app.delete("/api/groups/:id", (req, res) => {
  const groups = readGroups();
  const index = groups.findIndex((g) => g.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Group not found." });
  }

  const [removed] = groups.splice(index, 1);

  try {
    writeGroups(groups);
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete group." });
  }

  res.json({ deleted: true, group: removed });
});

// EXECUTE group — send SMS to every number in the group
app.post("/api/groups/:id/execute", async (req, res) => {
  const groups = readGroups();
  const group = groups.find((g) => g.id === req.params.id);

  if (!group) {
    return res.status(404).json({ error: "Group not found." });
  }

  try {
    const result = await executeGroup(group.orderNumber, group.phoneNumbers);
    res.json(result);
  } catch (error) {
    console.error("Execute group failed:", error);
    res.status(500).json({ error: "Failed to execute group SMS sending." });
  }
});

// Fallback 404 for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.listen(PORT, () => {
  console.log(`SMS Order Group Manager running at http://localhost:${PORT}`);
});
