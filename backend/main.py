import os
import time
import json
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
import database.queries as queries
from services.gemini_service import parse_problem, chat_with_jake, analyze_screenshot, generate_review
from services.glot_service import execute_code

load_dotenv()

app = Flask(__name__)
# Enable CORS for the frontend
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route("/", methods=["GET"])
def root():
    return jsonify({"status": "online"})

@app.route("/interview/session", methods=["POST"])
def create_session():
    data = request.json
    problem_text = data.get("problem_text")
    user_name = data.get("user_name", "Candidate")
    
    # Generate a simple session ID
    session_id = f"sess_{int(time.time())}"
    
    if not problem_text:
        return jsonify({"error": "Missing problem_text"}), 400
        
    parsed_problem = parse_problem(problem_text)
    queries.create_session(session_id, problem_text, user_name, parsed_problem)
    
    return jsonify({"session_id": session_id, "problem": parsed_problem})

@app.route("/interview/prepare/<session_id>", methods=["GET"])
def prepare_interview(session_id):
    def generate():
        # SSE format: event: event_name\ndata: {}\n\n
        time.sleep(0.5)
        yield "event: problem_loaded\ndata: {}\n\n"
        time.sleep(0.5)
        yield "event: constraints_analyzed\ndata: {}\n\n"
        time.sleep(0.5)
        yield "event: brute_force_mapped\ndata: {}\n\n"
        time.sleep(0.5)
        yield "event: hints_prepared\ndata: {}\n\n"
        time.sleep(0.5)
        yield "event: evaluation_ready\ndata: {}\n\n"
        time.sleep(0.5)
        yield "event: ready\ndata: {}\n\n"
        
    return Response(generate(), mimetype="text/event-stream")

@app.route("/ai/chat", methods=["POST"])
def chat():
    data = request.json
    session_id = data.get("session_id")
    user_message = data.get("user_message")
    current_code = data.get("current_code", "")
    
    if not session_id or not user_message:
        return jsonify({"error": "Missing session_id or user_message"}), 400
        
    session = queries.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    history = queries.get_messages(session_id)
    queries.add_message(session_id, "user", user_message, current_code)
    
    jake_reply = chat_with_jake(
        session_id=session_id,
        user_message=user_message,
        current_code=current_code,
        problem_text=session["problem_text"],
        conversation_history=history
    )
    
    queries.add_message(session_id, "jake", jake_reply, current_code)
    return jsonify({"response": jake_reply})

@app.route("/ai/analyze-screen", methods=["POST"])
def analyze_screen():
    data = request.json
    session_id = data.get("session_id")
    image_base64 = data.get("image_base64")
    current_code = data.get("current_code", "")
    
    if not session_id or not image_base64:
        return jsonify({"error": "Missing session_id or image_base64"}), 400
        
    session = queries.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    history = queries.get_messages(session_id)
    queries.add_message(session_id, "system", "[Shared screen for analysis]", current_code)
    
    jake_feedback = analyze_screenshot(
        session_id=session_id,
        image_base64=image_base64,
        problem_text=session["problem_text"],
        current_code=current_code,
        conversation_history=history
    )
    
    queries.add_message(session_id, "jake", jake_feedback, current_code)
    return jsonify({"response": jake_feedback})

@app.route("/code/run", methods=["POST"])
def run_code():
    data = request.json
    code = data.get("code")
    language = data.get("language")
    stdin = data.get("stdin", "")
    
    if not code or not language:
        return jsonify({"error": "Missing code or language"}), 400
        
    result = execute_code(code, language, stdin)
    return jsonify(result)

@app.route("/interview/end/<session_id>", methods=["POST"])
def end_interview(session_id):
    session = queries.get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    history = queries.get_messages(session_id)
    review = generate_review(
        session_id=session_id,
        problem_text=session["problem_text"],
        conversation_history=history,
        cheating_detected=session.get("cheating_detected", False),
        tab_switch_count=session.get("tab_switch_count", 0),
        screen_share_count=session.get("screen_share_count", 0)
    )
    
    queries.save_review(session_id, review)
    return jsonify({"review": review})

@app.route("/interview/tab-switch/<session_id>", methods=["POST"])
def log_tab_switch(session_id):
    data = request.json
    count = data.get("count", 1)
    cheating = data.get("cheating_detected", False)
    queries.update_tab_switch_count(session_id, count, cheating)
    return jsonify({"status": "success"})

@app.route("/interview/screen-share/<session_id>", methods=["POST"])
def log_screen_share(session_id):
    data = request.json
    count = data.get("count", 1)
    queries.update_screen_share_count(session_id, count)
    return jsonify({"status": "success"})

if __name__ == "__main__":
    queries.create_tables_if_not_exist()
    app.run(port=8000, debug=True)
