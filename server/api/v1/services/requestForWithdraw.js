import requestForWithdraw from "../../../models/requestForWithdraw";
import status from "../../../enums/status";


const requestForWithdrawServices = {

    createRequestForWithdraw: async (insertObj) => {
        return await requestForWithdraw.create(insertObj);
    },

    findRequestForWithdraw: async (query) => {
        return await requestForWithdraw.findOne(query);
    },

    updateRequestForWithdraw: async (query, updateObj) => {
        return await requestForWithdraw.findOneAndUpdate(query, updateObj, { new: true });
    },

    requestForWithdrawList: async (query) => {
        return await requestForWithdraw.find(query);
    },

    requestWithdrawAccountPagination: async (validatedBody) => {
        const { fromDate, toDate, page, limit,requestStatus } = validatedBody;
        let query = { status: { $ne: status.DELETE } };
        if(requestStatus){
            query.requestStatus=requestStatus
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
        return await requestForWithdraw.paginate(query, options);
    },


}

module.exports = { requestForWithdrawServices };