import transactionModel from "../../../models/transaction";
import status from "../../../enums/status";


const transactionServices = {

    createTransaction: async (insertObj) => {
        return await transactionModel.create(insertObj);
    },

    findTransaction: async (query) => {
        return await transactionModel.findOne(query);
    },

    updateTransaction: async (query, updateObj) => {
        return await transactionModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    transactionList: async (query) => {
        return await transactionModel.find(query);
    },

    transactionPaginateSearch: async (validatedBody) => {
        const { fromDate, toDate, page, limit, transactionType, userId } = validatedBody;
        let query = { status: { $ne: status.DELETE }, userId: userId };
        if (transactionType) {
            query.transactionType = transactionType
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
            populate: ('userId depositWithdrawUserId')
        };
        return await transactionModel.paginate(query, options);
    },

    aggregateSearchtransaction: async (body) => {
        const { search, page, limit, fromDate, toDate, transactionStatus } = body;
        if (search) {
            var filter = search.trim();
        }
        let data = filter || ""
        let searchData = [
            {
                $lookup: {
                    from: "users",
                    localField: 'userId',
                    foreignField: '_id',
                    as: "userDetails",
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: 'depositWithdrawUserId',
                    foreignField: '_id',
                    as: "depositWithdrawUserDetails",
                }
            },
            {
                $unwind: {
                    path: "$userDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$depositWithdrawUserDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    $or: [
                        {
                            "$expr": {
                                "$regexMatch": {
                                    "input": { "$concat": ["$userDetails.firstName", " ", "$userDetails.lastName"] },
                                    "regex": data,
                                    "options": "i"
                                }
                            }
                        },
                        { "userDetails.email": { $regex: data, $options: "i" } }
                    ]
                }
            },
            {
                $match: { "status": status.ACTIVE },
            },
            { $sort: { createdAt: -1 } }
        ]
        if (transactionStatus) {
            searchData.push({
                $match: { "transactionStatus": transactionStatus }
            })
        }

        if (fromDate && !toDate) {
            searchData.push({
                "$match": {
                    "$expr": { "$gte": ["$createdAt", new Date(fromDate)] }
                }
            })
        }
        if (!fromDate && toDate) {
            searchData.push({
                "$match": {
                    "$expr": { "$lte": ["$createdAt", new Date(toDate)] }
                }
            })
        }
        if (fromDate && toDate) {
            searchData.push({
                "$match": {
                    "$expr": { "$and": [{ "$lte": ["$createdAt", new Date(toDate)] }, { "$gte": ["$createdAt", new Date(fromDate)] }] }
                }
            })
        }

        let aggregate = transactionModel.aggregate(searchData)
        let options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 10,
            sort: { createdAt: -1 },
        };
        return await transactionModel.aggregatePaginate(aggregate, options)
    },

}

module.exports = { transactionServices };