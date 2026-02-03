# AI-Based Online Exam Proctoring System

## Overview
This project is an AI-powered online examination platform designed to detect and prevent cheating in real time.  
It uses webcam-based monitoring, behavioral analysis, and face authentication to ensure fair and secure online assessments without the need for human invigilators.

The system automatically detects suspicious activities, issues warnings, and terminates the exam when predefined thresholds are exceeded. An admin dashboard is provided for full auditability of exam attempts.

---

## Key Features

### Student Side
- Secure student login
- Face verification before exam start
- Online MCQ-based examination
- Live webcam monitoring
- Real-time warning banners
- Automatic exam termination on severe violations
- Final submission and terminated exam screens

### AI Proctoring & Monitoring
- Face detection and head direction tracking (MediaPipe)
- No-face and multiple-face detection
- Mobile phone detection using YOLO
- Continuous face identity verification during the exam
- Tab switch, window blur, and copy–paste detection
- Rule-based cheating score accumulation
- Warning → Final Warning → Termination logic

### Admin Side
- Admin login
- Dashboard with exam statistics:
  - Total attempts
  - Completed attempts
  - Flagged attempts
  - Terminated attempts
- Attempt-wise detailed view
- Chronological cheating timeline with:
  - Event type
  - Timestamp
  - Event weight
  - Cumulative cheating score

---

## Tech Stack

### Frontend
- React + Vite
- JavaScript
- Inline CSS (custom UI)
- react-webcam
- React Router
- Fetch API

### Backend
- Python (Flask)
- Flask Blueprints (modular architecture)
- MediaPipe (face detection & landmarks)
- YOLO (mobile phone detection)
- OpenCV
- DeepFace (FaceNet512) for face embeddings

### Database
- PostgreSQL

#### Main Tables
- `exam_attempts`
- `cheating_events`
- `event_weights`

---

---

## Cheating Detection Logic

### Event Weights (Example)
| Event Type            | Weight |
|----------------------|--------|
| NO_FACE              | 3      |
| MULTIPLE_FACES       | 5      |
| LOOKING_LEFT/RIGHT   | 2      |
| PHONE_DETECTED       | 5      |
| COPY_PASTE           | 4      |
| TAB_SWITCH           | 3      |
| FACE_MISMATCH        | 5      |

### Thresholds
- **0–4** → No warning  
- **5–7** → Warning  
- **8–11** → Warning (Yellow)  
- **12–14** → Final Warning  
- **≥15** → Exam Terminated  

### Final Attempt Status
- **COMPLETED** → Submitted normally, score below threshold
- **FLAGGED** → Exam abandoned without submission
- **TERMINATED** → Cheating score exceeded threshold or identity mismatch

---

## Face Authentication Flow

1. Student logs in
2. Face verification page opens
3. Webcam captures face and stores reference embedding
4. Exam starts only after successful face registration
5. During the exam:
   - Each frame is compared with the stored embedding
   - Consecutive face mismatches trigger warnings
   - Repeated mismatch leads to exam termination

---

## Current Project Status

### Completed
- Full exam lifecycle (login → verification → exam → submit/terminate)
- Webcam integration
- Face direction detection
- Phone detection
- Copy–paste and tab-switch monitoring
- Admin dashboard with detailed logs
- Face authentication and continuous identity verification
- Backend modularization and error handling

### Optional Enhancements
- Audio-based cheating detection
- Coding questions with secure editor
- Face embedding encryption
- Browser/device fingerprinting
- Charts and analytics in admin dashboard
- CSV/PDF export of exam reports

---

## Deployment Plan

- **Frontend:** Vercel
- **Backend:** Cloud VM / Render / Railway
- **Database:** Managed PostgreSQL
- **CI/CD:** GitHub-based redeployment

---

## One-Line Description (For Viva / PPT)

An AI-powered online exam proctoring system that uses real-time webcam analysis, behavioral monitoring, and face authentication to automatically detect and prevent cheating, ensuring fair and secure online assessments.
