import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

    .get('/listCategory', controller.listCategory)
    .get('/viewCategory', controller.viewCategory)
    .use(auth.verifyToken)










