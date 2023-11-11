import chipModel from "../../../models/chip";


const chipServices = {

    createChip: async (insertObj) => {
        return await chipModel.create(insertObj);
    },

    findChip: async (query) => {
        return await chipModel.findOne(query);
    },

    updateChip: async (query, updateObj) => {
        return await chipModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    chipList: async (query) => {
        return await chipModel.find(query);
    },


}

module.exports = { chipServices };