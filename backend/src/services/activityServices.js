const Activity = require('../models/activityModel');

const createActivity = async ({
    workspace,
    project = null,
    task = null,
    user,
    action,
    description
}) => {
    return Activity.create({
        workspace,
        project,
        task,
        user,
        action,
        description
    });
};

module.exports = {
    createActivity
};