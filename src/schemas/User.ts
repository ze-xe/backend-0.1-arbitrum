import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({

    id: { type: String, required: true },
    token: { type: String, required: true },
    inOrderBalance: { type: String, default: '0' },
    chainId: { type: String, required: true }

},
    { timestamps: true }
);


export default UserSchema;
