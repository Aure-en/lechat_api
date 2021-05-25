const express = require("express");

const router = express.Router();
const serverController = require("../controllers/serverController");

// GET all servers
router.get("/", serverController.server_list);

// POST to create a new server
router.post("/", serverController.check_user, serverController.server_create);

// PUT to update a server
router.put(
  "/:serverId",
  serverController.check_user,
  serverController.check_admin,
  serverController.server_update
);

// DELETE a server
router.delete(
  "/:serverId",
  serverController.check_user,
  serverController.check_admin,
  serverController.server_delete
);

// GET a specific server
router.get("/:serverId", serverController.server_detail);

module.exports = router;
