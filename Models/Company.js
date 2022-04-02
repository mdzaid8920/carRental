const mongoose = require('mongoose');
const CompanySchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true,
        unique: true
    },
    desc: {
        type: String,
        required: true
    },
    avgPrice: {
        type: Number,
        default: 0
    },
    isOwner: {
        type: Boolean,
        default: true
    },
    cars: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    }]

}, { timestamps: true })

module.exports = mongoose.model('Company', CompanySchema)