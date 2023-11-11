import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

   
    .post('/signUp', controller.signup)
    .patch('/verifyOTP', controller.verifyOTP)
    .post('/login', controller.login)
    .post('/forgotPassword', controller.forgotPassword)
    .post('/resendOtp', controller.resendOtp)
    .post('/spinPlayForGuestUser', controller.spinPlayForGuestUser)
    .get('/coinAcceptance', controller.coinAcceptance)
    .get('/checkIpAddress', controller.checkIpAddress)
    .use(auth.verifyToken)
    .get('/getProfile', controller.getProfile)
    .patch('/changePassword', controller.changePassword)
    .post('/resetPassword', controller.resetPassword)
    .post('/deposit', controller.deposit)
    .post('/spinPlay', controller.spinPlay)
    .put('/editProfile', controller.editProfile)
    .post('/createStripeToken',controller.createStripeToken)
    .get('/transactionHistory',controller.transactionHistory)
    .post('/depositWithCoinPayment',controller.depositWithCoinPayment)
    .post('/spinPlayV1', controller.spinPlayV1)
    .post('/withdraw',controller.withdraw)
    .post('/AddBank',controller.AddBank)
    .get('/getMyBankAccount',controller.getMyBankAccount)

    .use(upload.uploadFile)
    .post('/uploadFile', controller.uploadFile)









