import Express from "express";
import controller from "./controller";
import auth from '../../../../helper/auth'
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

    .post('/login', controller.login)
    .post('/forgotPassword', controller.forgotPassword)
    .patch('/verifyOTP', controller.verifyOTP)
    .post('/resendOtp', controller.resendOtp)
    .get('/getChipValue', controller.getChipValue)
    .use(auth.verifyToken)
    .get('/getProfile', controller.getProfile)
    .patch('/changePassword', controller.changePassword)
    .post('/resetPassword', controller.resetPassword)
    .get('/userList', controller.userList)
    .get('/viewUser', controller.viewUser)
    .put('/activeBlockUser', controller.activeBlockUser)
    .get('/allTransactionList', controller.allTransactionList)
    .put('/updateChipValue', controller.updateChipValue)
    .get('/transactionListParticularUser', controller.transactionListParticularUser)
    .get('/userGameActivityListParticularUser', controller.userGameActivityListParticularUser)
    .get('/requestWithdrawAccount', controller.requestWithdrawAccount)
    .get('/viewRequestedBank', controller.viewRequestedBank)
    .put('/approveRejectRequest', controller.approveRejectRequest)
    


    .use(upload.uploadFile)









