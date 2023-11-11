import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

    .get('/viewQuiz', controller.viewQuiz)
    .post('/playQuizForGuestUser', controller.playQuizForGuestUser)
    .get('/listQuizForGuestUser', controller.listQuizForGuestUser)
    .use(auth.verifyToken)
    .post('/addQuiz', controller.addQuiz)
    .put('/activeQuizForUser', controller.activeQuizForUser)
    .get('/listQuiz', controller.listQuiz)
    .put('/editQuiz', controller.editQuiz)
    .delete('/deleteQuiz', controller.deleteQuiz)
    .get('/listQuizForUser', controller.listQuizForUser)
    .post('/playQuiz', controller.playQuiz)
    .put('/addAndEditQuiz', controller.addAndEditQuiz)
    .get('/viewQuizForAdmin', controller.viewQuizForAdmin)