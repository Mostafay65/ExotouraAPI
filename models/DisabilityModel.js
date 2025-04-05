import mongoose from "mongoose";

const disabilitySchema = new mongoose.Schema({
  name: { type: String, require: true },
  description: { type: String, require: true },
  assistive_tools: [
    {
      name: { type: String, require: true },
      description: { type: String, require: true },
    },
  ],
  interaction_guidelines: { type: [String], require: true },
});

const Disability = new mongoose.model("Disability", disabilitySchema);

export default Disability;
