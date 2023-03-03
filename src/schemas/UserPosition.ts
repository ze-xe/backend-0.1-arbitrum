import mongoose from "mongoose";

const UserPositionSchema = new mongoose.Schema({

    id: { type: String, required: true },
    chainId: { type: String, required: true },
    position:{type: Object}

},
    { timestamps: true }
);


export default UserPositionSchema;