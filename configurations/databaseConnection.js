import mongoose from "mongoose";

const connectDB = async () => {
  const DB = process.env.CONNECTION_STRING;
  await mongoose.connect(DB);
};

export default connectDB;
