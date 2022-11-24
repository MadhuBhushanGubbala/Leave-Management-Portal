var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Project = require('../models/project');
var Leave = require('../models/leave');
var Holiday=require('../models/holidays');
var csrf = require('csurf');
var csrfProtection = csrf();
var config_passport = require('../config/passport.js');
var moment = require('moment');
var Leave = require('../models/leave');


router.use('/', isLoggedIn, function isAuthenticated(req, res, next) {
    next();
});

/* Displays home page to the admin*/
router.get('/', function viewHome(req, res, next) {
    res.render('Admin/adminHome', {
        title: 'Admin Home',
        csrfToken: req.csrfToken(),
        userName: req.session.user.name
    });
});

/* First it gets attributes of the logged in admin from the User Schema.
 * Attributes are get with the help of id of logged in admin stored in session.*/
router.get('/view-profile', function viewProfile(req, res, next) {

    User.findById(req.session.user._id, function getUser(err, user) {
        if (err) {
            console.log(err);
        }
        res.render('Admin/viewProfile', {
            title: 'Profile',
            csrfToken: req.csrfToken(),
            employee: user,
            moment: moment,
            userName: req.session.user.name
        });
    });
});

/* Then displays list of all employees to the admin.*/

router.get('/view-all-employees', function viewAllEmployees(req, res, next) {

    var userChunks = [];
    var chunkSize = 3;
    
    User.find({$or: [{designation: 'Employee'}]}).sort({_id: -1}).exec(function getUsers(err, docs) {
        for (var i = 0; i < docs.length; i++) {
            userChunks.push(docs[i]);
        }
        res.render('Admin/viewAllEmployee', {
            title: 'All Employees',
            csrfToken: req.csrfToken(),
            users: userChunks,
            userName: req.session.user.name
        });
    });
});

/*Displays add employee form to the admin.*/

router.get('/add-employee', function addEmployee(req, res, next) {
    var messages = req.flash('error');
    var newUser = new User();

    res.render('Admin/addEmployee', {
        title: 'Add Employee',
        csrfToken: req.csrfToken(),
        user: config_passport.User,
        messages: messages,
        hasErrors: messages.length > 0,
        userName: req.session.user.name
    });
});


router.get('/upload-holiday', function addHoliday(req, res, next) {
    
    res.render('Admin/UploadHoliday', {
        title: 'Upload Holiday',
        csrfToken: req.csrfToken(),
        userName: req.session.user.name
    });
});

router.post('/upload-holiday', function add(req, res, next) {

    var newHoliday = new Holiday();
    newHoliday.month = req.body.month;
    newHoliday.year = req.body.year;
    newHoliday.day = req.body.day;
    newHoliday.event = req.body.event;

    newHoliday.save(function saveHoliday(err) {
        if (err) {
            console.log(err);
        }
        res.redirect('/admin/upload-holiday');
    });

});


/* Then displays all the projects of the given employee.*/
router.get('/all-employee-projects/:id', function getAllEmployeePojects(req, res, next) {
    var employeeId = req.params.id;
    var projectChunks = [];

    //find is asynchronous function
    Project.find({employeeID: employeeId}).sort({_id: -1}).exec(function findProjectOfEmployee(err, docs) {
        var hasProject = 0;
        if (docs.length > 0) {
            hasProject = 1;
        }
        for (var i = 0; i < docs.length; i++) {
            projectChunks.push(docs[i]);
        }
        User.findById(employeeId, function getUser(err, user) {
            if (err) {
                console.log(err);
            }
            res.render('Admin/employeeAllProjects', {
                title: 'List Of Employee Projects',
                hasProject: hasProject,
                projects: projectChunks,
                csrfToken: req.csrfToken(),
                user: user,
                userName: req.session.user.name
            });
        });
    });
});

