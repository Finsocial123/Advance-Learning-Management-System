TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "quiz_generator",
            "description": "Generate a multiple choice quiz for a lesson. Call this when the student asks to be tested or quizzed on a lesson.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lesson_id": {
                        "type": "integer",
                        "description": "The ID of the lesson to generate quiz questions from"
                    },
                    "num_questions": {
                        "type": "integer",
                        "description": "Number of questions to generate. Default is 5.",
                        "default": 5
                    },
                    "difficulty": {
                        "type": "string",
                        "enum": ["easy", "medium", "hard"],
                        "default": "medium"
                    }
                },
                "required": ["lesson_id"]
            }
        }
    },

    # {
    #     "type": "function",
    #     "function": {
    #         "name": "lesson_summarizer",
    #         "description": "Summarize the content of a lesson. Call this when the student asks for a summary, overview, or key points of a lesson.",
    #         "parameters": {
    #             "type": "object",
    #             "properties": {
    #                 "lesson_id": {
    #                     "type": "integer",
    #                     "description": "The ID of the lesson to summarize"
    #                 }
    #             },
    #             "required": ["lesson_id"]
    #         }

    #     }
    # }
]