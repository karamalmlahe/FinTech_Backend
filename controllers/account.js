const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const isAuth = require('./isAuth');

const User = require('../models/user');

const generatePasscode = () => {
    return Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
};

router.post('/register', async (req, res) => {

    const { firstName, lastName, mobile, password } = req.body;
    User.findOne({ mobile: mobile })
        .then(async (user) => {
            if (user) {
                return res.status(200).json({
                    status: false,
                    message: 'User is already exist'
                })
            }

            const formatted_password = await bcryptjs.hash(password, 10);
            const _user = new User({
                _id: mongoose.Types.ObjectId(),
                firstName: firstName,
                lastName: lastName,
                mobile: mobile,
                password: formatted_password,
            });
            _user.passcode = generatePasscode();
            const token = await jwt.sign({ _id: _user._id, mobile: _user.mobile }, process.env.JWT_PRIVATE_KEY);
            await _user.save()
                .then((account_created) => {
                    return res.status(200).json({
                        status: true,
                        token
                    })
                })
        })
        .catch((error) => {
            return res.status(500).json({
                status: false,
                message: error.message
            });
        })
})
router.post('/login', async (req, res) => {
    const account = await User.findOne({ mobile: req.body.mobile });
    if (!account) {
        return res.status(200).json({
            status: false,
            message: "User not found"
        })
    }
    const isMatch = await bcryptjs.compare(req.body.password, account.password);
    if (!isMatch) {
        return res.status(200).json({
            status: false,
            message: 'Your password is not match'
        })
    }
    else {
        if (account.isApproved) {
            const token = await jwt.sign({ _id: account._id, mobile: account.mobile }, process.env.JWT_PRIVATE_KEY);
            return res.status(200).json({
                status: true,
                token,
            })
        }
        else {
            return res.status(200).json({
                status: false,
                message: 'Your account is not active',
            })
        }
    }
})
router.post('/sendPasscode', async (req, res) => {
    User.findOne({ mobile: req.body.mobile })
        .then(async (account) => {
            if (!account) {
                return res.status(200).json({
                    status: false,
                    message: 'User is not exist'
                })
            }
            account.passcode = generatePasscode();
            await account.save();
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const client = require('twilio')(accountSid, authToken);

            return client.messages
                .create({
                    body: "\n[FinTech] Verification code : " + account.passcode,
                    from: process.env.TWILIO_NUMBER_PHONE,
                    to: account.mobile
                })
                .then(message => res.status(200).json({ status: true }));

        })
        .catch((error) => {

            return res.status(500).json({
                status: false,
                message: error.message
            });
        })
})
router.post('/verify', async (req, res) => {
    User.findOne({ mobile: req.body.mobile })
        .then(async (account) => {
            if (account) {
                if (account.passcode == req.body.passcode) {
                    account.isApproved = true;
                    await account.save()
                        .then(async(account_updated) => {
                            const token = await jwt.sign({ _id: account_updated._id, mobile: account_updated.mobile }, process.env.JWT_PRIVATE_KEY);
                            return res.status(200).json({
                                status: true,
                                token
                            });
                        })
                }
                else {
                    return res.status(200).json({
                        status: false,
                        message: 'Passcode not match'
                    });
                }
            }
            else {
                return res.status(200).json({
                    status: false,
                    message: 'User not found'
                });
            }
        })
        .catch(error => {
            return res.status(500).json({
                status: false,
                message: error.message
            });
        })
})
router.post('/forgotPassword', (req, res) => {
    const mobile = req.body.mobile;
    User.findOne({ mobile: mobile })
        .then(user => {
            if (user) {
                return res.status(200).json({
                    status: true,
                });

            }
            else {
                return res.status(200).json({
                    status: false,
                    message: 'User not exist'
                });
            }
        })
        .catch(err => {
            return res.status(500).json({
                status: false,
                message: err.message
            });
        })
})
router.put('/updatePassword', async (req, res) => {
    const { mobile, newPassword } = req.body;
    User.findOne({ mobile: mobile })
        .then(async account => {
            if (account) {
                const isMatch = await bcryptjs.compare(newPassword, account.password);
                if (isMatch) {
                    return res.status(200).json({
                        status: false,
                        message: "You are using the same old password"
                    });
                }
                else {
                    const formatted_password = await bcryptjs.hash(newPassword, 10);
                    account.password = formatted_password;
                    account.save()
                        .then(account_updated => {
                            return res.status(200).json({
                                status: true,
                            });
                        })
                }
            }
        })
        .catch(err => {
            return res.status(500).json({
                status: false,
                message: err.message
            });
        })
})

router.get('/getUserData', isAuth, async (req, res) => {
    return res.status(200).json({
        status: true,
        firstName: req.account.firstName,
        lastName: req.account.lastName,
        mobile: req.account.mobile,
        balance: req.account.balance,
        actions: req.account.actions
    });
})


router.put('/addAction', isAuth, async (req, res) => {
    const { title, details, sum } = req.body;

    User.findById(req.account._id)
        .then((user) => {

            user.balance += sum;
            const actions = user.actions;
            actions.push({ title: title, details: details, sum: sum });
            user.save().then((user_updated) => {
                return res.status(200).json({
                    status: true,
                })
            })

        })
        .catch(err => {
            return res.status(500).json({
                status: false,
                message: err.message
            });
        })
})

router.put('/updateAccount', isAuth, async (req, res) => {
    const { firstName, lastName } = req.body;
    User.findById(req.account._id)
        .then((user) => {
            user.firstName = firstName;
            user.lastName = lastName;
            user.save().then((user_updated) => {
                return res.status(200).json({
                    status: true,
                })
            })

        })
        .catch(err => {
            return res.status(500).json({
                status: false,
                message: err.message
            });
        })
})

module.exports = router;