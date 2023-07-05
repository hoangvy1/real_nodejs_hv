const pool = require("../databasephp")
const bcrypt = require("bcrypt");
const config = require("../config");
const jwt = require("jsonwebtoken");
const express = require("express");
let middleware = require("../middleware");
const router = express.Router();

router.route("/:username").get(middleware.checkToken, (req, res) => {

  const q = "SELECT * FROM Login_user WHERE username = ?";

  pool.query(q,{ username: req.params.username }, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json({
      data: data,
      username: req.params.username,
    });
  });
});


router.route("/location").get((req, res) => {
  const q = "SELECT DISTINCT latitude, longitude FROM location;";
  pool.query(q, function (err, data) {
    if(err) throw err;
    return res.json(data[0]);
  })
})

// router.route("/location").get(middleware.checkToken, (req, res) => {

//   const q = "SELECT * FROM location";

//   pool.query(q, (err, data) => {
//     if (err) return res.status(500).json(err);
//     return res.json({
//       data: data,
//     });
//   });
// });



// router.route("/checkusername/:username").get((req, res) => {
//   User.findOne({ username: req.params.username }, (err, result) => {
//     if (err) return res.status(500).json({ msg: err });
//     if (result !== null) {
//       return res.json({
//         Status: true,
//       });
//     } else
//       return res.json({
//         Status: false,
//       });
//   });
// });

router.route("/register").post((req, res) => {
    //CHECK EXISTING USER
    const q = "SELECT * FROM Login_user WHERE username = ?";
  
    pool.query(q, [req.body.username], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.length) return res.status(409).json("User already exists!");
  
      //Hash the password and create a user
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(req.body.password, salt);
  
      const q = "INSERT INTO Login_user(`username`,`password`) VALUES (?)";
      const values = [req.body.username, hash];
  
      pool.query(q, [values], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json("User has been created.");
      });
    });
});
router.route("/login").post((req, res) => {
    //CHECK USER
  
    const q = "SELECT * FROM Login_user WHERE username = ?";
  
    pool.query(q, [req.body.username], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.length === 0) return res.status(404).json("User not found!");
  
      //Check password
      const isPasswordCorrect = bcrypt.compareSync(
        req.body.password,
        data[0].password
      );
  
      if (!isPasswordCorrect)
        return res.status(400).json("Wrong username or password!");
  
      const token = jwt.sign({ id: data[0].id }, config.key);
      const { password, ...other } = data[0];
      console.log(token);
      res
        .cookie("access_token", token, {
          httpOnly: true,
        })
        .status(200)
        .json(other);
    });
});

router.route("/update/:username").patch((req, res) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(req.body.password, salt);
  const q = " UPDATE Login_user SET password = ? WHERE username = ?";
  const values = [hash];
  pool.query(q, [values,req.body.username ],
    (err, data) => {
      if (err) return res.status(500).json(err);
      const msg = {
        msg: "password successfully updated",
        username: req.body.username,
      };
      return res.json(msg);
    }
  );
});

router.route("/delete/:username").delete(middleware.checkToken, (req, res) => {
  const q = "DELETE from Login_user WHERE id = ?";
  pool.query(q,[req.params.username], (err, data) => {
    if (err) return res.status(500).json({ msg: err });
    const msg = {
      msg: "User deleted",
      username: req.params.username,
    };
    return res.json(msg);
  });
});

router.route("/logout").post((req, res)=>{

    res.clearCookie("access_token",{
      sameSite:"none",
      secure:true
    }).status(200).json("User has been logged out.")
  });

router.route("/location").get(middleware.checkToken, (req, res) => {
    const q = "SELECT * FROM Login_user WHERE username = ?";
    pool.query({ username: req.decoded.username }, (err, result) => {
      if (err) return res.json({ err: err });
      if (result == null) return res.json({ data: [] });
      else return res.json({ data: result });
    });
  });


module.exports = router; 
