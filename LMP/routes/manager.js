var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Leave = require('../models/leave');
var Holiday = require('../models/holidays');
var moment = require('moment');
var Project = require('../models/project');
var flash = require('connect-flash');
var csrf = require('csurf');
var csrfProtection = csrf();

router.use('/', isLoggedIn, function checkAuthentication(req, res, next) {
    next();
});

/*Displays home to the manager*/

router.get('/', function viewHomePage(req, res, next) {

    res.render('Manager/managerHome', {
        title: 'Manager Home',
        csrfToken: req.csrfToken(),
        userName: req.session.user.name
    });
});


/*Checks which type of manager is logged in.
 * Displays the list of employees to the manager respectively.*/
router.get('/view-employees', function viewEmployees(req, res) {

    var userChunks = [];

    User.find({
        designation: 'Employee'
    }).sort({
        _id: -1
    }).exec(function getUser(err, docs) {
        for (var i = 0; i < docs.length; i++) {
            userChunks.push(docs[i]);
        }
        res.render('Manager/viewAllEmployee', {
            title: 'List Of Employees',
            csrfToken: req.csrfToken(),
            users: userChunks,
            errors: 0,
            userName: req.session.user.name
        });

    });
});


router.get('/view-hr', function viewEmployees(req, res) {

    var userChunks = [];

    User.find({
        designation: 'Human Resource admin'
    }).sort({
        _id: -1
    }).exec(function getUser(err, docs) {
        for (var i = 0; i < docs.length; i++) {
            userChunks.push(docs[i]);
        }
        res.render('Manager/viewAllhr', {
            title: 'List Of Employees',
            csrfToken: req.csrfToken(),
            users: userChunks,
            errors: 0,
            userName: req.session.user.name
        });

    });
});


/*Displays All the skills of the employee to the project manager.*/
router.get('/all-employee-skills/:id', function viewAllEmployeeSkills(req, res, next) {

    var employeeId = req.params.id;
    User.findById(employeeId, function getUser(err, user) {
        if (err) {
            console.log(err);
        }
        res.render('Manager/employeeSkills', {
            title: 'List Of Employee Skills',
            employee: user,
            moment: moment,
            csrfToken: req.csrfToken(),
            userName: req.session.user.name
        });
    });
});


/* Displays all the projects of the employee to the project manager*/
router.get('/all-employee-projects/:id', function viewAllEmployeeProjects(req, res, next) {

    var employeeId = req.params.id;
    var projectChunks = [];

    //find is asynchronous function
    Project.find({
        employeeID: employeeId
    }).sort({
        _id: -1
    }).exec(function getProject(err, docs) {
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
            res.render('Manager/employeeAllProjects', {
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


/*Displays employee project information to the project manager*/
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
            res.render('Manager/projectInfo', {
                title: 'Employee Project Information',
                project: project,
                employee: user,
                moment: moment,
                csrfToken: req.csrfToken(),
                message: '',
                userName: req.session.user.name
            });
        })
    });
});
/* Displays logged in manager his/her profile.*/
router.get('/view-profile', function viewProfile(req, res, next) {

    User.findById(req.user._id, function getUser(err, user) {
        if (err) {
            console.log(err);

        }
        res.render('Manager/viewManagerProfile', {
            title: 'Profile',
            csrfToken: req.csrfToken(),
            employee: user,
            moment: moment,
            userName: req.session.user.name
        });
    });
});
/*Gets the id of the project to be shown form request parameters.
 * Displays the project to the project manager.*/
router.get('/view-project/:project_id', function viewProject(req, res, next) {

    var projectId = req.params.project_id;
    Project.findById(projectId, function getProject(err, project) {
        if (err) {
            console.log(err);
        }
        res.render('Manager/viewManagerProject', {
            title: 'Project Details',
            project: project,
            csrfToken: req.csrfToken(),
            moment: moment,
            userName: req.session.user.name
        });
    });
});
/*Displays list of all the project managers project.*/
router.get('/view-all-personal-projects', function viewAllPersonalProjects(req, res, next) {

    var projectChunks = [];
    Project.find({
        employeeID: req.user._id
    }).sort({
        _id: -1
    }).exec(function getProject(err, docs) {
        var hasProject = 0;
        if (docs.length > 0) {
            hasProject = 1;
        }
        for (var i = 0; i < docs.length; i++) {
            projectChunks.push(docs[i]);
        }
        res.render('Manager/viewManagerPersonalProjects', {
            title: 'List Of Projects',
            hasProject: hasProject,
            projects: projectChunks,
            csrfToken: req.csrfToken(),
            userName: req.session.user.name
        });
    });
});

/*Displays the list of all the leave applications which are applied by all employees.*/
router.get('/leave-applications', function getLeaveApplications(req, res, next) {

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
            res.render('Manager/allApplications', {
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
router.get('/my-leave', function getLeaveApplications(req, res, next) {

    var leaveChunks = [];
    var employeeChunks = [];
    var temp;
    //find is asynchronous function
    Leave.find({
        applicantID: req.user._id
    }).sort({
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
            res.render('Manager/MyLeaves', {
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


/*Gets the leave id and employee id from the parameters.
 * Then shows the response application form of that leave of the employee to the admin.*/
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
            res.render('Manager/applicationResponse', {
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
                                res.redirect('/manager/leave-applications');
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


router.get('/view-leaves', function viewleaves(req, res, next) {
    
    User.findById(req.session.user._id, function getUser(err, user) {
        if (err) {
            console.log(err);
        }
        console.log("DATA",user.balanceLeaves)
        res.render('Manager/ViewLeaves', {
            title: 'Balance',
            csrfToken: req.csrfToken(),
            leaves: user.balanceLeaves,
            moment: moment,
            userName: req.session.user.name
        });
    });
});

router.get('/view-holidays', function viewholiday(req, res, next) {


    Holiday.find().exec(function viewholiday(err, docs) {
        var hasHolidays = 0;
        if (docs.length > 0) {
            hasHolidays = 1;
        }
        res.render('Manager/ViewHolidays', {
            title: 'Holidays',
            holidays: docs,
            has: hasHolidays,
            csrfToken: req.csrfToken(),
            userName: req.session.user.name
        });
    });
});

router.get('/apply-leave', function applyForLeave(req, res, next) {
    res.render('Manager/ApplyLeave', {
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
        res.redirect('/manager/my-leave');
    });

});

module.exports = router;

function isLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}