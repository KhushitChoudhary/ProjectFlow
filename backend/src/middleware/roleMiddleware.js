const workspaceModel = require("../models/workSpaceModel")

const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
    try {
        const workspace = await workspaceModel.findById(
            req.params.workspaceId
        );

        if(!workspace){
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const member = workspace.members.find(
            (member) => 
                member.user.toString() === req.userId
        );

        if(!member){
            return res.status(403).json({
                success: false,
                message: "You are not a workspace member"
            });
        }

        if(!allowedRoles.includes(member.role)){
            return res.status(403).json({
                success: false,
                message: "You do not have permission"
            });
        }

        req.workspace = workspace;
        req.workspaceRole = member.role;

        next();
        
    } catch (error) {
        console.error("Role middleware error:", error);

         res.status(403).json({
            success: false,
            message: "You are not a workspace member"
         });
       }
    };
};


module.exports = requireRole;