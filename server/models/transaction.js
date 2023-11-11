
import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import aggregatePaginate from "mongoose-aggregate-paginate";
import status from '../enums/status';
import transactionType from "../enums/transactionType";
import transactionName from "../enums/transactionName";
import transactionStatus from "../enums/transactionStatus";

var transactionModel = new Schema(
    {
        amount: {
            type: String
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        receipt_url: {
            type: String
        },
        checkout_url: {
            type: String
        },
        status_url: {
            type: String
        },
        qrcode_url: {
            type: String
        },
        payment_address: {
            type: String
        },
        txn_id: {
            type: String
        },
        transferId: {
            type: String
        },
        payoutId: {
            type: String
        },
        quantity: { type: Number },
        amount: { type: String },
        transactionHash: { type: String },
        receipt: Schema.Types.Mixed,
        failedReason:Schema.Types.Mixed,
        isPaypalPayment: { type: Boolean },
        transactionType: {
            type: String,
            enum: [transactionType.DEPOSIT, transactionType.WITHDRAW]
        },
        transactionName: {
            type: String,
            enum: [transactionName.COIN, transactionName.CARD, transactionName.QUIZ_LOSER, transactionName.QUIZ_WINNER, transactionName.SPIN_WINNER, transactionName.SPIN_LOSER,transactionName.SPIN_CHANCE]
        },
        transactionStatus: {
            type: String,
            enum: [transactionStatus.PENDING, transactionStatus.CANCEL, transactionStatus.COMPLETE]
        },
        depositWithdrawUserId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        status: {
            type: String,
            default: status.ACTIVE,
            enum: [status.ACTIVE, status.BLOCK, status.DELETE]
        },
    },
    { timestamps: true }
);

transactionModel.plugin(mongoosePaginate);
transactionModel.plugin(aggregatePaginate);
module.exports = Mongoose.model("transaction", transactionModel);