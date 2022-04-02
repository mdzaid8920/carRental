const express = require('express');
const router = express.Router();
const { body, validationResult, check } = require('express-validator');
const Car = require('../Models/Car');
const Company = require('../Models/Company');
const User = require('../Models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verify = require('../middleware/verify');
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

const clearImage = (filepath) => {
    filepath = path.join(__dirname, '../images', filepath)
    fs.unlink(filepath, err => {
        console.log(err)
    })
}

// create car
router.post('/create', verify, upload.single('image'), body('carName').isLength({ min: 3 }), async (req, res, next) => {
    if (req.user.isOwner) {
        console.log(req.user.id)
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array()[0].msg })
            };
            if (req.file) {
                const imageUrl = `http://localhost:${port}/image/${req.file.filename}`
                const newCar = new Car({
                    carName: req.body.carName,
                    model: req.body.model,
                    seats: req.body.seats,
                    carType: req.body.carType,
                    pickuploc: req.body.pickuploc,
                    dropoffloc: req.body.dropoffloc,
                    imageUrl: imageUrl
                })
                console.log(newCar, "req body")
                const fetchedCompany = await Company.findById(req.user.id).select({ "password": 0 });
                newCar.company = fetchedCompany
                const cretaedCar = await Car.create(newCar)
                // await newCar.save()
                fetchedCompany.cars.push(newCar);
                await fetchedCompany.save()
                res.status(200).json(cretaedCar)
            } else {
                res.status(500).json('Something is missing!!')
            }
        } catch (err) {

        }
        res.status(500).json(err)
    }
});


// update car
router.put('/:id', verify, upload.single('image'), async (req, res, next) => {
    if (req.user.isOwner) {
        try {
            const fetchedCar = await Car.findById(req.params.id);
            if (fetchedCar) {
                let imageUrl;
                console.log(fetchedCar.imageUrl)
                if (req.file) {
                    imageUrl = req.file.filename
                    const filename = fetchedCar.imageUrl.split('image/')
                    console.log(filename[1], 'imagename')
                    clearImage(filename[1])
                } else {
                    imageUrl = fetchedCompany.imageUrl
                }
                const updateObj = {
                    carName: req.body.carName,
                    model: req.body.model,
                    seats: req.body.seats,
                    carType: req.body.carType,
                    pickuploc: req.body.pickuploc,
                    dropoffloc: req.body.dropoffloc,
                    imageUrl: `http://localhost:${port}/image/${req.file.filename}`
                };
                console.log(req.body)
                const updatedCar = await Car.findByIdAndUpdate(req.params.id, {
                    $set: updateObj
                }, { new: true })
                res.status(200).json(updatedCar)
            } else {
                res.status(404).json('No Car Found!')
            }
        } catch (err) {
            res.status(500).json(err)
        }
    } else {
        res.status(403).json('You can not update any car.')
    }
});

// Delete Car
router.delete('/:id', verify, async (req, res, next) => {
    if (req.user.isOwner) {
        try {
            await Car.findByIdAndDelete(req.params.id)
            res.status(200).json('Car has been deleted.');
        } catch (err) {
            res.status.json(err)
        }
    } else {
        res.status(403).json('You can not delete any car.');
    }

});

// Get All  company Cars
router.get('/', verify, async (req, res, next) => {
    if (req.user.isOwner) {
        try {
            const company = await Company.findById(req.user.id).populate('cars')
            // const cars = await Car.find();
            res.status(200).json(company.cars)
        } catch (err) {
            res.status(500).json(err)
        }
    } else {
        res.status(403).json('You can not get Cars');
    }

});

// Get All  Cars (JUST FOR TESTING)
router.get('/all', async (req, res, next) => {
    // const query = req.query.latest
    // let cars;
    try {
        const cars = await Car.find();
        res.status(200).json(cars)
    } catch (err) {
        res.status(500).json(err)
    }

    res.status(403).json('You can not get Cars');


});

// Get Latest Cars
router.get('/latest', async (req, res, next) =>{
    const latestCars = await Car.find({}, {}, {sort: {'createdAt': -1}}).limit(4)
    res.status(200).json(latestCars)
})

// Get Single Cars
router.get('/find/:id', verify, async (req, res, next) => {
    if (req.user.isOwner) {
        try {
            const car = await Car.findById(req.params.id);
            if (car) {
                res.status(200).json(car)
            }
            else {
                res.status(400).json('Car not found!')
            }
        } catch (err) {
            res.status(500).json(err)
        }
    } else {
        res.status(403).json('You can not get car!');
    }

});

// Get Random Car 
router.get('/random', verify, async (req, res, next) => {
    if (req.user.isOwner) {
        try {
            const car = await Car.aggregate([
                { $sample: { size: 1 } }
            ]);
            if (car) {
                res.status(200).json(car);
            }
            else {
                res.status(400).json('No Car Found!');
            }
        } catch (err) {
            res.status(500).json(err)
        }
    } else {
        res.status(403).json('You can not fetched Car!');
    }
});

module.exports = router;
