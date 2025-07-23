
const {saveUser, verifyUser} = require('../firebase-functions');

const logInStatus = {status: false};
module.exports = {
    
    signup: async function(req, res){
        let newUser = req.body
        let username = newUser.username;
        let password = newUser.password;
        let confirmPass = newUser.confirmPassword;
        //validate user inputs
        
        if(username.length < 6 && !isAlphanumeric(username)){//check username length and if alpahnumeric
            return res.status(404).json({status: "Username has to be more than 6 alpahanumeric characters "});
        }  
                
        if(password.length < 5 && password.length > 10 ){ // check password length
            return res.status(404).json({status: "Password has to be between 5 to 10 characters "});

        }
                
        if(confirmPass !== password){ //check if both passwords are the same
            return res.status(404).json({status: "Incorrect confirmation password"});

        }

        try{
            await saveUser(username, password); //save the user into firebase
            return res.status(200).json({status: "Sign Up Successfully"});
        }
        catch(err){
            console.log(err);
            return res.status(404).json({status: "Unable to create account"});

        }

    },
    login: async function(req, res){
        let user = req.body;
        let username = user.username;
        let password = user.password;

        let isVerified = await verifyUser(username, password) //verify username and password
        if(!isVerified){
            //if username or password are invalid, user is not logged in
            logInStatus.status = false;
            res.status(404).json({status: "Invalid username or password"})
        }
        else{
            res.status(200).json({status: "Log In Successfully"})
            logInStatus.status = true;
        }
    },
    logInStatus

}