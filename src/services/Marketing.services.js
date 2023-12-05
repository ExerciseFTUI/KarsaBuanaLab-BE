const { Project } = require("../models/Project.models");
const { BaseSample } = require("../models/BaseSample.models");

exports.dashboard = async function (req, res) {
    const approvedOffer = await getApprovedOffer();
    const totalProject = await getTotalProjectPerYear();
    const totalClient = await getTotalClientPerYear();
    const projectCancelled = await projectCancelledPerMonth();
    const projectRunning = await projectRunningPerMonth();
    const projectFinished = await projectFinishedPerMonth();
    const offerPerMonth = await getOfferPerMonth();

    const result = {
        approvedOffer: approvedOffer,
        totalProject: totalProject,
        totalClient: totalClient,
        projectCancelled: projectCancelled,
        projectRunning: projectRunning,
        projectFinished: projectFinished,
        offerPerMonth: offerPerMonth
    }

    return {message: "Success", result};
}

exports.getSample = async function (req, res) {
    const result = await BaseSample.find().exec();
    return { message: "Success", result };

}

exports.getProjectByStatus = async function (params) {
    const result = await Project.find({ status: params.status.toUpperCase() }).exec();
    return { message: "Success", result };
}

exports.getProjectByStatusAndYear = async function (params) {
    const result = await Project.find({ status: params.status.toUpperCase(), created_year: params.year }).exec();
    return { message: "Success", result };
}

exports.getProjectByID = async function (params) {
    const result = await Project.findById(params.ProjectID).exec();
    return { message: "Success", result };
}

async function getApprovedOffer(){
    const result = await Project.find({status: "RUNNING"} || {status: "FINISHED"}).exec();
    return result;
}

async function getTotalProjectPerYear(){
    const result = await Project.find({status: "RUNNING"} || {status: "FINISHED"}).exec();
    const projectList = result.map(project => project.project_name);
    const projectCount = projectList.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});
    const totalProject = Object.keys(projectCount).length;
    return totalProject;
}

async function getTotalClientPerYear(){
    const result = await Project.find({status: "RUNNING"} || {status: "FINISHED"}).exec();
    const projectList = result.map(project => project.client_name);
    const projectCount = projectList.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});
    const totalProject = Object.keys(projectCount).length;
    return totalProject;
}


// TODO : Butuh revisi karena models baru dan database masih menggunakan model lama
async function projectCancelledPerMonth(){
    const result = await Project.find({status: "CANCELLED"}).exec();
    const projectList = result.map(project => project.project_name);
    const projectPerMonth = {};
    const currentYear = new Date().getFullYear();
    projectList.forEach(project => {
        if (new Date(project.created_at).getFullYear() !== currentYear) return;
        const month = new Date(project.created_at).getMonth();
        if (projectPerMonth[month] === undefined) {
            projectPerMonth[month] = 1;
        } else {
            projectPerMonth[month] += 1;
        }
    });
    return projectPerMonth;
}

async function projectRunningPerMonth(){
    const result = await Project.find({status: "RUNNING"}).exec();
    const projectList = result.map(project => project.project_name);
    const projectPerMonth = {};
    const currentYear = new Date().getFullYear();
    projectList.forEach(project => {
        if (new Date(project.created_at).getFullYear() !== currentYear) return;
        const month = new Date(project.created_at).getMonth();
        if (projectPerMonth[month] === undefined) {
            projectPerMonth[month] = 1;
        } else {
            projectPerMonth[month] += 1;
        }
    });
    return projectPerMonth;
}

async function projectFinishedPerMonth(){
    const result = await Project.find({status: "FINISHED"}).exec();
    const projectList = result.map(project => project.project_name);
    const projectPerMonth = {};
    const currentYear = new Date().getFullYear();
    projectList.forEach(project => {
        if (new Date(project.created_at).getFullYear() !== currentYear) return;
        const month = new Date(project.created_at).getMonth();
        if (projectPerMonth[month] === undefined) {
            projectPerMonth[month] = 1;
        } else {
            projectPerMonth[month] += 1;
        }
    });
    return projectPerMonth;
}

async function getOfferPerMonth(){
    const result = await Project.find({status: "RUNNING"} || {status: "FINISHED"}).exec();
    const projectList = result.map(project => project.project_name);
    const projectPerMonth = {};
    const currentYear = new Date().getFullYear();
    projectList.forEach(project => {
        if (new Date(project.created_at).getFullYear() !== currentYear) return;
        const month = new Date(project.created_at).getMonth();
        if (projectPerMonth[month] === undefined) {
            projectPerMonth[month] = 1;
        } else {
            projectPerMonth[month] += 1;
        }
    });
    return projectPerMonth;
}