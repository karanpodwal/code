import config from "config";
import Joi from "joi";
import jwt from 'jsonwebtoken';
import userModel from "../models/user"

import Sender from 'aws-sms-send';
var aws_topic = 'arn:aws:sns:us-east-1:729366371820:coinbaazar';
var config2 = {
  AWS: {
    accessKeyId: config.get('AWS.accessKeyId'),
    secretAccessKey: config.get('AWS.secretAccessKey'),
    region: config.get('AWS.region')
  },
  topicArn: aws_topic,
};
var sender = new Sender(config2);

import nodemailer from 'nodemailer';
import cloudinary from 'cloudinary';
import status from "../enums/status"
import userType from "../enums/userType"
cloudinary.config({
  cloud_name: config.get('cloudinary.cloud_name'),
  api_key: config.get('cloudinary.api_key'),
  api_secret: config.get('cloudinary.api_secret')
});

import qrcode from 'qrcode';

import useragent from 'useragent'
import geoip from 'geoip-lite'
const myIPAddress = require('what-is-my-ip-address')
import axios from 'axios'

module.exports = {


  getOTP() {
    var otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
  },


  sendSms: (number, otp) => {
    sender.sendSms(`Your otp is ${otp}`, config.get('AWS.smsSecret'), false, number)
      .then(function (response) {
        return response;
      })
      .catch(function (err) {
        return err;
      })

  },


  getToken: async (payload) => {
    var token = await jwt.sign(payload, config.get('jwtsecret'), { expiresIn: "24h" })
    return token;
  },


  sendPushMail: async (email, subject, body) => {
    var transporter = nodemailer.createTransport({
      service: config.get('nodemailer.service'),
      auth: {
        "user": config.get('nodemailer.email'),
        "pass": config.get('nodemailer.password')

      },

    });
    var mailOptions = {
      from: "<do_not_reply@gmail.com>",
      to: email,
      subject: subject,
      text: body
    };
    return await transporter.sendMail(mailOptions)
  },

  sendMailNotification: async (to, name, message) => {
    let html = `<div style="font-size:15px">
                <p>Hello ${name},</p>
                <p>"${message}>
                
                </a>

                </p> 
                <p>
                    Thanks<br>
                </p>
            </div>`

    var transporter = nodemailer.createTransport({
      service: config.get('nodemailer.service'),
      auth: {
        "user": config.get('nodemailer.email'),
        "pass": config.get('nodemailer.password')

      },

    });
    var mailOptions = {
      from: "<mailto:do_not_reply@gmail.com>",
      to: to,
      subject: 'Notification',
      html: html
    };
    return await transporter.sendMail(mailOptions)
  },

  sendMail: async (to, name, link) => {
    let html = `<div style="font-size:15px">
                <p>Hello ${name},</p>
                <p>Please click on the following link <a href="${config.get('hostAddress')}${link}">
                  Set a new password now
                </a>
                    If you did not request this, please ignore this email and your password will remain unchanged.
                </p> 
                <p>
                    Thanks<br>
                </p>
            </div>`

    var transporter = nodemailer.createTransport({
      service: config.get('nodemailer.service'),
      auth: {
        "user": config.get('nodemailer.email'),
        "pass": config.get('nodemailer.password')

      },

    });
    var mailOptions = {
      from: "<do_not_reply@gmail.com>",
      to: to,
      subject: 'Reset Link',
      html: html
    };
    return await transporter.sendMail(mailOptions)
  },



  getImageUrl: async (files) => {
    var result = await cloudinary.v2.uploader.upload(files[0].path, { resource_type: "auto" })
    return result.secure_url;
  },

  genBase64: async (data) => {
    return await qrcode.toDataURL(data);
  },

  getSecureUrl: async (base64) => {
    var result = await cloudinary.v2.uploader.upload(base64);
    return result.secure_url;

  },
  sendEmailOtp: async (email, otp) => {
    var sub = `Use the One Time Password(OTP) ${otp} to verify your accoount.`
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        "user": config.get('nodemailer.email'),
        "pass": config.get('nodemailer.password')

      }
    });
    var mailOptions = {
      from: config.get('nodemailer.email'),
      to: email,
      subject: 'Otp for verication',
      text: sub,
      // html: html
    };
    return await transporter.sendMail(mailOptions)
  },


  sendSmsTwilio: async (mobileNumber, otp) => {
    var result = await client.messages.create({
      body: `Your OTP is ${otp}`,
      to: mobileNumber,
      from: config.get('twilio.number')

    })
    console.log("136", result)
    return result;
  },


  uploadImage(image) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(image, function (error, result) {
        console.log(result);
        if (error) {
          reject(error);
        }
        else {
          resolve(result.url)
        }
      });
    })
  },

  activityLogFunction: async (req, idAddress) => {
    const userAgent = useragent.parse(req.headers['user-agent']);
    let ip = await myIPAddress.v4()
    var config = {
      method: 'get',
      url: `https://ipinfo.io/${idAddress}/json?token=f7d685d5f4c6d0`,
      headers: {}
    };
    let resultRes = await axios(config)
    const location = geoip.lookup(idAddress);
    const country = location ? location.country : 'Unknown';
    let obj = {
      browserName: userAgent.family,
      ipAddress: idAddress,
      country: resultRes.data.country
    }
    console.log("====================================", obj)
    return obj
  }
}
