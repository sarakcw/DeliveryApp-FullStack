# 📦 Delivery Management App

A full-stack Node.js web application designed to manage delivery drivers and packages using **MongoDB** (via Mongoose),
offering both traditional HTML interfaces and a RESTful JSON API. 
This project uses persistent MongoDB storage.
In addition, this project uses **Google Firestore** (part of Firebase) to store CRUD operation counters.


---

## 🚀 Features

### HTML Interface:
- View all drivers and packages through a browser-based UI.
- Index page displays the current number of drivers and packages.
- Stats page shows real-time counts of all CRUD operations.

### RESTful API:
- JSON-based endpoints for managing drivers and packages.
- Built to support web apps, mobile apps, smart devices, etc.
- All data operations use Mongoose schemas with validators.

---

## 📁 Project Structure
/models → Mongoose schemas (Driver, Package)  
/routes → API and HTML route handlers  
/public → Static assets and HTML pages  
/app.js → Entry point of the app  


---

## Technologies Used

- Node.js / Express.js
- MongoDB with Mongoose ODM
- Firestore
- HTML/CSS/JavaScript

---

## ⚙️ Setup Instructions (Local Environment)

### 1. Clone the Repository

```bash
git clone https://github.com/sarakcw/DeliveryApp-FullStack.git
cd DeliveryApp-fullStack
```
### 2. Install Dependencies

```bash
npm install
```
### 3. Configure MongoDB Connection
In app.js or a separate .env file, update your MongoDB URI:

```bash
mongoose.connect('mongodb://localhost:27017/your_database', { useNewUrlParser: true, useUnifiedTopology: true });
```
### 4. Firebase Setup
You will need to create your own Firebase project 
and generate your own service account key.

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Project Settings > Service Accounts**.
3. Click **Generate new private key** and download the `service-account.json` file.
4. Place the file in your project root folder.

### 5. Run the server

```bash
node app.js
```
The app will run on http://localhost:8080.
