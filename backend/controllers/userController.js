const userModel = require("./../models/userModel");
const {
    getUserByField,
    createUser,
    random,
    authentication,
    getUserByResetToken,
    checkPasswordComplexity,
    generateHashedPassword,
} = require("./helper");
const { responseMap } = require("./responseMap");
// const { v4: uuid } = require("uuid");
const nodemailer = require("nodemailer");
const port = 3000;

const multer = require("multer");
const upload = multer({ dest: "uploads/" });
// function register
const registerUser = async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        if (!userName || !email || !password) {
            return res.send(responseMap.missingInfo);
        } else if (password == email) {
            return res.send(responseMap.passwordEmailDuplicated);
        } else if (email == userName) {
            return res.send(responseMap.emailUserNameDuplicated);
        }
        // check if user uses the same email to register

        const existingUserEmail = await getUserByField("email", email);
        const existingUserName = await getUserByField("userName", userName);
        if (existingUserEmail) {
            return res.send(responseMap.existingUserEmail);
        } else if (existingUserName) {
            return res.send(responseMap.existingUserName);
        }

        if (!checkPasswordComplexity(password, 6, 10, 4)) {
            return res.send(responseMap.unprocessableEntity);
        }

    // if not .. user is able to type in password and it'll be hashed
    const salt = random();
    const user = await createUser({
      userName,
      email,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
    });

    return res
      .status(200)
      .json({
        _id: user._id,
        userName: user.userName,
        email,
        code: 200,
      });
  } catch (error) {
    console.log(error);
    return res.send(responseMap.serverError);
  }
};

// function login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // check if user type in email and password
        if (!email || !password) {
            return res.send(responseMap.missingInfo);
        }

        // get user by email and select data from DB
        const user = await getUserByField("email", email).select(
            "+authentication.salt+authentication.password"
        );

        // if user email doesn't exist
        if (!user) {
            return res.send(responseMap.nonExistingUser);
        }

        // if user email exists, comparing hashed password
        const expectedHash = authentication(user.authentication.salt, password);
        if (user.authentication.password !== expectedHash) {
            return res.send(responseMap.unauthorized);
        }

        const salt = random();
        user.authentication.sessionToken = authentication(
            salt,
            user._id.toString()
        );
        await user.save();
        return res.status(200).json({
            _id: user._id,
            userName: user.userName,
            about: user.about,
            email,
            profilePicture: user.profilePicture,
            showAbout: user.showAbout,
            showProfile: user.showProfile,
            showStatus: user.showStatus,
            status: user.status,
            code: 200,
        });
    } catch (error) {
        console.log(error);
        return res.send(responseMap.serverError);
        // return res.sendStatus(500).json({ code: 500 });
    }
};

// reset password (ForgettingPW.js)
const handleResetEmail = async (req, res) => {
    try {
        // use email as rest tool
        const { email } = req.body;
        const user = await getUserByField("email", email);

        // when user typed in WRONG email
        if (!user) {
            console.log("Email hasn't been signed up.");
            // return res.send({
            //     Status: "Wrong email",
            // });
            return res.send(responseMap.nonExistingUser);
        }

        // when user typed in CORRECT email
        const token = Math.random().toString(16).slice(3);
        // console.log("token1", token);
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MY_EMAIL,
                pass: process.env.MY_PASSWORD,
            },
        });

        // create a transporter to send reset mail
        try {
            await transporter.sendMail({
                from: process.env.MY_EMAIL,
                to: user.email,
                subject: "RESET PASSWORD",
                html: `<p>Hi user: ${user.userName}</p>
            <p>Please click the link to reset the password.</p>
            <a href="http://localhost:${port}/reset/${token}"><p>Link</p></a>
            <p>Link will be expired in 1 hour, thank you!</p>`,
            });
            // console.log("token2", token);
        } catch (error) {
            console.log("error");
            return res.send(responseMap.serverError);
        }

        // update token
        user.resetPassword = {
            resetToken: token,
            resetExpiration: Date.now() + 3600000,
        };
        // console.log("token3", user.resetPassword.resetToken);
        // console.log("user.resetExpiration", user.resetPassword.resetExpiration);
        await user.save();
        return res.sendStatus(200);
        // return res.send({
        //     Status: "Succeed",
        // });
        // console.log(`MSG: token has been saved`);
    } catch (error) {
        console.log(error);
        return res.send(responseMap.serverError);
    }
};

// after clicking the link, look for user inside token
const handleResetToken = async (req, res) => {
    const resetToken = req.params.resetToken;
    const resetUser = await getUserByResetToken(resetToken, Date.now());

    if (!resetUser) {
        console.log("Link expired");
        return res.status(400).json({ msg: "Link expired" });
    }
    console.log("resetUser", resetUser.authentication.salt);
    return res.status(200).json({ msg: "Token existed." });
};

