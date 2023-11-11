import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from '../enums/status';
import requestStatus from '../enums/requestStatus'

var requestForWithdraw = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        firstHolderName: {
            type: String
        },
        secondHolderName: {
            type: String
        },
        email: {
            type: String
        },
        countryCode: {
            type: String
        },
        MobileNumber: {
            type: String
        },
        dateOfBirth: {
            type: String
        },
        addressLine1: {
            type: String
        },
        addressLine2: {
            type: String
        },
        city: {
            type: String
        },
        state: {
            type: String
        },
        postal_code: {
            type: String
        },
        SSN: {
            type: String
        },
        bankName: {
            type: String
        },
        accountType: {
            type: String
        },
        accountNumber: {
            type: String
        },
        routingNumber: {
            type: String
        },
        identityDocument: {
            type: String
        },
        accountId: {
            type: String
        },
        reason: {
            type: String
        },
        requestStatus:{
            type: String,
            default: requestStatus.PENDING,
            enum: [requestStatus.PENDING, requestStatus.APPROVE, requestStatus.REJECT]
        },
        status: {
            type: String,
            default: status.ACTIVE,
            enum: [status.ACTIVE, status.BLOCK, status.DELETE]
        }
    },
    { timestamps: true }
);

requestForWithdraw.plugin(mongoosePaginate);
module.exports = Mongoose.model("requestForWithdraw", requestForWithdraw);