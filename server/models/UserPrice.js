const mongoose = require('mongoose');

const userPriceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VendorProduct',
        required: true
    },
    buyingPrice: {
        type: Number,
        required: true,
        default: 0
    },
    sellingPrice: {
        type: Number,
        required: true,
        default: 0
    },
    profit: {
        type: Number,
        default: 0
    },
    margin: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Pre-save hook to automatically calculate profit and margin
userPriceSchema.pre('save', function (next) {
    this.profit = this.sellingPrice - this.buyingPrice;

    if (this.buyingPrice > 0) {
        this.margin = Number(((this.profit / this.buyingPrice) * 100).toFixed(2));
    } else {
        this.margin = 100;
    }

    next();
});

module.exports = mongoose.model('UserPrice', userPriceSchema);
