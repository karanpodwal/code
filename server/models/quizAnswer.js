import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from '../enums/status';

var quizAnswerModel = new Schema(
    {
        quizQuestionId: {
            type: Schema.Types.ObjectId,
            ref: 'quizQuestion'
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'category'
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        quizAnswer:{
            type: String
        },
        status: {
            type: String,
            default: status.ACTIVE,
            enum: [status.ACTIVE, status.BLOCK, status.DELETE]
        }
    },
    { timestamps: true }
);

quizAnswerModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("quizAnswer", quizAnswerModel);