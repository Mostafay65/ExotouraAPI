import User from "../models/userModel.js";
import { deleteOne, getAll, getOne, updateOne } from "./handlerFactory.js";

export const getAllUsers = getAll(User);
export const getUser = getOne(User);
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);
