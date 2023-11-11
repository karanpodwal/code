import categoryModel from "../../../models/category";


const categoryServices = {

    createCatagory: async (insertObj) => {
        return await categoryModel.create(insertObj);
    },

    findCatagory: async (query) => {
        return await categoryModel.findOne(query);
    },

    updateCatagory: async (query, updateObj) => {
        return await categoryModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    categoryList: async (query) => {
        return await categoryModel.find(query);
    },


}

module.exports = { categoryServices };