import quizQuestionModel from "../../../models/quizQuestion";
import status from "../../../enums/status";


const quizQuestionServices = {

    createQuizQuestion: async (insertObj) => {
        return await quizQuestionModel.create(insertObj);
    },

    findQuizQuestion: async (query) => {
        return await quizQuestionModel.findOne(query);
    },

    updateQuizQuestion: async (query, updateObj) => {
        return await quizQuestionModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    multiUpdateStatus: async (query, updateObj) => {
        return await quizQuestionModel.updateMany(query, updateObj, { multi: true });
    },

    quizQuestionList: async (query) => {
        return await quizQuestionModel.find(query);
    },

    quizQuestionPaginateSearch: async (validatedBody) => {
        let query = { status: { $ne: status.DELETE } };
        const { search, fromDate, toDate, page, limit,quizType,quizStatus, isActive} = validatedBody;
        if (search) {
            query.$or = [
                { question: { $regex: search, $options: 'i' } },
            ]
        }
        if(quizStatus){
            query.quizStatus=quizStatus  
        }
        if(isActive){
            query.isActive = isActive
        }
        if(quizType){
            query.quizType=quizType  
        }
        if (fromDate && !toDate) {
            query.createdAt = { $gte: new Date(new Date(fromDate).toISOString().slice(0, 10)) };

        }
        if (!fromDate && toDate) {
            query.createdAt = { $lte: new Date(new Date(toDate).toISOString().slice(0, 10) + 'T23:59:59.999Z') };

        }
        if (fromDate && toDate) {
            query.$and = [
                { createdAt: { $gte: new Date(new Date(fromDate).toISOString().slice(0, 10)) } },
                { createdAt: { $lte: new Date(new Date(toDate).toISOString().slice(0, 10) + 'T23:59:59.999Z') } },
            ]
        }
        let options = {
            page: Number(page) || 1,
            limit: Number(limit) || 15,
            sort: { createdAt: -1 },
            populate:('userId categoryId roomId')
        };
        return await quizQuestionModel.paginate(query, options);
    },


}

module.exports = { quizQuestionServices };