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
  from: {
    type: Date,
    required: true,
  },
  to: {
    type: Date,
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
  "Accommodation Request",
  accommodationRequestSchema
);

export default AccommodationRequest;
