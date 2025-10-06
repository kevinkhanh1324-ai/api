import streamlit as st
import cv2
import torch
from ultralytics import YOLO
import numpy as np
import pandas as pd
import tempfile
import os
import time
from datetime import datetime
import plotly.express as px
from streamlit_option_menu import option_menu
import contextlib
import psutil
import pygame
from typing import List, Dict, Tuple, Optional
import sys
from pathlib import Path

# Initialize pygame for audio alerts
pygame.mixer.init()

# Cache model loading with warm-up
@st.cache_resource
def load_model(model_path: str) -> Optional[YOLO]:
    """Load and warm up the YOLO model."""
    try:
        model = YOLO(model_path)
        # Warm up model with dummy image (matching training imgsz=800)
        dummy_image = np.zeros((800, 800, 3), dtype=np.uint8)
        model(dummy_image)
        st.write(f"Model loaded. Class names: {model.names}")
        return model
    except Exception as e:
        st.error(f"Failed to load model: {e}")
        st.error("Please ensure:")
        st.error("1. Model file is a valid YOLOv8 .pt file")
        st.error("2. Proper CUDA drivers are installed for GPU usage")
        st.error("3. Required dependencies are installed (`pip install ultralytics torch`)")
        return None

# Context manager for video capture
@contextlib.contextmanager
def video_capture_manager(source: str):
    """Context manager for video capture resources."""
    cap = cv2.VideoCapture(source)
    try:
        yield cap
    finally:
        cap.release()

# Initialize session state
def init_session_state():
    """Initialize all session state variables."""
    if "log_data" not in st.session_state:
        st.session_state.log_data = []
    if "input_type" not in st.session_state:
        st.session_state.input_type = "Image"
    if "model_warmed" not in st.session_state:
        st.session_state.model_warmed = False
    if "frame_skip" not in st.session_state:
        st.session_state.frame_skip = 1
    if "alert_volume" not in st.session_state:
        st.session_state.alert_volume = 50
    if "custom_alert" not in st.session_state:
        st.session_state.custom_alert = None
    if "max_log_size" not in st.session_state:
        st.session_state.max_log_size = 5000

