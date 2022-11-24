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
const { connect } = require('mongoose');

router.use('/', isLoggedIn, function checkAuthentication(req, res, next) {
    next();
});


/*Displays home page to the employee.*/
router.get('/', function viewHome(req, res, next) {
    res.render('Employee/employeeHome', {
        title: 'Home',
        userName: req.session.user.name,
        csrfToken: req.csrfToken()
    });
});

/*Displays leave application form to the user.*/

router.get('/apply-for-leave', function applyForLeave(req, res, next) {
    res.render('Employee/applyForLeave', {
        title: 'Apply for Leave',
        csrfToken: req.csrfToken(),
        userName: req.session.user.name
    });
});

/*Displays the list of all applied laves of the user.*/

router.get('/applied-leaves', function viewAppliedLeaves(req, res, next) {
    var leaveChunks = [];

    //find is asynchronous function
    Leave.find({applicantID: req.user._id}).sort({_id: -1}).exec(function getLeaves(err, docs) {
        var hasLeave = 0;
        if (docs.length > 0) {
            hasLeave = 1;
        }
        for (var i = 0; i < docs.length; i++) {
            leaveChunks.push(docs[i]);
        }

        res.render('Employee/appliedLeaves', {
            title: 'List Of Applied Leaves',
            csrfToken: req.csrfToken(),
            hasLeave: hasLeave,
            leaves: leaveChunks,
            userName: req.session.user.name
        });
    });

});

/* Displays employee his/her profile.*/

router.get('/view-profile', function viewProfile(req, res, next) {

    User.findById(req.session.user._id, function getUser(err, user) {
        if (err) {
            console.log(err);

        }
        res.render('Employee/viewProfile', {
            title: 'Profile',
            csrfToken: req.csrfToken(),
            employee: user,
            moment: moment,
            userName: req.session.user.name
        });
    });

});

/*Displays the list of all the projects to the Project Schema.*/

router.get('/view-all-projects', function viewAllProjects(req, res, next) {

    var projectChunks = [];
    Project.find({employeeID: req.session.user._id}).sort({_id: -1}).exec(function getProjects(err, docs) {
        var hasProject = 0;
        if (docs.length > 0) {
            hasProject = 1;
        }
        for (var i = 0; i < docs.length; i++) {
            projectChunks.push(docs[i]);
        }
        res.render('Employee/viewPersonalProjects', {
            title: 'List Of Projects',
            hasProject: hasProject,
            projects: projectChunks,
            csrfToken: req.csrfToken(),
            userName: req.session.user.name
        });

    });

});

/*Displays the employee his/her project infomation by
 * getting project id from the request parameters.*/

router.get('/view-project/:project_id', function viewProject(req, res, next) {

    var projectId = req.params.project_id;
    Project.findById(projectId, function getProject(err, project) {
        if (err) {
            console.log(err);
        }
        res.render('Employee/viewProject', {
            title: 'Project Details',
            project: project,
            csrfToken: req.csrfToken(),
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
        res.render('Employee/ViewHolidays', {
            title: 'Holidays',
            holidays: docs,
            has: hasHolidays,
            csrfToken: req.csrfToken(),
            userName: req.session.user.name
        });
    });
});


/* Saves the applied leave application form in Leave Schema.*/

router.post('/apply-for-leave', function applyForLeave(req, res, next) {

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
        res.redirect('/employee/applied-leaves');
    });

});


router.get('/view-leaves', function viewleaves(req, res, next) {
    
    User.findById(req.session.user._id, function getUser(err, user) {
        if (err) {
            console.log(err);

        }
        console.log("DATA",user.balanceLeaves)
        res.render('Employee/ViewLeaves', {
            title: 'Balance',
            csrfToken: req.csrfToken(),
            leaves: user.balanceLeaves,
            moment: moment,
            userName: req.session.user.name
        });
    });
});
module.exports = router;

function isLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}