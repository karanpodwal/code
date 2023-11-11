import Joi from "joi";
import Mongoose from "mongoose";
import _ from "lodash";
import config from "config";
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response';
import responseMessage from '../../../../../assets/responseMessage';
import userModel from '../../../../models/user'
import staticModel from '../../../../models/static';
import commonFunction from '../../../../helper/util';
import jwt from 'jsonwebtoken';
import status from '../../../../enums/status';
import moment from "moment";
import { token } from "morgan";
import userType from "../../../../enums/userType";
import { userServices } from "../../services/user"
const { findUser, updateUser } = userServices
import { quizQuestionServices } from "../../services/quizQuestion"
const { createQuizQuestion, findQuizQuestion, updateQuizQuestion, multiUpdateStatus,quizQuestionList, quizQuestionPaginateSearch } = quizQuestionServices
import { quizAnswerServices } from "../../services/quizAnswer"
const { createQuizAnswer, findQuizAnswer, updateQuizAnswer, quizAnswerList } = quizAnswerServices
import { categoryServices } from "../../services/category"
const { findCatagory } = categoryServices;
import { roomServices } from "../../services/room"
const { createRoom, findRoom, updateRoom, roomList } = roomServices
import transactionName from '../../../../enums/transactionName'
import transactionType from '../../../../enums/transactionType'
import { transactionServices } from '../../services/transaction'
const { createTransaction, findTransaction, updateTransaction, transactionList } = transactionServices
import { userGameActivityServices } from "../../services/userGameActivity";
const { createUserGameActivity } = userGameActivityServices
import gameType from "../../../../enums/gameType"
import finalResult from "../../../../enums/finalResult";
import quizType from "../../../../enums/quizType";


export class quizController {



