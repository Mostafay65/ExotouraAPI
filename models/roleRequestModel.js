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
    enum: [roles.organizer, roles.hoster],
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(requestStatus),
    default: requestStatus.pending,
  },
  userPicture: {
    type: String,
    required: true,
  },
  idCard: {
    type: String,
    required: true,
  },
  attachments: {
    type: [String],
    required: true,
  },
});

const roleRequestModel = mongoose.model("role Request", roleRequestSchema);
export default roleRequestModel;
