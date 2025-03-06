import mongoose from "mongoose";
import requestStatus from "../helpers/requestStatus.js";
import roles from "../helpers/roles.js";
const roleRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roleType: {
    type: String,
    enum: [roles.organizer , roles.hoster],
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(requestStatus),
    default: requestStatus.pending,
  },
  attachments: {
    type: [String],
  },
});

const roleRequestModel = mongoose.model(
  "role Request",
  roleRequestSchema
);
export default roleRequestModel;
