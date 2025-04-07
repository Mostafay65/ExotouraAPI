import mongoose from "mongoose";
import spaceOffered from "../helpers/spaceOffered.js";
import facilities from "../helpers/facilities.js";
import accessibilityFeatures from "../helpers/accessibilityFeatures.js";
import houseRules from "../helpers/houseRules.js";
import LocationSchema from "./locationModel.js";

const accommodationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  price: {
    type: Number,
    required: true,
  },
  deposit: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  location: {
    type: LocationSchema,
    required: [true, "Location is required"],
  },
  maxCapacity: {
    type: Number,
    required: true,
  },
  beds: {
    type: Number,
    required: true,
  },
  bedrooms: {
    type: Number,
    required: true,
  },
  bathrooms: {
    type: Number,
    required: true,
  },
  spaceOffered: {
    type: String,
    enum: {
      values: spaceOffered,
      message:
        "Space offered is either: Single Room, Shared Room, Entire Apartment, or Entire House.",
    },
    required: true,
  },
  facilities: [
    {
      type: String,
      enum: {
        values: facilities,
        message: "Facility must be one of the predefined options",
      },
    },
  ],
  accessibilityFeatures: [
    {
      type: String,
      enum: {
        values: accessibilityFeatures,
        message: "Accessibility feature must be one of the predefined options",
      },
    },
  ],
  houseRules: [
    {
      type: String,
      enum: {
        values: houseRules,
        message: "House rules must be one of the predefined options",
      },
    },
  ],
  images: [
    {
      type: String,
      required: true,
    },
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
},
{ timestamps: true });
const Accommodation = mongoose.model("Accommodation", accommodationSchema);

export default Accommodation;
