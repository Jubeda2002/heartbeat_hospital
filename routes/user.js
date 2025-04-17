var express = require("express");
var exe = require("../connection");
var router = express.Router();


router.get("/", async function(req, res) {  


    var sql = `SELECT * FROM home_web`;
    var data= await exe(sql);
    
    var sliderimage = `SELECT * FROM home_web`;
    var data1= await exe(sliderimage);


    var review = `SELECT * FROM review`;
    var data2= await exe(review);

    var facility = `SELECT * FROM facility`;
    var data3= await exe(facility);

    var heart = `SELECT * FROM heart`;
    var data4= await exe(heart);


    var obj={
    "home":data,
    "sliderimage":data1,
    "review":data2,
    "facility":data3,
    "heart":data4
    }
    res.render("user/index.ejs",obj); 
});

// router.get("/about",async function(req,res){
    
//     res.render("user/about.ejs");

// });

// router.get("/service",async function(req,res){
    
//     res.render("user/service.ejs");

// });
// router.get("/department",async function(req,res){
    
//     res.render("user/department.ejs");

// });
router.get('/gallary', async function(req, res) {
    var gallary =  await exe(`SELECT * FROM gallary_image`);
    res.render('user/gallary.ejs', { gallary: gallary }); 

});



router.get('/Specialist', async function(req, res) {
        var Specialist =  await exe(`SELECT * FROM doctor_team`);
        res.render('user/Specialist.ejs', { Specialist: Specialist }); 
    
});



 router.get("/contact",async function(req,res){
     var contact = await exe(`SELECT * FROM contact`);
    
     res.render("user/contact.ejs",{contact:contact});

 });

 router.get("/contact_edit",async function(req,res){
    var contact = await exe(`SELECT * FROM user_contact`);
   
    res.render("user/contact_edit.ejs",{contact:contact});

});

router.post("/save_contact",async function(req,res){
    var sql = `INSERT INTO user_contact(quries,  full_name, email, mobile_no, address, date, select_city, select_doctor, message) VALUES (?,?,?,?,?,?,?,?,?)`;
    var d = req.body;
    var data = await exe(sql,[d.quries,  d.full_name, d.email, d.mobile_no, d.address, d.date, d.select_city, d.select_doctor, d.message]);
    res.redirect("/contact");
});




 router.get("/service",async function(req,res){
    var service = await exe(`SELECT * FROM service`);
    res.render("user/service.ejs",{service:service});   
}
);
router.get("/blogs",async function(req,res){
    var blogs = await exe(`SELECT * FROM blogs`);
    res.render("user/blogs.ejs",{blogs:blogs});   
});

router.get("/services",async function(req,res){
    var services = await exe(`SELECT * FROM services`);
    res.render("user/services.ejs",{services:services});   
}
);

router.get("/appointment",async function(req,res){
    var appointment = await exe(`SELECT * FROM appointment`);
    res.render("user/appointment.ejs",{appointment:appointment});   
}
);
router.post("/save_appoinment",async function(req,res){
    var sql = `INSERT INTO appointment(full_name, select_doctor, phone_no, date, time, message) VALUES (?,?,?,?,?,?)`;
    var d = req.body;
    var data = await exe(sql,[d.full_name, d.select_doctor, d.phone_no, d.date, d.time, d.message]);
    res.redirect("/");
});

router.get("/Privacy_Policy",async function(req,res){
    var policy = await exe(`SELECT * FROM policy`);
    res.render("user/Privacy_Policy.ejs",{policy:policy}); 
   
});

router.get("/insurance",async function(req,res){
    var insurance = await exe(`SELECT * FROM insurance`);
    res.render("user/insurance.ejs",{insurance:insurance}); 
   
});




router.get("/about_us",async function(req,res){
    var sql = `SELECT * FROM about`;
    var data= await exe(sql);
    
    var sqlhistory = `SELECT * FROM history`;
    var data1= await exe(sqlhistory);


    var sqlfaq = `SELECT * FROM faq`;
    var data2= await exe(sqlfaq);

    var obj={
    "about":data,
    "history":data1,
    "faq":data2
    }
    res.render("user/about_us.ejs",obj); 
});




module.exports=router;