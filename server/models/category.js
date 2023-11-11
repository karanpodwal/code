import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import userType from "../enums/userType";
import status from '../enums/status';
import bcrypt from 'bcryptjs';

var categoryModel = new Schema(
    {
        categoryName: {
            type: String
        },
        boxNumber: {
            type: Number
        },
        price: {
            type: Number
        },
        description: {
            type: String
        },
        status: {
            type: String,
            default: status.ACTIVE,
            enum: [status.ACTIVE, status.BLOCK, status.DELETE]
        },
    },
    { timestamps: true }
);

categoryModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("category", categoryModel);
// Mongoose.model("category", categoryModel).find({ status: "ACTIVE" }, (err, result) => {
//     if (err) {
//         console.log("Default find category error", err);
//     } else if (result.length != 0) {
//         console.log("Default category created");
//     }
//     else {
//         let data = [
//             {
//                 categoryName: "Drama",
//                 boxNumber: "9",
//                 price: 3,
//                 description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget"
//             },
//             {
//                 categoryName: "Comedy",
//                 boxNumber: "14",
//                 price: 1,
//                 description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget"
//             },
//             {
//                 categoryName: "Love Actually",
//                 boxNumber: "8",
//                 price: 5,
//                 description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget"
//             },
//             {
//                 categoryName: "Action",
//                 boxNumber: "9",
//                 price: 3,
//                 description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget"
//             },
//             {
//                 categoryName: "Sci-Fi",
//                 boxNumber: "6",
//                 price: 8,
//                 description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget"
//             },
//             {
//                 categoryName: "Horror",
//                 boxNumber: "8",
//                 price: 5,
//                 description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget"
//             },
//         ]
//         Mongoose.model("category", categoryModel).insertMany(data, (categoryErr, categoryResult) => {
//             if (categoryErr) {
//                 console.log("Catagory error.", categoryErr);
//             }
//             else {
//                 console.log("Category created successfully.", categoryResult)
//             }
//         })
//     }
// })

