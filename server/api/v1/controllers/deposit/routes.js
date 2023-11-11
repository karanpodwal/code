import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth"


export default Express.Router()

.get('/success', controller.success)
.get('/cancel', controller.cancel)
.use(auth.verifyToken)
// .post('/userDosit', controller.userDosit)
.post('/paypal', controller.paypal)
.post('/createpayment', controller.createpayment)



  
  
  
