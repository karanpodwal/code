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
import qrcode from 'qrcode';
import { token } from "morgan";
import { userServices } from "../../services/user"
const { findUser } = userServices
import { categoryServices } from "../../services/category"
const { createCatagory, findCatagory, updateCatagory, categoryList } = categoryServices;


export class categoryController {

    /**
     * @swagger
     * /category/listCategory:
     *   get:
     *     tags:
     *       - CATEGORY MANAGEMENT
     *     description: listCategory
     *     produces:
     *       - application/json
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

    async listCategory(req, res, next) {
        try {
            var result = await categoryList({ status: { $ne: status.DELETE } });
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
     * /category/viewCategory:
     *   get:
     *     tags:
     *       - CATEGORY MANAGEMENT
     *     description: viewCategory
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: categoryId
     *         description: categoryId
     *         in: query
     *         required: true
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

    async viewCategory(req, res, next) {
        try {
            var result = await findCatagory({ _id: req.query.categoryId, status: { $ne: status.DELETE } });
            if (result.length == 0) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }
}
export default new categoryController();