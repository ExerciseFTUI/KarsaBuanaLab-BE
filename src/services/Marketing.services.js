const { Project } = require("../models/Project.models");
const { BaseSample } = require("../models/BaseSample.models");

const keyPerMonth = [
    { month: "Jan", sales: 0 },
    { month: "Feb", sales: 0 },
    { month: "Mar", sales: 0 },
    { month: "Apr", sales: 0 },
    { month: "May", sales: 0 },
    { month: "Jun", sales: 0 },
    { month: "Jul", sales: 0 },
    { month: "Aug", sales: 0 },
    { month: "Sep", sales: 0 },
    { month: "Oct", sales: 0 },
    { month: "Nov", sales: 0 },
    { month: "Dec", sales: 0 }
]

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
    try {
        const resultRunning = await Project.find({ status: "RUNNING" }).exec();
        const resultFinished = await Project.find({ status: "FINISHED" }).exec();
        const result = resultRunning.concat(resultFinished);
        const projectList = result.map(project => project.project_name);
        const projectCount = projectList.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});
        const totalProject = Object.keys(projectCount).length;
        return totalProject;
    } catch (error) {
        console.log(error);
    }
}

async function getTotalClientPerYear() {
    try {
        const resultRunning = await Project.find({ status: "RUNNING" }).exec();
        const resultFinished = await Project.find({ status: "FINISHED" }).exec();
        const result = resultRunning.concat(resultFinished);
        const clientList = result.map(project => project.client_name);
        const clientCount = clientList.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});
        const totalProject = Object.keys(clientCount).length;
        return totalProject;
    } catch (error) {
        console.log(error);
    }
}

async function getOfferPerMonth() {
    try {
        const resultRunning = await Project.find({ status: "RUNNING" }).exec();
        const resultFinished = await Project.find({ status: "FINISHED" }).exec();
        let totalValuation = 0;

        const offerPerMonth = JSON.parse(JSON.stringify(keyPerMonth));
        resultRunning.forEach(project => {
            if (new Date(project.created_at).getFullYear() !== new Date().getFullYear()) return;
            offerPerMonth[new Date(project.created_at).getMonth()].sales++;
        });

        resultFinished.forEach(project => {
            if (new Date(project.created_at).getFullYear() !== new Date().getFullYear()) return;
            offerPerMonth[new Date(project.created_at).getMonth()].sales++;
            const valuation = project.valuasi_proyek;
            if (valuation === undefined || valuation === null || valuation === NaN) return;
            totalValuation += valuation;
        });
        return { offerPerMonth, totalValuation }
    } catch (error) {
        console.log(error);
    }
}

async function projectStatusPerMonth(status) {
    try {
        const result = await Project.find({ status: status }).exec();

        const projectPerMonth = JSON.parse(JSON.stringify(keyPerMonth));
        result.forEach(project => {
            if (new Date(project.created_at).getFullYear() !== new Date().getFullYear()) return;
            projectPerMonth[new Date(project.created_at).getMonth()].sales++;
        });

        return projectPerMonth;
    } catch (error) {
        console.log(error);
    }
}