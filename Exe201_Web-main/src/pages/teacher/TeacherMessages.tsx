import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Video, 
  Search, 
  Filter, 
  Plus,
  Paperclip,
  Smile,
  MoreVertical,
  Users,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Star,
  Archive
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
  attachments?: string[];
}

interface Conversation {
  id: string;
  parentName: string;
  studentName: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  priority: 'normal' | 'high' | 'urgent';
  messages: Message[];
}

const TeacherMessages: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      parentName: 'Nguyễn Thị Bình',
      studentName: 'Nguyễn Văn An',
      lastMessage: 'Con An hôm nay có vẻ mệt, có chuyện gì không ạ?',
      lastMessageTime: '10:30',
      unreadCount: 2,
      isOnline: true,
      priority: 'normal',
      messages: [
        {
          id: '1',
          senderId: 'parent1',
          senderName: 'Nguyễn Thị Bình',
          content: 'Xin chào cô, con An hôm nay có vẻ không vui. Cô có biết chuyện gì xảy ra không ạ?',
          timestamp: '09:15',
          isRead: true,
          type: 'text'
        },
        {
          id: '2',
          senderId: 'teacher',
          senderName: 'Cô giáo',
          content: 'Chào chị, con An hôm nay có làm bài tập nhóm với bạn. Có thể con hơi căng thẳng vì bài tập khó. Tôi sẽ quan sát thêm.',
          timestamp: '09:20',
          isRead: true,
          type: 'text'
        },
        {
          id: '3',
          senderId: 'parent1',
          senderName: 'Nguyễn Thị Bình',
          content: 'Con An hôm nay có vẻ mệt, có chuyện gì không ạ?',
          timestamp: '10:30',
          isRead: false,
          type: 'text'
        }
      ]
    },
    {
      id: '2',
      parentName: 'Trần Văn Cường',
      studentName: 'Trần Thị Bình',
      lastMessage: 'Cảm ơn cô đã quan tâm đến con Bình',
      lastMessageTime: 'Hôm qua',
      unreadCount: 0,
      isOnline: false,
      priority: 'normal',
      messages: [
        {
          id: '4',
          senderId: 'teacher',
          senderName: 'Cô giáo',
          content: 'Con Bình hôm nay học rất tốt và tích cực tham gia thảo luận.',
          timestamp: 'Hôm qua 15:00',
          isRead: true,
          type: 'text'
        },
        {
          id: '5',
          senderId: 'parent2',
          senderName: 'Trần Văn Cường',
          content: 'Cảm ơn cô đã quan tâm đến con Bình',
          timestamp: 'Hôm qua 15:30',
          isRead: true,
          type: 'text'
        }
      ]
    },
    {
      id: '3',
      parentName: 'Lê Thị Dung',
      studentName: 'Lê Văn Cường',
      lastMessage: 'Con Cường đã làm bài tập chưa ạ?',
      lastMessageTime: '2 ngày trước',
      unreadCount: 1,
      isOnline: true,
      priority: 'high',
      messages: [
        {
          id: '6',
          senderId: 'parent3',
          senderName: 'Lê Thị Dung',
          content: 'Con Cường đã làm bài tập chưa ạ?',
          timestamp: '2 ngày trước 14:00',
          isRead: false,
          type: 'text'
        }
      ]
    }
  ]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'unread' && conv.unreadCount > 0) ||
                         (filterStatus === 'priority' && conv.priority !== 'normal');
    
    return matchesSearch && matchesFilter;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const sendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // Logic gửi tin nhắn
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-blue-500 bg-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-xl">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Giao tiếp với Phụ huynh</h1>
                <p className="text-gray-600">Trao đổi thông tin về học sinh với gia đình</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="btn-secondary flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Tin nhắn mới</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col">
            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col space-y-3">
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm phụ huynh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả tin nhắn</option>
                  <option value="unread">Chưa đọc</option>
                  <option value="priority">Ưu tiên cao</option>
                </select>
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation === conversation.id ? 'bg-blue-50 border-l-blue-500' : getPriorityColor(conversation.priority)
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {conversation.parentName.charAt(0)}
                        </span>
                      </div>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.parentName}
                        </p>
                        <div className="flex items-center space-x-1">
                          {conversation.priority === 'urgent' && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          {conversation.priority === 'high' && (
                            <Star className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessageTime}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-blue-600 mb-1">
                        HS: {conversation.studentName}
                      </p>
                      
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                      </p>
                      
                      {conversation.unreadCount > 0 && (
                        <div className="mt-2 flex justify-end">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {selectedConv.parentName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{selectedConv.parentName}</h3>
                        <p className="text-sm text-blue-600">Phụ huynh của {selectedConv.studentName}</p>
                      </div>
                      {selectedConv.isOnline && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Đang online
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Gọi điện">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Video call">
                        <Video className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConv.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === 'teacher' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === 'teacher'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-between mt-1 ${
                          message.senderId === 'teacher' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{message.timestamp}</span>
                          {message.senderId === 'teacher' && (
                            <div className="ml-2">
                              {message.isRead ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Paperclip className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded">
                        <Smile className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    
                    <button
                      onClick={sendMessage}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Chọn cuộc trò chuyện</p>
                  <p className="text-sm">Chọn một phụ huynh để bắt đầu trò chuyện</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng tin nhắn</p>
                <p className="text-2xl font-bold text-gray-900">
                  {conversations.reduce((total, conv) => total + conv.messages.length, 0)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chưa đọc</p>
                <p className="text-2xl font-bold text-red-600">
                  {conversations.reduce((total, conv) => total + conv.unreadCount, 0)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Phụ huynh online</p>
                <p className="text-2xl font-bold text-green-600">
                  {conversations.filter(c => c.isOnline).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ưu tiên cao</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {conversations.filter(c => c.priority !== 'normal').length}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherMessages;
