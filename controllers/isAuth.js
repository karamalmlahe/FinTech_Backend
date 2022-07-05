const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = (request, response, next) => {

    const bearerHeader = request.headers['authorization'];
    if(bearerHeader){

        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];

        jwt.verify(bearerToken, process.env.JWT_PRIVATE_KEY, (err,authData) => {
            if(err){
                return response.sendStatus(403);
            } else {
                User.findById(authData._id)
                .then(account => {
                    if(account){
                        request.token = bearerToken;
                        request.account = account;
                        next();
                    }
                    else{
                        return response.sendStatus(403);
                    }

                })
                .catch(err => {
                    return response.sendStatus(403);
                })
            }
        })

    } else {
        return response.sendStatus(403);
    }


}