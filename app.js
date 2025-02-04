import "dotenv/config";
import express from "express";

import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log("database connected", process.env.CONNECTION_STRING);

let app = express();
app.use(express.json());

app.use("/uploads", express.static(join(__dirname, "Uploads")));

app.all("*", async (req, res, next) => {
    res.status(404).json({
        status: httpStatusText.ERROR,
        message: "Routing not found",
    });
});

app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({
        status: error.statusCodeText || httpStatusText.ERROR,
        message: error.message,
        data: null,
    });
});

app.listen(process.env.PORT, "Localhost", () => {
    console.log("listening on port", process.env.PORT);
});
