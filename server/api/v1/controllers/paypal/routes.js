import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth"


export default Express.Router()


.get('/generateAccessToken', controller.generateAccessToken)

//********************** Updated api routes **********************************/

.get('/success', controller.success)
.get('/failure', controller.failure)
.get('/executePayout/:batchId', controller.executePayout)
.get('/paymentHistory/:batchId', controller.paymentHistory)


.use(auth.verifyToken)
.post('/buyChip', controller.buyChip)
.post('/withdraw', controller.withdraw)
