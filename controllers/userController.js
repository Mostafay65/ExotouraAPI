import User from "../models/userModel.js";
import roles from "../helpers/roles.js";
import { deleteOne, getAll, getOne, updateOne } from "./handlerFactory.js";

export const getAllUsers = getAll(User, "disabilities");
export const getAllVolunteers = getAll(User, "", { role: { $in: [roles.volunteer] } });
export const getUser = getOne(User, "disabilities");
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);
