import quizAnswerModel from "../../../models/quizAnswer";


const quizAnswerServices = {

    createQuizAnswer: async (insertObj) => {
        return await quizAnswerModel.create(insertObj);
    },

    findQuizAnswer: async (query) => {
        return await quizAnswerModel.findOne(query);
    },

    updateQuizAnswer: async (query, updateObj) => {
        return await quizAnswerModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    quizAnswerList: async (query) => {
        return await quizAnswerModel.find(query);
    },


}

module.exports = { quizAnswerServices };