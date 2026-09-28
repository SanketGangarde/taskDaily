const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    
    role: {
        type: String,
        enum: ["student", "admin", "teacher"],      
    },

})

userSchema.plugin(passportLocalMongoose, {
    usernameField: "email"
});

const Users = mongoose.model("User", userSchema);

module.exports = Users;