/*Displays the list of all the leave applications which are applied by all employees.*/
router.get('/leave-applications', function getLeaveApplications(req, res, next) {

    var leaveChunks = [];
    var employeeChunks = [];
    var temp;
    //find is asynchronous function
    Leave.find({}).sort({_id: -1}).exec(function findAllLeaves(err, docs) {
        var hasLeave = 0;
        if (docs.length > 0) {
            hasLeave = 1;
        }
        for (var i = 0; i < docs.length; i++) {
            leaveChunks.push(docs[i])
        }
        for (var i = 0; i < leaveChunks.length; i++) {

            User.findById(leaveChunks[i].applicantID, function getUser(err, user) {
                if (err) {
                    console.log(err);
                }
                employeeChunks.push(user);
            })
        }
        // call the rest of the code and have it execute after 3 seconds
        setTimeout(render_view, 900);
        function render_view() {
            res.render('Admin/allApplications', {
                title: 'List Of Leave Applications',
                csrfToken: req.csrfToken(),
                hasLeave: hasLeave,
                leaves: leaveChunks,
                employees: employeeChunks, moment: moment, userName: req.session.user.name
            });
        }
    });
});

/*  shows the response application form of that leave of the employee to the admin.*/
router.get('/respond-application/:leave_id/:employee_id', function respondApplication(req, res, next) {
    var leaveID = req.params.leave_id;
    var employeeID = req.params.employee_id;
    Leave.findById(leaveID, function getLeave(err, leave) {

        if (err) {
            console.log(err);
        }
        User.findById(employeeID, function getUser(err, user) {
            if (err) {
                console.log(err);
            }
            res.render('Admin/applicationResponse', {
                title: 'Respond Leave Application',
                csrfToken: req.csrfToken(),
                leave: leave,
                employee: user,
                moment: moment, userName: req.session.user.name
            });
        })
    });
});

/* Displays profile of the employee with the help of the id of the employee from the parameters.*/
router.get('/employee-profile/:id', function getEmployeeProfile(req, res, next) {
    var employeeId = req.params.id;
    User.findById(employeeId, function getUser(err, user) {
        if (err) {
            console.log(err);
        }
        res.render('Admin/employeeProfile', {
            title: 'Employee Profile',
            employee: user,
            csrfToken: req.csrfToken(),
            moment: moment,
            userName: req.session.user.name
        });
    });
});

/* Displays edit employee form to the admin.*/
router.get('/edit-employee/:id', function editEmployee(req, res, next) {
    var employeeId = req.params.id;
    User.findById(employeeId, function getUser(err, user) {
        if (err) {
            res.redirect('/admin/');
        }
        res.render('Admin/editEmployee', {
            title: 'Edit Employee',
            csrfToken: req.csrfToken(),
            employee: user,
            moment: moment,
            message: '',
            userName: req.session.user.name
        });
    });
});

/*Gets id of the projet to be edit.
 * Displays the form of the edit project to th admin.*/
router.get('/edit-employee-project/:id', function editEmployeeProject(req, res, next) {
    var projectId = req.params.id;
    Project.findById(projectId, function getProject(err, project) {
        if (err) {
            console.log(err);
        }
        res.render('Admin/editProject', {
            title: 'Edit Employee',
            csrfToken: req.csrfToken(),
            project: project,
            moment: moment,
            message: '',
            userName: req.session.user.name
        });
    });
});

/*Gets the id of the employee from parameters.
 * Displays the add employee project form to the admin.*/
router.get('/add-employee-project/:id', function addEmployeeProject(req, res, next) {

    var employeeId = req.params.id;
    User.findById(employeeId, function getUser(err, user) {
        if (err) {
            res.redirect('/admin/');
        }
        res.render('Admin/addProject', {
            title: 'Add Employee Project',
            csrfToken: req.csrfToken(),
            employee: user,
            moment: moment,
            message: '',
            userName: req.session.user.name
        });
    });
});

/* Displays the project of the employee.*/
router.get('/employee-project-info/:id', function viewEmployeeProjectInfo(req, res, next) {
    var projectId = req.params.id;
    Project.findById(projectId, function getProject(err, project) {
        if (err) {
            console.log(err);
        }
        User.findById(project.employeeID, function getUser(err, user) {
            if (err) {
                console.log(err);
            }
            res.render('Admin/projectInfo', {
                title: 'Employee Project Information',
                project: project,
                employee: user,
                moment: moment,
                message: '',
                userName: req.session.user.name,
                csrfToken: req.csrfToken()
            });
        })
    });
});

