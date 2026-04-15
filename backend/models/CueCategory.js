const mongoose = require('mongoose');

const cueCategorySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['cues', 'tables', 'shafts', 'cases', 'accessories'],
        default: 'cues',
        required: true
    },
    categoryName: {
        type: String,
        required: true
    },
    items: [
        {
            name: {
                type: String,
                required: true
            },
            badge: {
                type: String,
                enum: ['NEW', 'HOT', null],
                default: null
            }
        }
    ],
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CueCategory', cueCategorySchema);
