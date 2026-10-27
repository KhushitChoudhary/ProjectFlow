const { generateTaskSuggestions} = require("../services/aiService");

const getTaskSuggestions = async (req, res) => {
    try {
        const { title, details } = req.body;

        if (
            !title ||
            typeof title !== "string" ||
            !details ||
            typeof details !== "string"
        ) {
            return res.status(400).json({
                message: "Task title and details are required"
            });
        }

        if (
            title.trim().length > 200 ||
            details.trim().length > 3000
        ) {
            return res.status(400).json({
                message: "Title or details exceed the allowed length"
            });
        }

        const suggestions = await generateTaskSuggestions(
            title.trim(),
            details.trim()
        );

        return res.status(200).json({
            message: "AI suggestions generated successfully",
            suggestions: suggestions
        });
    } catch (error) {
        console.error("AI Task Assistant Error:", error.message);

        if (error.name === "TimeoutError") {
            return res.status(504).json({
                message: "AI request timed out. Please try again."
            });
        }

        if (error.message === "Ollama request failed") {
            return res.status(502).json({
                message: "Could not get a response from Ollama"
            });
        }

        return res.status(500).json({
            message: "Failed to generate AI suggestions"
        });
    }
};

module.exports = {
    getTaskSuggestions
};