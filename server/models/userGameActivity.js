import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import status from '../enums/status';
import userType from "../enums/userType";
import gameType from "../enums/gameType";
import quizType from "../enums/quizType";
import finalResult from "../enums/finalResult";

var userGameActivityModel = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'user' },
        userType: {
            type: String,
            enum: [userType.ADMIN, userType.USER],
        },
        gameType: {
            type: String,
            enum: [gameType.QUIZ, gameType.SPIN],
        },
        quizType: {
            type: String,
            enum: [quizType.LIVE, quizType.NON_LIVE],
        },
        result: {
            type: String,
            enum: [finalResult.WIN, finalResult.LOSE,finalResult.TRY],
        },
        browserName: { type: String },
        ipAddress: { type: String },
        country: { type: String },
        status: {
            type: String,
            enum: [status.ACTIVE, status.BLOCK, status.DELETE],
            default: status.ACTIVE
        },
    },
    { timestamps: true }
);

userGameActivityModel.plugin(mongoosePaginate);
userGameActivityModel.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("userGameActivity", userGameActivityModel);