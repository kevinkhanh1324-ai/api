

DELETE FROM [Package];

INSERT INTO [Package] (name, price, duration_days, camera_limit, ai_features, storage_days, description, is_active, created_at) VALUES
(N'Gói Dịch Vụ Trẻ Em', 3000, 30, 1, N'["Phát hiện bạo lực", "Nhận diện khuôn mặt", "Theo dõi an toàn"]', 7, N'Gói dịch vụ chuyên biệt cho trẻ em với tính năng AI tiên tiến', 1, GETDATE());

PRINT 'Updated to single children package successfully!';