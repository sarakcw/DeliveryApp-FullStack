/**
 * Welcome to Monash Delivery!
 * @author Sara Kok
 */



const admin = require("firebase-admin");

//Get a reference to the private key
const serviceAccount = require("./service-account.json");

// initialize the access to Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


//import functions from firebase-functions.js
const { initializeCounter, increaseCreate, increaseRetrieve, increaseDelete, getData, saveUser, verifyUser } = require('./firebase-functions');
initializeCounter(); //start the counter when app starts

const mongoose = require("mongoose");

/**
 * Express router to provide user with related routes
 * @requires express
 */

/**
 * express module
 * @const
 */
const express = require('express');
const session = require('express-session');
/**
 * App instance
 * @const
 */
const app = express();

//----------------
app.use(session({//use express-session
    secret: 'secret-key', //simple key for assignment
    resave: false, //session is saved only when modified
    saveUninitialized: true
}));

const sessionRouter = require("./routes/session-routes");// handles all log in and sign ups
const driverRouter = require("./routes/driver-routes"); //handles all driver functions
const packageRouter = require("./routes/package-routes"); //handles all package functions
//------------------

/**
 * Path module for files and directory paths
 * @const 
 */
const path = require("path");

/**
 * Path to views directory
 * @const {string}
 */
const VIEWS_PATH = path.join(__dirname, "/views/");
/**
 * To serve Bootstrap lib file
 * @name BootstrapCSS
 * @param {string} staticPath - Path to Bootstrap directory
 */
app.use(express.static('node_modules/bootstrap/dist/css'));

/**
 * To serve image files
 * @param {string} path - URL path where image files are from
 * @param {string} staticPath - Path to static images directory
 */
app.use('/images',express.static('images'));

/**
 * EJS engine module
 * @require ejs
 */
/**
 * Engine to render HTML files with EJS
 * @name EJSEngine
 * @param {string} engine - view engine
 */
app.engine('html', require('ejs').renderFile);

/**
 * To set view engine
 * @name setViewEngine
 * @param {string} engine - engine being used
 */
app.set('view engine', 'html');


//-------------------------------------------------------------
/**
 * Module to handle anything related to Driver class
 * @const
 * @type {object}
 */
const Driver = require('./models/driver');

/**
 * Module to handle anything related to Package class
 * @const
 * @type {object}
 */
const Package = require('./models/package');

/**
 * Port number
 * @const
 */
const PORT_NUMBER = 8080;


/**
 * To parse URL-encoded data
 * @name useUrlencodedParser
 * @param {object} options - options for parsing URL encoded data
 * @param {boolean} options.extended
 */
app.use(express.urlencoded({extended:true}));
/**
 * To parse JSON data
 * @name useJsonParser
 */
app.use(express.json())



const url = "mongodb://localhost:27017/Assignment-2";

async function connect(url){
    await mongoose.connect(url);
    return "Connected successfully";

}

connect(url).then(console.log).catch((err) => console.log(err));


app.use("/Sara/api/v1/drivers", driverRouter);
app.use("/Sara/api/v1/packages", packageRouter);
app.use("/Sara/api/v1/session", sessionRouter);


//---------------------------------------------


/**
 * Router serving the homepage
 * @name get/ homepage
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('/', async function(req, res){
    let drivers = await Driver.find();
    let packages = await Package.find();

    //for counters in homepage
    res.render("index", {driverRecords: drivers,
        packageRecords: packages
    });

});

app.get('/Sara/signup', function(req, res){
    let fileName = VIEWS_PATH +"signup.html";
    res.sendFile(fileName);
});

app.post('/Sara/signup-post', async function(req, res){
    let newUser = req.body
    let username = newUser.username;
    let password = newUser.password;
    let confirmPass = newUser.confirmPassword;
    //validate user inputs
    
    if(username.length < 6 && !isAlphanumeric(username)){
        return res.redirect('/Sara/invalid-data')
    }  
              
    if(password.length < 5 && password.length > 10 ){
        return res.redirect('/Sara/invalid-data');
    }
            
    if(confirmPass !== password){
        return res.redirect('/Sara/invalid-data');
    }

    try{
        await saveUser(username, password); //save new user in database
        return res.redirect('/Sara/login');
    }
    catch(err){
        console.log(err);
        return res.redirect('/Sara/invalid-data');
    }

});

app.get('/Sara/login', function(req, res){
    let fileName = VIEWS_PATH +"login.html";
    res.sendFile(fileName);
});

app.post('/Sara/login-post', async function(req, res){
    let user = req.body;
    let username = user.username;
    let password = user.password;

    let isVerified = await verifyUser(username, password) //verify username and password
    if(!isVerified){
        return res.redirect('/Sara/invalid-data');
    }

    else{
        //set session data for the user
        req.session.user = { username: username };
        return res.redirect('/');

    }
    
});

/**
 * Router serving the list drivers
 * @name get/Sara/list-drivers
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('/Sara/list-drivers', isLoggedIn, async function(req, res){
    let drivers = await Driver.find().populate("assigned_packages");

    await increaseRetrieve(); //increase counter for retrieve in firebase

    //render table
    return res.render("list-drivers", {driverRecords: drivers});
});

/**
 * Route to add a driver
 * @name get/Sara/add-drivers
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('/Sara/add-driver', isLoggedIn, function (req, res){
    let fileName = VIEWS_PATH +"add-driver.html";
    res.sendFile(fileName);

});

/**
 * Route to add a driver to database
 * @name post/Sara/add-drivers-post
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.post('/Sara/add-driver-post', isLoggedIn, async function (req,res){
    let aDriver = req.body;

    //change checkbox inputs to true or false
    if(aDriver.isActive === 'on'){
        aDriver.isActive = true;
    }
    else{
        aDriver.isActive = false;
    }

    if(aDriver.driverName.length != 0 && aDriver.license.length != 0){
        if(isValidDriverInput(aDriver.driverName, aDriver.license)){

            try{   
                let aDriver = req.body;
                let driverId = generateDriverID();
                
                let driverDoc = new Driver ({ //create driver
                driver_id: driverId,
                driver_name: aDriver.driverName,
                driver_department: aDriver.department,
                driver_licence: aDriver.license,
                driver_isActive: aDriver.isActive,
                // driver_createdAt: new Date().toLocaleString()
                });

                await increaseCreate(); //increase counter for create in firebase

                await driverDoc.save();
                return res.redirect('/Sara/list-drivers');
            }

            catch(err){
                console.log(err);
                return res.redirect('/Sara/invalid-data')
            }
        }
    } else{
        return res.redirect('/Sara/invalid-data')

    }
    return res.redirect('/Sara/invalid-data')


});

/**
 * Route to delete a driver
 * @name get/Sara/delete-driver
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('/Sara/delete-driver', isLoggedIn, function (req, res){
    let fileName = VIEWS_PATH +"delete-driver.html";
    res.sendFile(fileName);

    

});

/**
 * Route to delete driver based on driver id
 * @name get/Sara/delete-driver-req
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('/Sara/delete-driver-req', isLoggedIn, async function (req, res){
    try{
          //find driver by autogen driver id
        let driver  = await Driver.findOne({driver_id: req.query.driverToDelete});
        
        if(!driver)// Check if driver exists
        { 
            return res.redirect('/Sara/invalid-data');
        }

        //get assigned packages assigned to driver
        let assignedPackages = driver.assigned_packages;
        if (assignedPackages != null){//if array is not empty
            //delete every package assigned to driver
            for (let i = 0; i < assignedPackages.length; i++){
                let packageId = assignedPackages[i];
                let packageToDelete = await Package.deleteOne({_id: packageId}); //delete package by id
            }
        }


        let driverToDelete = await Driver.deleteOne({driver_id: req.query.driverToDelete});// delete the driver
        await increaseDelete(); //increase delete counter in firebase

        return res.redirect('/Sara/list-drivers');
    }
    catch(err){
        console.log(err);
        return res.redirect('/Sara/invalid-data');
    }


});

/**
 * Route to list all packages in database
 * @name get/Sara/list-packages
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('/Sara/list-packages', isLoggedIn, async function(req, res){
    let package = await Package.find(); //find all packages
    let drivers = await Driver.find().populate("assigned_packages"); //find all drivers

    await increaseRetrieve(); //increase counter for retrieve in firebase

    // render table
    res.render("list-packages", {packageRecords: package, driverRecords: drivers});

});

/**
 * Route to add a package
 * @name get/Sara/add-package
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('/Sara/add-package', isLoggedIn, async function (req, res){
    let drivers = await Driver.find();

    res.render("add-package", {driverRecords: drivers});
});

/**
 * Route to add a package to database
 * @name post/Sara/add-package-post
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.post('/Sara/add-package-post', isLoggedIn, async function (req,res){


    try{
            
        let aPackage = req.body;

        //change html checkbox default  to true or false
        if(aPackage.isAllocated === 'on'){
            aPackage.isAllocated = true;
        }
        else{
            aPackage.isAllocated = false;
        }

        //get driver object by driver id from user input
        let assignedDriver = await Driver.findOne({driver_id: aPackage.driverId}); 

        if(!assignedDriver){ //if driver id is invalid
            return res.redirect('/Sara/invalid-data');
        }

        //check if form is empty and inputs are valid
        if(aPackage.packageTitle.length != 0 && aPackage.packageWeight.length != 0 && aPackage.packageDestination.length != 0 && aPackage.driverId != 0){
            if(isValidPackageInput(aPackage.packageTitle, aPackage.packageWeight, aPackage.packageDestination, aPackage.packageDescription)){
                let packageId = generatePackageId();
                let packageDoc = new Package({
                    package_id: packageId,
                    package_title: aPackage.packageTitle,
                    package_description: aPackage.packageDescription,
                    package_weight: aPackage.packageWeight,
                    package_destination: aPackage.packageDestination,
                    // package_createdAt: new Date().toLocaleDateString(),
                    package_isAllocated: aPackage.isAllocated,
                    driver_id: assignedDriver

                })
            
                await increaseCreate(); //increase counter for create in firebase
                await packageDoc.save();

                // assign package to driver
                assignedDriver.assigned_packages.push(packageDoc._id);
                await assignedDriver.save(); //save changes
                return res.redirect('/Sara/list-packages');
            }
        } 
    }
    catch(err){
        console.log(err);
        return res.redirect('/Sara/invalid-data');
    }
    return res.redirect('/Sara/invalid-data');


});

/**
 * Route to ask user to delete package
 * @name get/Sara/delete-package
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('/Sara/delete-package', isLoggedIn, function (req, res){
    let fileName = VIEWS_PATH +"delete-package.html";
    res.sendFile(fileName);

});

/**
 * Route to the delete package according to package id
 * @name get/Sara/delete-package-req
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('/Sara/delete-package-req', isLoggedIn, async function (req, res){

    try{        
        let packageObj = await Package.findOne({package_id: req.query.packageToDelete}); //find pacakge object  to delete
        if(!packageObj){//check if package exists
            return res.redirect('/Sara/invalid-data');
        }

        //find driver according to package doc associated
        let driver = await Driver.findOne({_id: packageObj.driver_id});
        
        if(!driver){
            return res.redirect('/Sara/invalid-data');
        }
        else{
            //remove package assigned to driver in assigned_packages array
            driver.assigned_packages.pull(packageObj._id);
            await driver.save();
        }
        
        //remove package
        let package = await Package.deleteOne({_id: packageObj.id});
        await increaseDelete(); //increase delete counter in firebase
        return res.redirect('/Sara/list-packages');
        
    }
    catch(err){
        console.log(err);
        return res.redirect('/Sara/invalid-data');
    }
    
});

app.get('/Sara/stats', isLoggedIn, async function (req, res){
    
    let data = await getData(); //retrive data of counter collection in firebase

    res.render("stats", {dataRecords : data}); //display stats through html

});
 

/**
 * Router to handle all invalid data
 * @name get/Sara/indalid-data
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('/Sara/invalid-data', function (req, res){
    let fileName = VIEWS_PATH +"invalid-data.html";
    res.sendFile(fileName);


});

/**
 * Router to handle 404 errors
 * @name get/*
 * @function
 * @param {string} path - Express path
 * @param {function} callback - Express callback
 */
app.get('*', function (req, res){
    let fileName = VIEWS_PATH +"404.html";
    res.sendFile(fileName);
  
});

/**
 * Start server and listen on dedicated port number
 * @name listen
 * @function
 * @param {number} PORT_NUMBER - listen on port 8080
 */
app.listen(PORT_NUMBER);

/**
 *  The findDriver function iterates through the 'driverDB' array to find the driver id that matches the id that has been inputed.
 * If there is a match, the index of the driver in the array will be returned.
 * If match not found, the function will return -1.
 * 
 * @param {*} id - Driver id
 * @returns {number} Index of driver found and -1 if driver is not found in database
 * 
 
 */
function findDriver(id){
    for(let i = 0; i< driverDB.length; i++){
        let currentId = driverDB[i].getDriverId();
        console.log(currentId);
        if (currentId == id){
            return i;
        }

    }

    return -1;
};

/**
 * The findPackage function iterates through the 'packageDB' array to find the package id that matches the id that has been inputed.
 * If there is a match, the index of the package in the array will be returned.
 * If match not found, the function will return -1.
 * 
 * @param {*} id - Package id
 * @returns {number} Index of package found and -1 if package is not found in database
 * 
 */
function findPackage(id){
    for(let i = 0; i< packageDB.length; i++){
        let currentId = packageDB[i].getPackageId();
        console.log(currentId);
        if (currentId == id){
            return i;
        }

    }

    return -1;
};

/**
 * This function generates the driver id through a concatination of two random digits
 * and three random letters
 * 
 * @returns {string} driver id based on the specified pattern
 * 
 */
