import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import userType from "../enums/userType";
import status from '../enums/status';
import bcrypt from 'bcryptjs';

var userModel = new Schema(

  {
    email: {
      type: String
    },
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    countryCode: {
      type: String
    },
    mobileNumber: {
      type: String
    },
    password: {
      type: String
    },
    dateOfBirth: {
      type: String
    },
    otp: {
      type: String
    },
    otpVerified: {
      type: Boolean,
      default: false
    },
    userType: {
      type: String,
      default: userType.USER
    },
    status: {
      type: String,
      default: status.ACTIVE
    },
    address: {
      type: String
    },
    location: {
      type: {
        type: String,
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    otpExpireTime: {
      type: Number
    },
    profilePic: {
      type: String
    },
    isChange: {
      type: Boolean,
      default: false
    },
    balance: {
      type: Number,
      default: 0
    },
    coinBalance: {
      type: Number,
      default: 0
    },
    ipAddress: {
      type: String
    },
    customerId: {
      type: String
    },
  },
  { timestamps: true }
);
userModel.index({ location: "2dsphere" })
userModel.plugin(mongooseAggregatePaginate)
userModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("user", userModel);

Mongoose.model("user", userModel).find({ userType: userType.ADMIN }, async (err, result) => {
  if (err) {
    console.log("DEFAULT ADMIN ERROR", err);
  }
  else if (result.length != 0) {
    console.log("Default Admin.");
  }
  else {

    let obj = {
      userType: userType.ADMIN,
      firstName: "Neal",
      lastName: "Dev",
      countryCode: "+91",
      mobileNumber: "556688698",
      email: "info@addressable.tv",
      dateOfBirth: "24/04/1996",
      password: bcrypt.hashSync("Mobiloitte@1"),
      address: "Delhi, India",
      otpVerified:true,
      profilePic: "https://res.cloudinary.com/mobiloitte-testing1/image/upload/v1639781336/q1spiih52uq9oh2wsop4.png",
    };
    Mongoose.model("user", userModel).create(obj, async (err1, result1) => {
      if (err1) {
        console.log("Default admin  creation error", err1);
      } else {
        console.log("Default admin created", result1);
      }
    });
  }
});