    /**
     * @swagger
     * /quiz/listQuiz:
     *   get:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: listQuiz for admin
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
     *       - name: quizType
     *         description: quizType
     *         in: query
     *         required: false
     *       - name: quizStatus
     *         description: quizStatus
     *         in: query
     *         required: false
     *       - name: isActive
     *         description: isActive
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async listQuiz(req, res, next) {
        const validationSchema = {
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.string().optional(),
            limit: Joi.string().optional(),
            quizType: Joi.string().optional(),
            quizStatus: Joi.string().optional(),
            isActive: Joi.string().optional()
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let result = await quizQuestionPaginateSearch(validatedBody)
            if (result.docs.length == 0) {
                throw apiError.notFound(responseMessage.QUIZ_NOT_FOUND)
            }
            return res.json(new response(result, responseMessage.QUIZ_FOUND));
        } catch (error) {
            console.log("108===erororrr=====>>>", error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /quiz/viewQuiz:
     *   get:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: viewQuiz for admin
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: quizQuestionId
     *         description: quizQuestionId
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async viewQuiz(req, res, next) {
        const validationSchema = {
            quizQuestionId: Joi.string().required()
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let result = await findQuizQuestion({ _id: validatedBody.quizQuestionId, status: { $ne: status.DELETE } })
            if (!result) {
                throw apiError.notFound(responseMessage.QUIZ_NOT_FOUND)
            }
            return res.json(new response(result, responseMessage.QUIZ_FOUND));
        } catch (error) {
            console.log("219===erororrr=====>>>", error)
            return next(error);
        }
    }



    /**
     * @swagger
     * /quiz/deleteQuiz:
     *   delete:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: deleteQuiz by admin
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: quizQuestionId
     *         description: quizQuestionId
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async deleteQuiz(req, res, next) {
        const validationSchema = {
            quizQuestionId: Joi.string().required()
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let result = await findQuizQuestion({ _id: validatedBody.quizQuestionId, status: { $ne: status.DELETE } })
            if (!result) {
                throw apiError.notFound(responseMessage.QUIZ_NOT_FOUND)
            }
            let deleteRes = await updateQuizQuestion({ _id: result._id }, { status: status.DELETE })
            await updateQuizAnswer({ quizQuestionId: result._id }, { status: status.DELETE })
            return res.json(new response(deleteRes, responseMessage.QUIZ_DELETE));
        } catch (error) {
            console.log("219===erororrr=====>>>", error)
            return next(error);
        }
    }


    /**
     * @swagger
     * /quiz/listQuizForUser:
     *   get:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: listQuizForUser for user
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
     *       - name: quizType
     *         description: quizType (PAID,FREE)
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async listQuizForUser(req, res, next) {
        const validationSchema = {
            roomId: Joi.string().required(),
            quizType: Joi.string().required(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.USER });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USERS_NOT_FOUND);
            }
            let result = await findQuizQuestion({ roomId: validatedBody.roomId, isActive: true, quizType: validatedBody.quizType, status: { $ne: status.DELETE } })
            if (!result) {
                throw apiError.notFound(responseMessage.QUIZ_NOT_FOUND)
            }
            // let randomNumber = Math.floor(Math.random() * Number(result.length))
            // let dataRes = result.at(randomNumber)
            return res.json(new response(result, responseMessage.QUIZ_FOUND));
        } catch (error) {
            console.log("219===erororrr=====>>>", error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /quiz/addQuiz:
     *   post:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: addQuiz by admin
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
     *         required: false
     *       - name: expiryTime
     *         description: expiryTime
     *         in: formData
     *         required: false
     *       - name: question
     *         description: question
     *         in: formData
     *         required: true
     *       - name: optionA
     *         description: optionA
     *         in: formData
     *         required: true
     *       - name: optionB
     *         description: optionB
     *         in: formData
     *         required: true
     *       - name: optionC
     *         description: optionC
     *         in: formData
     *         required: true
     *       - name: optionD
     *         description: optionD
     *         in: formData
     *         required: true
     *       - name: quizAnswer
     *         description: quizAnswer
     *         in: formData
     *         required: true
     *       - name: url
     *         description: url
     *         in: formData
     *         required: true
     *       - name: mediaType
     *         description: mediaType (mp3/video)
     *         in: formData
     *         required: true
     *       - name: quizType
     *         description: quizType (PAID/FREE)
     *         in: formData
     *         required: true
     *       - name: description
     *         description: description
     *         in: formData
     *         required: true
     *       - name: title
     *         description: title
     *         in: formData
     *         required: false
     *       - name: quizStatus
     *         description: quizStatus (LIVE / NON-LIVE)
     *         in: formData
     *         required: false
     *       - name: isActive
     *         description: isActive (true / false)
     *         in: formData
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async addQuiz(req, res, next) {
        const validationSchema = {
            roomId: Joi.string().optional(),
            question: Joi.string().required(),
            optionA: Joi.string().required(),
            optionB: Joi.string().required(),
            optionC: Joi.string().required(),
            optionD: Joi.string().required(),
            quizAnswer: Joi.string().required(),
            url: Joi.string().required(),
            mediaType: Joi.string().required(),
            quizType: Joi.string().required(),
            description: Joi.string().required(),
            expiryTime: Joi.number().optional(),
            title: Joi.string().optional(),
            quizStatus: Joi.string().optional(),
            isActive: Joi.boolean().optional(), 
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            if (validatedBody.quizType == "PAID") {
                if (validatedBody.roomId == null || validatedBody.roomId == undefined || validatedBody.roomId.length == 0) {
                    throw apiError.badRequest(responseMessage.ROOM_REQUIRED)
                }
                let roomFindRes = await findRoom({ _id: validatedBody.roomId, status: { $ne: status.DELETE } })
                if (!roomFindRes) {
                    throw apiError.notFound(responseMessage.ROOM_NOT_FOUND)
                }
                validatedBody.userId = userResult._id
                let result = await createQuizQuestion(validatedBody)
                let obj1 = {
                    quizQuestionId: result._id,
                    quizAnswer: validatedBody.quizAnswer,
                    userId: userResult._id
                }
                await createQuizAnswer(obj1)
                return res.json(new response(result, responseMessage.ADD_QUIZ));
            } else {
                validatedBody.userId = userResult._id
                let result = await createQuizQuestion(validatedBody)
                let obj1 = {
                    quizQuestionId: result._id,
                    quizAnswer: validatedBody.quizAnswer,
                    userId: userResult._id
                }
                await createQuizAnswer(obj1)
                return res.json(new response(result, responseMessage.ADD_QUIZ));
            }
        } catch (error) {
            console.log("108===erororrr=====>>>", error)
            return next(error);
        }
    }
    /**
     * @swagger
     * /quiz/editQuiz:
     *   put:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: editQuiz by admin
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
     *         required: false
     *       - name: quizId
     *         description: quizId
     *         in: formData
     *         required: false
     *       - name: expiryTime
     *         description: expiryTime
     *         in: formData
     *         required: false
     *       - name: question
     *         description: question
     *         in: formData
     *         required: true
     *       - name: optionA
     *         description: optionA
     *         in: formData
     *         required: true
     *       - name: optionB
     *         description: optionB
     *         in: formData
     *         required: true
     *       - name: optionC
     *         description: optionC
     *         in: formData
     *         required: true
     *       - name: optionD
     *         description: optionD
     *         in: formData
     *         required: true
     *       - name: quizAnswer
     *         description: quizAnswer
     *         in: formData
     *         required: true
     *       - name: url
     *         description: url
     *         in: formData
     *         required: true
     *       - name: mediaType
     *         description: mediaType (mp3 / video)
     *         in: formData
     *         required: true
     *       - name: quizType
     *         description: quizType (PAID / FREE)
     *         in: formData
     *         required: true
     *       - name: description
     *         description: description
     *         in: formData
     *         required: true
     *       - name: quizStatus
     *         description: quizStatus (LIVE / NON-LIVE)
     *         in: formData
     *         required: false
     *       - name: isActive
     *         description: isActive (true / false)
     *         in: formData
     *         required: false
     *       - name: title
     *         description: title
     *         in: formData
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async editQuiz(req, res, next) {
        const validationSchema = {
            roomId: Joi.string().optional(),
            quizId: Joi.string().optional(),
            question: Joi.string().required(),
            optionA: Joi.string().required(),
            optionB: Joi.string().required(),
            optionC: Joi.string().required(),
            optionD: Joi.string().required(),
            quizAnswer: Joi.string().required(),
            url: Joi.string().required(),
            mediaType: Joi.string().required(),
            quizType: Joi.string().required(),
            description: Joi.string().required(),
            expiryTime: Joi.number().optional(),
            quizStatus: Joi.string().optional(),
            isActive: Joi.boolean().optional(),
            title: Joi.string().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            var result,quizQuestionRes;
            // let quizQuestionRes = await findQuizQuestion({ _id: validatedBody.quizId, status: { $ne: status.DELETE } })
            // if (!quizQuestionRes) {
            //     throw apiError.notFound(responseMessage.QUIZ_NOT_FOUND)
            // }
            if(validatedBody.quizType == "PAID" && validatedBody.quizStatus == "LIVE"){
                if (validatedBody.roomId == null || validatedBody.roomId == undefined || validatedBody.roomId.length == 0) {
                    throw apiError.badRequest(responseMessage.ROOM_REQUIRED)
                }
                let roomFindRes = await findRoom({ _id: validatedBody.roomId, status: { $ne: status.DELETE } })
                if (roomFindRes) {
                    await multiUpdateStatus({roomId:roomFindRes._id, quizType: "PAID", quizStatus: "LIVE" }, {isActive: false}); 
                }
                quizQuestionRes = await findQuizQuestion({ _id: validatedBody.quizId, status: { $ne: status.DELETE } })

                if(quizQuestionRes){
                    result = await updateQuizQuestion({ _id: quizQuestionRes._id }, validatedBody)
                    let findQuizAnswerRes = await findQuizAnswer({ quizQuestionId: result._id, status: status.ACTIVE });
                    await updateQuizAnswer({ _id: findQuizAnswerRes._id }, { quizAnswer: validatedBody.quizAnswer, userId: userResult._id });
                }else{
                    validatedBody.userId = userResult._id
                    result = await createQuizQuestion(validatedBody)
                    let obj1 = {
                        quizQuestionId: result._id,
                        quizAnswer: validatedBody.quizAnswer,
                        userId: userResult._id
                    }
                    await createQuizAnswer(obj1)
                }
            }else if(validatedBody.quizType == "FREE" && validatedBody.quizStatus == "LIVE"){
                let roomFindRes = await findRoom({ _id: validatedBody.roomId, status: { $ne: status.DELETE } })
                if (roomFindRes) {
                    await multiUpdateStatus({roomId:roomFindRes._id, quizType: "FREE", quizStatus: "LIVE" }, {isActive: false}); 
                }
                quizQuestionRes = await findQuizQuestion({ _id: validatedBody.quizId, status: { $ne: status.DELETE } });
                if(quizQuestionRes){
                    result = await updateQuizQuestion({ _id: quizQuestionRes._id }, validatedBody);
                    let findQuizAnswerRes = await findQuizAnswer({ quizQuestionId: result._id, status: status.ACTIVE });
                    await updateQuizAnswer({ _id: findQuizAnswerRes._id }, { quizAnswer: validatedBody.quizAnswer, userId: userResult._id });
                }else{
                    validatedBody.userId = userResult._id
                    result = await createQuizQuestion(validatedBody)
                    let obj1 = {
                        quizQuestionId: result._id,
                        quizAnswer: validatedBody.quizAnswer,
                        userId: userResult._id
                    }
                    await createQuizAnswer(obj1)
                }

            }else if(validatedBody.quizType == "FREE" && validatedBody.quizStatus == "NON-LIVE") {
                quizQuestionRes = await findQuizQuestion({ _id: validatedBody.quizId, status: { $ne: status.DELETE } });
                await multiUpdateStatus({quizType: "FREE", quizStatus: "NON-LIVE"}, {isActive: false}); 
                if(quizQuestionRes){
                    result = await updateQuizQuestion({ _id: quizQuestionRes._id }, validatedBody);
                    let findQuizAnswerRes = await findQuizAnswer({ quizQuestionId: result._id, status: status.ACTIVE });
                    await updateQuizAnswer({ _id: findQuizAnswerRes._id }, { quizAnswer: validatedBody.quizAnswer, userId: userResult._id });
                }else{
                    validatedBody.userId = userResult._id
                    result = await createQuizQuestion(validatedBody)
                    let obj1 = {
                        quizQuestionId: result._id,
                        quizAnswer: validatedBody.quizAnswer,
                        userId: userResult._id
                    }
                    await createQuizAnswer(obj1)
                }


            }
            return res.json(new response(result, responseMessage.EDIT_QUIZ));

        } catch (error) {
            console.log("108===erororrr=====>>>", error)
            return next(error);
        }
    }
    /**
     * @swagger
     * /quiz/activeQuizForUser:
     *   put:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: activeQuizForUser
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: activeQuiz
     *         description: update quiz Permission
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/activeQuiz'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async activeQuizForUser(req, res, next) {
      try {
        const validatedBody = await Joi.validate(req.body);
        let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
        if (!userResult) {
            throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
        }
        if(validatedBody.permissions.length == 0){
            throw apiError.notFound(responseMessage.QUIZ_NOT_FOUND)
        }
        for (let element of validatedBody.permissions) {
          let result = await findQuizQuestion({ _id: element._id, status: { $ne: status.DELETE } });
          if(result){
            await updateQuizQuestion({ _id: result._id },{ isActive: element.isActive});
          }
        }
        return res.json(new response({}, responseMessage.UPDATE_SUCCESS));
      } catch (error) {
        console.log("error", error);
        return next(error);
      }
    }

    /**
     * @swagger
     * /quiz/addAndEditQuiz:
     *   put:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: addAndEditQuiz by admin
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
     *         required: false
     *       - name: quizId
     *         description: quizId
     *         in: formData
     *         required: true
     *       - name: question
     *         description: question
     *         in: formData
     *         required: true
     *       - name: optionA
     *         description: optionA
     *         in: formData
     *         required: true
     *       - name: optionB
     *         description: optionB
     *         in: formData
     *         required: true
     *       - name: optionC
     *         description: optionC
     *         in: formData
     *         required: true
     *       - name: optionD
     *         description: optionD
     *         in: formData
     *         required: true
     *       - name: quizAnswer
     *         description: quizAnswer
     *         in: formData
     *         required: true
     *       - name: url
     *         description: url
     *         in: formData
     *         required: true
     *       - name: mediaType
     *         description: mediaType (mp3/video)
     *         in: formData
     *         required: true
     *       - name: quizType
     *         description: quizType (PAID/FREE)
     *         in: formData
     *         required: true
     *       - name: description
     *         description: description
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async addAndEditQuiz(req, res, next) {
        const validationSchema = {
            roomId: Joi.string().optional(),
            question: Joi.string().required(),
            optionA: Joi.string().required(),
            optionB: Joi.string().required(),
            optionC: Joi.string().required(),
            optionD: Joi.string().required(),
            quizAnswer: Joi.string().required(),
            url: Joi.string().required(),
            mediaType: Joi.string().required(),
            quizType: Joi.string().required(),
            description: Joi.string().required(),
            quizId: Joi.string().required(),
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            if (validatedBody.quizType == "PAID") {
                if (validatedBody.roomId == null || validatedBody.roomId == undefined || validatedBody.roomId.length == 0) {
                    throw apiError.badRequest(responseMessage.ROOM_REQUIRED)
                }
                let roomFindRes = await findRoom({ _id: validatedBody.roomId, status: { $ne: status.DELETE } })
                if (!roomFindRes) {
                    throw apiError.notFound(responseMessage.ROOM_NOT_FOUND)
                }
                let quizQuestionRes = await findQuizQuestion({ roomId: roomFindRes._id, _id: validatedBody.quizId, quizType: "PAID", status: { $ne: status.DELETE } })
                if (quizQuestionRes) {
                    let result = await updateQuizQuestion({ _id: quizQuestionRes._id }, validatedBody)
                    let findQuizAnswerRes = await findQuizAnswer({ quizQuestionId: result._id, status: status.ACTIVE })
                    await updateQuizAnswer({ _id: findQuizAnswerRes._id }, { quizAnswer: validatedBody.quizAnswer, userId: userResult._id })
                    return res.json(new response(result, responseMessage.EDIT_QUIZ));
                }
                validatedBody.userId = userResult._id
                let result = await createQuizQuestion(validatedBody)
                let obj1 = {
                    quizQuestionId: result._id,
                    quizAnswer: validatedBody.quizAnswer,
                    userId: userResult._id
                }
                await createQuizAnswer(obj1)
                return res.json(new response(result, responseMessage.EDIT_QUIZ));
            } else {
                let quizQuestionRes = await findQuizQuestion({ quizType: "FREE", _id: validatedBody.quizId, status: { $ne: status.DELETE } })
                if (quizQuestionRes) {
                    let result = await updateQuizQuestion({ _id: quizQuestionRes._id }, validatedBody)
                    let findQuizAnswerRes = await findQuizAnswer({ quizQuestionId: result._id, status: status.ACTIVE })
                    await updateQuizAnswer({ _id: findQuizAnswerRes._id }, { quizAnswer: validatedBody.quizAnswer, userId: userResult._id })
                    return res.json(new response(result, responseMessage.EDIT_QUIZ));
                }
                validatedBody.userId = userResult._id
                let result = await createQuizQuestion(validatedBody)
                let obj1 = {
                    quizQuestionId: result._id,
                    quizAnswer: validatedBody.quizAnswer,
                    userId: userResult._id
                }
                await createQuizAnswer(obj1)
                return res.json(new response(result, responseMessage.EDIT_QUIZ));
            }
        } catch (error) {
            console.log("108===erororrr=====>>>", error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /quiz/playQuiz:
     *   post:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: playQuiz for user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: quizQuestionId
     *         description: quizQuestionId
     *         in: formData
     *         required: true
     *       - name: answer
     *         description: answer
     *         in: formData
     *         required: true
     *       - name: expired
     *         description: expired (true/false)
     *         in: formData
     *         required: true
     *       - name: bidAmount
     *         description: bidAmount
     *         in: formData
     *         required: false
     *       - name: gameType
     *         description: gameType (LIVE/NON_LIVE)
     *         in: formData
     *         required: true
     *       - name: ipAddress
     *         description: ipAddress
     *         in: formData
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async playQuiz(req, res, next) {
        const validationSchema = {
            quizQuestionId: Joi.string().required(),
            answer: Joi.string().required(),
            expired: Joi.string().required(),
            bidAmount: Joi.string().optional(),
            // categoryId: Joi.string().optional(),
            gameType: Joi.string().required(),
            ipAddress: Joi.string().required(),
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.USER });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USERS_NOT_FOUND);
            }
            let result = await findQuizAnswer({ quizQuestionId: validatedBody.quizQuestionId, status: { $ne: status.DELETE } })
            if (!result) {
                throw apiError.notFound(responseMessage.QUIZ_NOT_FOUND)
            }
            let responseObj = {
                rightAnswer: (result.quizAnswer).toLowerCase(),
                givenAnswer: (validatedBody.answer).toLowerCase()
            }
            // let getCountryIsoCode = await commonFunction.activityLogFunction(req, validatedBody.ipAddress)
            // if (getCountryIsoCode.country == 'US') {
            //     if (validatedBody.expired == "false") {
            //         if ((result.quizAnswer).toLowerCase() == (validatedBody.answer).toLowerCase()) {
            //             userGameActivityObj(req, userResult._id, userResult.userType, gameType.QUIZ, finalResult.WIN, quizType.NON_LIVE,validatedBody.ipAddress)
            //             return res.json(new response(responseObj, responseMessage.WIN));
            //         }
            //         userGameActivityObj(req, userResult._id, userResult.userType, gameType.QUIZ, finalResult.LOSE, quizType.NON_LIVE,validatedBody.ipAddress)
            //         return res.json(new response(responseObj, responseMessage.LOSER));
            //     }
            //     userGameActivityObj(req, userResult._id, userResult.userType, gameType.QUIZ, finalResult.LOSE, quizType.NON_LIVE,validatedBody.ipAddress)
            //     return res.json(new response(responseObj, responseMessage.LOSER));
            // }
            if (validatedBody.gameType != "LIVE") {
                if (validatedBody.expired == "false") {
                    if ((result.quizAnswer).toLowerCase() == (validatedBody.answer).toLowerCase()) {
                        userGameActivityObj(req, userResult._id, userResult.userType, gameType.QUIZ, finalResult.WIN, quizType.NON_LIVE,validatedBody.ipAddress)
                        return res.json(new response(responseObj, responseMessage.WIN));
                    }
                    userGameActivityObj(req, userResult._id, userResult.userType, gameType.QUIZ, finalResult.LOSE, quizType.NON_LIVE,validatedBody.ipAddress)
                    return res.json(new response(responseObj, responseMessage.LOSER));
                }
                userGameActivityObj(req, userResult._id, userResult.userType, gameType.QUIZ, finalResult.LOSE, quizType.NON_LIVE,validatedBody.ipAddress)
                return res.json(new response(responseObj, responseMessage.LOSER));
            } else {
                // if (validatedBody.categoryId == null || validatedBody.categoryId == undefined || validatedBody.categoryId.length == 0) {
                //     throw apiError.badRequest(responseMessage.CATEGORY_REQUIRED)
                // }
                if (validatedBody.bidAmount == null || validatedBody.bidAmount == undefined || validatedBody.bidAmount.length == 0) {
                    throw apiError.badRequest(responseMessage.BID_AMOUNT_REQUIRED)
                }
                // let categoryRes = await findCatagory({ _id: validatedBody.categoryId, status: { $ne: status.DELETE } })
                // if (!categoryRes) {
                //     throw apiError.notFound(responseMessage.GAME_CATEGORY_NOT_FOUND);
                // }
                let adminRes = await findUser({ userType: userType.ADMIN, status: { $ne: status.DELETE } })
                if (Number(userResult.balance) < Number(validatedBody.bidAmount)) {
                    throw apiError.badRequest(responseMessage.INSUFFICIENT_BALANCE);
                }
                // if (Number(adminRes.balance) < (Number(validatedBody.bidAmount) * 2)) {
                //     throw apiError.badRequest(responseMessage.GAME_NOT_AVAILBALE);
                // }
                if (validatedBody.expired == "false") {
                    if ((result.quizAnswer).toLowerCase() == (validatedBody.answer).toLowerCase()) {
                        let balance = Number(userResult.balance) + (Number(validatedBody.bidAmount) * 2)
                        let depositObj = await objCreate((Number(validatedBody.bidAmount) * 2), userResult._id, transactionType.DEPOSIT, transactionName.QUIZ_WINNER, adminRes._id)
                        await Promise.all([
                            updateUser({ _id: userResult._id }, { balance: balance }),
                            createTransaction(depositObj),
                            userGameActivityObj(req, userResult._id, userResult.userType, gameType.QUIZ, finalResult.WIN, quizType.LIVE,validatedBody.ipAddress)
                        ])
                        responseObj.amount = Number(validatedBody.bidAmount) * 2
                        return res.json(new response(responseObj, responseMessage.WIN));
                    }
                    let balance = Number(userResult.balance) - Number(validatedBody.bidAmount)
                    let depositObj = await objCreate(Number(validatedBody.bidAmount), userResult._id, transactionType.WITHDRAW, transactionName.QUIZ_LOSER, adminRes._id)
                    await Promise.all([
                        updateUser({ _id: userResult._id }, { balance: balance }),
                        createTransaction(depositObj),
                        userGameActivityObj(req, userResult._id, userResult.userType, gameType.QUIZ, finalResult.LOSE, quizType.LIVE,validatedBody.ipAddress)
                    ])
                    responseObj.amount = Number(validatedBody.bidAmount)
                    return res.json(new response(responseObj, responseMessage.LOSER));
                }
                let balance = Number(userResult.balance) - Number(validatedBody.bidAmount)
                let depositObj = await objCreate(Number(validatedBody.bidAmount), userResult._id, transactionType.WITHDRAW, transactionName.QUIZ_LOSER, adminRes._id)
                await Promise.all([
                    updateUser({ _id: userResult._id }, { balance: balance }),
                    createTransaction(depositObj),
                    userGameActivityObj(req, userResult._id, userResult.userType, gameType.QUIZ, finalResult.LOSE, quizType.LIVE,validatedBody.ipAddress)
                ])
                responseObj.amount = Number(validatedBody.bidAmount)
                return res.json(new response(responseObj, responseMessage.LOSER));
            }
        } catch (error) {
            console.log("854===erororrr=====>>>", error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /quiz/viewQuizForAdmin:
     *   get:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: viewQuizForAdmin for admin
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: quizQuestionId
     *         description: quizQuestionId
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async viewQuizForAdmin(req, res, next) {
        const validationSchema = {
            quizQuestionId: Joi.string().required(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let result = await findQuizQuestion({ _id: validatedBody.quizQuestionId, status: { $ne: status.DELETE } })
            if (!result) {
                throw apiError.notFound(responseMessage.QUIZ_NOT_FOUND)
            }
            let answerRes = await findQuizAnswer({ quizQuestionId: result._id, status: { $ne: status.DELETE } })
            result._doc.dummyKey = answerRes.quizAnswer
            return res.json(new response(result, responseMessage.QUIZ_FOUND));
        } catch (error) {
            console.log("948===erororrr=====>>>", error)
            return next(error);
        }

    }

    /**
     * @swagger
     * /quiz/playQuizForGuestUser:
     *   post:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: playQuizForGuestUser 
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: quizQuestionId
     *         description: quizQuestionId
     *         in: formData
     *         required: true
     *       - name: answer
     *         description: answer
     *         in: formData
     *         required: true
     *       - name: expired
     *         description: expired (true/false)
     *         in: formData
     *         required: true
     *       - name: bidAmount
     *         description: bidAmount
     *         in: formData
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async playQuizForGuestUser(req, res, next) {
        const validationSchema = {
            quizQuestionId: Joi.string().required(),
            answer: Joi.string().required(),
            expired: Joi.string().required(),
            bidAmount: Joi.string().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let result = await findQuizAnswer({ quizQuestionId: validatedBody.quizQuestionId, status: { $ne: status.DELETE } })
            if (!result) {
                throw apiError.notFound(responseMessage.QUIZ_NOT_FOUND)
            }
            let responseObj = {
                rightAnswer: (result.quizAnswer).toLowerCase(),
                givenAnswer: (validatedBody.answer).toLowerCase()
            }
            if (validatedBody.expired == "false") {
                if ((result.quizAnswer).toLowerCase() == (validatedBody.answer).toLowerCase()) {
                    return res.json(new response(responseObj, responseMessage.WIN));
                }
                return res.json(new response(responseObj, responseMessage.LOSER));
            }
            return res.json(new response(responseObj, responseMessage.LOSER));
        } catch (error) {
            console.log("854===erororrr=====>>>", error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /quiz/listQuizForGuestUser:
     *   get:
     *     tags:
     *       - QUIZ MANAGEMENT
     *     description: listQuizForGuestUser for user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: roomId
     *         description: roomId
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async listQuizForGuestUser(req, res, next) {
        try {
            let result
            if (req.query.roomId) {
                result = await findQuizQuestion({ quizType: "FREE", isActive: true, quizStatus: "LIVE", roomId: req.query.roomId, status: { $ne: status.DELETE } })
            } else {
                result = await findQuizQuestion({ quizType: "FREE", isActive: true, quizStatus: "NON-LIVE", status: { $ne: status.DELETE } })
            }
            if (!result) {
                throw apiError.notFound(responseMessage.QUIZ_NOT_FOUND)
            }
            return res.json(new response(result, responseMessage.QUIZ_FOUND));
        } catch (error) {
            console.log("219===erororrr=====>>>", error)
            return next(error);
        }
    }
}
export default new quizController();
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
async function userGameActivityObj(req, userId, userType, gameType, result, quizType,ipAddress) {
    try {
        let logHistory = await commonFunction.activityLogFunction(req,ipAddress)
        let logObj = {
            userId: userId,
            userType: userType,
            gameType: gameType,
            quizType: quizType,
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