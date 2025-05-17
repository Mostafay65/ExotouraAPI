import mongoose from "mongoose";

export const placeTypes = [
  "Speciality Museums",
  "Ancient Ruins",
  "Historic Sites",
  "National Parks",
  "Points of Interest & Landmarks",
  "Cemeteries",
  "Religious Sites",
  "Monuments & Statues",
  "Flea & Street Markets",
  "Bodies of Water",
  "Islands",
];

const placeSchema = new mongoose.Schema({
  locationName: {
    type: String,
    required: [true, "Location name is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  latitude: {
    type: Number,
    required: [true, "Latitude is required"],
  },
  longitude: {
    type: Number,
    required: [true, "Longitude is required"],
  },
  imageURLs: [
    {
      type: String,
      required: [true, "Image URL is required"],
    },
  ],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  type: {
    type: String,
    required: [true, "Type is required"],
    enum: [...placeTypes],
  },
  approved: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Created by is required"],
  },
});

const Place = mongoose.model("Place", placeSchema);
export default Place;