# Custom CSS for enhanced UI and color scheme
def inject_custom_css():
    """Inject custom CSS styles for the dashboard."""
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
    
    * {
        font-family: 'Inter', sans-serif;
        color: #E6E6E6;
        box-sizing: border-box;
    }
    
    body {
        background-color: #2A2E31;
    }
    
    .main {
        padding: 2.5rem;
        background-color: #2A2E31;
    }
    
    .stButton>button {
        border-radius: 8px;
        background: linear-gradient(145deg, #FF6F61, #E55A50);
        color: #FFFFFF;
        border: none;
        padding: 0.9rem 1.8rem;
        transition: all 0.3s ease;
        box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
    }
    
    .stButton>button:hover {
        background: linear-gradient(145deg, #FF8A80, #FF6F61);
        box-shadow: 0 5px 12px rgba(255,107,97,0.3);
        transform: translateY(-3px);
    }
    
    .sidebar .sidebar-content {
        background: #323639;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .section {
        border-radius: 12px;
        padding: 2rem;
        margin-bottom: 2rem;
        background: #323639;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: box-shadow 0.3s ease;
        border: 1px solid #45484B;
    }
    
    .section:hover {
        box-shadow: 0 6px 16px rgba(0,0,0,0.25);
    }
    
    .violence { color: #D32F2F; font-weight: 600; }
    .non-violence { color: #4CAF50; font-weight: 600; }
    
    .header {
        position: sticky;
        top: 0;
        background: #2A2E31;
        color: #E6E6E6;
        padding: 2rem;
        border-radius: 0 0 12px 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 100;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .header h2 {
        font-size: 1.8rem;
        font-weight: 700;
    }
    
    .stTabs [data-baseweb="tab"] {
        background-color: #323639;
        color: #B0B3B8;
        border-radius: 8px 8px 0 0;
        padding: 0.7rem 1.2rem;
        margin-right: 6px;
        font-size: 15px;
        font-weight: 500;
    }
    
    .stTabs [data-baseweb="tab"][aria-selected="true"] {
        background-color: #FF6F61;
        color: #FFFFFF;
        font-weight: 600;
    }
    
    .stExpander {
        background-color: #323639;
        border: 1px solid #45484B;
        border-radius: 10px;
    }
    
    h3, h4 {
        color: #E6E6E6;
        font-weight: 600;
        margin-bottom: 1rem;
    }
    
    .stMarkdown, .stText, .stCaption, .stTextInput > div > div > input {
        color: #E6E6E6;
    }
    
    .stSelectbox > div > div > div, .stSlider > div > div > div {
        color: #E6E6E6;
        background-color: #323639;
    }
    
    .stFileUploader > div > div {
        background-color: #323639;
        border: 1px solid #45484B;
        border-radius: 8px;
    }
    
    i.fas, i.far {
        font-size: 1.2rem;
        margin-right: 0.5rem;
        color: #FF6F61;
    }
    
    .stToast {
        background-color: #323639;
        color: #E6E6E6;
        border: 1px solid #FF6F61;
    }
    
    @media (max-width: 768px) {
        .main { padding: 1.5rem; }
        .section { padding: 1.2rem; }
        .stButton>button { padding: 0.6rem 1.2rem; font-size: 13px; }
        .header { font-size: 1.5rem; padding: 1.2rem; }
        .header h2 { font-size: 1.6rem; }
    }
    </style>
    """, unsafe_allow_html=True)

# Resize image with aspect ratio preservation
def resize_with_aspect_ratio(image: np.ndarray, target_size: int = 800) -> np.ndarray:
    """Resize image to target size while preserving aspect ratio."""
    h, w = image.shape[:2]
    scale = target_size / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    # Pad to target_size x target_size
    delta_w = target_size - new_w
    delta_h = target_size - new_h
    top, bottom = delta_h // 2, delta_h - (delta_h // 2)
    left, right = delta_w // 2, delta_w - (delta_w // 2)
    padded = cv2.copyMakeBorder(resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=[0, 0, 0])
    return padded

# Detection function with improved bounding box rendering
@st.cache_data
def detect_violence(image: np.ndarray, frame_time: Optional[datetime] = None, file_name: str = "Unknown") -> Tuple[np.ndarray, List[Dict], Optional[float]]:
    """
    Detect violence in an image frame using YOLO model.
    
    Args:
        image: Input image frame
        frame_time: Timestamp of the frame
        file_name: Name of the input file or source
        
    Returns:
        Tuple of (processed_image, detections, fps)
    """
    try:
        start_time = time.time()
        original_shape = image.shape[:2]  # (height, width)
        
        # Resize with aspect ratio preservation
        image_resized = resize_with_aspect_ratio(image, target_size=800)
        
        # Run inference
        results = model(image_resized, conf=conf_threshold, iou=0.7, max_det=300, imgsz=800)
        detections = []
        processed_image = image.copy()
        
        # Scale factors for bounding box coordinates
        scale_x = original_shape[1] / 800
        scale_y = original_shape[0] / 800
        
        for result in results:
            for box, cls, conf in zip(result.boxes.xyxy, result.boxes.cls, result.boxes.conf):
                x1, y1, x2, y2 = map(int, [box[0] * scale_x, box[1] * scale_y, box[2] * scale_x, box[3] * scale_y])
                label = model_names[int(cls)] if int(cls) < len(model_names) else "Unknown"
                color = (0, 0, 255) if label.lower() == "violence" else (0, 255, 0)
                
                # Draw bounding box and label
                cv2.rectangle(processed_image, (x1, y1), (x2, y2), color, 2)
                cv2.putText(
                    processed_image,
                    f"{label}: {conf:.2f}",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    color,
                    2
                )
                
                if label.lower() == "violence" and alert_enabled:
                    st.toast(f"⚠️ Violence Detected! Confidence: {conf:.2f}", icon="🚨")
                    play_alert()
                
                detections.append({
                    "Timestamp": pd.Timestamp.now(),
                    "Class": label,
                    "Confidence": conf.item(),
                    "FrameTime": frame_time if frame_time else pd.Timestamp.now(),
                    "FileName": file_name
                })
                
                if debug_mode:
                    st.write(f"Detection: Class={label}, Conf={conf:.2f}, Box=({x1},{y1},{x2},{y2}), File={file_name}")
        
        if debug_mode and len(results[0].boxes) > 0:
            raw_plot = results[0].plot(labels=True, conf=True, boxes=True)
            raw_plot_resized = cv2.resize(raw_plot, (original_shape[1], original_shape[0]))
            cv2.imwrite("debug_plot.jpg", raw_plot_resized)
            st.image(raw_plot_resized, channels="BGR", caption="Debug: Raw Plot Output")
        
        if not detections:
            st.warning("No detections found. Try lowering the confidence threshold or check input content.")
        
        fps = 1 / (time.time() - start_time) if frame_time else None
        return processed_image, detections, fps
    
    except Exception as e:
        st.error(f"Detection error: {e}")
        return image, [], None

# Audio alert function
def play_alert():
    """Play audio alert when violence is detected."""
    if alert_enabled and st.session_state.alert_volume > 0:
        try:
            if st.session_state.custom_alert:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                    temp_file.write(st.session_state.custom_alert.read())
                    temp_path = temp_file.name
                sound = pygame.mixer.Sound(temp_path)
                os.unlink(temp_path)
            else:
                # Fallback alert sound
                sound = pygame.mixer.Sound(buffer=bytearray(
                    [128 + int(127 * np.sin(2 * np.pi * 440 * x / 44100)) for x in range(44100)]
                ))
            sound.set_volume(st.session_state.alert_volume / 100)
            sound.play()
        except Exception as e:
            st.warning(f"Could not play alert sound: {e}. Ensure the file is a valid WAV or MP3.")

# Video processing function
def process_video(uploaded_file, conf_threshold: float, frame_skip: int = 1) -> None:
    """
    Process uploaded video file with violence detection.
    
    Args:
        uploaded_file: Uploaded video file
        conf_threshold: Confidence threshold for detections
        frame_skip: Number of frames to skip between processing
    """
    file_name = uploaded_file.name
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
        temp_file.write(uploaded_file.read())
        temp_path = temp_file.name
    
    try:
        with video_capture_manager(temp_path) as cap:
            if not cap.isOpened():
                st.error("Failed to open video.")
                return
            
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            progress_bar = st.progress(0)
            status_text = st.empty()
            fps_text = st.empty()
            stframe = st.empty()
            
            if save_output:
                output_path = "annotated_video.mp4"
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            frame_count = 0
            processing_times = []
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                if frame_count % frame_skip != 0:
                    continue
                
                start_time = time.time()
                frame_time = datetime.now()
                
                processed_frame, detections, _ = detect_violence(frame, frame_time, file_name)
                st.session_state.log_data.extend(detections)
                
                if len(st.session_state.log_data) > st.session_state.max_log_size:
                    st.session_state.log_data = st.session_state.log_data[-st.session_state.max_log_size // 2:]
                    st.warning(f"Log size exceeded {st.session_state.max_log_size}. Truncated to recent entries.")
                
                processing_time = time.time() - start_time
                processing_times.append(processing_time)
                avg_fps = 1 / (sum(processing_times[-10:]) / len(processing_times[-10:])) if processing_times else 0
                
                if save_output:
                    out.write(processed_frame)
                
                stframe.image(processed_frame, channels="BGR")
                status_text.text(f"Processing frame {frame_count}/{total_frames}")
                fps_text.text(f"Average FPS: {avg_fps:.2f}")
                progress_bar.progress(min(frame_count / total_frames, 1.0))
            
            if save_output:
                out.release()
                with open(output_path, "rb") as file:
                    st.download_button(
                        label="Download Processed Video",
                        data=file,
                        file_name=output_path,
                        mime="video/mp4",
                        on_click=lambda: st.toast("Video downloaded successfully!", icon="✅")
                    )
    
    finally:
        os.unlink(temp_path)

# Live feed processing
def process_live_feed(conf_threshold: float, frame_skip: int = 1) -> None:
    """
    Process live camera feed with violence detection.
    
    Args:
        conf_threshold: Confidence threshold for detections
        frame_skip: Number of frames to skip between processing
    """
    file_name = "Live Feed"
    try:
        with video_capture_manager(0) as cap:
            if not cap.isOpened():
                st.error("Failed to access camera.")
                return
            
            stframe = st.empty()
            fps_text = st.empty()
            stop = st.button("Stop Live Feed", use_container_width=True)
            
            with st.sidebar:
                preview = st.empty()
                sys_monitor = st.empty()
            
            frame_count = 0
            processing_times = []
            
            while cap.isOpened() and not stop:
                ret, frame = cap.read()
                if not ret:
                    st.error("Failed to capture frame.")
                    break
                
                frame_count += 1
                if frame_count % frame_skip != 0:
                    continue
                
                start_time = time.time()
                frame_time = datetime.now()
                
                processed_frame, detections, _ = detect_violence(frame, frame_time, file_name)
                st.session_state.log_data.extend(detections)
                
                if len(st.session_state.log_data) > st.session_state.max_log_size:
                    st.session_state.log_data = st.session_state.log_data[-st.session_state.max_log_size // 2:]
                    st.warning(f"Log size exceeded {st.session_state.max_log_size}. Truncated to recent entries.")
                
                processing_time = time.time() - start_time
                processing_times.append(processing_time)
                avg_fps = 1 / (sum(processing_times[-10:]) / len(processing_times[-10:])) if processing_times else 0
                
                if avg_fps < 10:
                    st.warning("Low FPS detected. Increase frame skip or reduce resolution.")
                
                stframe.image(processed_frame, channels="BGR")
                fps_text.text(f"FPS: {avg_fps:.2f}")
                
                preview.image(
                    cv2.resize(processed_frame, (100, 100)),
                    channels="BGR",
                    caption="Live Preview"
                )
                
                cpu_percent = psutil.cpu_percent()
                mem = psutil.virtual_memory()
                sys_monitor.markdown(f"""
                **System Monitor**  
                CPU: {cpu_percent}%  
                Memory: {mem.percent}%  
                FPS: {avg_fps:.2f}
                """)
    
    except Exception as e:
        st.error(f"Live feed error: {e}")

# Image batch processing
def process_images(uploaded_files: List, conf_threshold: float) -> None:
    """
    Process batch of uploaded images with violence detection.
    
    Args:
        uploaded_files: List of uploaded image files
        conf_threshold: Confidence threshold for detections
    """
    with st.status("Batch Processing Images...", expanded=True) as status:
        progress_bar = st.progress(0)
        gallery = st.container()
        
        for i, uploaded_file in enumerate(uploaded_files):
            file_name = uploaded_file.name
            status.write(f"Processing {file_name}...")
            
            try:
                file_bytes = np.asarray(bytearray(uploaded_file.read()), dtype=np.uint8)
                image = cv2.imdecode(file_bytes, 1)
                
                if image is None:
                    st.error(f"Invalid image: {file_name}")
                    continue
                
                processed_image, detections, _ = detect_violence(image, file_name=file_name)
                st.session_state.log_data.extend(detections)
                
                if len(st.session_state.log_data) > st.session_state.max_log_size:
                    st.session_state.log_data = st.session_state.log_data[-st.session_state.max_log_size // 2:]
                    st.warning(f"Log size exceeded {st.session_state.max_log_size}. Truncated to recent entries.")
                
                with gallery:
                    st.image(processed_image, channels="BGR", caption=file_name)
                    
                    if save_output:
                        output_path = f"annotated_{file_name}"
                        cv2.imwrite(output_path, processed_image)
                        with open(output_path, "rb") as file:
                            st.download_button(
                                label=f"Download {output_path}",
                                data=file,
                                file_name=output_path,
                                mime="image/jpeg",
                                key=f"dl_{file_name}",
                                on_click=lambda: st.toast("Image downloaded successfully!", icon="✅")
                            )
                
                progress_bar.progress((i + 1) / len(uploaded_files))
            
            except Exception as e:
                st.error(f"Error processing {file_name}: {e}")
        
        status.update(label="Batch Processing Complete!", state="complete")

# Main application
def main():
    """Main application function."""
    global model, model_names, conf_threshold, alert_enabled, save_output, debug_mode
    model = None  # 👈 thêm dòng này để chắc chắn biến tồn tại
    model_names = {}
    conf_threshold = 0.25
    alert_enabled = False
    save_output = False
    debug_mode = False
    
    # Initialize session state
    init_session_state()
    
    # Inject custom CSS
    inject_custom_css()
    
    # Sidebar
    with st.sidebar:
        st.markdown("<h3 style='color: #E6E6E6; font-weight: 600;'><i class='fas fa-cog'></i> Control Panel</h3>", unsafe_allow_html=True)
        selected = option_menu(
            menu_title=None,
            options=["Dashboard", "Settings", "About"],
            icons=["house", "gear", "info-circle"],
            default_index=0,
            styles={
                "container": {"padding": "0!important", "background-color": "transparent"},
                "nav-link": {"font-size": "15px", "text-align": "left", "margin": "0px", "color": "#B0B3B8", "--hover-color": "#45484B"},
                "nav-link-selected": {"background-color": "#FF6F61", "color": "#FFFFFF"},
            }
        )
        
        if selected == "Dashboard":
            # Model weights upload
            default_model_path = Path("/home/shuilee/Python/EXE201/best_yolov11.pt")  # 👉 sửa path tới weight thật

            model_path = st.file_uploader(
                "Upload Model Weights (.pt)", 
                type=["pt"], 
                help="Upload your trained YOLOv8/YOLOv11 model",
                key="model_uploader"
            )

            if model_path:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pt") as temp_file:
                    temp_file.write(model_path.read())
                    temp_model_path = temp_file.name
                model = load_model(temp_model_path)
                os.unlink(temp_model_path)
            elif default_model_path.exists():
                model = load_model(str(default_model_path))  # 👉 sẽ load best.pt mặc định
            else:
                st.error(f"Default model path {default_model_path} does not exist. Please upload a model file.")
                st.stop()

            if model is None:
                st.stop()

            model_names = model.names

            
            # Validate class names
            if not any("violence" in name.lower() for name in model_names.values()):
                st.error("Model does not contain 'Violence' class. Please check model training or use a different model.")
                st.stop()
            
            conf_threshold = st.slider(
                "Confidence Threshold", 0.0, 1.0, 0.1, 0.05,
                help="Lower to capture more detections (may increase false positives). Raise to reduce false positives (may miss detections).",
                format="%.2f"
            )
            alert_enabled = st.checkbox(
                "Enable Alerts", True,
                help="Toggle audio/visual alerts for violence detections"
            )
            save_output = st.checkbox(
                "Save Output", False,
                help="Save processed images and videos"
            )
            debug_mode = st.checkbox(
                "Debug Mode", True,
                help="Show detection details and debug plot for troubleshooting"
            )
            
            with st.expander("System Monitor", expanded=True):
                cpu_percent = psutil.cpu_percent()
                mem = psutil.virtual_memory()
                
                st.metric("CPU Usage", f"{cpu_percent}%")
                st.progress(cpu_percent / 100)
                
                st.metric("Memory Usage", f"{mem.percent}%")
                st.progress(mem.percent / 100)
                
                if torch.cuda.is_available():
                    st.metric("GPU Memory", 
                             f"{torch.cuda.memory_allocated()/1024**2:.1f}MB / {torch.cuda.memory_reserved()/1024**2:.1f}MB")
        
        elif selected == "Settings":
            with st.expander("Performance Settings", expanded=True):
                st.session_state.frame_skip = st.slider(
                    "Frame Skip (Video/Live)", 1, 10, st.session_state.frame_skip,
                    help="Higher values skip more frames, improving performance but may miss detections."
                )
                if st.session_state.frame_skip > 5:
                    st.warning("High frame skip values may reduce detection accuracy.")
                st.session_state.max_log_size = st.slider(
                    "Max Log Size", 1000, 10000, st.session_state.max_log_size, 1000,
                    help="Maximum number of detection records to store."
                )
            
            with st.expander("Alert Settings", expanded=True):
                st.session_state.alert_volume = st.slider(
                    "Alert Volume", 0, 100, st.session_state.alert_volume,
                    help="Set the volume for audio alerts"
                )
                st.session_state.custom_alert = st.file_uploader(
                    "Custom Alert Sound", type=["wav", "mp3"],
                    help="Upload a custom alert sound (WAV or MP3)"
                )
            
            with st.expander("Advanced Settings", expanded=False):
                st.checkbox(
                    "Enable Hardware Acceleration", True,
                    help="Use GPU acceleration if available"
                )
                st.checkbox(
                    "Detailed Logging", False,
                    help="Enable verbose logging for debugging"
                )
        
        elif selected == "About":
            st.markdown("""
            **Violence Detection Dashboard**  
            Real-time violence detection powered by YOLOv8.  
            
            - **Model**: YOLOv8  
            - **Classes**: Violence, Non-Violence  
            - **Version**: 2.1  
            
            
            **System Information**  
            Python: {python_version}  
            Streamlit: {st_version}  
            PyTorch: {torch_version}  
            OpenCV: {cv2_version}  
            """.format(
                python_version=sys.version.split()[0],
                st_version=st.__version__,
                torch_version=torch.__version__,
                cv2_version=cv2.__version__
            ), unsafe_allow_html=True)
    
    # Sticky header
    st.markdown("""
    <div class='header'>
        <h2 style='margin: 0; font-weight: 700; color: #E6E6E6;'>Violence Detection Dashboard <i class='fas fa-shield-alt'></i></h2>
    </div>
    """, unsafe_allow_html=True)
    
    # Main content with tabs
    with st.container():
        st.markdown("<div class='section'><h4 style='color: #E6E6E6;'><i class='fas fa-video'></i> Input Processing</h4>", unsafe_allow_html=True)
        tabs = st.tabs(["📷 Image", "🎥 Video", "📡 Live Feed", "📊 Analytics"])
        
        with tabs[0]:
            st.session_state.input_type = "Image"
            uploaded_files = st.file_uploader(
                "Upload Images", type=["jpg", "png", "jpeg"],
                accept_multiple_files=True,
                help="Select one or more images for processing"
            )
            
            if uploaded_files:
                if st.button("Process All Images", key="process_images", use_container_width=True):
                    with st.spinner("Processing images..."):
                        process_images(uploaded_files, conf_threshold)
        
        with tabs[1]:
            st.session_state.input_type = "Video"
            uploaded_file = st.file_uploader(
                "Upload a Video", type=["mp4", "avi", "mov"],
                help="Select a video for processing"
            )
            
            if uploaded_file:
                if st.button("Process Video", key="process_video", use_container_width=True):
                    with st.spinner("Processing video..."):
                        process_video(uploaded_file, conf_threshold, st.session_state.frame_skip)
        
        with tabs[2]:
            st.session_state.input_type = "Live Feed"
            if st.button("Start Live Feed", key="start_live_feed", use_container_width=True):
                with st.spinner("Starting live feed..."):
                    process_live_feed(conf_threshold, st.session_state.frame_skip)
        
        with tabs[3]:
            st.session_state.input_type = "Analytics"
            st.markdown("<div class='section'><h4 style='color: #E6E6E6;'><i class='fas fa-table'></i> Detection Log</h4>", unsafe_allow_html=True)
            
            if st.session_state.log_data:
                df = pd.DataFrame(st.session_state.log_data)
                
                col1, col2 = st.columns(2)
                with col1:
                    class_filter = st.multiselect(
                        "Filter by Class", 
                        options=df["Class"].unique(), 
                        default=df["Class"].unique(),
                        help="Select classes to display in the log"
                    )
                with col2:
                    date_range = st.date_input(
                        "Date Range",
                        value=[df["Timestamp"].min(), df["Timestamp"].max()],
                        min_value=df["Timestamp"].min(),
                        max_value=df["Timestamp"].max(),
                        help="Filter detections by date range"
                    )
                
                filtered_df = df[
                    (df["Class"].isin(class_filter)) &
                    (df["Timestamp"].dt.date >= pd.Timestamp(date_range[0]).date()) &
                    (df["Timestamp"].dt.date <= pd.Timestamp(date_range[1]).date())
                ]
                
                def style_row(row):
                    color = "#D32F2F" if row["Class"].lower() == "violence" else "#4CAF50"
                    return [f"color: {color};"] * len(row)
                
                st.data_editor(
                    filtered_df.style.apply(style_row, axis=1),
                    use_container_width=True,
                    column_config={
                        "Timestamp": st.column_config.DatetimeColumn(format="YYYY-MM-DD HH:mm:ss"),
                        "Confidence": st.column_config.NumberColumn(format="%.2f"),
                        "FileName": st.column_config.TextColumn("File Name")
                    },
                    hide_index=True
                )
                
                col1, col2 = st.columns(2)
                with col1:
                    csv = filtered_df.to_csv(index=False)
                    st.download_button(
                        label="Download Log as CSV",
                        data=csv,
                        file_name="detections.csv",
                        mime="text/csv",
                        use_container_width=True,
                        on_click=lambda: st.toast("Log downloaded successfully!", icon="✅")
                    )
                with col2:
                    if st.button(
                        "Reset Log",
                        use_container_width=True,
                        help="Clear all detection records"
                    ):
                        st.session_state.log_data = []
                        st.rerun()
            else:
                st.info("No detections yet.")
            
            st.markdown("</div>", unsafe_allow_html=True)
            
            st.markdown("<div class='section'><h4 style='color: #E6E6E6;'><i class='fas fa-chart-bar'></i> Summary & Insights</h4>", unsafe_allow_html=True)
            
            if st.session_state.log_data:
                df = pd.DataFrame(st.session_state.log_data)
                
                violence_count = len(df[df["Class"].str.lower() == "violence"])
                non_violence_count = len(df[df["Class"].str.lower() == "non-violence"])
                avg_conf = df["Confidence"].mean()
                
                col1, col2, col3 = st.columns(3)
                col1.metric("Violence Detections", violence_count, delta_color="inverse")
                col2.metric("Non-Violence Detections", non_violence_count, delta_color="normal")
                col3.metric("Avg. Confidence", f"{avg_conf:.2f}")
                
                with st.expander("Visual Analytics", expanded=True):
                    tab1, tab2, tab3 = st.tabs(["Class Distribution", "Confidence Trend", "Hourly Pattern"])
                    
                    @st.cache_data
                    def create_bar_chart(data):
                        return px.bar(
                            data,
                            x="Class",
                            y="count",
                            color="Class",
                            color_discrete_map={"Violence": "#D32F2F", "Non-Violence": "#4CAF50"},
                            title="Class Distribution",
                            labels={"Class": "Class", "count": "Count"},
                            template="plotly_dark"
                        )
                    
                    @st.cache_data
                    def create_line_chart(data, x, y, color):
                        return px.line(
                            data,
                            x=x,
                            y=y,
                            color=color,
                            title="Confidence Trend Over Time",
                            color_discrete_map={"Violence": "#D32F2F", "Non-Violence": "#4CAF50"},
                            template="plotly_dark"
                        )
                    
                    @st.cache_data
                    def create_hourly_chart(_x, _y):
                        # Convert hourly_counts to a DataFrame for Plotly
                        df_hourly = pd.DataFrame(index=_x, columns=_y).fillna(0).reset_index().rename(columns={'index': 'Hour'})
                        df_hourly = df_hourly.melt(id_vars='Hour', value_vars=_y, var_name='Class', value_name='Count')
                        return px.line(
                            df_hourly,
                            x='Hour',
                            y='Count',
                            color='Class',
                            title="Hourly Detection Pattern",
                            labels={'Hour': 'Hour of Day', 'Count': 'Number of Detections'},
                            color_discrete_map={"Violence": "#D32F2F", "Non-Violence": "#4CAF50"},
                            template="plotly_dark"
                        )
                    
                    with tab1:
                        fig = create_bar_chart(df["Class"].value_counts().reset_index())
                        st.plotly_chart(fig, use_container_width=True)
                        with st.spinner("Generating chart..."):
                            try:
                                chart_data = fig.to_image(format="png")
                                st.download_button(
                                    label="Download Chart as PNG",
                                    data=chart_data,
                                    file_name="class_distribution.png",
                                    mime="image/png",
                                    use_container_width=True,
                                    on_click=lambda: st.toast("Chart downloaded successfully!", icon="✅")
                                )
                            except Exception as e:
                                st.error(
                                    f"Failed to export chart as PNG: {e}. "
                                    "Install Kaleido with `pip install kaleido`. "
                                    "Ensure Microsoft Visual C++ Redistributable is installed (https://aka.ms/vs/17/release/vc_redist.x64.exe). "
                                    "Using HTML fallback."
                                )
                                st.download_button(
                                    label="Download Chart as HTML",
                                    data=fig.to_html(),
                                    file_name="class_distribution.html",
                                    mime="text/html",
                                    use_container_width=True,
                                    on_click=lambda: st.toast("Chart downloaded successfully!", icon="✅")
                                )
                    
                    with tab2:
                        if len(df) > 1:
                            fig = create_line_chart(df, "Timestamp", "Confidence", "Class")
                            st.plotly_chart(fig, use_container_width=True)
                            with st.spinner("Generating chart..."):
                                try:
                                    chart_data = fig.to_image(format="png")
                                    st.download_button(
                                        label="Download Chart as PNG",
                                        data=chart_data,
                                        file_name="confidence_trend.png",
                                        mime="image/png",
                                        use_container_width=True,
                                        on_click=lambda: st.toast("Chart downloaded successfully!", icon="✅")
                                    )
                                except Exception as e:
                                    st.error(
                                        f"Failed to export chart as PNG: {e}. "
                                        "Install Kaleido with `pip install kaleido`. "
                                        "Ensure Microsoft Visual C++ Redistributable is installed."
                                    )
                                    st.download_button(
                                        label="Download Chart as HTML",
                                        data=fig.to_html(),
                                        file_name="confidence_trend.html",
                                        mime="text/html",
                                        use_container_width=True,
                                        on_click=lambda: st.toast("Chart downloaded successfully!", icon="✅")
                                    )
                    
                    with tab3:
                        df['Hour'] = df['Timestamp'].dt.hour
                        hourly_counts = df.groupby(['Hour', 'Class']).size().unstack(fill_value=0)
                        fig = create_hourly_chart(hourly_counts.index, hourly_counts.columns)
                        st.plotly_chart(fig, use_container_width=True)
                        with st.spinner("Generating chart..."):
                            try:
                                chart_data = fig.to_image(format="png")
                                st.download_button(
                                    label="Download Chart as PNG",
                                    data=chart_data,
                                    file_name="hourly_pattern.png",
                                    mime="image/png",
                                    use_container_width=True,
                                    on_click=lambda: st.toast("Chart downloaded successfully!", icon="✅")
                                )
                            except Exception as e:
                                st.error(
                                    f"Failed to export chart as PNG: {e}. "
                                    "Install Kaleido with `pip install kaleido`. "
                                    "Ensure Microsoft Visual C++ Redistributable is installed."
                                )
                                st.download_button(
                                    label="Download Chart as HTML",
                                    data=fig.to_html(),
                                    file_name="hourly_pattern.html",
                                    mime="text/html",
                                    use_container_width=True,
                                    on_click=lambda: st.toast("Chart downloaded successfully!", icon="✅")
                                )
                
                with st.expander("Export Visualizations", expanded=False):
                    st.download_button(
                        label="Export All Charts as HTML",
                        data=fig.to_html(),
                        file_name="violence_detection_charts.html",
                        mime="text/html",
                        use_container_width=True,
                        on_click=lambda: st.toast("Charts downloaded successfully!", icon="✅")
                    )
            
            st.markdown("</div>", unsafe_allow_html=True)
        
        st.markdown("</div>", unsafe_allow_html=True)
    
    # Footer
    st.markdown("""
    <div style='text-align: center; padding: 2.5rem; color: #B0B3B8; font-size: 15px;'>
        <i class='fas fa-rocket'></i> | © 2025 Violence Prediction.
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
