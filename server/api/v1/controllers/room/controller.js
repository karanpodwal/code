import Joi from "joi";
import Mongoose from "mongoose";
import _ from "lodash";
import config from "config";
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response';
import responseMessage from '../../../../../assets/responseMessage';
import commonFunction from '../../../../helper/util';
import status from '../../../../enums/status';
import { token } from "morgan";
import userType from "../../../../enums/userType";
import { userServices } from "../../services/user"
const { findUser, updateUser } = userServices
import { quizQuestionServices } from "../../services/quizQuestion"
const { createQuizQuestion, findQuizQuestion, updateQuizQuestion, quizQuestionList, quizQuestionPaginateSearch } = quizQuestionServices
import { quizAnswerServices } from "../../services/quizAnswer"
const { createQuizAnswer, findQuizAnswer, updateQuizAnswer, quizAnswerList } = quizAnswerServices
import { categoryServices } from "../../services/category"
const { findCatagory } = categoryServices;
import { roomServices } from "../../services/room"
const { findRoom, updateRoom, roomList } = roomServices


export class roomController {

    /**
     * @swagger
     * /room/listRoom:
     *   get:
     *     tags:
     *       - ROOM MANAGEMENT
     *     description: listRoom for user
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
    async listRoom(req, res, next) {
        try {
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USERS_NOT_FOUND);
            }
            let result
            if (userResult.userType == userType.ADMIN) {
                result = await roomList({ status: { $ne: status.DELETE } })
            } else {
                result = await roomList({ islive: true, status: { $ne: status.DELETE } })
            }
            if (result.length == 0) {
                throw apiError.notFound(responseMessage.ROOM_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.ROOM_FOUND));
        } catch (error) {
            console.log("59===error=====>>>", error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /room/viewRoom:
     *   get:
     *     tags:
     *       - ROOM MANAGEMENT
     *     description: viewRoom for user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: roomId
     *         description: roomId
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async viewRoom(req, res, next) {
        const validationSchema = {
            roomId: Joi.string().required(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USERS_NOT_FOUND);
            }
            let result = await findRoom({ _id: validatedBody.roomId, status: { $ne: status.DELETE } })
            if (!result) {
                throw apiError.notFound(responseMessage.ROOM_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.ROOM_FOUND));
        } catch (error) {
            console.log("99===error=====>>>", error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /room/editRoom:
     *   put:
     *     tags:
     *       - ROOM MANAGEMENT
     *     description: editRoom for admin
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: roomId
     *         description: roomId
     *         in: formData
     *         required: true
     *       - name: fromTime
     *         description: fromTime
     *         in: formData
     *         required: false
     *       - name: toTime
     *         description: toTime
     *         in: formData
     *         required: false
     *       - name: name
     *         description: name
     *         in: formData
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async editRoom(req, res, next) {
        const validationSchema = {
            roomId: Joi.string().required(),
            fromTime: Joi.string().optional(),
            toTime: Joi.string().optional(),
            name: Joi.string().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USERS_NOT_FOUND);
            }
            let result = await findRoom({ _id: validatedBody.roomId, status: { $ne: status.DELETE } })
            if (!result) {
                throw apiError.notFound(responseMessage.ROOM_NOT_FOUND);
            }
            let updateRes = await updateRoom({ _id: result._id }, validatedBody)
            return res.json(new response(updateRes, responseMessage.ROOM_UPDATE));
        } catch (error) {
            console.log("59===error=====>>>", error)
            return next(error);
        }
    }

    // /**
    //  * @swagger
    //  * /room/joinRoom:
    //  *   put:
    //  *     tags:
    //  *       - ROOM MANAGEMENT
    //  *     description: joinRoom for user
    //  *     produces:
    //  *       - application/json
    //  *     parameters:
    //  *       - name: token
    //  *         description: token
    //  *         in: header
    //  *         required: true
    //  *       - name: roomId
    //  *         description: roomId
    //  *         in: formData
    //  *         required: true
    //  *       - name: categoryId
    //  *         description: categoryId
    //  *         in: formData
    //  *         required: false
    //  *       - name: bidAmount
    //  *         description: bidAmount
    //  *         in: formData
    //  *         required: false
    //  *     responses:
    //  *       200:
    //  *         description: Returns success message
    //  */
    // async joinRoom(req, res, next) {
    //     const validationSchema = {
    //         roomId: Joi.string().required(),
    //         categoryId: Joi.string().optional(),
    //         bidAmount: Joi.string().optional()
    //     };
    //     try {
    //         const validatedBody = await Joi.validate(req.body, validationSchema);
    //         let userResult = await findUser({ _id: req.userId, userType: userType.USER, status: { $ne: status.DELETE } });
    //         if (!userResult) {
    //             throw apiError.notFound(responseMessage.USERS_NOT_FOUND);
    //         }
    //         let result = await findRoom({ _id: validatedBody.roomId, status: { $ne: status.DELETE } })
    //         if (!result) {
    //             throw apiError.notFound(responseMessage.ROOM_NOT_FOUND);
    //         }
    //         let categoryRes = await findCatagory({ _id: validatedBody.categoryId, status: { $ne: status.DELETE } })
    //         if (!categoryRes) {
    //             throw apiError.notFound(responseMessage.CATEGORY_NOT_FOUND);
    //         }
    //         let roomRes = await findRoom({ _id: result._id, 'joinUser.userId': userResult._id, status: { $ne: status.DELETE } })
    //         if (roomRes) {
    //             throw apiError.conflict(responseMessage.ALREADY_JOIN_ROOM);
    //         }
    //         let obj = {
    //             userId: userResult._id,
    //             categoryId: categoryRes._id,
    //             amount: validatedBody.amount
    //         }
    //         let updateRes = await updateRoom({ _id: result._id }, { $push: { joinUser: obj } })
    //         return res.json(new response(updateRes, responseMessage.JOIN_ROOM));
    //     } catch (error) {
    //         console.log("59===error=====>>>", error)
    //         return next(error);
    //     }
    // }

    /**
     * @swagger
     * /room/enableDisableLiveGame:
     *   put:
     *     tags:
     *       - ROOM MANAGEMENT
     *     description: enableDisableLiveGame for admin
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: roomId
     *         description: roomId
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async enableDisableLiveGame(req, res, next) {
        const validationSchema = {
            roomId: Joi.string().required()
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let result = await findRoom({ _id: validatedBody.roomId, status: { $ne: status.DELETE } })
            if (!result) {
                throw apiError.notFound(responseMessage.ROOM_NOT_FOUND)
            }
            if (result.islive == true) {
                let updateRes = await updateRoom({ _id: result._id }, { islive: false })
                return res.json(new response(updateRes, responseMessage.LIVE_DISABLE));
            }
            let updateRes = await updateRoom({ _id: result._id }, { islive: true })
            return res.json(new response(updateRes, responseMessage.LIVE_ENABLE));
        } catch (error) {
            console.log("274===erororrr=====>>>", error)
            return next(error);
        }
    }

    roomListForSocket(req) {
        let response = {};
        return new Promise(async (resolve, reject) => {
            let findRes = await roomList({ islive: true, status: { $ne: status.DELETE } })
            if (findRes.length == 0) {
                response = { responseCode: 404, responseMessage: "Data not found", result: [], };
                resolve(response);
            } else {
                response = { responseCode: 200, responseMessage: "Data found successfully.", result: findRes, };
                resolve(response);
            }
        });
    }

}
export default new roomController();