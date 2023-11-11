import Mongoose, { Schema } from "mongoose";
import status from '../enums/status';
import quizQuestion from "../models/quizQuestion"
import quizAnswer from "../models/quizAnswer"

const roomModel = new Schema(
    {
        fromTime: {
            type: String
        },
        toTime: {
            type: String
        },
        name: {
            type: String
        },
        islive: {
            type: Boolean,
            default: false
        },
        index: { type: String },
        // joinUser: [
        //     {
        //         userId:{
        //             type: Schema.Types.ObjectId,
        //             ref: 'user'
        //         },
        //         categoryId:{
        //             type: Schema.Types.ObjectId,
        //             ref: 'category'
        //         },
        //         amount:{
        //             type:Number
        //         }
        //     }
        // ],
        status: {
            type: String,
            default: status.ACTIVE
        }
    },
    { timestamps: true }
);

module.exports = Mongoose.model("room", roomModel)
const staticFunction = async () => {
    try {
        let findRes = await Mongoose.model("room", roomModel).find({ status: "ACTIVE" })
        if (findRes.length != 0) {
            console.log("Default room created");
        } else {
            let data = [
                {
                    fromTime: "00:00:00",
                    toTime: "00:05:00",
                    name: "Morning",
                    // joinUser: [],
                    islive: false,
                    index: 1
                },
                {
                    fromTime: "11:00:00",
                    toTime: "11:05:00",
                    name: "Evening",
                    // joinUser: [],
                    islive: false,
                    index: 2
                },
                {
                    fromTime: "20:00:00",
                    toTime: "20:05:00",
                    name: "Night",
                    // joinUser: [],
                    islive: false,
                    index: 3
                }
            ]
            let roomCreate = await Mongoose.model("room", roomModel).insertMany(data)
            let questionData=[
                {
                    question:"Who plays the role of Lieutenant Weinberg in the movie, 'A Few Good Men'?",
                    optionA:"Kiefer Sutherland",
                    optionB:"Tom Cruise",
                    optionC:"Demi Moore",
                    optionD:"Kevin Pollack",
                    quizAnswer:"d",
                    url:"https://www.youtube.com/embed/9FnO3igOkOk?start=1&end=129",
                    mediaType:"video",
                    quizType:"FREE",
                    description:"description",
                    quizStatus:'NON-LIVE'
                }
            ]
            for (let i = 0; i < roomCreate.length; i++) {
                let obje={
                    question:"Who plays the role of Lieutenant Weinberg in the movie, 'A Few Good Men'?",
                    optionA:"Kiefer Sutherland",
                    optionB:"Tom Cruise",
                    optionC:"Demi Moore",
                    optionD:"Kevin Pollack",
                    quizAnswer:"d",
                    url:"https://www.youtube.com/embed/9FnO3igOkOk?start=1&end=129",
                    mediaType:"video",
                    quizType:"PAID",
                    roomId:roomCreate[i]._id,
                    description:"description",
                    quizStatus:'LIVE'
                }
                let obje1={
                    question:"Who plays the role of Lieutenant Weinberg in the movie, 'A Few Good Men'?",
                    optionA:"Kiefer Sutherland",
                    optionB:"Tom Cruise",
                    optionC:"Demi Moore",
                    optionD:"Kevin Pollack",
                    quizAnswer:"d",
                    url:"https://www.youtube.com/embed/9FnO3igOkOk?start=1&end=129",
                    mediaType:"video",
                    quizType:"FREE",
                    roomId:roomCreate[i]._id,
                    description:"description",
                    quizStatus:'LIVE'
                }
                questionData.push(obje,obje1)
            }

            for(let j=0;j<questionData.length;j++){
                let createQuestionRes=await quizQuestion.create(questionData[j])
                let answerObj={
                    quizQuestionId:createQuestionRes._id,
                    quizAnswer:questionData[j].quizAnswer
                }
                let createAnswerRes=await quizAnswer.create(answerObj)
            }
            console.log("Create room and quiz successfully.")

        }

    } catch (error) {
        console.log("staticFunction 89 ===>>>>> ", error)
    }

}
// staticFunction()