function generateDriverID(){
    let randomDigits = Math.floor(Math.random() * 90 )+ 10; //shift up by 10 numbers
    
    let firstLetter = generateLetter();
    let secondLetter = generateLetter();
    let thirdLetter = generateLetter();

    let finalString = 'D' + randomDigits + '-34-' + firstLetter + secondLetter + thirdLetter;
    return finalString;
};

/**
 * This function generates a random number between 65 and 90 as ASCII codes
 * to convert to uppercase letters
 * @returns {string} A random letter
 */
function generateLetter(){

    //generate between 65 and 90 for uppercase
    const NUM_FOR_ASCII= Math.floor(Math.random() * 26) + 65;
    return String.fromCharCode(NUM_FOR_ASCII);
};

/**
 * This function generates the package id 
 * through a concatination of two random letters
 * and three random digits
 * 
 * @returns {string} package id based on the specified pattern
 * 
 */
function generatePackageId(){
    let firstLetter= generateLetter();
    let secondLetter = generateLetter();
    let randomDigits = Math.floor(Math.random() * 900) + 100; //get three digit number

    let finalString = 'P' + firstLetter + secondLetter + '-SK-' + randomDigits;
    return finalString;

};
/**
 * This function iterates through the inputted string and converts each character to its ASCII code.
 * ASCII codes are checked if they are between ranges.
 * Returns false if string is not alphanumeric.
 * Returns true if string is alphanumeric.
 * 
 * @param {string} str - string to be checked if it contains only alphanumeric characters
 * @returns {boolean} True if characters are all alphanumeric and false if not
 * 

 */
function isAlphanumeric(str){
    for(let i = 0; i< str.length; i++){
        let asciiCode = str.charCodeAt(i);
        if (!(asciiCode >= 48 && asciiCode <= 57) //numbers (0-9)
            && !(asciiCode >= 65 && asciiCode <= 90) //uppercase 
            && !(asciiCode >= 97 && asciiCode <= 122)){ //lowercase
                return false;
        }
    }
    return true;
};

/**
 * This function iterates through the inputted string and converts each character to its ASCII code.
 * ASCII codes are checked if they are between ranges.
 * Returns false if string is not alphabetic.
 * Returns true if string is alphabetic.
 * 
 * @param {string} str - string to be checked if it contains only alphabetic characters
 * @returns {boolean} True if characters are all alphabetic and false if not
 * 
 */
function isAlphabetic(str){
    for(let i = 0; i< str.length; i++){
        let asciiCode = str.charCodeAt(i);
        if (!(asciiCode >= 65 && asciiCode <= 90) //uppercase 
            && !(asciiCode >= 97 && asciiCode <= 122)){ //lowercase
                return false;
        }
    }
    
    return true;
};

// middleware to check if user is still logged in and in session
function isLoggedIn(req, res, next){
    if(req.session.user){ //if the user is still logged in
        return next(); //so that the request will not be left hanging
    }
    else{
        res.redirect('/Sara/login'); //return to login page if not signed in
    }
}

/**
 * This function validates if the length of the driver's name is between 3 and 20.
 * It will also check if the license of the driver has 5 characters and only contains alphanumeric characters
 * @param {string} name - Name of driver
 * @param {string} license - License of driver
 * @returns {boolean}
 */
function isValidDriverInput(name, license){
    if (name.length >= 3 && name.length <= 20 ){
        //remove whitespace before going in function
        if ( isAlphabetic(name.replace(/\s+/g, ''))){ 
            if(isAlphanumeric(license) && license.length == 5){
                return true;
                
            }
        }
        
    }
    return false;
    
};
/**
 * This function validates if the length of the package's title is between 3 and 15.
 * It will also check if the destination of the package has a range of 5-15 characters and only contains alphanumeric characters.
 * It will check if the weight is a positve non zero number and that the description is less than 30 characters
 * @param {string} title - Title of Package
 * @param {string} weight - Weight of Package
 * @param {string} destination - Destination of Package
 * @param {string} description - Description of Package
 * 
 * @returns {boolean}
 */
function isValidPackageInput(title, weight, destination, description){
    if(title.length >=3 && title.length <= 15 && isAlphanumeric(title.replace(/\s+/g, ''))){ //validate title
        
        let weightInt = parseInt(weight, 10);
        
        if(weightInt > 0){ //weight must be positive non zero number
            
            if(destination.length >= 5 && destination.length <= 15 && isAlphanumeric(destination.replace(/\s+/g, ''))){
                if(description.length <= 30){
                    return true;
                }
            }
        }
    }
    return false;
};


module.exports = {isLoggedIn};
