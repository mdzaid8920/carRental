const mongoose = require('mongoose');
const CarSchema = new mongoose.Schema({
    carName: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    model: {
        type: Number,
        required: true
    },
    seats: {
        type: String,
        required: true
        // seats: Number,
        // carType: String,
    },
    carType: {
        type: String,
        required: true
    },
    pickuploc: {
        type: String,
        required: true
    },
    dropoffloc: {
        type: String,
        required: true
    },
    // loc: {
    //     pickuploc: String,
    //     dropoffloc: String
    // },
    rentalPrice: {
        type: Number,
        default: 0
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }

}, { timestamps: true })

module.exports = mongoose.model('Car', CarSchema);