const handleResetPW = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const resetToken = req.params.resetToken;
        const user = await getUserByResetToken(resetToken, Date.now());
        if (!user) {
            console.log("Expired Link");
            return res.send({
                Status: "Expired Link",
            });
        }
        if (!checkPasswordComplexity(newPassword, 6, 10, 4)) {
            console.log("password doesn't isn't acceptable");
            return res.send(responseMap.unprocessableEntity);
        }

        const { salt, newHashedPassword } = generateHashedPassword(password);
        user.authentication.salt = salt;
        user.authentication.password = newHashedPassword;
        // const salt = random();
        // const newHashedPassword = authentication(salt, newPassword);
        // user.authentication.salt = salt;
        // user.authentication.password = newHashedPassword;

        user.resetPassword.resetToken = null;
        await user.save();
        return res.send({
            Status: "Success",
        });
    } catch (error) {
        console.log(error);
        return res.send(responseMap.serverError);
    }
};

const changePassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { password } = req.body;
        const user = await userModel.findById(userId);
        // const user = await changePassword(userId, password);
        // console.log("password", password);
        console.log("user", user);
        if (user.isGoogleAccount === true) {
            // console.log("it's google account");
            return res.send(responseMap.unauthorized);
        }
        if (!password) {
            console.log("password non exist");
        }
        if (!user) {
            console.log("user not exist");
            return res.send(responseMap.existingUserEmail);
        }

        if (!checkPasswordComplexity(password, 6, 10, 4)) {
            return res.send(responseMap.unprocessableEntity);
        }

        const { salt, newHashedPassword } = generateHashedPassword(password);

        user.authentication.salt = salt;
        user.authentication.password = newHashedPassword;

        await user.save();
        return res.status(200).json({ user });
    } catch (error) {
        console.log(error);
        return res.send(responseMap.serverError);
    }
};

const googleLogin = async (req, res) => {
    const { uid, email, displayName, profilePicture } = req.body;

    try {
        let user = await userModel.findOne({ email: email });

        if (user) {
            if (!user.firebaseUid) {
                user.firebaseUid = uid;
                await user.save();
                console.log("firebaseUid saved successfully");
            }
        } else {
            // Create a new user and set isGoogleAccount to true
            const newUser = new userModel({
                email: email,
                userName: displayName,
                about: about,
                profilePicture: profilePicture,
                firebaseUid: uid,
                isGoogleAccount: true, // Indicate that this user is authenticated through Google
            });

            user = await newUser.save();
            console.log("New user created with firebaseUid");
        }
        return res.status(user ? 200 : 201).json({
            _id: user._id,
            userName: user.userName,
            email: user.email,
            about: user.about,
            profilePicture: user.profilePicture,
            code: 200,
        });
    } catch (error) {
        console.error("Error in googleLogin:", error);
        return res
            .status(500)
            .send({ message: "Error in googleLogin", error: error });
    }
};

//find one  user
const findUser = async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await userModel.findById(userId);

        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
};

//get array of users
const getUsers = async (req, res) => {
    try {
        const users = await userModel.find();

        res.status(200).json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
};

const updateUserProfile = async (req, res) => {
    const profileData = JSON.parse(req.body.profileData);
    const { _id, userName, about, email, profilePicture } = profileData;
    const profilePicturePath = req.file
        ? req.file.path.replace(/\\/g, "/")
        : null; // Normalize file path

    if (!_id) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        // Retrieve the current user data
        const currentUser = await userModel.findById(_id);

        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        let updateObject = { userName, about, email };
        if (profilePicturePath) {
            updateObject.profilePicture = profilePicturePath;
        }

        let emailChangeAttempted = false;

        // Check for email change attempt
        if (
            currentUser.isGoogleAccount &&
            email &&
            email !== currentUser.email
        ) {
            emailChangeAttempted = true;
        } else if (!currentUser.isGoogleAccount) {
            updateObject.email = email;
        }

        // Update the user data
        const updatedUser = await userModel.findByIdAndUpdate(
            _id,
            updateObject,
            {
                new: true,
            }
        );

        // Construct the full URL for the profile picture
        if (updatedUser.profilePicture) {
            updatedUser.profilePictureUrl = `${req.protocol}://${req.get(
                "host"
            )}/uploads/${updatedUser.profilePicture}`;
        }

        res.json({ user: updatedUser, emailChangeAttempted });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Error updating user." });
    }
};
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
      // Delete user from the database
      await userModel.findByIdAndDelete(userId);

      // Here, you can also add logic to handle any additional data cleanup if necessary

      res.status(200).json({ message: 'Account successfully deleted' });
  } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error deleting account' });
  }
};

module.exports = {
    registerUser,
    login,
    handleResetEmail,
    handleResetToken,
    handleResetPW,
    findUser,
    getUsers,
    googleLogin,
    changePassword,
    updateUserProfile,
  deleteUser
};
