const mongoose = require("mongoose");

const packageSchema = mongoose.Schema({
    package_id: {
        type: String,
    },
    package_title:{
        type: String,
        validate: {
            validator:function(value){
                return value.length >=3 && value.length <=15;
            },
            message:  "Name must be between 3 and 15 characters"
        },
        match: [/^[A-Za-z0-9\s]+$/, "Package title needs to be alpahnumeric"],

        required: true
    },
    package_description: {
        type: String,
        validate: {
            validator:function(value){
                return value.length >=0 && value.length <=30;
            },
            message:  "Name must be between 0 and 30 characters"
        },

    },
    package_weight: {
        type: Number,
        validate: {
            validator:function(value){
                return value >0 ;
            },
            message:  "Weight must be a positive non zero number"
        },
        required: true
    },
    package_destination: {
        type: String,
        validate: {
            validator: function(value){
                return value.length >= 5 && value.length <= 15;
            },
            message: "Desitnation must be between 5 and 15"
        },
        match: [/^[A-Za-z0-9\s]+$/, "Package destination needs to be alpahnumeric"],
        required: true

    },
    package_createdAt: {
        type: Date,
        default: Date.now
    },
    package_isAllocated:{
        type: Boolean,
        default: false
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    }

});

module.exports = mongoose.model("Package", packageSchema);
