import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const mongoose = require("mongoose");


const depositSchema = new mongoose.Schema({
  userId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionId: {
    type: String,
  },
  // payerId:{
  //   type: String,
  // },
  type: {
    type: String,
    enum: ['Credit', 'Debit'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'], // Customize as needed
    default: 'Pending',
  },
  chips: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chip', 
  },
});






depositSchema.plugin(mongoosePaginate);
depositSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("Deposit", depositSchema);