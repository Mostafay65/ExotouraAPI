import express from "express";
import authorize from "../middleware/authorize.js";
import restrictTo from "../middleware/restrictTo.js";
import {
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
} from "../controllers/userController.js";
import roles from "../helpers/roles.js";
import {
  filterAdminBody,
  filterUserBody,
  setUserId,
} from "../middleware/userHandlers.js";
import checkPassword from "../middleware/checkPassword.js";

const router = express.Router();

// Authentication
router.use(authorize);

router
  .route("/me")
  .get(setUserId, getUser)
  .patch(setUserId, filterUserBody, updateUser)
  .delete(checkPassword, setUserId, deleteUser);

// Administration
router.use(restrictTo(roles.admin));

router.get("/", getAllUsers);
router.route("/:id").get(getUser).patch(filterAdminBody, updateUser).delete(deleteUser);

export default router;
