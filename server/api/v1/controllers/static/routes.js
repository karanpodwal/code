import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

    .get('/staticContentList', controller.staticContentList)
    .get('/staticContentView', controller.staticContentView)
    .use(auth.verifyToken)
    .put('/editStaticContent', controller.editStaticContent)









