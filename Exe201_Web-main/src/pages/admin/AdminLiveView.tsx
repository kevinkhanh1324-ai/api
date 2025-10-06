import React, { useState, useRef, useEffect } from 'react'
import { Camera, Maximize, Volume2, VolumeX, Users, User, Grid, Eye, Wifi, WifiOff, TrendingUp } from 'lucide-react'

interface Detection {
    class: string;
    confidence: number;
    box: number[];
}

const AdminLiveView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'single' | 'full'>('single')
    const [selectedCamera, setSelectedCamera] = useState('classroom-a')
    const [audioEnabled, setAudioEnabled] = useState(false)
    const [running, setRunning] = useState(false);
    const [detections, setDetections] = useState<Detection[]>([]);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const cameras = [
        { id: 'classroom-a', name: 'Phòng học A', status: 'Hoạt động', location: 'Tầng 1', students: 22 },
        { id: 'playground', name: 'Sân chơi ngoài trời', status: 'Hoạt động', location: 'Ngoài trời', students: 45 },
        { id: 'hallway', name: 'Hành lang chính', status: 'Bảo trì', location: 'Tầng 1', students: 0 },
        { id: 'cafeteria', name: 'Phòng ăn tập thể', status: 'Hoạt động', location: 'Tầng 1', students: 38 }
    ]

    useEffect(() => {
        if (running) {
            startCamera();
            // Giảm interval time xuống 100ms để cập nhật thường xuyên hơn
            const interval = setInterval(() => {
                captureAndDetect();
            }, 100);
            return () => clearInterval(interval);
        } else {
            stopCamera();
        }
    }, [running]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }  // Tăng frame rate
                } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Không thể bật camera:", err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const drawDetections = (ctx: CanvasRenderingContext2D, detections: Detection[]) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.lineWidth = 2;
        detections.forEach((det) => {
            const [x1, y1, x2, y2] = det.box;
            ctx.strokeStyle = det.class.toLowerCase() === "violence" ? "red" : "green";
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = "16px Arial";
            ctx.fillText(
                `${det.class} (${(det.confidence * 100).toFixed(1)}%)`,
                x1 + 4,
                y1 > 20 ? y1 - 4 : y1 + 20
            );
        });
    };

    const captureAndDetect = async () => {
        if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { alpha: false }); // Tối ưu performance với alpha: false
        if (!ctx) return;

        // Chỉ cập nhật kích thước canvas một lần khi video thay đổi
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
            const blob = await new Promise<Blob>((resolve) => 
                canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.8) // Giảm chất lượng xuống 0.8 để tăng tốc độ
            );

            const formData = new FormData();
            formData.append("file", blob, "frame.jpg");

            const response = await fetch("http://127.0.0.1:8000/detect", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            setDetections(data.detections || []);
            drawDetections(ctx, data.detections || []);
        } catch (err) {
            console.error("Error detecting:", err);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">📹 Giám sát trực tiếp toàn trường</h1>
                        <p className="text-green-100">Theo dõi hoạt động của tất cả các lớp học trong thời gian thực</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex bg-white/20 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('single')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${viewMode === 'single'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                <Eye className="w-4 h-4" />
                                <span>Theo dõi cá nhân</span>
                            </button>
                            <button
                                onClick={() => setViewMode('full')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${viewMode === 'full'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                <Grid className="w-4 h-4" />
                                <span>Xem tổng quan</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Camera Selection */}
                <div className="lg:col-span-1">
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">🎥 Danh sách camera</h3>
                        <div className="space-y-3">
                            {cameras.map((camera) => (
                                <button
                                    key={camera.id}
                                    onClick={() => setSelectedCamera(camera.id)}
                                    className={`w-full p-4 rounded-lg text-left transition-all ${selectedCamera === camera.id
                                        ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">{camera.name}</span>
                                        <div className="flex items-center">
                                            {camera.status === 'Hoạt động' ? (
                                                <Wifi className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <WifiOff className="w-4 h-4 text-red-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{camera.location}</span>
                                        <span className="font-medium text-blue-600">{camera.students} em</span>
                                    </div>
                                    <div className={`mt-2 text-xs font-medium px-2 py-1 rounded-full inline-block ${camera.status === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {camera.status}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Camera Stats */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-bold text-blue-900 mb-3">📊 Thống kê camera</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Đang hoạt động:</span>
                                    <span className="font-medium text-blue-900">3/4</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Tổng học sinh:</span>
                                    <span className="font-medium text-blue-900">105 em</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Chất lượng trung bình:</span>
                                    <span className="font-medium text-green-600">96%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Video Feed */}
                <div className="lg:col-span-3">
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                                <Camera className="w-5 h-5 text-blue-600" />
                                <span>{cameras.find(c => c.id === selectedCamera)?.name}</span>
                                <span className="text-sm text-gray-500">
                                    ({cameras.find(c => c.id === selectedCamera)?.students} học sinh)
                                </span>
                            </h3>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setAudioEnabled(!audioEnabled)}
                                    className={`p-2 rounded-lg transition-colors ${audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                        } hover:bg-gray-200`}
                                    title={audioEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                                >
                                    {audioEnabled ? (
                                        <Volume2 className="w-5 h-5" />
                                    ) : (
                                        <VolumeX className="w-5 h-5" />
                                    )}
                                </button>

                                <button
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="Xem toàn màn hình"
                                >
                                    <Maximize className="w-5 h-5 text-gray-600" />
                                </button>

                                <button
                                    onClick={() => setRunning(!running)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${running ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                                        }`}
                                >
                                    {running ? "Dừng" : "Bắt đầu"}
                                </button>
                            </div>
                        </div>

                        {/* Video Container */}
                        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '16/9' }}>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline
                                muted 
                                className="w-full h-full object-cover"
                            />
                            <canvas 
                                ref={canvasRef} 
                                className="absolute top-0 left-0 w-full h-full"
                            />
                            {!running && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <Camera className="w-20 h-20 mx-auto mb-4 opacity-50" />
                                        <p className="text-xl font-medium">Video trực tiếp - Quản trị viên</p>
                                        <p className="text-sm opacity-75">Camera: {cameras.find(c => c.id === selectedCamera)?.name}</p>
                                    </div>
                                </div>
                            )}

                            {/* AI Overlay Indicators */}
                            <div className="absolute top-4 left-4 space-y-2">
                                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                    ✓ Phát hiện {cameras.find(c => c.id === selectedCamera)?.students} trẻ em
                                </div>
                                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                    🎯 AI đang theo dõi
                                </div>
                                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                    ⚠ 2 vùng cảnh báo
                                </div>
                            </div>

                            {/* Live Indicator */}
                            <div className="absolute top-4 right-4">
                                <div className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full shadow-lg">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">TRỰC TIẾP</span>
                                </div>
                            </div>

                            {/* Admin Controls Overlay */}
                            <div className="absolute bottom-4 left-4 space-y-2">
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors">
                                    📱 Gửi thông báo
                                </button>
                                <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors">
                                    📋 Tạo báo cáo
                                </button>
                            </div>
                        </div>

                        {/* Enhanced Controls */}
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-gray-700">Chất lượng:</span>
                                    <select
                                        className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white"
                                        title="Chọn chất lượng video"
                                    >
                                        <option>HD (720p)</option>
                                        <option>Full HD (1080p)</option>
                                        <option>4K (Quản trị)</option>
                                    </select>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-700">Hiển thị AI:</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                defaultChecked
                                                title="Bật/tắt hiển thị AI"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-700">Ghi âm:</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                title="Bật/tắt ghi âm"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>🔋 Độ trễ: 0.2s</span>
                                <span>📊 Băng thông: 2.4 MB/s</span>
                                <span>⚡ FPS: 30</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Analysis Panel - Enhanced for Admin */}
            <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🤖 Phân tích AI chi tiết</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-bold text-green-900 mb-1">Phát hiện trẻ em</h4>
                        <p className="text-sm text-green-700">22/22 em đã xác định</p>
                        <p className="text-xs text-green-600 mt-1">Độ chính xác: 98.5%</p>
                    </div>

                    <div className="text-center p-4 bg-yellow-50 rounded-xl">
                        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <div className="w-8 h-8 bg-yellow-600 rounded"></div>
                        </div>
                        <h4 className="font-bold text-yellow-900 mb-1">Vùng nguy hiểm</h4>
                        <p className="text-sm text-yellow-700">2 vùng được giám sát</p>
                        <p className="text-xs text-yellow-600 mt-1">0 vi phạm</p>
                    </div>

                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-bold text-blue-900 mb-1">Hoạt động hiện tại</h4>
                        <p className="text-sm text-blue-700">Giờ học tập trung</p>
                        <p className="text-xs text-blue-600 mt-1">Mức độ tương tác: Cao</p>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-bold text-purple-900 mb-1">Xu hướng hành vi</h4>
                        <p className="text-sm text-purple-700">Ổn định</p>
                        <p className="text-xs text-purple-600 mt-1">Cảnh báo giảm 15%</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminLiveView
