# Messaging API Documentation

## Overview
The messaging API allows users and admins to send messages with support for text, voice messages, images (PNG, JPG, JPEG, WEBP), PDFs, and documents.

## File Upload Support
- **Images**: PNG, JPG, JPEG, WEBP
- **Audio**: MP3, WAV, OGG, WEBM
- **Documents**: PDF, DOC, DOCX, TXT
- **Max File Size**: 10MB

## API Endpoints

### 1. Send Message (User)
**POST** `/api/messages/send`

**Headers:**
```
Authorization: Bearer <user_token>
Content-Type: multipart/form-data
```

**Body (Form Data):**
- `messageType` (required): `text` | `voice` | `image` | `document` | `pdf`
- `content` (required for text messages): string
- `file` (required for non-text messages): file

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "message_id",
    "userId": "user_id",
    "messageType": "text",
    "content": "Hello",
    "sentBy": "user",
    "isRead": false,
    "createdAt": "2025-12-02T10:00:00.000Z"
  }
}
```

### 2. Send Message (Admin)
**POST** `/api/messages/admin/send`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body (Form Data):**
- `userId` (optional): user ID to send message to (defaults to admin's own ID)
- `messageType` (required): `text` | `voice` | `image` | `document` | `pdf`
- `content` (required for text messages): string
- `file` (required for non-text messages): file

### 3. Get All Messages (Admin)
**GET** `/api/messages`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `isRead` (optional): `true` | `false`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2
}
```

### 4. Get User Messages
**GET** `/api/messages/user/:userId`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 10
}
```

### 5. Get My Messages (User)
**GET** `/api/messages/my-messages`

**Headers:**
```
Authorization: Bearer <user_token>
```

### 6. Mark Messages as Read
**PUT** `/api/messages/mark-read`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "messageIds": ["message_id_1", "message_id_2"]
}
```

### 7. Mark Messages as Unread
**PUT** `/api/messages/mark-unread`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "messageIds": ["message_id_1", "message_id_2"]
}
```

### 8. Delete Message
**DELETE** `/api/messages/:messageId`

**Headers:**
```
Authorization: Bearer <admin_token>
```

## File Storage
Files are stored in the `uploads/` directory with the following structure:
- `uploads/images/` - Image files
- `uploads/pdfs/` - PDF files
- `uploads/voice/` - Audio files
- `uploads/documents/` - Document files

Files are accessible via: `http://localhost:4000/uploads/{path}`

## Message Model
```typescript
{
  userId: string;
  adminId?: string;
  messageType: "text" | "voice" | "image" | "document" | "pdf";
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isRead: boolean;
  sentBy: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}
```