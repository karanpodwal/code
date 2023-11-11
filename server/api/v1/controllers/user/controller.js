import Joi from "joi";
import Mongoose, { Promise } from "mongoose";
import _ from "lodash";
import config from "config";
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response';
import bcrypt from 'bcryptjs';
import responseMessage from '../../../../../assets/responseMessage';
import userModel from '../../../../models/user';
import commonFunction from '../../../../helper/util';
import jwt from 'jsonwebtoken';
import status, { ACTIVE } from '../../../../enums/status';
import userType from "../../../../enums/userType";
import transactionType from "../../../../enums/transactionType";
import { userServices } from "../../services/user"
const { userCheck, checkUserExists, emailMobileExist, createUser, findUser, findUserData, userFindList, updateUser, updateUserById, paginateSearch } = userServices
import { transactionServices } from '../../services/transaction'
const { createTransaction, findTransaction, updateTransaction, transactionList, transactionPaginateSearch } = transactionServices
import { categoryServices } from "../../services/category"
const { findCatagory, categoryList } = categoryServices;
import stripeFunction from '../../../../helper/stripe';
const { createToken, createCustomer, createCharge, retrieveToken, paymentIntent, createbankAccount, createPayout, verifyBankAccount, customerSource, productCreate, priceCreate, checkOutsessioncreate, createCustomerUsingEmailAndName, getStripeBalance, accountCreate, updateAccount, externalAccount, transfers, getPayoutInformation } = stripeFunction;
import transactionName from '../../../../enums/transactionName'
const axios = require('axios');
const CryptoJS = require('crypto-js');
import Coinpayments from 'coinpayments';
import crypto from 'crypto';
import transactionStatus from "../../../../enums/transactionStatus";
import { userGameActivityServices } from "../../services/userGameActivity";
const { createUserGameActivity } = userGameActivityServices;
import gameType from "../../../../enums/gameType";
import finalResult from "../../../../enums/finalResult";
import { chipServices } from "../../services/chip";
const { findChip, updateChip, chipList } = chipServices;
import { guestUserServices } from '../../services/guestUser';
const { createGuestUser, findGuestUser } = guestUserServices;
const stripeScrecteKey = config.get('stripe_secret_key');
var stripe = require('stripe')(stripeScrecteKey);
import { requestForWithdrawServices } from '../../services/requestForWithdraw'
const { createRequestForWithdraw, findRequestForWithdraw, updateRequestForWithdraw, requestForWithdrawList } = requestForWithdrawServices

import requestStatus from '../../../../enums/requestStatus'

export class userController {

