import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import status from '../enums/status';

const options = {
    collection: "chip",
    timestamps: true
};

const schemaDefination = new Schema(
    {
        currency: { type: String, default: "USD" },
        userId: {
            type: Mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        chipQuantity: { type: Number, default: 1 },
        amountInUSD: { type: Number, default: 1 },
        status: { type: String, default: status.ACTIVE }
    },
    options
);

schemaDefination.plugin(mongoosePaginate);
schemaDefination.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("chip", schemaDefination);

// (async () => {
//     let result = await Mongoose.model("chip", schemaDefination).find({});
//     if (result.length != 0) {
//         console.log("Default chip already created.");
//     }
//     else {
//         var obj1 = {
//             currency:"USD",
//             chipQuantity: 1,
//             amountInUSD: 1
//         };

//     let staticResult = await Mongoose.model("chip", schemaDefination).create(obj1 );
//     if (staticResult) {
//         console.log("DEFAULT chip Created.", staticResult)
//     }
// }

// }).call();



