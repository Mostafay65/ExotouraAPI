import mongoose from "mongoose";
import cron from "node-cron";
import hangoutTypes from "../helpers/hangoutTypes.js";

const hangoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hangout name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Hangout description is required"],
      maxlength: 5000,
    },
    date: {
      type: Date,
      required: [true, "Hangout date is required"],
    },
    locations: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        placeName: {
          type: String,
          required: [true, "Place name is required"],
        },
      },
    ],
    images: [
      {
        type: String,
        required: true,
      },
    ],
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Hangout must have a creator"],
    },
    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },
    type: {
      type: String,
      enum: hangoutTypes,
      required: [true, "Hangout type is required"],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

hangoutSchema.virtual("isToday").get(function () {
  const today = new Date();
  const hangoutDate = new Date(this.date);

  return (
    hangoutDate.getDate() === today.getDate() &&
    hangoutDate.getMonth() === today.getMonth() &&
    hangoutDate.getFullYear() === today.getFullYear()
  );
});

hangoutSchema.virtual("isUpcoming").get(function () {
  const now = new Date();
  return this.date > now;
});

const Hangout = mongoose.model("Hangout", hangoutSchema);

// Example cron job to close hangouts when the date has passed
cron.schedule("0 * * * *", async () => {
  const now = new Date();

  try {
    const result = await Hangout.updateMany(
      {
        status: "Open",
        date: { $lt: now },
      },
      { $set: { status: "Closed" } }
    );
  } catch (err) {
    console.error("Error updating hangout statuses:", err);
  }
});
export default Hangout;
