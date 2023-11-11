const express = require('express')
import controller from "./controller";



export default express.Router()

    // .post('/',controller.checkSignature)
    .post('/webhook', express.raw({ type: 'application/json' }), controller.checkSignature)
