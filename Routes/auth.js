const express = require('express');
const router = express.Router();
const { body, validationResult, check } = require('express-validator');
const cryptoJS = require('crypto-js');
const Company = require('../Models/Company');
const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const verify = require('../middleware/verify');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Car = require('../Models/Car');
const port = process.env.PORT || 8000

// Multer file upload
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    }
})
const filefilter = (req, file, cb) => {
    if (file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
let upload = multer({
    storage: storage,
    fileFilter: filefilter
});

// remove Image
const clearImage = (filepath) => {
    filepath = path.join(__dirname, '../images', filepath)
    fs.unlink(filepath, err => {
        console.log(err)
    })
}

// Register Company
router.post('/company/register', upload.single('image'), body('email').isEmail(), body('password').isLength({ min: 5 }), body('desc').isLength({ min: 30 }), async (req, res, next) => {
    // Error Reslut
    console.log(`http://localhost:${port}/image/${req.file.filename}`);
    // ,body('email').isEmail(), body('password').isLength({ min: 5 }), body('desc').isLength({ min: 30 }), 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array()[0].msg })
    };
    try {
        console.log(req.body)
        const imageUrl = `http://localhost:${port}/image/${req.file.filename}`
        const newCompany = new Company({
            email: req.body.email,
            password: cryptoJS.AES.encrypt(req.body.password, process.env.SECRET_KEY).toString(),
            imageUrl: imageUrl,
            companyName: req.body.companyName,
            desc: req.body.desc
        })
        const fetchedCompany = await Company.find({ $or: [{ email: newCompany.email }, { companyName: newCompany.companyName }] })
        if (fetchedCompany.length === 0) {
            console.log(fetchedCompany)
            const company = await Company.create(newCompany)
            console.log(company)
            res.status(200).json(company);
        }
        res.status(404).json('Company already exist!');
    } catch (err) {
        res.status(500).json(err)
    }
});

// login Company
router.get('/company/login', body('email').isEmail(), body('password').isLength({ min: 5 }), async (req, res, next) => {
    try {
        // Error Result
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array()[0].msg })
        };

        const company = await Company.findOne({ email: req.body.email })
        if (!company) {
            res.status(401).json('Email Wrong')
        }

        const bytes = cryptoJS.AES.decrypt(company.password, process.env.SECRET_KEY);
        const originalPassword = bytes.toString(cryptoJS.enc.Utf8)
        if (originalPassword !== req.body.password) {
            res.status(401).json('Wrong Password')
        }
        else {
            const accesstoken = jwt.sign({ id: company._id, isOwner: company.isOwner }, process.env.SECRET_KEY, {
                expiresIn: '4d'
            })
            const { password, ...info } = company._doc;
            console.log(accesstoken, 'LoggedIn Token')
            res.status(200).json({ ...info, accesstoken })
        }

    } catch (err) {
        res.status(500).json(err)
    }
});

// Update Company Details
router.put('/company/:id', upload.single('image'), verify, body('desc').isLength({ min: 30 }), body('password').isLength({ min: 5 }), async (req, res, next) => {
    try {
        // Error Result
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array()[0].msg })
        };
        const fetchedCompany = await Company.findById(req.params.id);
        if (fetchedCompany) {
            let imageUrl;
            console.log(fetchedCompany.imageUrl)
            if (req.file) {
                imageUrl = req.file.filename
                const filename = fetchedCompany.imageUrl.split('image/')
                console.log(filename[1], 'imagename')
                clearImage(filename[1])
            } else {
                imageUrl = fetchedCompany.imageUrl
            }
            const updateObj = {
                companyName: req.body.companyName,
                desc: req.body.desc,
                imageUrl: `http://localhost:${port}/image/${req.file.filename}`,
                password: cryptoJS.AES.encrypt(req.body.password, process.env.SECRET_KEY).toString()
            };
            const updatedCompany = await Company.findByIdAndUpdate(req.params.id, {
                $set: updateObj
            }, { new: true })
            res.status(200).json(updatedCompany)
        } else {
            res.status(404).json('No company found!')
        }

    } catch (err) {
        res.status(500).json(err)
    }
});

