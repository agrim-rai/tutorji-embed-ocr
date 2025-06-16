import mongoose from "mongoose";

const adaAndImageSchema = new mongoose.Schema({
    ada: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const adaAndImage = mongoose.models.adaAndImage || mongoose.model("adaAndImage", adaAndImageSchema);

export default adaAndImage;