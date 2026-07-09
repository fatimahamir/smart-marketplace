import { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Image, Badge } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { FaPaperPlane, FaComments } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { messageService } from '../services/messageService';
import { userService } from '../services/userService';
import { initSocket, getSocket, disconnectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const AVATAR_PLACEHOLDER = 'https://placehold.co/60x60/E8F5E9/1E8449?text=U';

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectUserId = searchParams.get('to');

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    const socket = initSocket(user.id);

    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => {
        if (activeUser && (msg.sender === activeUser._id || msg.sender?._id === activeUser._id)) {
          return [...prev, msg];
        }
        return prev;
      });
      loadInbox();
    });

    socket.on('userTyping', ({ senderId }) => {
      if (activeUser && senderId === activeUser._id) setTyping(true);
    });
    socket.on('userStopTyping', ({ senderId }) => {
      if (activeUser && senderId === activeUser._id) setTyping(false);
    });

    return () => disconnectSocket();
    // eslint-disable-next-line
  }, [activeUser]);

  const loadInbox = useCallback(async () => {
    try {
      const { data } = await messageService.getInbox();
      setConversations(data.conversations);
    } catch {
      toast.error('Could not load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  useEffect(() => {
    if (preselectUserId) {
      userService.getProfile(preselectUserId).then(({ data }) => setActiveUser(data.user)).catch(() => {});
    }
  }, [preselectUserId]);

  const openConversation = async (otherUser) => {
    setActiveUser(otherUser);
    try {
      const { data } = await messageService.getConversation(otherUser._id);
      setMessages(data.messages);
      await messageService.markAsRead(otherUser._id);
      loadInbox();
    } catch {
      toast.error('Could not load conversation');
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !activeUser) return;
    socket.emit('typing', { senderId: user.id, receiverId: activeUser._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stopTyping', { senderId: user.id, receiverId: activeUser._id });
    }, 1500);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUser) return;

    const socket = getSocket();
    const payload = { sender: user.id, receiver: activeUser._id, content: text };
    socket.emit('sendMessage', payload);
    setMessages((prev) => [...prev, { ...payload, createdAt: new Date().toISOString(), _id: Date.now() }]);
    setText('');
  };

  if (loading) return <Loader text="Loading messages..." />;

  return (
    <Container className="py-4">
      <h3 className="sm-section-title">Messages</h3>
      <Row className="g-0 sm-card border-0" style={{ minHeight: 500 }}>
        <Col md={4} className="border-end" style={{ maxHeight: 600, overflowY: 'auto' }}>
          {conversations.length === 0 && !activeUser ? (
            <EmptyState icon={<FaComments />} title="No conversations yet" text="Message a seller or provider to start chatting." />
          ) : (
            conversations.map((c) => {
              const other = c.lastMessage.sender === user.id ? c.lastMessage.receiver : c.lastMessage.sender;
              return (
                <div
                  key={c._id}
                  className="d-flex align-items-center gap-2 p-3 border-bottom"
                  style={{ cursor: 'pointer', background: activeUser?._id === other ? 'var(--sm-green-tint)' : 'transparent' }}
                  onClick={() => userService.getProfile(other).then(({ data }) => openConversation(data.user))}
                >
                  <Image src={AVATAR_PLACEHOLDER} roundedCircle style={{ width: 40, height: 40 }} />
                  <div className="flex-grow-1 text-truncate">
                    <div className="small fw-semibold">Conversation</div>
                    <div className="text-muted small text-truncate" style={{ maxWidth: 180 }}>{c.lastMessage.content || 'Image'}</div>
                  </div>
                  {c.unreadCount > 0 && <Badge bg="secondary" pill>{c.unreadCount}</Badge>}
                </div>
              );
            })
          )}
        </Col>

        <Col md={8} className="d-flex flex-column" style={{ maxHeight: 600 }}>
          {!activeUser ? (
            <EmptyState icon={<FaComments />} title="Select a conversation" text="Choose a conversation from the left to start chatting." />
          ) : (
            <>
              <div className="d-flex align-items-center gap-2 p-3 border-bottom">
                <Image src={activeUser.profilePicture || AVATAR_PLACEHOLDER} roundedCircle style={{ width: 40, height: 40, objectFit: 'cover' }} />
                <div>
                  <div className="fw-semibold">{activeUser.fullName}</div>
                  {typing && <div className="small text-muted">typing...</div>}
                </div>
              </div>

              <div className="flex-grow-1 p-3" style={{ overflowY: 'auto' }}>
                {messages.map((m, i) => {
                  const isMe = (m.sender === user.id) || (m.sender?._id === user.id);
                  return (
                    <div key={m._id || i} className={`d-flex mb-2 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div className={`px-3 py-2 ${isMe ? 'sm-chat-bubble-me' : 'sm-chat-bubble-them'}`} style={{ maxWidth: '70%' }}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <Form onSubmit={sendMessage} className="d-flex gap-2 p-3 border-top">
                <Form.Control
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => { setText(e.target.value); handleTyping(); }}
                />
                <Button type="submit" variant="primary"><FaPaperPlane /></Button>
              </Form>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Messages;
