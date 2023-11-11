import Joi from "joi";
import Mongoose from "mongoose";
import _ from "lodash";
import config from "config";
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response';
import bcrypt from 'bcryptjs';
import responseMessage from '../../../../../assets/responseMessage';
import userModel from '../../../../models/user'
import staticModel from '../../../../models/static';
import commonFunction from '../../../../helper/util';
import jwt from 'jsonwebtoken';
import status from '../../../../enums/status';
import auth from "../../../../helper/auth"
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import bcryptjs from 'bcryptjs';
import userType from "../../../../enums/userType";
import { token } from "morgan";
import { staticServices } from "../../services/static"
const { createStaticContent, findStaticContent, updateStaticContent, staticContentList } = staticServices
import { userServices } from "../../services/user"
const {findUser} = userServices


export class staticController {

    /**
     * @swagger
     * /static/staticContentList:
     *   get:
     *     tags:
     *       - STATIC
     *     description: staticContentList
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async staticContentList(req, res, next) {
        try {
            var result = await staticContentList({ status: { $ne: status.DELETE } });
            if (result.length == 0) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /static/staticContentView:
     *   get:
     *     tags:
     *       - STATIC
     *     description: staticContentView
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: staticId
     *         description: staticId
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async staticContentView(req, res, next) {
        const validationSchema = {
            staticId: Joi.string().required()
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            var result = await findStaticContent({ _id: validatedBody.staticId, status: { $ne: status.DELETE } });
            if (!result) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /static/editStaticContent:
     *   put:
     *     tags:
     *       - STATIC
     *     description: editStaticContent
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: staticId
     *         description: staticId
     *         in: formData
     *         required: true
     *       - name: title
     *         description: title
     *         in: formData
     *         required: false
     *       - name: description
     *         description: description
     *         in: formData
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async editStaticContent(req, res, next) {
        const validationSchema = {
            staticId: Joi.string().required(),
            title: Joi.string().optional(),
            description: Joi.string().optional(),

        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({ _id: req.userId, userType: userType.ADMIN });
            if (!userResult) {
                throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
            let staticRes = await findStaticContent({ _id: validatedBody.staticId, status: { $ne: status.DELETE } })
            if (!staticRes) throw apiError.notFound(responseMessage.DATA_NOT_FOUND)
            var result = await updateStaticContent({ _id: staticRes._id }, validatedBody)
            return res.json(new response(result, responseMessage.UPDATE_SUCCESS));
        } catch (error) {
            console.log("===erororrr=====>>>138", error)
            return next(error);
        }
    }
}
export default new staticController();