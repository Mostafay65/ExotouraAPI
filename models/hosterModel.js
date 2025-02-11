import mongoose from "mongoose";
import User from "./userModel";
import roles from "../helpers/roles";

const hosterSchema = User.discriminator(
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
const Hoster = mongoose.model("Hoster", hosterSchema);
export default Hoster;
