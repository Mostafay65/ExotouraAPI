import mongoose from "mongoose";

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
    type: String,
    required: true,
  },
  maxCapacity: {
    type: Number,
    required: true,
  },
  availability: {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  spaceOffered: {
    type: String,
    enum: {
      values: ["Single Room", "Shared Room", "Entire Apartment", "Entire House"],
      message:
        "Space offered is either: Single Room, Shared Room, Entire Apartment, or Entire House.",
    },
    required: true,
  },
  facilities: [
    {
      type: String,
      enum: {
        values: [
          "WiFi",
          "Parking",
          "Swimming Pool",
          "Air Conditioning",
          "Kitchen",
          "TV",
          "Heating",
          "Washer",
          "Dryer",
        ],
        message: "Facility must be one of the predefined options",
      },
    },
  ],
  accessibilityFeatures: [
    {
      type: String,
      enum: {
        values: [
          "Wheelchair Ramp",
          "Elevator",
          "Roll-in Shower",
          "Grab Bars",
          "Visual Doorbell",
          "Braille Signage",
          "Height-Adjusted Furniture",
          "Medical Bed",
          "Stair Lift",
          "Accessible Bathroom",
          "Handrails",
        ],
        message: "Accessibility feature must be one of the predefined options",
      },
    },
  ],
  houseRules: [
    {
      type: String,
      enum: {
        values: [
          "No Smoking",
          "No Pets",
          "No Parties",
          "No Children",
          "Quiet Hours",
          "No Outside Visitors",
          "No Food in Rooms",
          "No Alcohol",
          "Check-out Time",
          "Keep Common Areas Clean",
        ],
        message: "House rule must be one of the predefined options",
      },
    },
  ],
  hoster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hoster",
    required: true,
  },
});

const Accommodation = mongoose.model("Accommodation", accommodationSchema);

export default Accommodation;
