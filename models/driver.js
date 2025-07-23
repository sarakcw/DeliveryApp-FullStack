const mongoose = require("mongoose");

const driverSchema = mongoose.Schema({
    driver_id: {
        type: String,
    },
    driver_name:{
        type: String,
        validate: {
            validator:function(value){
                return value.length >=3 && value.length <=20;
            },
            message:  "Name must be between 3 and 20 characters"
        },
        match: [/^[A-Za-z\s]+$/, "Driver name needs to be alphabetic"],

        required: true
    },
    driver_department: {
        type: String,
        validate:{
            validator: function(value){
                return value.toUpperCase() === "FURNITURE" || value.toUpperCase() === "FOOD" || value.toUpperCase() === "ELECTRONIC"
            },
            message: "Please select either: Furniture, Food, or Electronic Department"
        },
        required: true
    },
    driver_licence: {
        type: String,
        validate: {
            validator: function(value){
                return value.length === 5;
            },
            message: "License must be 5 characters"
        },
        match: [/^[A-Za-z0-9\s]+$/, "Driver license needs to be alpahnumeric"],

        required: true

    },
    driver_isActive: {
        type: Boolean,
        default: false

    },
    driver_createdAt: {
        type: Date,
        default: Date.now
    },
    assigned_packages:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
    }]
    
});

module.exports = mongoose.model("Driver", driverSchema);
