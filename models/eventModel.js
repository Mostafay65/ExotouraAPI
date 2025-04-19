import mongoose from "mongoose";
import accessibilityFeatures from "../helpers/accessibilityFeatures.js";
import LocationSchema from "./locationModel.js";
import cron from "node-cron";

const eventTypes = ["Sport", "Cultural", "Social", "Educational", "Other"];
const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      maxlength: 5000,
    },
    accessibilityFeatures: [
      {
        type: String,
        enum: accessibilityFeatures,
        message: "Invalid accessibility feature",
      },
    ],
    maxCapacity: {
      type: Number,
      required: [true, "Event capacity is required"],
      min: [20, "Event must have at least 20 participant"],
    },
    registrationEndDate: {
      type: Date,
    },
    price: {
      type: Number,
      required: [true, "Event price is required"],
      min: [0, "Price cannot be negative"],
    },
    type: {
      type: String,
      enum: eventTypes,
      required: [true, "Event type is required"],
    },
    availability: {
      from: { type: Date, required: [true, "Event start date is required"] },
      to: { type: Date, required: [true, "Event end date is required"] },
    },
    location: {
      type: LocationSchema,
      required: [true, "Location is required"],
    },
    status: {
      type: String,
      enum: ["Open", "Closed", "Full"],
      default: "Open",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Event must have an organizer"],
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    volunteers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    place: {
      type: String,
    },
  },
  { timestamps: true }
);

eventSchema.pre("save", function (next) {
  const now = new Date();
  if (this.availability && this.availability.from) {
    const oneDayBefore = new Date(this.availability.from);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    this.registrationEndDate = oneDayBefore;
  }

  if (this.registrationEndDate && now > this.registrationEndDate) {
    this.status = "Closed";
  }

  if (this.attendees.length >= this.maxCapacity) {
    this.status = "Full";
  } else if (this.status === "Full") {
    this.status = "Open";
  }

  next();
});

const Event = mongoose.model("Event", eventSchema);

// Runs every hour ?/
cron.schedule("0 * * * *", async () => {
  const now = new Date();

  try {
    const result = await Event.updateMany(
      {
        status: "Open",
        registrationEndDate: { $lt: now },
      },
      { $set: { status: "Closed" } }
    );
  } catch (err) {
    console.error("Error updating event statuses:", err);
  }
});

export default Event;
