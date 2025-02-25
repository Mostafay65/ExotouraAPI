import mongoose from "mongoose";
import requestStatus from "../helpers/requestStatus.js";
const accommodationRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  accommodation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Accommodation",
    required: true,
  },
  status: {
    type: String,
    enum: [
      requestStatus.pending,
      requestStatus.holding,
      requestStatus.approved,
      requestStatus.rejected,
    ],
    default: requestStatus.pending,
  },
});

const AccommodationRequest = mongoose.model(
  "AccommodationRequest",
  accommodationRequestSchema
);

export default AccommodationRequest;
