import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()


    .use(auth.verifyToken)
    .get('/listRoom', controller.listRoom)
    .get('/viewRoom', controller.viewRoom)
    .put('/editRoom', controller.editRoom)
    // .put('/joinRoom', controller.joinRoom)
    .put('/enableDisableLiveGame', controller.enableDisableLiveGame)