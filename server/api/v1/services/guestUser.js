import guestUserModel from "../../../models/guestUser";


const guestUserServices = {

    createGuestUser: async (insertObj) => {
        return await guestUserModel.create(insertObj);
    },

    findGuestUser: async (query) => {
        return await guestUserModel.findOne(query);
    },

}

module.exports = { guestUserServices };