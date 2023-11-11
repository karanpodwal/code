
import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from '../enums/status';

var quizQuestionModel = new Schema(
    {
        question: {
            type: String
        },
        optionA: {
            type: String
        },
        optionB: {
            type: String
        },
        optionC: {
            type: String
        },
        optionD: {
            type: String
        },
        url: {
            type: String
        },
        mediaType: {
            type: String,
            enum: ["mp3", "video"]
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'category'
        },
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'room'
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        quizType: {
            type: String,
            enum: ["PAID", "FREE"]
        },
        quizStatus: {
            type: String,
            enum: ["LIVE", "NON-LIVE"]
        },
        description: {
            type: String
        },
        title: {
            type: String
        },
        expiryTime : {
            type: Number,
            default: 8
        },
        isActive: {
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

quizQuestionModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("quizQuestion", quizQuestionModel);