import mongoose from "mongoose";
import User from "./userModel.js";
import roles from "../helpers/roles.js";

const Hoster = User.discriminator(
  roles.hoster,
  new mongoose.Schema({
    profileDescription: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["verified", "notVerified"],
        message: "Status is either: verified, notVerified.",
      },
    },
  })
);

export default Hoster;
