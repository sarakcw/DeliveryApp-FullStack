const Driver = require('../models/driver');
const Package = require('../models/package');

const { increaseCreate, increaseRetrieve, increaseUpdate, increaseDelete } = require('../firebase-functions');
const { logInStatus } = require('./session-controller'); //retrieve log in status


function generatePackageId(){ //generate autogen package id
    let firstLetter= generateLetter();
    let secondLetter = generateLetter();
    let randomDigits = Math.floor(Math.random() * 900) + 100; //get three digit number

    let finalString = 'P' + firstLetter + secondLetter + '-SK-' + randomDigits;
    return finalString;

};

function generateLetter(){

    //generate between 65 and 90 for uppercase
    const NUM_FOR_ASCII= Math.floor(Math.random() * 26) + 65;
    return String.fromCharCode(NUM_FOR_ASCII);
};

module.exports = {
    createPackage: async function(req, res){
        if(!logInStatus.status){ //check log in status
            return res.status(404).json({status: "Please log in"});
        }
        try{
            
            let aPackage = req.body;
            let assignedDriver = await Driver.findOne({_id: aPackage.driver_id});  

            if(!assignedDriver){ 
                return res.status(404).json({staus: "Driver not found"});
            }

            let packageId = generatePackageId();
            let packageDoc = new Package({
                package_id: packageId,
                package_title : aPackage.package_title,
                package_description: aPackage.package_description,
                package_weight: aPackage.package_weight,
                package_destination: aPackage.package_destination,
                // package_createdAt: new Date().toLocaleDateString(),
                package_isAllocated: aPackage.package_isAllocated,
                driver_id: aPackage.driver_id

            })
            await increaseCreate(); //increase create counter
            await packageDoc.save();

            // assign package to driver
            assignedDriver.assigned_packages.push(packageDoc._id);
            await assignedDriver.save();
            res.status(200).json({_id: packageDoc._id, package_id: packageDoc.package_id});
        }
        catch(err){
            console.log(err);
            return res.status(404).json({staus: "Unable to create new package"});
        }

    },

    getAllPackage: async function (req, res){
        if(!logInStatus.status){//check log in status
            return res.status(404).json({status: "Please log in"})
        }

        //find and display packages and assigned drivers
        let package = await Package.find().populate("driver_id");

        await increaseRetrieve(); //increase retrieve counter

        res.status(200).json(package); 
    },
    deletePackage: async function(req, res){
        if(!logInStatus.status){//check log in status
            return res.status(404).json({status: "Please log in"});
        }

        try{        
            let packageObj = await Package.findById(req.query.id);
            if(!packageObj){
                return res.status(404).json({status: "Package not found"});
            }

            //find driver according to package doc associated
            let driver = await Driver.findOne({_id: packageObj.driver_id});
            //for me to debug
            if(!driver){
                return res.status(404).json({ status: "Driver not found" });
            }
            else{
                //remove package assigned to driver in assigned_packages array
                driver.assigned_packages.pull(packageObj._id);
                await driver.save();
            }
            
            await increaseDelete(); //increase delete counter

            //remove package
            let package = await Package.deleteOne({_id: req.query.id});
            return res.status(200).json(package);
            
        }
        catch(err){
            console.log(err);
            return res.status(404).json({status: "Delete package failed"});
        }
    },

    updateDestination : async function (req, res){
        if(!logInStatus.status){//check log in status
            return res.status(404).json({status: "Please log in"});
        }

        let destination = req.body.package_destination;
        if (destination.length < 5 || destination.length > 15){
            return res.status(404).json({status: "Destination must be between 5 and 15 alphanumeric characters"});
        }

        try{        
            //find and update package
            let package = await  Package.findOneAndUpdate({ _id: req.body.id }, req.body);
            
            await increaseUpdate(); //increase update counter

            
            return res.status(200).json({status: "Package successfully updated"});
           
        }
        catch(err){
            console.log(err);
            return res.status(404).json({status: "Package ID not found"});
        }
    }


    

}