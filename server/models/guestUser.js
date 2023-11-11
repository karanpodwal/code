import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from '../enums/status';

var guestUserModel = new Schema(
    {
        ipAddress: {
            type: String,
        },
        balance: {
            type: Number,
            default: 0
        },
        isChange: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            default: status.ACTIVE,
            enum: [status.ACTIVE, status.BLOCK, status.DELETE]
        }
    },
    { timestamps: true }
);

guestUserModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("guestUser", guestUserModel);