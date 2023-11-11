import Joi from "joi";
import Mongoose from "mongoose";
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
import { userServices } from "../../services/user"
const { userCheck, checkUserExists, emailMobileExist, createUser, findUser, findUserData, userFindList, updateUser, updateUserById, paginateSearch } = userServices
import { transactionServices } from '../../services/transaction'
const { aggregateSearchtransaction, transactionPaginateSearch } = transactionServices
import { chipServices } from "../../services/chip"
const { findChip, updateChip, chipList } = chipServices
import { userGameActivityServices } from "../../services/userGameActivity";
const { userGameActivitySearch } = userGameActivityServices
import { requestForWithdrawServices } from '../../services/requestForWithdraw'
const { createRequestForWithdraw, findRequestForWithdraw, updateRequestForWithdraw, requestForWithdrawList, requestWithdrawAccountPagination } = requestForWithdrawServices
import requestStatus from "../../../../enums/requestStatus";


export class adminController {

    /**
     * @swagger
     * /admin/login:
     *   post:
     *     tags:
     *       - ADMIN
     *     description: Admin login with email and Password
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
            password: Joi.string().required(),
        }
        try {
            if (req.body.email) {
                req.body.email = (req.body.email).toLowerCase();
            }
            var results
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email, password } = validatedBody;
            var userResult = await findUser({ $and: [{ status: { $ne: status.DELETE } }, { userType: userType.ADMIN }, { $or: [{ mobileNumber: email }, { email: email }] }] });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND)
            }
            if (!bcrypt.compareSync(password, userResult.password)) {
                throw apiError.conflict(responseMessage.INCORRECT_LOGIN)
            } else {
                var token = await commonFunction.getToken({ _id: userResult._id, email: userResult.email, mobileNumber: userResult.mobileNumber, userType: userResult.userType });
                results = {
                    _id: userResult._id,
                    email: email,
                    speakeasy: userResult.speakeasy,
                    userType: userResult.userType,
                    token: token,
                }
            }
            return res.json(new response(results, responseMessage.LOGIN));
        } catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/getProfile:
     *   get:
     *     tags:
     *       - ADMIN
     *     description: get his own profile details with getProfile API
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async getProfile(req, res, next) {
        try {
            console.log(req.userId)
            let adminResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            return res.json(new response(adminResult, responseMessage.USER_DETAILS));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/forgotPassword:
     *   post:
     *     tags:
     *       - ADMIN
     *     description: forgotPassword by ADMIN on plateform when he forgot password
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
            var userResult = await findUser({ $and: [{ status: { $ne: status.DELETE } }, { userType: userType.ADMIN }, { $or: [{ mobileNumber: email }, { email: email }] }] });
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
     * /admin/verifyOTP:
     *   patch:
     *     tags:
     *       - ADMIN
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
     *         description: OTP send successfully.
     *       404:
     *         description: This user does not exist.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async verifyOTP(req, res, next) {
        var validationSchema = {
            email: Joi.string().required(),
            otp: Joi.string().required()
        };
        try {
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email, otp } = validatedBody;
            var userResult = await findUserData({ $and: [{ status: { $ne: status.DELETE } }, { userType: userType.ADMIN }, { $or: [{ mobileNumber: email }, { email: email }] }] });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (new Date().getTime() > userResult.otpExpireTime) {
                throw apiError.badRequest(responseMessage.OTP_EXPIRED);
            }
            if (userResult.otp != otp) {
                throw apiError.badRequest(responseMessage.INCORRECT_OTP);
            }
            var updateResult = await updateUser({ _id: userResult._id }, { otpVerified: true })
            var token = await commonFunction.getToken({ _id: updateResult._id, email: updateResult.email, mobileNumber: updateResult.mobileNumber, userType: updateResult.userType });
            var obj = {
                _id: updateResult._id,
                name: updateResult.name,
                email: updateResult.email,
                countryCode: updateResult.countryCode,
                mobileNumber: updateResult.mobileNumber,
                otpVerified: true,
                token: token
            }
            return res.json(new response(obj, responseMessage.OTP_VERIFY));
        }
        catch (error) {
            console.log(error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/resendOtp:
     *   post:
     *     tags:
     *       - ADMIN
     *     description: resend otp by ADMIN on plateform when he resend otp
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
     *         description: Returns success message
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
            var userResult = await findUser({ $and: [{ status: { $ne: status.DELETE } }, { userType: userType.ADMIN }, { $or: [{ mobileNumber: email }, { email: email }] }] });
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
     * /admin/changePassword:
     *   patch:
     *     tags:
     *       - ADMIN
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
     * /admin/resetPassword:
     *   post:
     *     tags:
     *       - ADMIN
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
     * /admin/userList:
     *   get:
     *     tags:
     *       - USER MANAGEMENT
     *     description: get his own profile details with userList API
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
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
     *       - name: userType1
     *         description: userType1
     *         in: query
     *         required: false
     *       - name: status1
     *         description: status1
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Users found successfully.
     *       404:
     *         description: Users not found.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async userList(req, res, next) {
        const validationSchema = {
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.string().optional(),
            limit: Joi.string().optional(),
            userType1: Joi.string().optional(),
            status1: Joi.string().optional()

        };
        try {
            let validatedBody = await Joi.validate(req.query, validationSchema);
            let adminResult = await findUser({ _id: req.userId, userType: userType.ADMIN, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let userResult = await paginateSearch(validatedBody)
            if (userResult.docs.length == 0) {
                throw apiError.notFound(responseMessage.USERS_NOT_FOUND)
            }
            return res.json(new response(userResult, responseMessage.USERS_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/viewUser:
     *   get:
     *     tags:
     *       - USER MANAGEMENT
     *     description: get particular user data
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: userId
     *         description: userId
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: User found successfully.
     *       404:
     *         description: User not found.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async viewUser(req, res, next) {
        const validationSchema = {
            userId: Joi.string().required(),

        };
        try {
            let validatedBody = await Joi.validate(req.query, validationSchema);
            let adminResult = await findUser({ _id: req.userId, userType: userType.ADMIN, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let userResult = await findUser({ _id: validatedBody.userId, status: { $ne: status.DELETE } })
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND)
            }
            return res.json(new response(userResult, responseMessage.USER_DETAILS));
        } catch (error) {
            return next(error);
        }
    }


    /**
     * @swagger
     * /admin/activeBlockUser:
     *   put:
     *     tags:
     *       - USER MANAGEMENT
     *     description: activeBlockUser
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: userId
     *         description: userId
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async activeBlockUser(req, res, next) {
        const validationSchema = {
            userId: Joi.string().required()
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            var userInfo = await findUser({ _id: validatedBody.userId, userType: { $ne: userType.ADMIN }, status: { $ne: status.DELETE } });
            if (!userInfo) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (userInfo.status == status.ACTIVE) {
                let blockRes = await updateUser({ _id: userInfo._id }, { status: status.BLOCK });
                return res.json(new response(blockRes, responseMessage.BLOCK_USER_BY_ADMIN));
            } else {
                let activeRes = await updateUser({ _id: userInfo._id }, { status: status.ACTIVE });
                return res.json(new response(activeRes, responseMessage.UNBLOCK_USER_BY_ADMIN));
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/allTransactionList:
     *   get:
     *     tags:
     *       - USER MANAGEMENT
     *     description: get all transaction list
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
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
     *       - name: transactionStatus
     *         description: transactionStatus
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Data found successfully.
     *       404:
     *         description: Data not found.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async allTransactionList(req, res, next) {
        const validationSchema = {
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.string().optional(),
            limit: Joi.string().optional(),
            transactionStatus: Joi.string().optional()

        };
        try {
            let validatedBody = await Joi.validate(req.query, validationSchema);
            let adminResult = await findUser({ _id: req.userId, userType: userType.ADMIN, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let transactionHistory = await aggregateSearchtransaction(validatedBody)
            if (transactionHistory.docs.length == 0) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND)
            }
            return res.json(new response(transactionHistory, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }


    /**
     * @swagger
     * /admin/getChipValue:
     *   get:
     *     tags:
     *       - ADMIN
     *     description: getChipValue
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async getChipValue(req, res, next) {
        try {
            let chipValue = await chipList({ status: { $ne: status.DELETE } });
            if (chipValue.length == 0) {
                throw apiError.notFound(responseMessage.CHIP_NOT_FOUND);
            }
            return res.json(new response(chipValue, responseMessage.CHIP_FOUND))
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/updateChipValue:
     *   put:
     *     tags:
     *       - ADMIN
     *     description: updateChipValue
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: chipId
     *         description: chipId
     *         in: formData
     *         required: true
     *       - name: chipQuantity
     *         description: chipQuantity
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async updateChipValue(req, res, next) {
        const validationSchema = {
            chipId: Joi.string().required(),
            chipQuantity: Joi.string().required()

        };
        try {
            let validatedBody = await Joi.validate(req.body, validationSchema);
            let adminResult = await findUser({ _id: req.userId, userType: userType.ADMIN, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let chipValue = await findChip({ _id: validatedBody.chipId, status: { $ne: status.DELETE } });
            if (!chipValue) {
                throw apiError.notFound(responseMessage.CHIP_NOT_FOUND);
            }
            let updateRes = await updateChip({ _id: chipValue._id }, { chipQuantity: validatedBody.chipQuantity })
            return res.json(new response(updateRes, responseMessage.UPDATE_SUCCESS))
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/transactionListParticularUser:
     *   get:
     *     tags:
     *       - USER MANAGEMENT
     *     description: get transaction list for particular user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: userId
     *         description: userId
     *         in: query
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
     *         description: Data found successfully.
     *       404:
     *         description: Data not found.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async transactionListParticularUser(req, res, next) {
        const validationSchema = {
            userId: Joi.string().required(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.string().optional(),
            limit: Joi.string().optional(),
            transactionType: Joi.string().optional()

        };
        try {
            let validatedBody = await Joi.validate(req.query, validationSchema);
            let adminResult = await findUser({ _id: req.userId, userType: userType.ADMIN, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let transactionHistory = await transactionPaginateSearch(validatedBody)
            if (transactionHistory.docs.length == 0) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND)
            }
            return res.json(new response(transactionHistory, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/userGameActivityListParticularUser:
     *   get:
     *     tags:
     *       - USER MANAGEMENT
     *     description:  user game activity list for particular user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: userId
     *         description: userId
     *         in: query
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
     *       - name: gameType
     *         description: gameType
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Data found successfully.
     *       404:
     *         description: Data not found.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async userGameActivityListParticularUser(req, res, next) {
        const validationSchema = {
            userId: Joi.string().required(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.string().optional(),
            limit: Joi.string().optional(),
            gameType: Joi.string().optional()

        };
        try {
            let validatedBody = await Joi.validate(req.query, validationSchema);
            let adminResult = await findUser({ _id: req.userId, userType: userType.ADMIN, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let userGameActivityResult = await userGameActivitySearch(validatedBody)
            if (userGameActivityResult.docs.length == 0) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND)
            }
            return res.json(new response(userGameActivityResult, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/requestWithdrawAccount:
     *   get:
     *     tags:
     *       - USER MANAGEMENT
     *     description: Get all request withdraw account.
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
     *       - name: requestStatus
     *         description: requestStatus
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Data found successfully.
     *       404:
     *         description: Data not found.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async requestWithdrawAccount(req, res, next) {
        const validationSchema = {
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.string().optional(),
            limit: Joi.string().optional(),
            requestStatus: Joi.string().optional()

        };
        try {
            let validatedBody = await Joi.validate(req.query, validationSchema);
            let adminResult = await findUser({ _id: req.userId, userType: userType.ADMIN, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let transactionHistory = await requestWithdrawAccountPagination(validatedBody)
            if (transactionHistory.docs.length == 0) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND)
            }
            return res.json(new response(transactionHistory, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/viewRequestedBank:
     *   get:
     *     tags:
     *       - USER MANAGEMENT
     *     description: View requested bank account
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: accountId
     *         description: accountId
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: User found successfully.
     *       404:
     *         description: User not found.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async viewRequestedBank(req, res, next) {
        const validationSchema = {
            accountId: Joi.string().required(),

        };
        try {
            let validatedBody = await Joi.validate(req.query, validationSchema);
            let adminResult = await findUser({ _id: req.userId, userType: userType.ADMIN, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let checkBankAccount = await findRequestForWithdraw({ _id: validatedBody.accountId, status: { $ne: status.DELETE } })
            if (!checkBankAccount) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND)
            }
            return res.json(new response(checkBankAccount, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/approveRejectRequest:
     *   put:
     *     tags:
     *       - USER MANAGEMENT
     *     description: Approve request 
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
     *       - name: bankId
     *         description: bankId
     *         in: formData
     *         required: false
     *       - name: reason
     *         description: reason
     *         in: formData
     *         required: false
     *       - name: requestStatus
     *         description: requestStatus (APPROVE,REJECT)
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: User found successfully.
     *       404:
     *         description: User not found.
     *       500:
     *         description: Internal Server Error
     *       501:
     *         description: Something went wrong!
     */
    async approveRejectRequest(req, res, next) {
        const validationSchema = {
            accountId: Joi.string().required(),
            bankId: Joi.string().optional(),
            requestStatus: Joi.string().required(),
            reason: Joi.string().optional()
        };
        try {
            let validatedBody = await Joi.validate(req.body, validationSchema);
            let adminResult = await findUser({ _id: req.userId, userType: userType.ADMIN, status: { $ne: status.DELETE } });
            if (!adminResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let checkBankAccount = await findRequestForWithdraw({ _id: validatedBody.accountId, status: { $ne: status.DELETE } })
            if (!checkBankAccount) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND)
            }
            if (checkBankAccount.requestStatus == requestStatus.APPROVE) {
                throw apiError.badRequest(responseMessage.BANK_ALREADY_APPROVE)
            }
            if (validatedBody.requestStatus == requestStatus.APPROVE) {
                if (!validatedBody.bankId) {
                    throw apiError.badRequest(responseMessage.REQUIRE_BANKID)
                }
                let updateRes = await updateRequestForWithdraw({ _id: checkBankAccount._id }, { accountId: validatedBody.bankId, requestStatus: requestStatus.APPROVE })
                return res.json(new response(updateRes, responseMessage.BANK_APPROVE));
            }
            if (!validatedBody.reason) {
                throw apiError.badRequest(responseMessage.REQUIRE_REASON)
            }
            let updateRes = await updateRequestForWithdraw({ _id: checkBankAccount._id }, { requestStatus: requestStatus.REJECT })
            return res.json(new response(updateRes, responseMessage.BANK_REJECT));
        } catch (error) {
            return next(error);
        }
    }

}
export default new adminController()