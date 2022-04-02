const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult, check } = require('express-validator');
const router = express.Router();
const User = require('../Models/User');
const Car = require('../Models/Car');
const verify = require('../middleware/verify');




// Orders Cars
router.post('/car/:id', verify, async (req, res, next) => {
    try {
        if (!req.user.isOwner) {
            const fetchedCar = await Car.findById(req.params.id);
            const user = await User.findById(req.user.id);
            user.orders.forEach(item => {
                if (item.toString() !== req.params.id.toString()) {
                    user.orders.push(fetchedCar)

                } else {
                    res.status(400).json('Car already exist!')
                }
            });
            await user.save();

            console.log(fetchedCar)
            console.log(user)
            res.status(200).json(user);
        }
        res.status(400).json('You are not authenticated!')
    } catch (err) {
        res.status(500).json(err)
    }
});

// Get All User Order cars
router.get('/car', verify, async (req, res, next) => {
    try {
        if (!req.user.isOwner) {
            const user = await User.findById(req.user.id).populate('orders');
            console.log(user.orders);
            res.status(200).json(user.orders)
        }
    } catch (err) {
        res.status(500).json(err)
    }
});

// Delete  Order from User orders
router.post('/car/delete/:id', verify, async (req, res, next) => {
    try {
        if (!req.user.isOwner || req.params.id) {
            const user = await User.findById(req.user.id).select({ "password": 0 });
            const updatedOrder = user.orders.filter(item => {
                return item.toString() !== req.params.id.toString()
            })
            console.log(updatedOrder, 'Updated User Orders');
            user.orders = updatedOrder;
            await user.save();
            res.status(200).json(user)
        }
    } catch (err) {
        res.status(500).json(err)
    }
})

module.exports = router