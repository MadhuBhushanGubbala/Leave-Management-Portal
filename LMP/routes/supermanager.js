var express = require('express');
var router = express.Router();
var Leave = require('../models/leave');
var Project = require('../models/project');
var moment = require('moment');
var User = require('../models/user');
var Holiday = require('../models/holidays');
var csrf = require('csurf');
var csrfProtection = csrf();
var moment = require('moment');
var config_passport = require('../config/passport.js');

router.use('/', isLoggedIn, function checkAuthentication(req, res, next) {
    next();
});

router.get('/', function viewSuperHome(req, res, next) {
    res.render('SuperManager/SuperManagerHome', {
        title: 'Home',
        userName: req.session.user.name,
        csrfToken: req.csrfToken()
    });
});

router.get('/view-all-hr', function viewAllEmployees(req, res, next) {

    var userChunks = [];
    var chunkSize = 3;


    //Human Resource admin
    //{$or: [{type: 'employee'}, {type: 'project_manager'}, {type: 'accounts_manager'}]}
    User.find({
        designation: "Human Resource admin"
    }).sort({
        _id: -1
    }).exec(function getUsers(err, docs) {
        for (var i = 0; i < docs.length; i++) {
            userChunks.push(docs[i]);
        }
        res.render('SuperManager/ViewHR', {
            title: 'All Employees',
            csrfToken: req.csrfToken(),
            users: userChunks,
            userName: req.session.user.name
        });
    });
});

/*Displays add employee form to the admin.*/

router.get('/add-hr', function addEmployee(req, res, next) {
    var messages = req.flash('error');
    var newUser = new User();

    res.render('SuperManager/AddHR', {
        title: 'Add Employee',
        csrfToken: req.csrfToken(),
        user: config_passport.User,
        messages: messages,
        hasErrors: messages.length > 0,
        userName: req.session.user.name
    });
});


router.get('/leaves-applications', function getLeaveApplications(req, res, next) {

    var leaveChunks = [];
    var employeeChunks = [];
    var temp;
    //find is asynchronous function
    Leave.find({}).sort({
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
                // if (user.designation === "Accounts manager" || user.designation === "Project manager") {
                // }
                employeeChunks.push(user);
            })
        }
        // call the rest of the code and have it execute after 3 seconds
        setTimeout(render_view, 900);

        function render_view() {
            res.render('SuperManager/LeaveApplications', {
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
router.get('/leaves-applications-hr', function getLeaveApplications(req, res, next) {

    var leaveChunks = [];
    var employeeChunks = [];
    var temp;
    //find is asynchronous function
    Leave.find({}).sort({
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
            res.render('SuperManager/LeaveApplicationHR', {
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

router.get('/view-holidays', function viewholiday(req, res, next) {


    Holiday.find().exec(function viewholiday(err, docs) {
        var hasHolidays = 0;
        if (docs.length > 0) {
            hasHolidays = 1;
        }
        res.render('SuperManager/ViewHolidays', {
            title: 'Holidays',
            holidays: docs,
            has: hasHolidays,
            csrfToken: req.csrfToken(),
            userName: req.session.user.name
        });
    });
});



router.get('/admin-profile', function viewProfile(req, res, next) {

    User.findById(req.session.user._id, function getUser(err, user) {
        if (err) {
            console.log(err);
        }
        res.render('SuperManager/Profile', {
            title: 'Profile',
            csrfToken: req.csrfToken(),
            employee: user,
            moment: moment,
            userName: req.session.user.name
        });
    });
});

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
            res.render('SuperManager/applicationResponse', {
                title: 'Respond Leave Application',
                csrfToken: req.csrfToken(),
                leave: leave,
                employee: user,
                moment: moment,
                userName: req.session.user.name
            });
        })
    });
});
/* Gets the id of the leave from the body of the post request.
 * Sets the response field of that leave according to response given by employee from body of the post request.*/
router.post('/respond-application', function respondApplication(req, res) {

    Leave.findById(req.body.leave_id, function getLeave(err, leave) {
        leave.adminResponse = req.body.status;

        if (req.body.status != "Approved") {
            leave.save(function saveLeave(err) {
                if (err) {
                    console.log(err);
                }
                res.redirect('/manager/leave-applications');
            })
        } else {
            const leaveType = leave.type;
            User.findById(leave.applicantID, function getUser(err, userData) {
                console.log("USERDATA", userData)
                console.log("LEAVE", userData.balanceLeaves[leaveType]);
                userData.balanceLeaves[leaveType] = userData.balanceLeaves[leaveType] - leave.period;
                console.log("LEAVE", userData.balanceLeaves[leaveType]);


                User.findByIdAndUpdate(leave.applicantID, userData,
                    function (err, docs) {
                        if (err) {
                            console.log(err)
                        } else {
                            leave.save(function saveLeave(err) {
                                if (err) {
                                    console.log(err);
                                }
                                res.redirect('/SuperManager/leaves-applications');
                            })
                            //console.log("Updated User : ", docs);
                        }
                    });
                // userData.save(function saveUpdated(err) {
                //     if (err) {
                //         console.log(err);
                //     }
                //     res.redirect('/manager/leave-applications');
                // })
            })
        }
    })
});


module.exports = router;

function isLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}