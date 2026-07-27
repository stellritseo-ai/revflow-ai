from typing import Dict, Any

async def ask_executive_assistant(client_id: str, question: str) -> Dict[str, Any]:
    """
    Simulates sending a natural language query to Gemini, providing it with the clinic's analytics data.
    """
    
    # In a real implementation, we would:
    # 1. Fetch current KPIs and Snapshot data.
    # 2. Build a prompt context: "Here is the clinic's data: {kpis}. Answer the user's question: {question}"
    # 3. Call Gemini API.
    
    question_lower = question.lower()
    
    response = ""
    
    if "cancellations" in question_lower:
        response = "Cancellations increased by 15% this week primarily on Wednesday and Thursday. This correlates with the severe weather warning in your area. I recommend enabling the Waitlist Auto-Fill feature to recover the 8 open slots."
    elif "doctor generated" in question_lower:
        response = "Dr. Smith generated the most completed treatments this month ($42,500), followed closely by Dr. Jones ($38,200). Dr. Smith's increase is largely due to 4 high-value Invisalign cases."
    elif "receptionist" in question_lower or "ai" in question_lower:
        response = "The AI receptionist recovered $12,400 in missed call revenue this month by booking 32 appointments from callers who would have otherwise hung up on voicemail."
    elif "summarize" in question_lower:
        response = "Yesterday was a strong production day. The clinic collected $8,450. You had 2 no-shows, but the AI Waitlist manager successfully filled 1 of those slots. You have 14 patients due for recall today."
    else:
        response = "Based on the clinic's current data, everything is operating within normal parameters. Revenue is up 12% month-over-month, and the AI is successfully managing 85% of inbound calls."
        
    return {
        "question": question,
        "answer": response,
        "suggested_actions": ["View Waitlist", "Send Recall SMS"]
    }
