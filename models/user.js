const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id:{type:Schema.Types.ObjectId},
    firstName: String,
    lastName: String,
    mobile:String,
    passcode:Number,
    balance:{type:Number,default:0.0},
    password: String,
    isApproved: {type: Boolean, default: false},
    actions:[
        {
            title:String,
            details: String,
            sum:Number,
            createdAt: {type: Date, default: Date.now},

        }
    ],
    createdAt: {type: Date, default: Date.now},
})

module.exports = mongoose.model('User', userSchema);