// Delete Company (Still in progress)
router.delete('/company/:id', verify, async (req, res, next) => {
    try {
        if (req.user.isOwner) {
            const fetchedcompany = await Company.findById(req.params.id);
            const filename = fetchedcompany.imageUrl.split('image/')
            console.log(filename[1], 'imagename')
            clearImage(filename[1])
            // Still Car delete function in progress-------------------
            Car.deleteMany({
                _id: {
                    $in: fetchedcompany.cars
                }
            })
            // -------------end Car delete Fucntion-------------------
            await Company.findByIdAndDelete(req.params.id)
            res.status(200).json('company has been deleted!')
            // const company = Company.findById(req.params.id);
            // if(Company.findOneAndDelete(req.params.id)) {
            //     res.status(200).json('Company has been deleted!')
            // } else {
            //     res.status(400).json('Not deleted!')
            // }
        }
    } catch (err) {
        res.status(500).json(err)
    }
});

// Register End User
router.post('/user/register', upload.single('image'), async (req, res, next) => {
    // ,body('firstName').isString().isLength({ min: 4, max: 10 }).notEmpty(), body('lastName').isString().isLength({ min: 4, max: 10 }).notEmpty(), body('email').isEmail().notEmpty(), body('password').isLength({ min: 5 }).notEmpty(), body('contactNumber').isLength({ min: 10, max: 11 }).notEmpty()
    // Error Result
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     res.status(400).json({ errors: errors.array()[0].msg })
    // };

    try {
        const imageUrl = `http://localhost:${port}/image/${req.file.filename}`
        console.log(imageUrl, 'image Url')
        const endUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: cryptoJS.AES.encrypt(req.body.password, process.env.SECRET_KEY).toString(),
            imageUrl: imageUrl,
            contactNumber: req.body.contactNumber
        });
        console.log(req.file.filename)
        const filename = req.file.filename;

        const fetchedUser = await User.find({ $or: [{ email: endUser.email }, { contactNumber: endUser.contactNumber }] })
        console.log(fetchedUser)
        if (fetchedUser.length === 0) {
            console.log(fetchedUser)
            const user = await endUser.save();
            res.status(200).json(user);
        } else {
            clearImage(filename, 'zaid clear')
            res.status(404).json('User already exist!');
        }

    } catch (err) {
        res.status(500).json(err)
    }
});

// login End User
router.get('/user/login', body('email').isEmail().notEmpty(), body('password').notEmpty().isLength({ min: 5 }), async (req, res, next) => {
    try {
        // Error Result
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array()[0].msg })
        };

        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            res.status(401).json('Wrong email!');
        }
        const bytes = cryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
        const originalPassword = bytes.toString(cryptoJS.enc.Utf8);
        if (originalPassword !== req.body.password) {
            res.status(401).json('Wrong Password!');
        }
        else {
            const accesstoken = jwt.sign({ id: user._id, isOwner: user.isOwner }, process.env.SECRET_KEY,
                {
                    expiresIn: '4d'
                });
            const { password, ...info } = user._doc;
            console.log(accesstoken, 'LoggedIn Token');
            res.status(200).json({ ...info, accesstoken })
        }
    } catch (err) {
        res.status(500).json(err)
    }
});

// Update User Profile
router.put('/user/:id', upload.single('image'), body('firstName').isString().isLength({ min: 4, max: 10 }).notEmpty(), body('lastName').isString().isLength({ min: 4, max: 10 }).notEmpty(), body('password').isLength({ min: 5 }).notEmpty(), body('contactNumber').isLength({ min: 4, max: 10 }).notEmpty(), verify, async (req, res, next) => {
    try {
        // Error Result
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array()[0].msg })
        };
        const fetchedUser = await User.findById(req.params.id)
        if (fetchedUser) {
            let imageUrl;
            // `http://localhost:${port}/image/${req.file.filename}`
            if (req.file) {
                imageUrl = req.file.filename
                const filename = fetchedUser.imageUrl.split('image/')
                console.log(filename[1], 'imagename')
                clearImage(filename[1])
            } else {
                imageUrl = fetchedUser.imageUrl;
            }

            if (req.user.isOwner || !req.user.isOwner) {
                const updatedObj = {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    password: cryptoJS.AES.encrypt(req.body.password, process.env.SECRET_KEY).toString(),
                    imageUrl: `http://localhost:${port}/image/${req.file.filename}`,
                    contactNumber: req.body.contactNumber
                };
                const updatedUser = await User.findByIdAndUpdate(req.params.id, {
                    $set: updatedObj
                }, { new: true });
                res.status(200).json(updatedUser);
            }
        } else {
            res.status(400).json('User not found!')
        }

    } catch (err) {
        res.status(500).json(err)
    }
});

// Delete User
router.delete('/user/:id', verify, async (req, res, next) => {
    try {
        if (!req.user.isOwner) {
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json('User has been deleted!');
        }
    } catch (err) {
        res.status(500).json(err)
    }
});

module.exports = router;
