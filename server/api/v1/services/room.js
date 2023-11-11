import roomModel from "../../../models/room";


const roomServices = {

    createRoom: async (insertObj) => {
        return await roomModel.create(insertObj);
    },

    findRoom: async (query) => {
        return await roomModel.findOne(query);
    },

    updateRoom: async (query, updateObj) => {
        return await roomModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    roomList: async (query) => {
        return await roomModel.find(query);
    },


}

module.exports = { roomServices };