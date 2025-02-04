import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.CONNECTION_STRING);
        console.log(`MongoDB Connected Successfully`);
    } catch (error) {
        console.error(`Error in Database Connection: ${error.message}`);
    }
};
export default connectDB;