    /**
    * @swagger
    * /user/signup:
    *   post:
    *     tags:
    *       - USER
    *     description: signup
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: signup
    *         description: signup
    *         in: body
    *         required: true
    *         schema:
    *           $ref: '#/definitions/signup'
    *     responses:
    *       200:
    *         description: Returns success message
    */
    async signup(req, res, next) {
        const validationSchema = {
            email: Joi.string().required(),
            mobileNumber: Joi.string().required(),
            firstName: Joi.string().optional(),
            lastName: Joi.string().optional(),
            countryCode: Joi.string().required(),
            password: Joi.string().allow('').optional(),
            address: Joi.string().allow('').optional(),
            dateOfBirth: Joi.string().allow('').optional(),
            profilePic: Joi.string().allow('').optional(),
        };
        try {
            if (req.body.email) {
                req.body.email = (req.body.email).toLowerCase();
            }

            const validatedBody = await Joi.validate(req.body, validationSchema);
            const { mobileNumber, email, countryCode } = validatedBody;
            var userInfo = await checkUserExists(mobileNumber, email);
            if (userInfo) {
                if (userInfo.otpVerified == true) {
                    if (userInfo.email == email) {
                        if (userInfo.status === status.BLOCK) {
                            throw apiError.conflict(responseMessage.BLOCK_USER_EMAIL_BY_ADMIN);
                        } else {
                            throw apiError.conflict(responseMessage.EMAIL_EXIST);
                        }
                    }
                    if (userInfo.mobileNumber === mobileNumber && mobileNumber !== undefined && mobileNumber !== '') {
                        if (userInfo.status === status.BLOCK) {
                            throw apiError.conflict(responseMessage.BLOCK_USER_MOBILE_BY_ADMIN);
                        } else {
                            throw apiError.conflict(responseMessage.MOBILE_EXIST);
                        }
                    }
                }
            }
            validatedBody.password = bcrypt.hashSync(validatedBody.password)
            validatedBody.otp = commonFunction.getOTP();
            validatedBody.otpExpireTime = new Date().getTime() + 300000;
            validatedBody.userType = userType.USER
            // if (validatedBody.profilePic && validatedBody.profilePic !== '') {
            //     validatedBody.profilePic = await commonFunction.getSecureUrl(validatedBody.profilePic);
            // }
            if (email) {
                await commonFunction.sendEmailOtp(email, validatedBody.otp);
            }
            // if (mobileNumber) {
            //     let number = `${countryCode}${email}`
            //     commonFunction.sendSms(number, validatedBody.otp);
            // }
            if (userInfo) {
                var result = await updateUser({ _id: userInfo._id }, validatedBody)
                return res.json(new response(result, responseMessage.USER_CREATED));
            }
            var result = await createUser(validatedBody)
            result = _.omit(JSON.parse(JSON.stringify(result)), 'otp')
            return res.json(new response(result, responseMessage.USER_CREATED));
        } catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/verifyOTP:
     *   patch:
     *     tags:
     *       - USER
     *     description: verifyOTP
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: verifyOTP
     *         description: verifyOTP
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/verifyOTP'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async verifyOTP(req, res, next) {
        var validationSchema = {
            email: Joi.string().required(),
            otp: Joi.string().required()
        };
        try {
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email, otp } = validatedBody;
            var userResult = await findUserData({ $and: [{ status: { $ne: status.DELETE } }, { $or: [{ mobileNumber: email }, { email: email }] }] });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            };
            if (new Date().getTime() > userResult.otpExpireTime) {
                throw apiError.badRequest(responseMessage.OTP_EXPIRED);
            };
            if (userResult.otp != otp) {
                throw apiError.badRequest(responseMessage.INCORRECT_OTP);
            };
            var updateResult = await updateUser({ _id: userResult._id }, { otpVerified: true });
            var token = await commonFunction.getToken({ _id: updateResult._id, email: updateResult.email, mobileNumber: updateResult.mobileNumber, userType: updateResult.userType });
            var obj = {
                _id: updateResult._id,
                name: updateResult.name,
                email: updateResult.email,
                countryCode: updateResult.countryCode,
                mobileNumber: updateResult.mobileNumber,
                otpVerified: true,
                token: token
            };
            return res.json(new response(obj, responseMessage.OTP_VERIFY));
        }
        catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/getProfile:
     *   get:
     *     tags:
     *       - USER
     *     description: get his own profile details with getProfile API
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: ipAddress
     *         description: ipAddress
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async getProfile(req, res, next) {
        try {
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            await updateUser({ _id: userResult._id }, { ipAddress: req.query.ipAddress })
            return res.json(new response(userResult, responseMessage.USER_DETAILS));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/login:
     *   post:
     *     tags:
     *       - USER
     *     description: login with email and password
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: login
     *         description: login  
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/login'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async login(req, res, next) {
        var validationSchema = {
            email: Joi.string().required(),
            password: Joi.string().required()
        }
        try {
            if (req.body.email) {
                req.body.email = (req.body.email).toLowerCase();
            }
            var results
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email, password } = validatedBody;
            let userResult = await findUser({ email: email, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (userResult.otpVerified === false) {
                throw apiError.badRequest(responseMessage.OTP_NOT_VERIFY);
            }
            if (!bcrypt.compareSync(password, userResult.password)) {
                throw apiError.conflict(responseMessage.INCORRECT_LOGIN)
            } else {
                var token = await commonFunction.getToken({ _id: userResult._id, email: userResult.email, mobileNumber: userResult.mobileNumber, userType: userResult.userType });
                results = {
                    _id: userResult._id,
                    email: email,
                    userType: userResult.userType,
                    token: token,
                };
            }
            return res.json(new response(results, responseMessage.LOGIN));
        } catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/forgotPassword:
     *   post:
     *     tags:
     *       - USER
     *     description: forgotPassword by USER on plateform when he forgot password
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: forgotPassword
     *         description: forgotPassword  
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/forgotPassword'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async forgotPassword(req, res, next) {
        var validationSchema = {
            email: Joi.string().required()
        };
        try {
            if (req.body.email) {
                req.body.email = (req.body.email).toLowerCase();
            }
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email } = validatedBody;
            var userResult = await findUser({ $and: [{ status: { $ne: status.DELETE } }, { $or: [{ mobileNumber: email }, { email: email }] }] });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            } else {
                var otp = commonFunction.getOTP();
                var newOtp = otp;
                var time = Date.now() + 180000;
                await commonFunction.sendEmailOtp(userResult.email, otp);
                var updateResult = await updateUser({ _id: userResult._id }, { $set: { otp: newOtp, otpExpireTime: time } })
                return res.json(new response(updateResult, responseMessage.OTP_SEND));
            }
        }
        catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/changePassword:
     *   patch:
     *     tags:
     *       - USER
     *     description: changePassword
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: changePassword
     *         description: changePassword
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/changePassword'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async changePassword(req, res, next) {
        const validationSchema = {
            oldPassword: Joi.string().required(),
            newPassword: Joi.string().required()
        };
        try {
            let validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (!bcrypt.compareSync(validatedBody.oldPassword, userResult.password)) {
                throw apiError.badRequest(responseMessage.PWD_NOT_MATCH);
            }
            let updated = await updateUserById(userResult._id, { password: bcrypt.hashSync(validatedBody.newPassword) });
            return res.json(new response(updated, responseMessage.PWD_CHANGED));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/resetPassword:
     *   post:
     *     tags:
     *       - USER
     *     description: resetPassword
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: resetPassword
     *         description: resetPassword
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/resetPassword'
     *     responses:
     *       200:
     *         description: Your password has been successfully changed.
     *       404:
     *         description: This user does not exist.
     *       422:
     *         description: Password not matched.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async resetPassword(req, res, next) {
        const validationSchema = {
            password: Joi.string().required(),
            confirmPassword: Joi.string().required()

        };
        try {
            const { password, confirmPassword } = await Joi.validate(req.body, validationSchema);
            var userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            else {
                if (password == confirmPassword) {
                    let update = await updateUser({ _id: userResult._id }, { password: bcrypt.hashSync(password) });
                    return res.json(new response(update, responseMessage.PWD_CHANGED));
                }
                else {
                    throw apiError.notFound(responseMessage.PWD_NOT_MATCH);
                }
            }
        }
        catch (error) {
            console.log(error);
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/resendOtp:
     *   post:
     *     tags:
     *       - USER
     *     description: resend otp by user on plateform when he resend otp
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: resendOtp
     *         description: resendOtp  
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/resendOtp'
     *     responses:
     *       200:
     *         description: OTP send successfully.
     *       404:
     *         description: This user does not exist.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async resendOtp(req, res, next) {
        var validationSchema = {
            email: Joi.string().required()
        };
        try {
            if (req.body.email) {
                req.body.email = (req.body.email).toLowerCase();
            }
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email } = validatedBody;
            var userResult = await findUser({ $and: [{ status: { $ne: status.DELETE } }, { $or: [{ mobileNumber: email }, { email: email }] }] });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            } else {
                var otp = commonFunction.getOTP();
                var newOtp = otp;
                var time = Date.now() + 180000;
                await commonFunction.sendEmailOtp(userResult.email, otp);
                var updateResult = await updateUser({ _id: userResult._id }, { $set: { otp: newOtp, otpExpireTime: time } })
                return res.json(new response(updateResult, responseMessage.OTP_SEND));
            }
        }
        catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/deposit:
     *   post:
     *     tags:
     *       - DEPOSIT
     *     description: Deposit amount
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: amount
     *         description: amount
     *         in: formData
     *         required: true
     *       - name: currencyType
     *         description: currencyType
     *         in: formData
     *         required: true
     *       - name: successUrl
     *         description: successUrl
     *         in: formData
     *         required: true
     *       - name: failureUrl
     *         description: failureUrl
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async deposit(req, res, next) {
        try {
            var validatedBody = req.body;
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let product = await productCreate();
            let price = await priceCreate(Number(validatedBody.amount), product, validatedBody.currencyType);
            let customerRes
            if (userResult.customerId) {
                customerRes = userResult.customerId
            } else {
                customerRes = await createCustomerUsingEmailAndName(userResult.firstName, userResult.email)
                updateUser({ _id: userResult._id }, { customerId: customerRes })
            }
            let link = await checkOutsessioncreate(price, customerRes, validatedBody.successUrl, validatedBody.failureUrl);
            return res.json(new response(link, responseMessage.PAYMENT_LINK_CREATE));
        } catch (error) {
            // return next(error);
            console.log("--------------------------------", error)
            let message = "Internal server error."
            if (error.raw.code == 'token_already_used') {
                message = `You cannot use a Stripe token more than once :${validatedBody.stripeToken}`
            }
            return res.status(402).send({
                responseCode: 402,
                responseMessage: message,
            });
        }
    }


    /**
    * @swagger
    * /user/editProfile:
    *   put:
    *     tags:
    *       - USER
    *     description: editProfile
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: token
    *         description: token
    *         in: header
    *         required: true
    *       - name: editProfile
    *         description: editProfile
    *         in: body
    *         required: true
    *         schema:
    *           $ref: '#/definitions/editProfile'
    *     responses:
    *       200:
    *         description: Returns success message
    */
    async editProfile(req, res, next) {
        const validationSchema = {
            email: Joi.string().optional(),
            mobileNumber: Joi.string().optional(),
            firstName: Joi.string().optional(),
            lastName: Joi.string().optional(),
            countryCode: Joi.string().optional(),
            address: Joi.string().allow('').optional(),
            dateOfBirth: Joi.string().allow('').optional(),
            profilePic: Joi.string().allow('').optional(),
        };
        try {
            if (req.body.email) {
                req.body.email = (req.body.email).toLowerCase();
            }
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let userExist = await emailMobileExist(validatedBody.mobileNumber, validatedBody.email, userResult._id)
            if (userExist) {
                if (userExist.email == validatedBody.email) {
                    throw apiError.conflict(responseMessage.EMAIL_EXIST)
                }
                else {
                    throw apiError.conflict(responseMessage.MOBILE_EXIST)
                }
            }
            if (validatedBody.profilePic && validatedBody.profilePic !== '') {
                validatedBody.profilePic = await commonFunction.getSecureUrl(validatedBody.profilePic);
            }
            var result = await updateUser({ _id: userResult._id }, validatedBody);
            return res.json(new response(result, responseMessage.USER_UPDATED));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/uploadFile:
     *   post:
     *     tags:
     *       - UPLOAD-FILE
     *     description: uploadFile
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: uploaded_file
     *         description: uploaded_file
     *         in: formData
     *         type: file
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async uploadFile(req, res, next) {
        try {
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            const { files } = req;
            const imageFiles = await commonFunction.getImageUrl(files);
            if (imageFiles) {
                let obj = {
                    secure_url: imageFiles,
                    original_filename: files[0].filename,
                };
                return res.json(new response(obj, responseMessage.UPLOAD_SUCCESS));
            }
        } catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
 * @swagger
 * /user/createStripeToken:
 *   post:
 *     tags:
 *       - STRIPE
 *     description: createStripeToken
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: token
 *         in: header
 *         required: true
 *       - name: number
 *         description: number
 *         in: formData
 *         required: true
 *       - name: month
 *         description: month
 *         in: formData
 *         required: true
 *       - name: year
 *         description: year
 *         in: formData
 *         required: true
 *       - name: cvv
 *         description: cvv
 *         in: formData
 *         required: true
 *     responses:
 *       200:
 *         description: Returns success message
 */
    async createStripeToken(req, res, next) {
        try {
            const { number, month, year, cvv } = req.body;
            let data = await createToken(number, month, year, cvv);
            return res.json(new response(data, responseMessage.TOKEN_GENERATE))
        } catch (error) {
            console.log("============================>>>", error)
            let message = "Internal server error."
            if (error.raw.code == 'incorrect_number') {
                message = "Your card number is incorrect."
            }
            if (error.raw.code == 'invalid_expiry_month') {
                message = "Your card's expiration month is invalid."
            }
            if (error.raw.code == 'invalid_cvc') {
                message = "Your card's security code is invalid."
            }
            if (error.raw.type == "invalid_request_error") {
                message = "Sending credit card numbers directly to the Stripe API is generally unsafe."
            }
            return res.status(402).send({
                responseCode: 402,
                responseMessage: message,
            });
        }
    }

    /**
     * @swagger
     * /user/transactionHistory:
     *   get:
     *     tags:
     *       - USER
     *     description: Particular user transaction history (deposit and withdraw)
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: fromDate
     *         description: fromDate
     *         in: query
     *         required: false
     *       - name: toDate
     *         description: toDate
     *         in: query
     *         required: false
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         required: false
     *       - name: transactionType
     *         description: transactionType
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async transactionHistory(req, res, next) {
        const validationSchema = {
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.string().optional(),
            limit: Joi.string().optional(),
            transactionType: Joi.string().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            validatedBody.userId = userResult._id
            let result = await transactionPaginateSearch(validatedBody)
            if (result.docs.length == 0) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/spinPlayForGuestUser:
     *   post:
     *     tags:
     *       - SPIN
     *     description: spinPlayForGuestUser for guest user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: spinPlayV1
     *         description: spinPlayV1
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/spinPlayV1'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async spinPlayForGuestUser(req, res, next) {
        var validationSchema = {
            ipAddress: Joi.string().required(),
            allCategoryAndBid: Joi.array()
                .items({
                    gameCategoryId: Joi.string().required(),
                    bidAmount: Joi.number().required(),
                })
        };
        try {
            let getCountryIsoCode = await commonFunction.activityLogFunction(req, req.body.ipAddress)
            let userResult = await findGuestUser({ ipAddress: getCountryIsoCode.ipAddress, status: { $ne: status.DELETE } })
            if (!userResult) {
                let obj = {
                    ipAddress: getCountryIsoCode.ipAddress
                }
                userResult = await createGuestUser(obj)
            }
            var validatedBody = await Joi.validate(req.body, validationSchema);
            let allCategory = await categoryList({ status: { $ne: status.DELETE } })
            let randomNumber = Math.floor(Math.random() * Number(allCategory.length))
            let dataRes = allCategory.at(randomNumber)
            let winCategory = validatedBody.allCategoryAndBid.find(e => e.gameCategoryId === ((dataRes._id).toString()));
            // if (getCountryIsoCode.country == 'US') {
            //     if (winCategory && dataRes.price != 0 && (dataRes.categoryName != "Wild" || dataRes.categoryName != "Joker")) {
            //         let finalResultRes = await userWinnerLoserFunction(userResult, 'WINNER', validatedBody.allCategoryAndBid, dataRes._id, winCategory)
            //         let obj = await objCreate1(dataRes._id, dataRes.categoryName, "WINNER", finalResultRes.totalAmount, finalResultRes.loseAmount, finalResultRes.winAmount, finalResultRes.luckyAmount)
            //         return res.json(new response(obj, responseMessage.WIN));
            //     } else if (!winCategory && dataRes.price == 0 && (dataRes.categoryName == "Wild" || dataRes.categoryName == "Joker")) {
            //         let obj = await objCreate1(dataRes._id, dataRes.categoryName, "TRY")
            //         return res.json(new response(obj, responseMessage.TRY));
            //     } else {
            //         let finalResultRes = await userWinnerLoserFunction(userResult, 'LOSER', validatedBody.allCategoryAndBid, dataRes._id, winCategory)
            //         let obj = await objCreate1(dataRes._id, dataRes.categoryName, "LOSER", finalResultRes.totalAmount, finalResultRes.loseAmount)
            //         return res.json(new response(obj, responseMessage.LOSER));
            //     }
            // }
            if (winCategory && dataRes.price != 0 && (dataRes.categoryName != "Wild" || dataRes.categoryName != "Joker")) {
                let finalResultRes = await userWinnerLoserFunction(userResult, 'WINNER', validatedBody.allCategoryAndBid, dataRes._id, winCategory)
                let obj = await objCreate1(dataRes._id, dataRes.categoryName, "WINNER", finalResultRes.totalAmount, finalResultRes.loseAmount, finalResultRes.winAmount, finalResultRes.luckyAmount)
                return res.json(new response(obj, responseMessage.WIN));
            } else if (!winCategory && dataRes.price == 0 && (dataRes.categoryName == "Wild" || dataRes.categoryName == "Joker")) {
                let obj = await objCreate1(dataRes._id, dataRes.categoryName, "TRY")
                return res.json(new response(obj, responseMessage.TRY));
            } else {
                let finalResultRes = await userWinnerLoserFunction(userResult, 'LOSER', validatedBody.allCategoryAndBid, dataRes._id, winCategory)
                let obj = await objCreate1(dataRes._id, dataRes.categoryName, "LOSER", finalResultRes.totalAmount, finalResultRes.loseAmount)
                return res.json(new response(obj, responseMessage.LOSER));
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/depositWithCoinPayment:
     *   post:
     *     tags:
     *       - DEPOSIT
     *     description: depositWithCoinPayment amount
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: amount
     *         description: amount
     *         in: formData
     *         required: true
     *       - name: currency1
     *         description: currency1
     *         in: formData
     *         required: true
     *       - name: currency2
     *         description: currency2
     *         in: formData
     *         required: true
     *       - name: itemName
     *         description: itemName
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async depositWithCoinPayment(req, res, next) {
        var validationSchema = {
            amount: Joi.string().required(),
            currency1: Joi.string().required(),
            currency2: Joi.string().required(),
            itemName: Joi.string().required(),
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            const privateApiKey = config.get('coin_payment.privateKey');
            const publicApiKey = config.get('coin_payment.publicKey');
            // let CoinpaymentsCredentials = {
            //     key: publicApiKey,
            //     secret: privateApiKey
            // }
            // const params = {
            //     cmd: 'create_transaction',
            //     key: publicApiKey,
            //     amount: validatedBody.amount,
            //     currency1: validatedBody.currency1,
            //     currency2: validatedBody.currency2,
            //     buyer_email: userResult.email,
            //     item_name: validatedBody.itemName
            // };
            // const client = new Coinpayments(CoinpaymentsCredentials)
            // let result = await client.createTransaction(params)
            // return res.json(new response(result, responseMessage.DEPOSIT_SUCCESSFULLY));


            const payload = {
                version: "1",
                key: publicApiKey,
                cmd: "create_transaction",
                amount: validatedBody.amount,
                currency1: validatedBody.currency1,
                currency2: validatedBody.currency2,
                buyer_email: userResult.email,
                item_name: validatedBody.itemName,
            };
            const hmacPayload = Object.keys(payload).sort().map((key) => `${key}=${payload[key]}`).join("&");
            const hmac = crypto.createHmac("sha512", privateApiKey).update(hmacPayload).digest("hex");
            const headers = {
                HMAC: hmac,
                "Content-Type": "application/x-www-form-urlencoded",
            };
            const responseData = await axios.post("https://www.coinpayments.net/api.php", hmacPayload, { headers });
            if (responseData.status == 200) {
                if (responseData.data.result.length == 0) {
                    throw apiError.invalid(responseMessage.DEPOSIT_FAIL);
                }
                let depositObj = {
                    amount: responseData.data.result.amount,
                    userId: userResult._id,
                    transactionType: transactionType.DEPOSIT,
                    checkout_url: responseData.data.result.checkout_url,
                    status_url: responseData.data.result.status_url,
                    qrcode_url: responseData.data.result.qrcode_url,
                    payment_address: responseData.data.result.address,
                    transactionStatus: transactionStatus.PENDING,
                    txn_id: responseData.data.result.txn_id,
                    transactionName: transactionName.COIN
                }
                await Promise.all([createTransaction(depositObj)])
                return res.json(new response(responseData.data.result, responseMessage.DEPOSIT_SUCCESSFULLY));
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/spinPlay:
     *   post:
     *     tags:
     *       - SPIN
     *     description: spinPlayV1
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: User token
     *         in: header
     *         required: true
     *       - name: spinPlayV1
     *         description: spinPlayV1
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/spinPlayV1'
     *     responses:
     *       200:
     *         description: Returns success message
    */
    async spinPlay(req, res, next) {
        var validationSchema = {
            ipAddress: Joi.string().required(),
            allCategoryAndBid: Joi.array()
                .items({
                    gameCategoryId: Joi.string().required(),
                    bidAmount: Joi.number().required(),
                })
        };
        try {
            var validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: { $ne: userType.ADMIN }, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let adminRes = await findUser({ userType: userType.ADMIN, status: { $ne: status.DELETE } })
            let allCategory = await categoryList({ status: { $ne: status.DELETE } })
            let randomNumber = Math.floor(Math.random() * Number(allCategory.length))
            let dataRes = allCategory.at(randomNumber)
            let getCountryIsoCode = await commonFunction.activityLogFunction(req, req.body.ipAddress)
            let winCategory = validatedBody.allCategoryAndBid.find(e => e.gameCategoryId === ((dataRes._id).toString()));
            // if (getCountryIsoCode.country == 'US') {
            //     if (winCategory && dataRes.price != 0 && (dataRes.categoryName != "Wild" || dataRes.categoryName != "Joker")) {
            //         let obj = await objCreate1(dataRes._id, dataRes.categoryName, "WINNER")
            //         userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.WIN, req.body.ipAddress)
            //         return res.json(new response(obj, responseMessage.WIN));
            //     } else if (!winCategory && dataRes.price == 0 && (dataRes.categoryName == "Wild" || dataRes.categoryName == "Joker")) {
            //         let obj = await objCreate1(dataRes._id, dataRes.categoryName, "TRY")
            //         userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.TRY, req.body.ipAddress)
            //         return res.json(new response(obj, responseMessage.TRY));
            //     } else {
            //         let obj = await objCreate1(dataRes._id, dataRes.categoryName, "LOSER")
            //         userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.LOSE, req.body.ipAddress)
            //         return res.json(new response(obj, responseMessage.LOSER));
            //     }
            // }
            // let highestPrice = Math.max.apply(null, validatedBody.allCategoryAndBid.map(e => e.bidAmount));
            // let item = validatedBody.allCategoryAndBid.find(e => e.bidAmount === highestPrice);
            let checkBalance = validatedBody.allCategoryAndBid.map(o => o.bidAmount).reduce((a, c) => { return a + c })
            console.log("==================<<", checkBalance)
            if (Number(userResult.balance) < Number(checkBalance)) {
                throw apiError.badRequest(responseMessage.INSUFFICIENT_BALANCE);
            }
            if (winCategory && dataRes.price != 0 && (dataRes.categoryName != "Wild" || dataRes.categoryName != "Joker")) {
                var newArray = validatedBody.allCategoryAndBid.filter(function (el) {
                    return el.gameCategoryId != ((dataRes._id).toString())
                });
                let categoryRes = await findCatagory({ _id: winCategory.gameCategoryId, price: { $ne: 0 }, status: { $ne: status.DELETE } })
                let balance = newArray.map(o => o.bidAmount).reduce((a, c) => { return a + c });
                let transcationBalance = (Number(categoryRes.price) + Number(winCategory.bidAmount)) - Number(balance)
                let winAmount = (Number(categoryRes.price) + Number(winCategory.bidAmount))
                let loseAmount = Number(balance)
                let luckyAmount = 0
                balance = (Number(categoryRes.price) + Number(winCategory.bidAmount) + Number(userResult.balance)) - Number(balance)
                if (userResult.isChange == true) {
                    balance = (Number(categoryRes.price) * 1.5) + Number(balance)
                    transcationBalance = (Number(categoryRes.price) * 1.5) + Number(transcationBalance)
                    luckyAmount = (Number(categoryRes.price) * 1.5)
                }
                let depositObj = await objCreate(transcationBalance, userResult._id, transactionType.DEPOSIT, transactionName.SPIN_WINNER, adminRes._id)
                await Promise.all([
                    updateUser({ _id: userResult._id }, { balance: balance, isChange: false }),
                    createTransaction(depositObj),
                    userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.WIN, req.body.ipAddress)
                ])
                let totalAmount = transcationBalance
                let obj = await objCreate1(dataRes._id, dataRes.categoryName, "WINNER", totalAmount, loseAmount, winAmount, luckyAmount)
                return res.json(new response(obj, responseMessage.WIN));
            } else if (!winCategory && dataRes.price == 0 && (dataRes.categoryName == "Wild" || dataRes.categoryName == "Joker")) {
                let obj = await objCreate1(dataRes._id, dataRes.categoryName, "TRY")
                await Promise.all([
                    updateUser({ _id: userResult._id }, { isChange: true }),
                    userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.TRY, req.body.ipAddress)
                ])
                return res.json(new response(obj, responseMessage.TRY));
            } else {
                let balance = validatedBody.allCategoryAndBid.map(o => o.bidAmount).reduce((a, c) => { return a + c });
                let transcationBalance = balance
                balance = Number(userResult.balance) - Number(balance)
                let depositObj = await objCreate('-' + transcationBalance, userResult._id, transactionType.WITHDRAW, transactionName.SPIN_LOSER, adminRes._id)
                await Promise.all([
                    updateUser({ _id: userResult._id }, { balance: balance, isChange: false }),
                    createTransaction(depositObj),
                    userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.LOSE, req.body.ipAddress)
                ])
                let loseAmount = Number(transcationBalance)
                let totalAmount = transcationBalance
                let obj = await objCreate1(dataRes._id, dataRes.categoryName, "LOSER", totalAmount, loseAmount)
                return res.json(new response(obj, responseMessage.LOSER));
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/coinAcceptance:
     *   get:
     *     tags:
     *       - USER
     *     description: get coin Acceptance on coinpayment 
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async coinAcceptance(req, res, next) {
        try {
            const privateApiKey = config.get('coin_payment.privateKey');
            const publicApiKey = config.get('coin_payment.publicKey');
            const payload = {
                version: "1",
                key: publicApiKey,
                short: 1,
                accepted: 1,
                cmd: "rates"
            };
            const hmacPayload = Object.keys(payload).sort().map((key) => `${key}=${payload[key]}`).join("&");
            const hmac = crypto.createHmac("sha512", privateApiKey).update(hmacPayload).digest("hex");
            const headers = {
                HMAC: hmac,
                "Content-Type": "application/x-www-form-urlencoded",
            };
            const responseData = await axios.post("https://www.coinpayments.net/api.php", hmacPayload, { headers });
            if (responseData.status == 200) {
                let arrayData = []
                for (let [key, value] of Object.entries(responseData.data.result)) {
                    if (value.accepted == 1) {
                        let obje = {
                            coin: key,
                            is_fiat: value.is_fiat,
                            rate_btc: value.rate_btc,
                            tx_fee: value.tx_fee,
                            status: value.status,
                            image: value.image,
                            accepted: value.accepted
                        }
                        arrayData.push(obje)
                    }
                }
                return res.json(new response(arrayData, responseMessage.DATA_FOUND));
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/withdraw:
     *   post:
     *     tags:
     *       - WITHDRAW
     *     description: Withdraw amount
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: accountId
     *         description: accountId
     *         in: formData
     *         required: true
     *       - name: amount
     *         description: amount
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async withdraw(req, res, next) {
        var validationSchema = {
            accountId: Joi.string().required(),
            amount: Joi.string().required(),
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let findAccountRes = await findRequestForWithdraw({ _id: validatedBody.accountId, userId: userResult._id, status: status.ACTIVE, requestStatus: requestStatus.APPROVE })
            if (!findAccountRes) {
                throw apiError.notFound(responseMessage.BANK_ACCOUNT_NOT_FOUND);
            }
            let stripeBalance = await getStripeBalance()
            var usdBalance = stripeBalance.available.find(function (el) {
                return el.currency == 'usd'
            });

            let finalBalance = usdBalance.amount / 100
            if (parseFloat(userResult.balance) < parseFloat(validatedBody.amount)) {
                throw apiError.badRequest(responseMessage.INSUFFICIENT_BALANCE_FOR_ADMIN);
            }
            if (parseFloat(finalBalance) >= parseFloat(validatedBody.amount)) {
                // let bankRes = await accountCreate(userResult.email)
                // console.log("======================", bankRes)
                // let updateRes = await updateAccount(bankRes, req.ip)
                // let externalAccountRes = await externalAccount(bankRes, validatedBody.account_holder_name, validatedBody.routing_number, validatedBody.account_number)
                let transferRes = await transfers(validatedBody.amount, findAccountRes.accountId)
                let result = await createPayout(validatedBody.amount, findAccountRes.accountId)
                let depositObj = {
                    amount: Number(validatedBody.amount),
                    userId: userResult._id,
                    transactionType: transactionType.WITHDRAW,
                    transferId: transferRes.id,
                    payoutId: result.id,
                    transactionStatus: transactionStatus.COMPLETE,
                }
                let adminRes = await findUser({ userType: userType.ADMIN, status: status.ACTIVE })
                let [userResultRes, adminupdateRes, transactionRes] = await Promise.all([
                    updateUser({ _id: userResult._id }, { balance: Number(userResult.balance) - Number(validatedBody.amount) }),
                    updateUser({ _id: adminRes._id }, { balance: Number(adminRes.balance) - Number(validatedBody.amount) }),
                    createTransaction(depositObj)
                ])
                return res.json(new response(userResultRes, responseMessage.WITHDRAW));
            }
            throw apiError.badRequest(responseMessage.INSUFFICIENT_BALANCE_FOR_ADMIN);
        } catch (error) {
            console.log("========withdraw error", error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/spinPlayV1:
     *   post:
     *     tags:
     *       - SPIN
     *     description: spinPlayV1
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: User token
     *         in: header
     *         required: true
     *       - name: spinPlayV1
     *         description: spinPlayV1
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/spinPlayV1'
     *     responses:
     *       200:
     *         description: Returns success message
    */
    async spinPlayV1(req, res, next) {
        var validationSchema = {
            ipAddress: Joi.string().required(),
            allCategoryAndBid: Joi.array()
                .items({
                    gameCategoryId: Joi.string().required(),
                    bidAmount: Joi.number().required(),
                })
        };
        try {
            var validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: { $ne: userType.ADMIN }, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let adminRes = await findUser({ userType: userType.ADMIN, status: { $ne: status.DELETE } })
            let allCategory = await categoryList({ status: { $ne: status.DELETE } })
            let randomNumber = Math.floor(Math.random() * Number(allCategory.length))
            let dataRes = allCategory.at(randomNumber)
            let getCountryIsoCode = await commonFunction.activityLogFunction(req, req.body.ipAddress)
            let winCategory = validatedBody.allCategoryAndBid.find(e => e.gameCategoryId === ((dataRes._id).toString()));
            // if (getCountryIsoCode.country == 'US') {
            //     if (winCategory && dataRes.price != 0 && (dataRes.categoryName != "Wild" || dataRes.categoryName != "Joker")) {
            //         let finalResultRes = await userWinnerLoserFunction(userResult, 'WINNER', validatedBody.allCategoryAndBid, dataRes._id, winCategory)
            //         let obj = await objCreate1(dataRes._id, dataRes.categoryName, "WINNER", finalResultRes.totalAmount, finalResultRes.loseAmount, finalResultRes.winAmount, finalResultRes.luckyAmount)
            //         userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.WIN, req.body.ipAddress)
            //         return res.json(new response(obj, responseMessage.WIN));
            //     } else if (!winCategory && dataRes.price == 0 && (dataRes.categoryName == "Wild" || dataRes.categoryName == "Joker")) {
            //         let obj = await objCreate1(dataRes._id, dataRes.categoryName, "TRY")
            //         userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.TRY, req.body.ipAddress)
            //         return res.json(new response(obj, responseMessage.TRY));
            //     } else {
            //         let finalResultRes = await userWinnerLoserFunction(userResult, 'LOSER', validatedBody.allCategoryAndBid, dataRes._id, winCategory)
            //         let obj = await objCreate1(dataRes._id, dataRes.categoryName, "LOSER", finalResultRes.totalAmount, finalResultRes.loseAmount)
            //         userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.LOSE, req.body.ipAddress)
            //         return res.json(new response(obj, responseMessage.LOSER));
            //     }
            // }
            // let highestPrice = Math.max.apply(null, validatedBody.allCategoryAndBid.map(e => e.bidAmount));
            // let item = validatedBody.allCategoryAndBid.find(e => e.bidAmount === highestPrice);
            let checkBalance = validatedBody.allCategoryAndBid.map(o => o.bidAmount).reduce((a, c) => { return a + c })
            if (Number(userResult.balance) < Number(checkBalance)) {
                throw apiError.badRequest(responseMessage.INSUFFICIENT_BALANCE);
            }
            if (winCategory && dataRes.price != 0 && (dataRes.categoryName != "Wild" || dataRes.categoryName != "Joker")) {
                let finalResultRes = await userWinnerLoserFunction(userResult, 'WINNER', validatedBody.allCategoryAndBid, dataRes._id, winCategory)
                let depositObj = await objCreate(finalResultRes.totalAmount, userResult._id, transactionType.DEPOSIT, transactionName.SPIN_WINNER, adminRes._id)
                await Promise.all([
                    updateUser({ _id: userResult._id }, { balance: finalResultRes.balance, isChange: false }),
                    createTransaction(depositObj),
                    userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.WIN, req.body.ipAddress)
                ])
                let obj = await objCreate1(dataRes._id, dataRes.categoryName, "WINNER", finalResultRes.totalAmount, finalResultRes.loseAmount, finalResultRes.winAmount, finalResultRes.luckyAmount)
                return res.json(new response(obj, responseMessage.WIN));
            } else if (!winCategory && dataRes.price == 0 && (dataRes.categoryName == "Wild" || dataRes.categoryName == "Joker")) {
                let obj = await objCreate1(dataRes._id, dataRes.categoryName, "TRY")
                await Promise.all([
                    updateUser({ _id: userResult._id }, { isChange: true }),
                    userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.TRY, req.body.ipAddress)
                ])
                return res.json(new response(obj, responseMessage.TRY));
            } else {
                let finalResultRes = await userWinnerLoserFunction(userResult, 'LOSER', validatedBody.allCategoryAndBid, dataRes._id, winCategory)
                let depositObj = await objCreate('-' + finalResultRes.totalAmount, userResult._id, transactionType.WITHDRAW, transactionName.SPIN_LOSER, adminRes._id)
                await Promise.all([
                    updateUser({ _id: userResult._id }, { balance: finalResultRes.balance, isChange: false }),
                    createTransaction(depositObj),
                    userGameActivityObj(req, userResult._id, userResult.userType, gameType.SPIN, finalResult.LOSE, req.body.ipAddress)
                ])
                let obj = await objCreate1(dataRes._id, dataRes.categoryName, "LOSER", finalResultRes.totalAmount, finalResultRes.loseAmount)
                return res.json(new response(obj, responseMessage.LOSER));
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/checkIpAddress:
     *   get:
     *     tags:
     *       - USER
     *     description: checkIpAddress
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: ipAddress
     *         description: ipAddress
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async checkIpAddress(req, res, next) {
        try {
            let getCountryIsoCode = await commonFunction.activityLogFunction(req, req.query.ipAddress)
            return res.json(new response(getCountryIsoCode, responseMessage.USER_DETAILS));
        } catch (error) {
            return next(error);
        }
    }

    async checkSignature(req, res, next) {
        try {
            const endpointSecret = config.get('stripe_endpoint');
            // Match the raw body to content type application/json
            const sig = req.headers['stripe-signature'];
            let event;
            try {
                event = await stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
            }
            catch (err) {
                res.status(400).send(`Webhook Error: ${err.message}`);
            }
            // Handle the event
            let [findChipRes, adminAmount] = await Promise.all([findChip({ status: status.ACTIVE }), findUser({ userType: userType.ADMIN, status: status.ACTIVE })])
            switch (event.type) {
                case 'charge.succeeded':
                    const paymentIntent = event.data.object;
                    console.log('PaymentIntent was successful!===============>>>>', paymentIntent);
                    let userResult = await findUser({ customerId: paymentIntent.customer, status: { $ne: status.DELETE } })
                    let chipAmount = (Number(paymentIntent.amount) / 100) * Number(findChipRes.chipQuantity)
                    let depositObj = {
                        amount: chipAmount,
                        userId: userResult._id,
                        transactionType: transactionType.DEPOSIT,
                        receipt_url: paymentIntent.receipt_url,
                        transactionName: transactionName.CARD,
                        txn_id: paymentIntent.balance_transaction,
                        transactionStatus: transactionStatus.COMPLETE,
                    }
                    let balance = Number(userResult.balance) + Number(chipAmount)
                    console.log("====================>>>>>>", balance)
                    await Promise.all([createTransaction(depositObj), updateUser({ _id: userResult._id }, { balance: balance }), updateUser({ _id: adminAmount._id }, { balance: Number(adminAmount.balance) + (Number(paymentIntent.amount) / 100) })])
                    break;
                case 'payment_method.attached':
                    const paymentMethod = event.data.object;
                    console.log('PaymentMethod was attached to a Customer!', paymentMethod);
                case 'payout.created':
                    const payoutCreated = event.data.object;
                    console.log("=======================>payoutCreated", payoutCreated)
                    // Then define and call a function to handle the event payout.created
                    break;
                case 'payout.failed':
                    const payoutFailed = event.data.object;
                    console.log("==============>>>>>>>>>>payoutFailed", payoutFailed)
                    // Then define and call a function to handle the event payout.failed
                    break;
                case 'payout.paid':
                    const payoutPaid = event.data.object;
                    console.log("========================>>>>>>>payoutPaid", payoutPaid)
                    // Then define and call a function to handle the event payout.paid
                    break;
                    break;
                // ... handle other event types
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
            // Return a res to acknowledge receipt of the event
            res.json({ received: true });

        } catch (error) {
            return next(error)
        }
    }

    /**
     * @swagger
     * /user/AddBank:
     *   post:
     *     tags:
     *       - USER
     *     description: Add bank details for withdraw
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: User token
     *         in: header
     *         required: true
     *       - name: firstHolderName
     *         description: firstHolderName
     *         in: formData
     *         required: true
     *       - name: secondHolderName
     *         description: secondHolderName
     *         in: formData
     *         required: true
     *       - name: email
     *         description: email
     *         in: formData
     *         required: true
     *       - name: countryCode
     *         description: countryCode
     *         in: formData
     *         required: true
     *       - name: MobileNumber
     *         description: MobileNumber
     *         in: formData
     *         required: true
     *       - name: dateOfBirth
     *         description: dateOfBirth
     *         in: formData
     *         required: true
     *       - name: addressLine1
     *         description: addressLine1
     *         in: formData
     *         required: true
     *       - name: addressLine2
     *         description: addressLine2
     *         in: formData
     *         required: false
     *       - name: city
     *         description: city
     *         in: formData
     *         required: true
     *       - name: state
     *         description: state
     *         in: formData
     *         required: true
     *       - name: postal_code
     *         description: postal_code
     *         in: formData
     *         required: true
     *       - name: SSN
     *         description: SSN
     *         in: formData
     *         required: true
     *       - name: identityDocument
     *         description: identityDocument
     *         in: formData
     *         required: true
     *       - name: accountNumber
     *         description: accountNumber
     *         in: formData
     *         required: true
     *       - name: routingNumber
     *         description: routingNumber
     *         in: formData
     *         required: true
     *       - name: bankName
     *         description: bankName
     *         in: formData
     *         required: true
     *       - name: accountType
     *         description: accountType
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async AddBank(req, res, next) {
        var validationSchema = {
            firstHolderName: Joi.string().required(),
            secondHolderName: Joi.string().required(),
            email: Joi.string().required(),
            countryCode: Joi.string().required(),
            MobileNumber: Joi.string().required(),
            dateOfBirth: Joi.string().required(),
            addressLine1: Joi.string().required(),
            addressLine2: Joi.string().optional(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            postal_code: Joi.string().required(),
            SSN: Joi.string().required(),
            identityDocument: Joi.string().required(),
            bankName: Joi.string().optional(),
            accountType: Joi.string().optional(),
            accountNumber: Joi.string().required(),
            routingNumber: Joi.string().required(),
        };
        try {
            var validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let checkBankAccount = await findRequestForWithdraw({ accountNumber: validatedBody.accountNumber, userId: userResult._id, routingNumber: validatedBody.routingNumber })
            if (checkBankAccount) {
                throw apiError.conflict(responseMessage.BANK_AREADY_EXIST);
            }
            validatedBody.userId = userResult._id
            let saveRes = await createRequestForWithdraw(validatedBody)
            return res.json(new response(saveRes, responseMessage.ADD_BANK_ACCOUNT));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/getMyBankAccount:
     *   get:
     *     tags:
     *       - USER
     *     description: get all approve bank account
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: User token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async getMyBankAccount(req, res, next) {
        try {
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let dataRes = await requestForWithdrawList({ userId: userResult._id })
            if (dataRes.length == 0) {
                throw apiError.notFound(responseMessage.BANK_ACCOUNT_NOT_FOUND);
            }
            return res.json(new response(dataRes, responseMessage.BANK_ACCOUNT_FOUND));
        } catch (error) {
            return next(error);
        }
    }

}
export default new userController();
async function objCreate(amount, userId, transactionType, transactionName, depositWithdrawUserId) {
    let obj = {
        amount: amount,
        userId: userId,
        transactionType: transactionType,
        transactionName: transactionName,
        depositWithdrawUserId: depositWithdrawUserId
    }
    return obj;
}
async function objCreate1(categoryId, categoryName, result, totalAmount, loseAmount, winAmount, luckyAmount) {
    let obj = {
        categoryId: categoryId,
        categoryName: categoryName,
        result: result,
        loseAmount: loseAmount,
        winAmount: winAmount,
        luckyAmount: luckyAmount,
        totalAmount: totalAmount
    }
    return obj;
}

async function userGameActivityObj(req, userId, userType, gameType, result, ipAddress) {
    try {
        let logHistory = await commonFunction.activityLogFunction(req, ipAddress)
        let logObj = {
            userId: userId,
            userType: userType,
            gameType: gameType,
            result: result,
            browserName: logHistory.browserName,
            ipAddress: logHistory.ipAddress,
            country: logHistory.country
        }
        await createUserGameActivity(logObj)
    } catch (error) {
        console.log("log history create error", error)
    }
}

async function userWinnerLoserFunction(userResult, result, reqData, categoryId, winCategory) {
    if (result == "WINNER") {
        var newArray = reqData.filter(function (el) {
            return el.gameCategoryId != ((categoryId).toString())
        });
        let categoryRes = await findCatagory({ _id: winCategory.gameCategoryId, price: { $ne: 0 }, status: { $ne: status.DELETE } })
        let winAmount = (Number(categoryRes.price) * Number(winCategory.bidAmount))
        let loseAmount = newArray.map(o => o.bidAmount).reduce((a, c) => { return a + c });
        let luckyAmount = 0
        let balance = (Number(winAmount) + Number(userResult.balance)) - Number(loseAmount)
        if (userResult.isChange == true) {
            balance = (Number(categoryRes.price) * 1.5) + Number(balance)
            luckyAmount = (Number(categoryRes.price) * 1.5)
            winAmount = (Number(categoryRes.price) * 1.5) * Number(winAmount)
        }
        let responseObj = {
            winAmount: winAmount,
            loseAmount: loseAmount,
            luckyAmount: luckyAmount,
            balance: balance,
            totalAmount: Number(winAmount) - Number(loseAmount)
        }
        return responseObj
    } else if (result == "LOSER") {
        let loseAmount = reqData.map(o => o.bidAmount).reduce((a, c) => { return a + c });
        let balance = Number(userResult.balance) - Number(loseAmount)
        let responseObj = {
            loseAmount: loseAmount,
            balance: balance,
            totalAmount: loseAmount
        }
        return responseObj
    }
}
