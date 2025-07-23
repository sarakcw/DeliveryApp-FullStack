const Driver = require('../models/driver');
const Package = require('../models/package');
const{logInStatus} = require ('./session-controller');
const { increaseCreate, increaseRetrieve, increaseUpdate, increaseDelete } = require('../firebase-functions');

function generateDriverID(){ //function to generate the autogen driver id
    let randomDigits = Math.floor(Math.random() * 90 )+ 10; //shift up by 10 numbers
    
    let firstLetter = generateLetter();
    let secondLetter = generateLetter();
    let thirdLetter = generateLetter();

    let finalString = 'D' + randomDigits + '-34-' + firstLetter + secondLetter + thirdLetter;
    return finalString;
};

function generateLetter(){

    //generate between 65 and 90 for uppercase
    const NUM_FOR_ASCII= Math.floor(Math.random() * 26) + 65;
    return String.fromCharCode(NUM_FOR_ASCII);
};

module.exports = {
    
    createDriver: async function(req, res){
        if(!logInStatus.status){ //check log in status
            return res.status(440).json({status: "Please log in"});
        }
        console.log("Log in status:" + logInStatus.status);


        try{   

            let aDriver = req.body;
            let driverId = generateDriverID();
            let driverDoc = new Driver ({
            driver_id: driverId,
            driver_name: aDriver.driver_name,
            driver_department: aDriver.driver_department,
            driver_licence: aDriver.driver_licence,
            driver_isActive: aDriver.driver_isActive,
            // driver_createdAt: new Date().toLocaleString()
            });

            await increaseCreate(); //increase create counter
            await driverDoc.save();
            
            res.status(200).json({_id: driverDoc.id, driver_id: driverDoc.driver_id});
        }
        catch(err){
            console.log(err);
            res.status(404).json({sataus: "Invalid data"});
        }

    },

    getAllDriver: async function(req, res){
        if(!logInStatus.status){//check log in status
            return res.status(440).json({status: "Please log in"});
        }

        let drivers = await Driver.find().populate("assigned_packages"); //get all drivers and show details for assigned_packages

        await increaseRetrieve(); //increase retrieve counter

        res.status(200).json(drivers);
    },

    deleteDriver: async function (req, res){

        if(!logInStatus.status){//check log in status
            return res.status(440).json({status: "Please log in"});
        }
        //get driver
        try{
            
            let driver  = await Driver.findById(req.query.id); //find driver by id through query string
            
            if(!driver)
            { // Check if driver exists
                return res.status(404).json({ status: "Driver not found" });
            }
  
            //get assigned packages assigned to driver
            let assignedPackages = driver.assigned_packages;
            if (assignedPackages != null){//is array is not empty
                //delete every package assigned to driver
                for (let i = 0; i < assignedPackages.length; i++){
                    let packageId = assignedPackages[i];
                    let packageToDelete = await Package.deleteOne({_id: packageId});
                }
            }
            await increaseDelete(); //increase delete counter

            //delete driver by id through query
            let driverToDelete = await Driver.deleteOne({_id: req.query.id});
            res.status(200).json(driverToDelete);
        }
        catch(err){
            console.log(err);
            return res.status(404).json({ status: "Delete driver failed" })
        }
    },
    updateDriver: async function (req, res) {
        if(!logInStatus.status){//check log in status
            return res.status(440).json({status: "Please log in"});
        }

        let driverLicence = req.body.driver_licence;
        let driverDepartment = req.body.driver_department;

        //validate licence input
        if(driverLicence.length != 5){
            return res.status(404).json({status: "Driver licence must be 5 alphanumeric characters"});

        }

        //validate deparment input
        if(driverDepartment.toUpperCase() !== "FURNITURE" &&
        driverDepartment.toUpperCase() !== "FOOD" &&
        driverDepartment.toUpperCase() !== "ELECTRONIC" ){
            return res.status(404).json({status: "Department must either be: Furniture, Food, or Electronic"});

        }

        try{  
            //find driver by id and update licence and department
            let driver = await  Driver.findOneAndUpdate({ _id: req.body.id }, req.body);
            
            await increaseUpdate(); //increase update counter

            return res.status(200).json({status: "Driver successfully updated"});

                 
        }
        catch(err){
            return res.status(404).json({status: "Driver ID not found"});
        }
      }

}