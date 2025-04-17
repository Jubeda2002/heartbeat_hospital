var express = require("express");
var exe = require("../connection");
var router = express.Router();


router.get("/",function(req,res){
    res.render("admin/login.ejs");
});


function checkAdminAuth(req, res, next) {
    if (req.session.user_id) {
        next();
    } else {
        res.status(404).send("Page not found");
    }
}

// Process login
router.post("/login", async function (req, res) {
    var { username, password } = req.body; 

    try {
        var sql = "SELECT * FROM login WHERE username =? AND password =?";
        var data = await exe(sql, [username, password]);  

        if (data.length > 0) {
            var user_id = data[0].login_id;  
            req.session.user_id = user_id;

            res.redirect("/admin/dashboard");
        } 
        else {
            res.send("Login Failed! Invalid username or password.");
        }
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/",function(req,res){
    res.render("admin/login.ejs");
});


router.get("/dashboard",checkAdminAuth, async function(req,res){

    var accepted = `SELECT COUNT(*) as accepted_count FROM appointment WHERE status = 'Accepted'`;
    var rejected = `SELECT COUNT(*) as rejected_count FROM appointment WHERE status = 'Rejected'`;
    var pending = `SELECT COUNT(*) as pending_count FROM appointment WHERE status = 'pending'`;
    var total = `SELECT COUNT(*) as total_count FROM appointment`;

    var data = await exe(accepted);
    var accepted_count = data[0].accepted_count;
    data = await exe(rejected);
    var rejected_count = data[0].rejected_count;
    data = await exe(pending);
    var pending_count = data[0].pending_count;
    data = await exe(total);
    var total_count = data[0].total_count;

    var obj = {
        "accepted_count": accepted_count,
        "rejected_count": rejected_count,
        "pending_count": pending_count,
        "total_count": total_count
    }
    res.render("admin/dashboard.ejs", obj);
});


router.get("/home", checkAdminAuth,async function(req, res) {  
    try {
        var data = await exe(`SELECT * FROM home_web`); 
        var obj = { "home_info": data  }; 
        res.render("admin/home.ejs", obj);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
    }
});


router.post("/home_details", async function (req, res) {
    let home_image = "";  // Initialize variable

    if (req.files && req.files.home_image) {
        home_image = new Date().getTime() + "_" + req.files.home_image.name;
        
        // Move the uploaded image to the correct directory
        await req.files.home_image.mv("public/admin_assets/home/" + home_image);
    }

    var d = req.body;

    // Insert the correct image filename into the database
    var sql = `INSERT INTO home_web (home_title, home_description, home_image)  
               VALUES ('${d.home_title}', '${d.home_description}', '${home_image}')`;

    await exe(sql);
    res.redirect("/admin/home");
});

router.get("/home_delete/:id", async function (req, res) {
    try {
        let homeId = req.params.id;
        let sql = `DELETE FROM home_web WHERE home_id = ${homeId}`;
        await exe(sql);
        res.redirect("/admin/home");
    } catch (err) {
        console.error("Error deleting home data:", err);
        res.status(500).send("Internal Server Error");
    }
});
router.get("/home_edit/:id", async function (req, res) {
    try {
        let homeId = req.params.id;
        let data = await exe(`SELECT * FROM home_web WHERE home_id = ${homeId}`);

        if (data.length === 0) {
            return res.status(404).send("Home data not found");
        }

        res.render("admin/home_edit.ejs", { home_info: data[0] });
    } catch (err) {
        console.error("Error fetching home data:", err);
        res.status(500).send("Internal Server Error");
    }
});
router.post("/home_update/:id", async function(req, res) {
    try {
        let homeId = req.params.id;
        let { home_title, home_description} = req.body;

        let updateQuery = `UPDATE home_web 
                           SET home_title = ?, 
                               home_description = ?
                               `;

        let queryParams = [home_title, home_description];

        if (req.files && req.files.home_image) {
            let home_image = new Date().getTime() + req.files.home_image.name;
            await req.files.home_image.mv("public/admin_assets/home/" + home_image);
            updateQuery += ", home_image = ?";
            queryParams.push(home_image);
        }

        updateQuery += " WHERE home_id = ?";
        queryParams.push(homeId);

        await exe(updateQuery, queryParams);
        res.redirect("/admin/home");
    } catch (err) {
        console.error("Error updating home data:", err);
        res.status(500).send("Internal Server Error");
    }
});



router.get("/contact",checkAdminAuth, async function(req,res){
    try {
        var data = await exe(`SELECT * FROM contact`);
        var obj = {"contact": data};
        
        res.render("admin/contact.ejs", obj);
    } catch (err) {
        console.error("Error fetching department data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/contact_details",async function(req,res){
    var d=req.body;
    var sql=`INSERT INTO contact (contact_address,contact_email,contact_number) VALUES
     ('${d.contact_address}','${d.contact_email}','${d.contact_number}')`;
    var data=await exe(sql);
    res.redirect("/admin/contact");
});
router.get("/contact_edit/:id", async function(req, res) {
    try {
        let contactId = req.params.id;
        let data = await exe(`SELECT * FROM contact WHERE contact_id = ${contactId}`);
        
        if (data.length === 0) {
            return res.status(404).send("Contact Not Found");
        }

        res.render("admin/contact_edit.ejs", { contact_info: data[0] });
    } catch (err) {
        console.error("Error fetching contact data:", err);
        res.status(500).send("Internal Server Error");
    }
});
router.post("/contact_update/:id", async function(req, res) {
    try {
        let contactId = req.params.id;
        let { contact_number, contact_email, contact_address } = req.body;

        let sql = `UPDATE contact 
                   SET contact_number = '${contact_number}', 
                       contact_email = '${contact_email}', 
                       contact_address = '${contact_address}' 
                   WHERE contact_id = ${contactId}`;

        await exe(sql);
        res.redirect("/admin/contact");
    } catch (err) {
        console.error("Error updating contact:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/contact_delete/:id", async function (req, res) {
    try {
        let contactId = req.params.id;
        let sql = `DELETE FROM contact WHERE contact_id = ${contactId}`;
        await exe(sql);
        res.redirect("/admin/contact");
    } catch (err) {
        console.error("Error deleting contact:", err);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/appointment",checkAdminAuth, async function(req,res){
        var data = await exe(`SELECT * FROM appointment WHERE status = 'pending'`);
        var obj = {"appointment": data};
        res.render("admin/appointment.ejs", obj);
  
       
});


router.get("/accepted",async (req,res)=>{
    var data = await exe(`SELECT * FROM appointment WHERE status = 'Accepted'`);
    var obj = {"appointment":data};
    res.render("admin/accepted.ejs",obj);
})
router.get("/reject",async (req,res)=>{   
    var data = await exe(`SELECT * FROM appointment WHERE status = 'Rejected'`);
    var obj = {"appointment":data};
    res.render("admin/reject.ejs",obj);
});

router.get("/appointment_accepted/:id",async function(req,res){
    var id = req.params.id;
    var sql = `UPDATE appointment SET status = 'Accepted' WHERE appointment_id = ?`;
    await exe(sql, [id]);
    res.redirect("/admin/appointment");
});
router.get("/appointment_rejected/:id",async function(req,res){
    var id = req.params.id;
    var sql = `UPDATE appointment SET status = 'Rejected' WHERE appointment_id = ?`;
    await exe(sql, [id]);
    res.redirect("/admin/appointment");
});


router.get("/accepted_delete/:id",async function(req,res){
    var acceptedId =req.params.id;
    var sql =`DELETE FROM appointment where appointment_id=${acceptedId}`;
    await exe(sql);
    res.redirect("/admin/accepted");
})

router.get("/rejected_deleted/:id",async function(req,res){    
    var rejectedId =req.params.id;
    var sql =`DELETE FROM appointment where appointment_id=${rejectedId}`;
    await exe(sql);
    res.redirect("/admin/reject");
});





router.get("/department",checkAdminAuth,async function(req,res){
    try {
        var data = await exe(`SELECT * FROM department`);
        var obj = {"dep_info": data};
        res.render("admin/department.ejs", obj);
    } catch (err) {
        console.error("Error fetching department data:", err);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/Specialist",checkAdminAuth,async function(req,res){
    try{
        var data=await exe(`SELECT * FROM doctor_team`);
        var obj={"doctor_info":data};
        res.render("admin/Specialist.ejs",obj);
    }
   catch(err){
res.status(500).send("Internal Server Error");
   }
});


router.post("/doctor_details",async function(req,res){
    if(req.files){
        var doctor_image = new Date().getTime() + req.files.doctor_image.name;
          req.files.doctor_image.mv("public//admin_assets/specilist/" + doctor_image)
      }
      var d=req.body;
      var sql=`INSERT INTO doctor_team(doctor_image,doctor_name,doctor_position,doctor_experience,doctor_education,doctor_description)
       VALUES('${doctor_image}','${d.doctor_name}','${d.doctor_position}','${d.doctor_experience}','${d.doctor_education}','${d.doctor_description}')`;
      var data=await exe(sql);
      res.redirect("/admin/Specialist");
});
router.get("/Specialist_edit/:id", async function(req, res) {
    try {
        let SpecialistId = req.params.id;
        let data = await exe(`SELECT * FROM doctor_team WHERE doctor_id = ${SpecialistId}`);
        
        if (data.length === 0) {
            return res.status(404).send("Specialist Not Found");
        }

        res.render("admin/Specialist_edit.ejs", { doctor_info: data[0] });
    } catch (err) {
        console.error("Error fetching Specialist data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/Specialist_update/:id", async function(req, res) {
  
    try {
        let SpecialistId = req.params.id;
        let { doctor_image,doctor_name,doctor_position,doctor_experience,doctor_education,doctor_description } = req.body;

        let updateQuery = `UPDATE doctor_team 
                           SET doctor_image = ?, 
                               doctor_name = ?, 
                               doctor_position = ?, 
                               doctor_experience = ?, 
                               doctor_education = ?, 
                               doctor_description = ? `;

        let queryParams = [doctor_image, doctor_name, doctor_position, doctor_experience, doctor_education, doctor_description];

        if (req.files && req.files.doctor_image) {
            let doctor_image = new Date().getTime() + req.files.doctor_image.name;
            await req.files.doctor_image.mv("public/admin_assets/specilist/" + doctor_image);
            updateQuery += ", doctor_image = ?";
            queryParams.push(doctor_image);
        }

        updateQuery += " WHERE doctor_id = ?";
        queryParams.push(SpecialistId);

        await exe(updateQuery, queryParams);
        res.redirect("/admin/Specialist");
    } catch (err) {
        console.error("Error updating specialist data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/Specialist_delete/:id", async function (req, res) {
    try {
        let SpecialistId = req.params.id;
        let sql = `DELETE FROM doctor_team WHERE doctor_id = ${SpecialistId}`;
        await exe(sql);
        res.redirect("/admin/Specialist");
    } catch (err) {
        console.error("Error deleting Specialist:", err);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/gallary",checkAdminAuth, async function(req, res) {  
    try {
        var data = await exe(`SELECT * FROM gallary_image`); 
        var obj = { "gallary": data  }; 
        res.render("admin/gallary.ejs", obj);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
    }
});


router.post("/gallary_details",async function(req,res){
    if(req.files){
        var gallery_image = new Date().getTime() + req.files.gallery_image.name;
          req.files.gallery_image.mv("public//admin_assets/gallery/" + gallery_image)
      }
      var d=req.body;
      var sql=`INSERT INTO gallary_image(gallery_image,gallery_description)
       VALUES('${gallery_image}','${d.gallery_description}')`;
      var data=await exe(sql);
      res.redirect("/admin/gallary");
});
router.get("/gallery_delete/:id", async function (req, res) {
    try {
        let gallaryId = req.params.id;
        let sql = `DELETE FROM gallary_image WHERE gallery_id = ${gallaryId}`;
        await exe(sql);
        res.redirect("/admin/gallary");
    } catch (err) {
        console.error("Error deleting gallary data:", err);
        res.status(500).send("Internal Server Error");
    }
});
router.get("/gallery_edit/:id", async function (req, res) {
    try {
        let gallaryId = req.params.id;
        let data = await exe(`SELECT * FROM gallary_image WHERE gallery_id = ${gallaryId}`);

        if (data.length === 0) {
            return res.status(404).send("Home data not found");
        }

        res.render("admin/gallery_edit.ejs", { gallary: data[0] });
    } catch (err) {
        console.error("Error fetching gallary data:", err);
        res.status(500).send("Internal Server Error");
    }
});
router.post("/gallary_update/:id", async function(req, res) {
    try {
        let gallaryId = req.params.id;
        let { gallery_image, gallery_description } = req.body;

        let updateQuery = `UPDATE gallary_image 
                           SET gallery_description = ?`;
        let queryParams = [gallery_description];

        if (req.files && req.files.gallery_image) {
            let uploaded_image = new Date().getTime() + req.files.gallery_image.name;
            await req.files.gallery_image.mv("public/admin_assets/home/" + uploaded_image);
            updateQuery += ", gallery_image = ?";
            queryParams.push(uploaded_image);
        }

        updateQuery += " WHERE gallery_id = ?";
        queryParams.push(gallaryId);

        console.log("Final Query:", updateQuery);
        console.log("Query Params:", queryParams);

        await exe(updateQuery, queryParams);
        res.redirect("/admin/gallary");
    } catch (err) {
        console.error("Error updating gallery data:", err);
        res.status(500).send("Internal Server Error");
    }
});



router.get("/blogs",checkAdminAuth,async function(req,res){
    try{
        var data=await exe(`SELECT * FROM blogs`);
        var obj={"blogs":data};
        res.render("admin/blogs.ejs",obj);
    }
   catch(err){
res.status(500).send("Internal Server Error");
   }
});


router.post("/blogs_details",async function(req,res){
    if(req.files){
        var blogs_image = new Date().getTime() + req.files.blogs_image.name;
          req.files.blogs_image.mv("public//admin_assets/blogs/" + blogs_image)
      }
      var d=req.body;
      var sql=`INSERT INTO blogs(blogs_image,blogs_title,blogs_description) 
       VALUES('${blogs_image}','${d.blogs_title}','${d.blogs_description}')`;
      var data=await exe(sql);
      res.redirect("/admin/blogs");
});
router.get("/blogs_edit/:id", async function(req, res) {
    try {
        let BlogsId = req.params.id;
        let data = await exe(`SELECT * FROM blogs WHERE blogs_id = ${BlogsId}`);
        
        if (data.length === 0) {
            return res.status(404).send("blogs Not Found");
        }

        res.render("admin/blogs_edit.ejs", { blogs: data[0] });
    } catch (err) {
        console.error("Error fetching blogs data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/blogs_details/:id", async function(req, res) {
        let { blogs_image, blogs_title, blogs_description } = req.body;
    try {
        let BlogsId = req.params.id;
        let { blogs_image,blogs_title,blogs_description} = req.body;

        let updateQuery = `UPDATE blogs 
                           SET blogs_image = ?, 
                               blogs_title = ?, 
                               blogs_description = ?  `;

        let queryParams = [blogs_image, blogs_title, blogs_description];

        if (req.files && req.files.blogs_image) {
            let blogs_image = new Date().getTime() + req.files.blogs_image.name;
            await req.files.blogs_image.mv("public/admin_assets/blogs/" + blogs_image);
            updateQuery += ", blogs_image = ?";
            queryParams.push(blogs_image);
        }

        updateQuery += " WHERE blogs_id = ?";
        queryParams.push(BlogsId);

        await exe(updateQuery, queryParams);
        res.redirect("/admin/blogs");
    } catch (err) {
        console.error("Error updating blogs data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/blogs_delete/:id", async function (req, res) {
    try {
        let BlogsId = req.params.id;
        let sql = `DELETE FROM blogs WHERE blogs_id = ${BlogsId}`;
        await exe(sql);
        res.redirect("/admin/blogs");
    } catch (err) {
        console.error("Error deleting blogs:", err);
        res.status(500).send("Internal Server Error");
    }
});



router.get("/services",checkAdminAuth,async function(req,res){
    try{
        var data=await exe(`SELECT * FROM services`);
        var obj={"services":data};
        res.render("admin/services.ejs",obj);
    }
   catch(err){
res.status(500).send("Internal Server Error");
   }
});


router.post("/services_details", async function (req, res) {
    try {
        var d = req.body;
        var sql = `INSERT INTO services (services_icon, services_title, services_description) 
                   VALUES ('${d.services_icon}', '${d.services_title}', '${d.services_description}')`;

        var data = await exe(sql);
        res.redirect("/admin/services");
    } catch (error) {
        console.error("Error inserting service:", error);
        res.status(500).send("An error occurred while adding the service.");
    }
});


router.get("/services_edit/:id", async function(req, res) {
    try {
        let ServicesId = req.params.id;
        let data = await exe(`SELECT * FROM services WHERE services_id = ${ServicesId}`);
        
        if (data.length === 0) {
            return res.status(404).send("services Not Found");
        }

        res.render("admin/services_edit.ejs", { services: data[0] });
    } catch (err) {
        console.error("Error fetching services data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/services_update/:id", async function (req, res) {
    try {
        let ServicesId = req.params.id;  // Corrected ID reference
        let { services_icon, services_title, services_description } = req.body;
        
        let updateQuery = `UPDATE services 
                           SET services_icon = ?, 
                               services_title = ?, 
                               services_description = ?`;

        let queryParams = [services_icon, services_title, services_description];

        // Handle File Upload (Only if a new icon is uploaded)
        if (req.files && req.files.services_icon) {
            let services_icon_filename = new Date().getTime() + req.files.services_icon.name;
            await req.files.services_icon.mv("public/admin_assets/services/" + services_icon_filename);
            updateQuery += ", services_icon = ?";
            queryParams.push(services_icon_filename);
        }

        updateQuery += " WHERE services_id = ?";
        queryParams.push(ServicesId);

        await exe(updateQuery, queryParams);
        res.redirect("/admin/services");
    } catch (err) {
        console.error("Error updating services data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/services_delete/:id", async function (req, res) {
    try {
        let ServicesId = req.params.id;
        let sql = `DELETE FROM services WHERE services_id = ${ServicesId}`;
        await exe(sql);
        res.redirect("/admin/services");
    } catch (err) {
        console.error("Error deleting services:", err);
        res.status(500).send("Internal Server Error");
    }
});



router.get("/about_us",checkAdminAuth,async function(req,res){
    try{
        var data=await exe(`SELECT * FROM about`);
        var obj={"about":data};
        res.render("admin/about_us.ejs",obj);
    }
   catch(err){
res.status(500).send("Internal Server Error");
   }
});


router.post("/about_details", async function (req, res) {
   
   
    if(req.files){
        var doctor_image = new Date().getTime() + req.files.doctor_image.name;
          req.files.doctor_image.mv("public//admin_assets/about/" + doctor_image)
      }
      if(req.files){
        var hospital_image = new Date().getTime() + req.files.hospital_image.name;
          req.files.hospital_image.mv("public//admin_assets/about/" + hospital_image)
      }
      
      try {
        var d = req.body;
        var sql = `INSERT INTO about (mission_title,mission_description,vision_title, vision_description, doctor_location, doctor_name, 
        doctor_position, doctor_description, doctor_image, 
hospital_image,hospital_title,hospital_description) 
                   VALUES ('${d.mission_title}', '${d.mission_description}', '${d.vision_title}','${d.vision_description}', 
                   '${d.doctor_location}', '${d.doctor_name}','${d.doctor_position}', '${d.doctor_description}', '${doctor_image}','${hospital_image}', 
                   '${d.hospital_title}', 
                   '${d.hospital_description}')`;

        var data = await exe(sql);
        res.redirect("/admin/about_us");
    } catch (error) {
        console.error("Error inserting service:", error);
        res.status(500).send("An error occurred while adding the service.");
    }
});
router.get("/about_edit/:id", async function (req, res) {
    try {
        let AboutId = req.params.id;
        let data = await exe(`SELECT * FROM about WHERE about_id = ${AboutId}`);

        if (data.length === 0) {
            return res.status(404).send("About data not found");
        }

        res.render("admin/about_edit.ejs", { about: data[0] });
    } catch (err) {
        console.error("Error fetching about data:", err);
        res.status(500).send("Internal Server Error");
    }
});
router.post("/about_update/:id", async function (req, res) {
    try {
        let AboutId = req.params.id;
        let { mission_title, mission_description, vision_title, vision_description, doctor_location, doctor_name, 
              doctor_position, doctor_description, hospital_title, hospital_description, 
              } = req.body;

        let updateQuery = `UPDATE about 
                           SET mission_title = ?, 
                               mission_description = ?, 
                               vision_title = ?, 
                               vision_description = ?, 
                               doctor_location = ?, 
                               doctor_name = ?, 
                               doctor_position = ?, 
                               doctor_description = ?, 
                               hospital_title = ?, 
                               hospital_description = ? 
                             `;

        let queryParams = [mission_title, mission_description, vision_title, vision_description, doctor_location, doctor_name, 
                           doctor_position, doctor_description, hospital_title, hospital_description, 
                     ];

        // Check if a new doctor image is uploaded
        if (req.files && req.files.doctor_image) {
            let doctor_image = new Date().getTime() + "_" + req.files.doctor_image.name;
            await req.files.doctor_image.mv("public/admin_assets/about/" + doctor_image);
            updateQuery += ", doctor_image = ?";
            queryParams.push(doctor_image);
        }

        // Check if a new hospital image is uploaded
        if (req.files && req.files.hospital_image) {
            let hospital_image = new Date().getTime() + "_" + req.files.hospital_image.name;
            await req.files.hospital_image.mv("public/admin_assets/about/" + hospital_image);
            updateQuery += ", hospital_image = ?";
            queryParams.push(hospital_image);
        }

        // Append WHERE condition
        updateQuery += " WHERE about_id = ?";
        queryParams.push(AboutId);

        // Execute query
        await exe(updateQuery, queryParams);

        res.redirect("/admin/about_us");
    } catch (err) {
        console.error("Error updating about data:", err);
        res.status(500).send("Internal Server Error");
    }
});


// router.post("/about_update/:id", async function(req, res) {
//         let { mission_title,mission_description,vision_title, vision_description, doctor_location, doctor_name, 
//             doctor_position, doctor_description, doctor_image, 
//     hospital_image,hospital_title,hospital_description,faq_title,histroy_description,faq_question, faq_Answer } = req.body;
//     try {
//         let AboutId = req.params.id;
//         let { mission_title,mission_description,vision_title, vision_description, doctor_location, doctor_name, 
//             doctor_position, doctor_description, doctor_image, 
//     hospital_image,hospital_title,hospital_description,histroy_title,histroy_description,faq_question, faq_Answer} = req.body;

//         let updateQuery = `UPDATE about 
//                            SET mission_title = ?, 
//                                mission_description = ?, 
//                                vision_title = ?,
//                                vision_description = ?, 
//                                doctor_location = ?, 
//                                doctor_name = ?,
//                                doctor_position = ?, 
//                                doctor_description = ?, 
//                                doctor_image = ?,
//                                hospital_image = ?, 
//                                hospital_title = ?, 
//                                hospital_description = ?,
//                                histroy_title = ?, 
//                                histroy_description = ?, 
//                                faq_question = ?,
//                                faq_Answer = ?,   `;

//         let queryParams = [mission_title,mission_description,vision_title, vision_description, doctor_location, doctor_name, 
//             doctor_position, doctor_description, doctor_image, 
//     hospital_image,hospital_title,hospital_description,histroy_title,histroy_description,faq_question, faq_Answer];

//         if (req.files && req.files.doctor_image) {
//             let doctor_image = new Date().getTime() + req.files.doctor_image.name;
//             await req.files.doctor_image.mv("public/admin_assets/about/" + doctor_image);
//             updateQuery += ", doctor_image = ?";
//             queryParams.push(doctor_image);
//         }
//         if (req.files && req.files.hospital_image) {
//             let hospital_image = new Date().getTime() + req.files.hospital_image.name;
//             await req.files.hospital_image.mv("public/admin_assets/about/" + hospital_image);
//             updateQuery += ", hospital_image = ?";
//             queryParams.push(hospital_image);
//         }

//         updateQuery += " WHERE about_id = ?";
//         queryParams.push(AboutId);

//         await exe(updateQuery, queryParams);
//         res.redirect("/admin/about_us");
//     } catch (err) {
//         console.error("Error updating about data:", err);
//         res.status(500).send("Internal Server Error");
//     }
// });

router.get("/about_delete/:id", async function (req, res) {
    try {
        let AboutId = req.params.id;
        let sql = `DELETE FROM about WHERE about_id = ${AboutId}`;
        await exe(sql);
        res.redirect("/admin/about_us");
    } catch (err) {
        console.error("Error deleting about:", err);
        res.status(500).send("Internal Server Error");
    }
});



router.get("/history",checkAdminAuth, async function(req,res){
    try {
        var data = await exe(`SELECT * FROM history`);
        var obj = {"history": data};
        
        res.render("admin/history.ejs", obj);
    } catch (err) {
        console.error("Error fetching department data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/history_details",async function(req,res){
    var d=req.body;
    var sql=`INSERT INTO history (histroy_title_left, histroy_descritdtion_left, histroy_title_right, histroy_description_right) VALUES
     ('${d.histroy_title_left}','${d.histroy_descritdtion_left}','${d.histroy_title_right}','${d.histroy_description_right}')`;
    var data=await exe(sql);
    res.redirect("/admin/history");
});
router.get("/history_edit/:id", async function(req, res) {
    try {
        let historyId = req.params.id;
        let data = await exe(`SELECT * FROM history WHERE history_id = ${historyId}`);
        
        if (data.length === 0) {
            return res.status(404).send("history Not Found");
        }

        res.render("admin/history_edit.ejs", { history: data[0] });
    } catch (err) {
        console.error("Error fetching history data:", err);
        res.status(500).send("Internal Server Error");
    }
});
router.post("/history_update/:id", async function(req, res) {
    try {
        let historyId = req.params.id;
        let { histroy_title, histroy_description} = req.body;

        let sql = `UPDATE contact SET
                   histroy_title_left =?,
                    histroy_descritdtion_left =?,
                     histroy_title_right=?,
                      histroy_description_right=? `;    

        await exe(sql);
        res.redirect("/admin/histroy");
    } catch (err) {
        console.error("Error updating histroy:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/history_delete/:id", async function (req, res) {
    try {
        let historyId = req.params.id;
        let sql = `DELETE FROM history WHERE history_id = ${historyId}`;
        await exe(sql);
        res.redirect("/admin/history");
    } catch (err) {
        console.error("Error deleting history:", err);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/faq",checkAdminAuth, async function(req,res){
    try {
        var data = await exe(`SELECT * FROM faq`);
        var obj = {"faq": data};
        
        res.render("admin/faq.ejs", obj);
    } catch (err) {
        console.error("Error fetching department data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/faq_details",async function(req,res){
    var d=req.body;
    var sql=`INSERT INTO faq (faq_question, faq_Answer) VALUES
     ('${d.faq_question}','${d.faq_Answer}')`;
    var data=await exe(sql);
    res.redirect("/admin/faq");
});

router.get("/faq_edit/:id", async function(req, res) {
    try {
        let faqId = req.params.id;
        let data = await exe(`SELECT * FROM faq WHERE faq_id = ${faqId}`);
        
        if (data.length === 0) {
            return res.status(404).send("faq Not Found");
        }

        res.render("admin/faq_edit.ejs", { faq: data[0] });
    } catch (err) {
        console.error("Error fetching history data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/faq_update/:id", async function(req, res) {
    try {
        let faqid = req.params.id;
        let { faq_question, faq_Answer } = req.body;

        let sql = `UPDATE  faq
                   SET faq_question = '${faq_question}',
                       faq_Answer = '${faq_Answer}'
                      
                   WHERE faq_id = ${faqid}`;

               //    res.send(sql)

        await exe(sql);
        res.redirect("/admin/faq");
    } catch (err) {
        console.error("Error updating faq:", err);
        res.status(500).send("Internal Server Error");
    }
});



router.get("/faq_delete/:id", async function(req, res) {
    try {
        let faqId = req.params.id;
        let { faq_question, faq_Answer} = req.body;
        let sql = `DELETE FROM faq WHERE faq_id = ${faqId}`;  

        await exe(sql);
        res.redirect("/admin/faq");
    } catch (err) {
        console.error("Error updating faq:", err);
        res.status(500).send("Internal Server Error");
    }
});




router.get("/Privacy_Policy",checkAdminAuth, async function(req,res){
    try {
        var data = await exe(`SELECT * FROM policy`);
        var obj = {"policy": data};
        
        res.render("admin/Privacy_Policy.ejs", obj);
    } catch (err) {
        console.error("Error fetching department data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/policy_details",async function(req,res){
    var d=req.body;
    var sql=`INSERT INTO policy( policy_title, policy_description) VALUES
     ('${d.policy_title}','${d.policy_description}')`;
    var data=await exe(sql);
    res.redirect("/admin/Privacy_Policy");
});
router.get("/policy_delete/:id", async function (req, res) {
    try {
        let policyId = req.params.id;
        let sql = `DELETE FROM policy WHERE policy_id = ${policyId}`;
        await exe(sql);
        res.redirect("/admin/Privacy_Policy");
    } catch (err) {
        console.error("Error deleting Privacy_Policy:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/insurance", async function(req,res){
    try {
        var data = await exe(`SELECT * FROM insurance`);
        var obj = {"insurance": data};
        
        res.render("admin/insurance.ejs", obj);
    } catch (err) {
        console.error("Error fetching department data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/insurance_details",async function(req,res){
    var d=req.body;
    var sql=`INSERT INTO insurance( insurance_title) VALUES
     ('${d.insurance_title}')`;
    var data=await exe(sql);
    res.redirect("/admin/insurance");
});
router.get("/insurance_delete/:id", async function (req, res) {
    try {
        let insuranceId = req.params.id;
        let sql = `DELETE FROM insurance WHERE insurance_id = ${insuranceId}`;
        await exe(sql);
        res.redirect("/admin/insurance");
    } catch (err) {
        console.error("Error deleting insurance:", err);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/review_section",checkAdminAuth, async function(req,res){
    try {
        var data = await exe(`SELECT * FROM review`);
        var obj = {"review": data};
        
        res.render("admin/review_section.ejs", obj);
    } catch (err) {
        console.error("Error fetching department data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/review_details",async function(req,res){
    if(req.files){
        var patient_image = new Date().getTime() + req.files.patient_image.name;
          req.files.patient_image.mv("public/admin_assets/home/" + patient_image)
      }
    var d=req.body;
    var sql=`INSERT INTO review(patient_image, patient_name, date, description) VALUES
     ('${patient_image}','${d.patient_name}','${d.date}','${d.description}')`;
    var data=await exe(sql);
    res.redirect("/admin/review_section");
});


router.get("/review_delete/:id", async function (req, res) {
    try {
        let reviewId = req.params.id;
        let sql = `DELETE FROM review WHERE review_id = ${reviewId}`;
        await exe(sql);
        res.redirect("/admin/review_section");
    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).send("Internal Server Error");
    }
});



router.get("/facility",checkAdminAuth, async function(req,res){
    try {
        var data = await exe(`SELECT * FROM facility`);
        var obj = {"facility": data};
        
        res.render("admin/facility.ejs", obj);
    } catch (err) {
        console.error("Error fetching department data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/facility_details",async function(req,res){
    if(req.files){
        var facility_image = new Date().getTime() + req.files.facility_image.name;
          req.files.facility_image.mv("public/admin_assets/home/" + facility_image)
      }
    var d=req.body;
    var sql=`INSERT INTO facility(facility_image, facility_title) VALUES
     ('${facility_image}','${d.facility_title}')`;
    var data=await exe(sql);
    res.redirect("/admin/facility");
});


router.get("/facility_delete/:id", async function (req, res) {
    try {
        let facilityId = req.params.id;
        let sql = `DELETE FROM facility WHERE facility_id = ${facilityId}`;
        await exe(sql);
        res.redirect("/admin/facility");
    } catch (err) {
        console.error("Error deleting facility:", err);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/heart_health",checkAdminAuth, async function(req,res){
    try {
        var data = await exe(`SELECT * FROM heart`);
        var obj = {"heart": data};
        
        res.render("admin/heart_health.ejs", obj);
    } catch (err) {
        console.error("Error fetching department data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/heart_details",async function(req,res){
    if(req.files){
        var heart_image = new Date().getTime() + req.files.heart_image.name;
          req.files.heart_image.mv("public/admin_assets/home/" + heart_image)
      }
    var d=req.body;
    var sql=`INSERT INTO heart(heart_image, heart_title, heart_description) VALUES
     ('${heart_image}','${d.heart_title}','${d.heart_description}')`;
    var data=await exe(sql);
    res.redirect("/admin/heart_health");
});


router.get("/heart_delete/:id", async function (req, res) {
    try {
        let heartId = req.params.id;
        let sql = `DELETE FROM heart WHERE heart_id = ${heartId}`;
        await exe(sql);
        res.redirect("/admin/heart_health");
    } catch (err) {
        console.error("Error deleting heart:", err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports=router;
