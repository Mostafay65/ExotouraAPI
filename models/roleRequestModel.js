import mongoose from "mongoose";
import requestStatus from "../helpers/requestStatus.js";
import roles from "../helpers/roles.js";
import axios from "axios";

const roleRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roleType: {
    type: String,
    enum: Object.values(roles),
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
});

// Run verification after saving the document
roleRequestSchema.post("save", async function () {
  try {
    
    const { data } = await axios.post("http://127.0.0.1:8000/verify", {
      id_url: this.idCard,
      ref_url: this.userPicture,
    });
    console.log("Face verification response:", data);

    if (data.match) {
      await mongoose.model("role Request").findByIdAndUpdate(this._id, {
        matched: true,
      });
    }
  } catch (error) {
    console.error("Face verification failed:", error.message);
  }
});

const roleRequestModel = mongoose.model("role Request", roleRequestSchema);
export default roleRequestModel;
