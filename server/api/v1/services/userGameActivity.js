import userGameActivityModel from "../../../models/userGameActivity";
import status from "../../../enums/status";


const userGameActivityServices = {

    createUserGameActivity: async (insertObj) => {
        return await userGameActivityModel.create(insertObj);
    },

    findUserGameActivity: async (query) => {
        return await userGameActivityModel.findOne(query);
    },

    updateUserGameActivity: async (query, updateObj) => {
        return await userGameActivityModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    userGameActivityList: async (query) => {
        return await userGameActivityModel.find(query);
    },
    userGameActivitySearch: async (validatedBody) => {
        const { fromDate, toDate, page, limit, gameType, userId } = validatedBody;
        let query = { status: { $ne: status.DELETE }, userId: userId };
        if (gameType) {
            query.gameType = gameType
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
            populate: ('userId')
        };
        return await userGameActivityModel.paginate(query, options);
    },

}

module.exports = { userGameActivityServices };