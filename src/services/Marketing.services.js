const { Project } = require("../models/Project.models");
const { BaseSample } = require("../models/BaseSample.models");



exports.dashboard = async function (req, res) {
    const approvedOffer = await getApprovedOffer();
    const totalProject = await getTotalProjectPerYear();
    const totalClient = await getTotalClientPerYear();
    const projectCancelled = await projectStatusPerMonth("CANCELLED");
    const projectRunning = await projectStatusPerMonth("RUNNING");
    const projectFinished = await projectStatusPerMonth("FINISHED");
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

    return { message: "Success", result };
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

async function getApprovedOffer() {
    const result = await Project.find({ status: "RUNNING" } || { status: "FINISHED" }).exec();
    return result;
}

async function getTotalProjectPerYear() {
    const result = await Project.find({ status: "RUNNING" } || { status: "FINISHED" }).exec();
    const projectList = result.map(project => project.project_name);
    const projectCount = projectList.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});
    const totalProject = Object.keys(projectCount).length;
    return totalProject;
}

async function getTotalClientPerYear() {
    const result = await Project.find({ status: "RUNNING" } || { status: "FINISHED" }).exec();
    const projectList = result.map(project => project.client_name);
    const projectCount = projectList.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});
    const totalProject = Object.keys(projectCount).length;
    return totalProject;
}

async function getOfferPerMonth() {
    const resultRunning  = await Project.find({ status: "RUNNING" }).exec();
    const resultFinished = await Project.find({ status: "FINISHED" }).exec();
    const projectPerMonth = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0
    };
    resultRunning.forEach(project => {
        if (new Date(project.created_at).getFullYear() !== new Date().getFullYear()) return;
        projectPerMonth[new Date(project.created_at).getMonth()]++;
    });

    resultFinished.forEach(project => {
        if (new Date(project.created_at).getFullYear() !== new Date().getFullYear()) return;
        projectPerMonth[new Date(project.created_at).getMonth()]++;
    });

    return projectPerMonth;
}

async function projectStatusPerMonth(status) {
    const result = await Project.find({ status: status }).exec();
    const projectPerMonth = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0
    };

    result.forEach(project => {
        if (new Date(project.created_at).getFullYear() !== new Date().getFullYear()) return;
        projectPerMonth[new Date(project.created_at).getMonth()]++;
    });
    return projectPerMonth;
}