/* Redirects admin to the employee profile page.*/
router.get('/redirect-employee-profile', function viewEmployeeProfile(req, res, next) {
    var employeeId = req.user.id;
    User.findById(employeeId, function getUser(err, user) {
        if (err) {
            console.log(err);
        }
        res.redirect('/admin/employee-profile/' + employeeId);
    });
});

/*Adds employee to the User Schema by getting attributes from the body of the post request.
  Then redirects admin to the profile information page of the added employee. */
router.post('/add-employee', passport.authenticate('local.add-employee', {
    successRedirect: '/admin/redirect-employee-profile',
    failureRedirect: '/admin/add-employee',
    failureFlash: true,
}));

/*Gets the id of the leave from the body of the post request.
  Sets the response field of that leave according to response given by employee from body of the post request. */
router.post('/respond-application', function respondApplication(req, res) {

    Leave.findById(req.body.leave_id, function getLeave(err, leave) {
        leave.adminResponse = req.body.status;
        leave.save(function saveLeave(err) {
            if (err) {
                console.log(err);
            }
            res.redirect('/admin/leave-applications');
        })
    })
});

/*Gets the id of the employee from the parameters.
 * Gets the edited fields of the project from body of the post request.
 * Saves the update field to the project of the employee  in Project Schema.
 * Edits the project of the employee.*/

router.post('/edit-employee/:id', function editEmployee(req, res) {
    var employeeId = req.params.id;
    var newUser = new User();
    newUser.email = req.body.email;
    
    newUser.type = req.body.designation;
    newUser.name = req.body.name,
    newUser.dateOfBirth = new Date(req.body.DOB),
    newUser.contactNumber = req.body.number,
    newUser.department = req.body.department;
    newUser.Skills = req.body['skills[]'];
    newUser.designation = req.body.designation;

    User.findById(employeeId, function getUser(err, user) {
        if (err) {
            res.redirect('/admin/');
        }
        if (user.email != req.body.email) {
            User.findOne({'email': req.body.email}, function getUser(err, user) {
                if (err) {
                    res.redirect('/admin/');
                }
                if (user) {
                    res.render('Admin/editEmployee', {
                        title: 'Edit Employee',
                        csrfToken: req.csrfToken(),
                        employee: newUser,
                        moment: moment,
                        message: 'Email is already in use', userName: req.session.user.name
                    });
                }
            });
        }
        user.email = req.body.email;

        user.type = req.body.designation;
        
        user.name = req.body.name,
        user.dateOfBirth = new Date(req.body.DOB),
        user.contactNumber = req.body.number,
        user.department = req.body.department;
        user.Skills = req.body['skills[]'];
        user.designation = req.body.designation;

        user.save(function saveUser(err) {
            if (err) {
                console.log(error);
            }
            res.redirect('/admin/employee-profile/' + employeeId);

        });
    });

});

/* Gets the id of the employee from the parameters.
 * Gets the attributed of the the project from body of the post request.
 * Adds the the project of the employee in Project Schema.*/
router.post('/add-employee-project/:id', function addEmployeeProject(req, res) {
    var newProject = new Project();
    newProject.employeeID = req.params.id;
    newProject.title = req.body.title;
    newProject.type = req.body.type;
    newProject.startDate = new Date(req.body.start_date),
        newProject.endDate = new Date(req.body.end_date),
        newProject.description = req.body.description,
        newProject.status = req.body.status;

    newProject.save(function saveProject(err) {
        if (err) {
            console.log(err);
        }
        res.redirect('/admin/employee-project-info/' + newProject._id);
    });
});

/* Gets the id of the employee from the parameters.
 * Gets the edited fields of the project from body of the post request.
 * Saves the update field to the project of the employee  in Project Schema.
 * Edits the project of the employee.*/
