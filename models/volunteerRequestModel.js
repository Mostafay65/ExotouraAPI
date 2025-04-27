import mongoose from "mongoose";
import volunteerStatus from "../helpers/volunteerStatus.js";

const volunteerRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(volunteerStatus),
      default: volunteerStatus.pending,
      message:
        "Status must be one of the following: " +
        Object.values(volunteerStatus).join(", "),
    },
    images: [String],
    feedback: String,
  },
  {
    timestamps: true,
  }
);

const VolunteerRequest = mongoose.model("VolunteerRequest", volunteerRequestSchema);
export default VolunteerRequest;
