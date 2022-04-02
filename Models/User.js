const mongoose = require('mongoose');
const UserScheme = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        // unique: true
    },
    password: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true
    },
    contactNumber: {
        type: Number,
        required: true,
        // unique: true,
    },
    isOwner: {
        type: Boolean,
        default: false
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    }]
}, { timestamps: true });

// UserScheme.methods.removeFromOrder = function(prodID) {
//     const updatedOrder = this.orders.filter(item =>{
//         return item.toString() !== prodID.toString();
//     });
//     this.orders = updatedOrder;
//     return this.save();
// }
module.exports = mongoose.model('EndUser',UserScheme)