router.post('/edit-employee-project/:id', function editEmployeeProject(req, res) {
    var projectId = req.params.id;
    var newProject = new Project();

    Project.findById(projectId, function (err, project) {
        if (err) {
            console.log(err);
        }
        project.title = req.body.title;
        project.type = req.body.type;
        project.startDate = new Date(req.body.start_date),
            project.endDate = new Date(req.body.end_date),
            project.description = req.body.description,
            project.status = req.body.status;

        project.save(function saveProject(err) {
            if (err) {
                console.log(err);
            }
            res.redirect('/admin/employee-project-info/' + projectId);
        });
    });
});

/*Gets the id of the employeed to be deleted form the parameters.
 * Find the given employee from User Scheme.
 * Deleteth employee from User Schema.*/
router.post('/delete-employee/:id', function deleteEmployee(req, res) {
    var id = req.params.id;
    User.findByIdAndRemove({_id: id}, function deleteUser(err) {
        if (err) {
            console.log('unable to delete employee');
        }
        else {
            res.redirect('/admin/view-all-employees');
        }
    });
});




router.get('/my-leave', function getLeaveApplications(req, res, next) {

    var leaveChunks = [];
    var employeeChunks = [];
    var temp;
    //find is asynchronous function
    Leave.find({applicantID: req.user._id}).sort({
        _id: -1
    }).exec(function findAllLeaves(err, docs) {
        var hasLeave = 0;
        if (docs.length > 0) {
            hasLeave = 1;
        }
        for (var i = 0; i < docs.length; i++) {
            leaveChunks.push(docs[i])
        }
        for (var i = 0; i < leaveChunks.length; i++) {

            User.findById(leaveChunks[i].applicantID, function getUser(err, user) {
                if (err) {
                    console.log(err);
                }
                employeeChunks.push(user);

            })
        }
        // call the rest of the code and have it execute after 3 seconds
        setTimeout(render_view, 900);

        function render_view() {
            res.render('Admin/MyLeaves', {
                title: 'List Of Leave Applications',
                csrfToken: req.csrfToken(),
                hasLeave: hasLeave,
                leaves: leaveChunks,
                employees: employeeChunks,
                moment: moment,
                userName: req.session.user.name
            });
        }
    });
});

router.get('/view-leaves', function viewleaves(req, res, next) {
    User.findById(req.session.user._id, function getUser(err, user) {
        if (err) {
            console.log(err);

        }
        console.log("DATA",user.balanceLeaves)
        res.render('Admin/ViewLeaves', {
            title: 'Balance',
            csrfToken: req.csrfToken(),
            leaves: user.balanceLeaves,
            moment: moment,
            userName: req.session.user.name
        });
    });
});


router.get('/apply-leave', function applyForLeave(req, res, next) {
    res.render('Admin/ApplyLeave', {
        title: 'Apply for Leave',
        csrfToken: req.csrfToken(),
        userName: req.session.user.name
    });
});

router.post('/apply-leave', function applyForLeave(req, res, next) {

    var newLeave = new Leave();
    newLeave.applicantID = req.user._id;
    newLeave.title = req.body.title;
    newLeave.type = req.body.type;
    newLeave.startDate = new Date(req.body.start_date);
    newLeave.endDate = new Date(req.body.end_date);
    newLeave.period = req.body.period;
    newLeave.reason = req.body.reason;
    newLeave.appliedDate = new Date();
    newLeave.adminResponse = 'Pending';
    newLeave.save(function saveLeave(err) {
        if (err) {
            console.log(err);
        }
        res.redirect('/admin/my-leave');
    });

});


router.get('/view-holidays', function viewholiday(req, res, next) {


    Holiday.find().exec(function viewholiday(err, docs) {
        var hasHolidays = 0;
        if (docs.length > 0) {
            hasHolidays = 1;
        }
        res.render('Admin/ViewHolidays', {
            title: 'Holidays',
            holidays: docs,
            has: hasHolidays,
            csrfToken: req.csrfToken(),
            userName: req.session.user.name
        });
    });
});


module.exports = router;

/* Checks if user is logged in then redirects user to the his/her home page.*/
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

/* Checks if user is not logged in then redirects user to the login page.*/
function notLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}