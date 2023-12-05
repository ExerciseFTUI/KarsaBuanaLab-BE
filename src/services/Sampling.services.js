const { Sampling } = require('../models/Sampling.models');
const { Project } = require('../models/Project.models');
const { User } = require('../models/User.models');

exports.getSampling = async function (params) {
    const sample = await getSample(params);
    if (sample == null) {
        throw new Error("No sample found");
    }
    return { message: "success", data: sample };
}

exports.sampleAssignment = async function (params, body) {
    const user = await User.findById(body.accountId).exec();
    if (user == null) {
        throw new Error(body.accountId);
    }

    const projectList = await Project.find({ created_year: params.tahun }).exec();
    if (projectList == null) {
        throw new Error("No project found");
    }

    // TODO: salah di assignmentnya, typecast error untuk regulation 
    projectList.forEach(async (project) => {
        const sampleList = project.sampling_list;
        sampleList.forEach(async (sample) => {
            if (sample._id == params.no_sampling) {
                sample.assigned_to.push(user)
                console.log(sample.assigned_to);
            }
        });

        await project.save();
    });

    const sample = await getSample(params);
    
    return { message: "success", data: sample}
}

exports.getSampleByAcc = async function (params, body) {
    const projectList = await Project.find({ created_year: params.tahun });
    if (projectList == null) {
        throw new Error("No project found");
    }

    const projectRes = [];
    projectList.forEach(async (project) => {
        const sampleList = project.sampling_list;
        sampleList.forEach(async (sample) => {
            const user = sample.assigned_to;
            user.forEach(async (acc) => {
                if (acc._id == body.accountId) {
                    projectRes.push(project);

                    if (projectRes.length > 1) {
                        projectRes.forEach(async (project) => {
                            const duplicateProject = projectRes.filter((p) => p._id == project._id);
                            if (duplicateProject.length > 1) {
                                projectRes.splice(projectRes.indexOf(project), 1);
                            }
                        });
                    }
                }
            });
        });
    });

    const user = await User.findById(body.accountId).exec();
    if (user == null) {
        throw new Error("No user found");
    }

    if (projectRes == null) {
        throw new Error("No project found");
    }
    return { message: "success", data: projectRes };
}

exports.changeSampleStatus = async function (params, body) {
    const projectList = await Project.findOne({ created_year: params.tahun }, { "sampling_list._id": params.no_sampling });
    if (projectList == null) {
        throw new Error("No sample found");
    }
    const sampleList = projectList.sampling_list;
    sampleList.forEach(async (sample) => {
        if (sample._id == params.no_sampling) {
            sample.status = body.status;
        }
    });
    await projectList.save();
    const sample = await getSample(params);

    if (sample == null) {
        throw new Error("No sample found");
    }

    return { message: "success update status", data: sample };
}

async function getSample(params) {
    const { tahun, no_sampling } = params;
    const projectList = await Project.find({ created_year: tahun });
    const samplingList = [];
    projectList.forEach(async (project) => {
        const sampleList = project.sampling_list;
        sampleList.forEach(async (sample) => {
            if (sample._id == no_sampling) {
                samplingList.push(sample);
            }
        });
    });

    return samplingList[0];
}