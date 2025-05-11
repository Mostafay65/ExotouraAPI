import mongoose from "mongoose";
import requestStatus from "../helpers/requestStatus.js";
import axios from "axios";
import EventEmitter from "events";

const eventEmitter = new EventEmitter();

const lecturerRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  matched: {
    type: Boolean,
    default: false,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
});

// Define the event listener for face verification
eventEmitter.on("verifyFace", async (lecturerRequest) => {
  try {
    const { data } = await axios.post("http://127.0.0.1:8000/verify", {
      id_url: lecturerRequest.idCard,
      ref_url: lecturerRequest.userPicture,
    });
    console.log("Face verification response:", data);

    if (data.match) {
      await mongoose.model("lecturer Request").findByIdAndUpdate(lecturerRequest._id, {
        matched: true,
      });
    }
  } catch (error) {
    console.error("Face verification failed:", error.message);
  }
});

// Modify the post-save hook to emit the event
lecturerRequestSchema.post("save", function () {
  eventEmitter.emit("verifyFace", this);
});

const lecturerRequestModel = mongoose.model("lecturer Request", lecturerRequestSchema);
export default lecturerRequestModel;
