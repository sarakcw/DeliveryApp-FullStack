const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const db = admin.firestore();

async function initializeCounter(){
    const counterDoc = await db.collection('counter').doc('status').get(); //get status document
    if (!counterDoc.exists){ 
        //if document does not exist, create and set values
        await db.collection('counter').doc('status').set({ 'create': 0, 'retrieve': 0, 'update': 0, 'delete': 0 }); // set all fields to 0
        console.log('Counter initialize');
    }
    else{
        console.log('Counter already exists');
    }

}

async function getData() {
    const doc = await db.collection('counter').doc('status').get(); //retrieve all data from 'status' document
    return doc.data();
}

async function increaseCreate(){
    try{    
        const counterDoc = db.collection('counter').doc('status'); //access the status document is counter collection
        const doc = await counterDoc.get(); // get the document
        
        if(!doc.exists){ // check if document exists in firebase
            console.log('Document does not exists');
        }
        else{

            await counterDoc.update({'create': admin.firestore.FieldValue.increment(1)}); //increase 'create' field value by 1
        }

    }
    catch(error){
        console.log("Error:" + error);
        return res.status(500).json({satus: "Cannot increase counter"});
    }
   
}

async function increaseRetrieve(){
    try{    
        const counterDoc = db.collection('counter').doc('status'); //access status doc
        const doc = await counterDoc.get(); //retireve document
        
        if(!doc.exists){
            console.log('Document does not exists');
        }
        else{

            await counterDoc.update({'retrieve': admin.firestore.FieldValue.increment(1)});//increase 'retrieve' field value by 1
        }

    }
    catch(error){
        console.log("Error:" + error);
        return res.status(500).json({satus: "Cannot increase counter"});

    }
}

async function increaseUpdate(){
    try{    
        const counterDoc = db.collection('counter').doc('status'); //access the document
        const doc = await counterDoc.get(); // get the document
        
        if(!doc.exists){ // check if document exists in firebase
            console.log('Document does not exists');
        }
        else{

            await counterDoc.update({'update': admin.firestore.FieldValue.increment(1)}); //increase 'update' field value by 1
        }

    }
    catch(error){
        console.log("Error:" + error);
        return res.status(500).json({satus: "Cannot increase counter"});
    }
}

async function increaseDelete(){
    try{    
        const counterDoc = db.collection('counter').doc('status'); //access the reference
        const doc = await counterDoc.get(); // get the document
        
        if(!doc.exists){ // check if document exists in firebase
            console.log('Document does not exists');
        }
        else{

            await counterDoc.update({'delete': admin.firestore.FieldValue.increment(1)}); //increase 'delete' field by 1
        }

    }
    catch(error){
        console.log("Error:" + error);
        return res.status(500).json({satus: "Cannot increase counter"});

    }
}


async function saveUser(username, password){
    
    
    await db.collection('users')
    .doc(username) 
    .set({ 'username': username, 'password': password });
}


async function verifyUser(username, password){
    //get the user document from firebase
    const userDoc = await db.collection('users').doc(username).get();

    if(!userDoc.exists){
        console.log("User does not exists");
        return false;
    }

    const userData = userDoc.data(); //access data of this user

    if(userData.password !== password){ //check if password input matches password in database
        console.log("password does not match");
        return false;
    }

    return true; //user has correct password and username

}



module.exports = {
    initializeCounter,
    increaseCreate,
    increaseDelete,
    increaseRetrieve,
    increaseUpdate,
    getData,
    saveUser,
    verifyUser
}