import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { BiPowerOff } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/Input';
import tutorialsdev from '../../assets/tutorialsdev.png';
import Img1 from '../../assets/img1.jpg';

const Dashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user:detail')));
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const messageRef = useRef(null);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('user:detail');
    localStorage.removeItem('user:token');
    navigate('/users/sign_in');
  };

  useEffect(() => {
    const socketInstance = io('http://localhost:8000');
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    socket?.emit('addUser', user?.id);
    socket?.on('getUsers', (users) => {
      console.log('activeUsers :>> ', users);
    });
    socket?.on('getMessage', (data) => {
      setMessages((prev) => ({
        ...prev,
        messages: [...prev.messages, { user: data.user, message: data.message }],
      }));  
    });
  }, [socket, user?.id]);

  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.messages]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/conversations/${user?.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const resData = await res.json();
        setConversations(resData);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, [user?.id]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/users/${user?.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const resData = await res.json();
        setUsers(resData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [user?.id]);

  // const fetchMessages = async (conversationId, receiver) => {
  //   try {
  //     const res = await fetch(
  //       `http://localhost:8000/api/message/${conversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`,
  //       {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       }
  //     );
  //     const resData = await res.json();
  //     setMessages({ messages: resData, receiver, conversationId });
  //   } catch (error) {
  //     console.error('Error fetching messages:', error);
  //   }
  // };

  const fetchMessages = async (conversationId, receiver) => {
    try {
        let actualConversationId = conversationId;

        // Check if the conversation is new, and get the actual conversationId
        if (conversationId === "new") {
            const existingConversation = conversations.find(conv => conv.user.id === receiver.id);
            if (existingConversation) {
                actualConversationId = existingConversation.conversationId;
            }
        }

        // Fetch messages using the actual conversationId
        const res = await fetch(
            `http://localhost:8000/api/message/${actualConversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        const resData = await res.json();
        setMessages({ messages: resData, receiver, conversationId: actualConversationId });
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
};


  const sendMessage = async () => {
    try {
      setMessage('');
      socket?.emit('sendMessage', {
        senderId: user?.id,
        receiverId: messages?.receiver?.receiverId,
        message,
        conversationId: messages?.conversationId,
      });

      await fetch(`http://localhost:8000/api/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: messages?.conversationId,
          senderId: user?.id,
          message,
          receiverId: messages?.receiver?.receiverId,
        }),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };


  return (
    <div className="w-screen flex">
      <div className="w-[25%] h-screen bg-secondary overflow-scroll">
        <div className="flex items-center my-8 mx-14">
          <div>
            <img
              src={tutorialsdev}
              width={75}
              height={75}
              alt=""
              className="border border-primary p-[2px] rounded-full"
            />
          </div>
          <div className="ml-8 flex flex-col">
            <h3 className="text-2xl">{user?.fullName}</h3>
            <BiPowerOff className="h-9 w-9 mt-4" onClick={logout} />
          </div>
        </div>
        <hr />
        <div className="mx-14 mt-10">
          <div className="text-primary text-lg">Messages</div>
          <div>
            {conversations.length > 0 ? (
              conversations.map(({ conversationId, user }) => {
                return (
                  <div
                    key={conversationId}
                    className="flex items-center py-8 border-b border-b-gray-300"
                  >
                    <div
                      className="cursor-pointer flex items-center"
                      onClick={() => fetchMessages(conversationId, user)}
                    >
                      <div>
                        <img
                          src={Img1}
                          alt=""
                          className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary"
                        />
                      </div>
                      <div className="ml-6">
                        <h3 className="text-lg font-semibold">
                          {user?.fullName}
                        </h3>
                        <p className="text-sm font-light text-gray-600">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No Conversations
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-[50%] h-screen bg-white flex flex-col items-center">
        {messages?.receiver?.fullName && (
          <div className="w-[75%] bg-secondary h-[80px] my-14 rounded-full flex items-center px-14 py-2">
            <div className="cursor-pointer">
              <img
                src={Img1}
                width={60}
                height={60}
                alt=""
                className="rounded-full"
              />
            </div>
            <div className="ml-6 mr-auto">
              <h3 className="text-lg">{messages?.receiver?.fullName}</h3>
              <p className="text-sm font-light text-gray-600">
                {messages?.receiver?.email}
              </p>
            </div>
            <div className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-phone-outgoing"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="black"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                <line x1="15" y1="9" x2="20" y2="4" />
                <polyline points="16 4 20 4 20 8" />
              </svg>
            </div>
          </div>
        )}
        <div className="h-[75%] w-full overflow-scroll shadow-sm">
          <div className="p-14">
            {messages?.messages?.length > 0 ? (
              messages.messages.map(({ message, user: { id } = {} }, index) => {
                return (
                  <>
                    <div
                      key={user?.id}
                      className={`max-w-[40%] rounded-b-xl p-4 mb-6 ${
                        id === user?.id
                          ? "bg-primary text-white rounded-tl-xl ml-auto"
                          : "bg-secondary rounded-tr-xl"
                      } `}
                    >
                      {message}
                    </div>
                    <div ref={messageRef}></div>
                  </>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No Messages or No Conversation Selected
              </div>
            )}
          </div>
        </div>
        {messages?.receiver?.fullName && (
          <div className="p-14 w-full flex items-center">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-[75%]"
              inputClassName="p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none"
            />
            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
              onClick={() => sendMessage()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-send"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#2c3e50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <line x1="10" y1="14" x2="21" y2="3" />
                <path d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5" />
              </svg>
            </div>
            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-circle-plus"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#2c3e50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <circle cx="12" cy="12" r="9" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="12" y1="9" x2="12" y2="15" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className="w-[25%] h-screen bg-light px-8 py-16 overflow-scroll">
        <div className="text-primary text-lg">People</div>
        <div>
          {users.length > 0 ? (
            users.map(({ userId, user }, index) => {
              return (
                <div
                  key={index}
                  className="flex items-center py-8 border-b border-b-gray-300"
                >
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => fetchMessages("new", user)}
                  >
                    <div>
                      <img
                        src={Img1}
                        alt=""
                        className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary"
                      />
                    </div>
                    <div className="ml-6">
                      <h3 className="text-lg font-semibold">
                        {user?.fullName}
                      </h3>
                      <p className="text-sm font-light text-gray-600">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-lg font-semibold mt-24">
              No Conversations
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
