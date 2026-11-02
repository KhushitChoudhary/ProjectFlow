const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL =
    process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const generateTaskSuggestions = async (title, details) => {
    const prompt = `
You are an expert software project manager.

Create a practical, task-specific implementation plan based on the user's task.

TASK TITLE:
${JSON.stringify(title)}

TASK DETAILS:
${JSON.stringify(details)}

Return one valid JSON object with exactly these fields:
{
  "improvedDescription": "A detailed description based on the actual task",
  "priority": "LOW",
  "estimatedHours": 3,
  "subtasks": [
    "A concrete implementation step specific to this task",
    "Another concrete implementation step specific to this task",
    "A testing or verification step specific to this task"
  ],
  "suggestions": [
    "A useful technical recommendation specific to this task"
  ]
}

Requirements:
- Generate content based on the supplied title and details.
- Do not copy the example phrases above.
- Never return generic placeholders such as "First actionable subtask",
  "Second actionable subtask", "Third actionable subtask",
  or "Useful suggestion for completing the task".
- Every subtask must describe a distinct, actionable step.
- Return 3 to 5 subtasks.
- Return 1 to 3 specific recommendations.
- improvedDescription must explain what needs to be done.
- priority must be exactly LOW, MEDIUM, HIGH, or URGENT.
- estimatedHours must be a number between 1 and 100.
- Return JSON only. Do not use Markdown.
`;

    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert software project manager. Return only valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.5,
            max_tokens: 2000,
            response_format: {
                type: "json_object"
            }
        }),
        signal: AbortSignal.timeout(60000)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Groq API Error:", data);
        throw new Error(
            data.error?.message || "Groq request failed"
        );
    }

    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
        throw new Error("Groq returned an empty response");
    }

    let suggestions;

    try {
        suggestions = JSON.parse(content);
    } catch {
        throw new Error("Groq returned invalid JSON");
    }

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    if (
        !suggestions ||
        typeof suggestions.improvedDescription !== "string" ||
        !suggestions.improvedDescription.trim() ||
        !allowedPriorities.includes(suggestions.priority) ||
        typeof suggestions.estimatedHours !== "number" ||
        suggestions.estimatedHours < 1 ||
        suggestions.estimatedHours > 100 ||
        !Array.isArray(suggestions.subtasks) ||
        !Array.isArray(suggestions.suggestions)
    ) {
        throw new Error("Invalid AI response format");
    }

    const subtasks = suggestions.subtasks
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim())
        .slice(0, 5);

    const recommendations = suggestions.suggestions
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim())
        .slice(0, 3);

    const placeholders = [
        "first actionable subtask",
        "second actionable subtask",
        "third actionable subtask",
        "useful suggestion for completing the task"
    ];

    const hasPlaceholder = [...subtasks, ...recommendations].some(
        (item) => placeholders.includes(item.toLowerCase())
    );

    if (
        subtasks.length < 3 ||
        recommendations.length < 1 ||
        hasPlaceholder
    ) {
        throw new Error(
            "AI returned generic suggestions. Please generate the plan again."
        );
    }

    return {
        improvedDescription: suggestions.improvedDescription.trim(),
        priority: suggestions.priority,
        estimatedHours: suggestions.estimatedHours,
        subtasks,
        suggestions: recommendations
    };
};

module.exports = {
    generateTaskSuggestions
};
