
import userModel from "../../../models/user";
import status from '../../../enums/status';
import userType from "../../../enums/userType";



const userServices = {
    userCheck: async (userId) => {
        let query = { $and: [{ status: { $ne: status.DELETE } }, { $or: [{ email: userId }, { mobileNumber: userId }] }] }
        return await userModel.findOne(query);
    },

    checkUserExists: async (mobileNumber, email) => {
        let query = { $and: [{ status: { $ne: status.DELETE } }, { $or: [{ email: email }, { mobileNumber: mobileNumber }] }] }
        return await userModel.findOne(query);
    },

    emailMobileExist: async (mobileNumber, email, id) => {
        let query = { $and: [{ status: { $ne: status.DELETE } }, { _id: { $ne: id } }, { $or: [{ email: email }, { mobileNumber: mobileNumber }] }] }
        return await userModel.findOne(query);
    },

    checkSocialLogin: async (socialId, socialType) => {
        return await userModel.findOne({ socialId: socialId, socialType: socialType });
    },

    createUser: async (insertObj) => {
        return await userModel.create(insertObj);
    },

    findUser: async (query) => {
        return await userModel.findOne(query).select('-otp');
    },


    findUserData: async (query) => {
        return await userModel.findOne(query);
    },

    deleteUser: async (query) => {
        return await userModel.deleteOne(query);
    },

    userFindList: async (query) => {
        return await userModel.find(query);
    },

    updateUser: async (query, updateObj) => {
        return await userModel.findOneAndUpdate(query, updateObj, { new: true }).select('-otp');
    },

    updateUserById: async (query, updateObj) => {
        return await userModel.findByIdAndUpdate(query, updateObj, { new: true }).select('-otp');
    },

    insertManyUser: async (obj) => {
        return await userModel.insertMany(obj);
    },

    paginateSearch: async (validatedBody) => {
        let query = { status: { $ne: status.DELETE }, userType: { $ne: userType.ADMIN } };
        const { search, fromDate, toDate, page, limit, userType1, status1 } = validatedBody;
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } },
            ]
        }
        if (status1) {
            query.status = status1
        }
        if (userType1) {
            query.userType = userType1
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
        };
        return await userModel.paginate(query, options);
    },




}

module.exports = { userServices };

